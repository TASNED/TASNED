from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import logging
import uuid
import base64
import io
import secrets
import hashlib
import jwt
import bcrypt
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File, Form
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.staticfiles import StaticFiles
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from bson import ObjectId
from PIL import Image

# ------------------------------------------------------------------ config
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get('EMERGENT_EMAIL_KEY')
EMAIL_FROM_NAME = os.environ.get('EMAIL_FROM_NAME', 'TASNED INTEGRATED')
OWNER_EMAIL = os.environ.get('OWNER_EMAIL', 'info@tasned.sa')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tasned")

app = FastAPI(title="TASNED INTEGRATED API")
api = APIRouter(prefix="/api")


# ------------------------------------------------------------------ helpers
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email,
               "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def send_email(recipient: str, subject: str, html: str, reply_to: Optional[str] = None, attachments: Optional[list] = None):
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY missing; skipping email")
        return
    payload = {"to": [recipient], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to:
        payload["contact_email"] = reply_to
    if attachments:
        payload["attachments"] = attachments
    try:
        async with httpx.AsyncClient(timeout=60) as c:
            resp = await c.post(f"{EMAIL_BASE_URL}/api/v1/email/send",
                                headers={"X-Email-Key": EMAIL_KEY}, json=payload)
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Email send failed: {e}")


# ------------------------------------------------------------------ models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class NewsBase(BaseModel):
    title_en: str
    title_ar: str = ""
    excerpt_en: str = ""
    excerpt_ar: str = ""
    body_en: str = ""
    body_ar: str = ""
    category: str = "News"
    cover_image: str = ""
    published: bool = True


class NewsOut(NewsBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    slug: str
    created_at: str


class ContactRequest(BaseModel):
    name: str
    company: str = ""
    email: EmailStr
    phone: str = ""
    vessel_name: str = ""
    imo_number: str = ""
    port: str = ""
    requested_service: str = ""
    preferred_date: str = ""
    message: str = ""


def news_doc_to_out(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


# ------------------------------------------------------------------ auth routes
@api.post("/auth/login")
async def login(body: LoginRequest, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    response.set_cookie(key="access_token", value=token, httponly=True,
                        secure=True, samesite="none", max_age=43200, path="/")
    return {"id": str(user["_id"]), "email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"status": "ok"}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ------------------------------------------------------------------ news routes
@api.get("/news", response_model=List[NewsOut])
async def list_news(all: bool = False):
    query = {} if all else {"published": True}
    docs = await db.news.find(query).sort("created_at", -1).to_list(200)
    return [news_doc_to_out(d) for d in docs]


@api.get("/news/{slug}", response_model=NewsOut)
async def get_news(slug: str):
    doc = await db.news.find_one({"slug": slug})
    if not doc:
        raise HTTPException(status_code=404, detail="Article not found")
    return news_doc_to_out(doc)


@api.post("/news", response_model=NewsOut)
async def create_news(body: NewsBase, user: dict = Depends(get_current_user)):
    slug = body.title_en.lower().strip().replace(" ", "-")
    slug = "".join(ch for ch in slug if ch.isalnum() or ch == "-")[:60] or str(uuid.uuid4())[:8]
    if await db.news.find_one({"slug": slug}):
        slug = f"{slug}-{str(uuid.uuid4())[:4]}"
    doc = body.model_dump()
    doc["slug"] = slug
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    res = await db.news.insert_one(doc)
    doc["_id"] = res.inserted_id
    return news_doc_to_out(doc)


@api.put("/news/{item_id}", response_model=NewsOut)
async def update_news(item_id: str, body: NewsBase, user: dict = Depends(get_current_user)):
    await db.news.update_one({"_id": ObjectId(item_id)}, {"$set": body.model_dump()})
    doc = await db.news.find_one({"_id": ObjectId(item_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return news_doc_to_out(doc)


@api.delete("/news/{item_id}")
async def delete_news(item_id: str, user: dict = Depends(get_current_user)):
    await db.news.delete_one({"_id": ObjectId(item_id)})
    return {"status": "deleted"}


# ------------------------------------------------------------------ contact route
@api.post("/contact")
async def contact(body: ContactRequest):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.contact_requests.insert_one({**doc})
    rows = "".join(
        f"<tr><td style='padding:6px 12px;font-weight:600;color:#0A1F3D'>{k.replace('_',' ').title()}</td>"
        f"<td style='padding:6px 12px;color:#5B6770'>{v or '-'}</td></tr>"
        for k, v in body.model_dump().items())
    html = f"""
    <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'>
      <div style='background:#0A1F3D;padding:24px;color:#fff'>
        <h2 style='margin:0'>New Inspection / Contact Request</h2>
        <p style='margin:4px 0 0;color:#00C2C7'>TASNED INTEGRATED</p>
      </div>
      <table style='width:100%;border-collapse:collapse;background:#fff'>{rows}</table>
    </div>"""
    await send_email(OWNER_EMAIL, "New Inspection Request — TASNED INTEGRATED", html, reply_to=body.email)
    return {"status": "success", "message": "Your request has been received. Our team will contact you shortly."}


@api.get("/contact-requests")
async def list_contacts(user: dict = Depends(get_current_user)):
    docs = await db.contact_requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


ALLOWED_CV_TYPES = {"application/pdf", "application/msword",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
ALLOWED_CV_EXTS = {".pdf", ".doc", ".docx"}


@api.post("/careers")
async def careers(
    full_name: str = Form(...),
    mobile: str = Form(...),
    email: str = Form(...),
    city: str = Form(...),
    nationality: str = Form(""),
    current_job: str = Form(""),
    experience: str = Form(""),
    sector: str = Form(""),
    qualification: str = Form(""),
    bio: str = Form(""),
    cv: UploadFile = File(...),
):
    content = await cv.read()
    size = len(content)
    if size == 0:
        raise HTTPException(status_code=400, detail="CV file is empty")
    if size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB")
    ext = ("." + cv.filename.rsplit(".", 1)[-1].lower()) if "." in (cv.filename or "") else ""
    if ext not in ALLOWED_CV_EXTS:
        raise HTTPException(status_code=400, detail="Only PDF, DOC or DOCX files are allowed")

    doc = {
        "id": str(uuid.uuid4()),
        "full_name": full_name, "mobile": mobile, "email": email, "city": city,
        "nationality": nationality, "current_job": current_job, "experience": experience,
        "sector": sector, "qualification": qualification, "bio": bio,
        "cv_filename": cv.filename, "cv_size": size,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.careers_applications.insert_one({**doc})

    rows_data = {
        "Full Name": full_name, "Mobile": mobile, "Email": email, "City": city,
        "Nationality": nationality, "Current Job Title": current_job,
        "Years of Experience": experience, "Sector / Field": sector,
        "Academic Qualification": qualification, "Bio": bio,
    }
    rows = "".join(
        f"<tr><td style='padding:8px 14px;font-weight:600;color:#0A1F3D;vertical-align:top'>{k}</td>"
        f"<td style='padding:8px 14px;color:#5B6770'>{(v or '-').replace(chr(10),'<br/>')}</td></tr>"
        for k, v in rows_data.items())
    html = f"""
    <div style='font-family:Arial,sans-serif;max-width:640px;margin:auto'>
      <div style='background:#0A1F3D;padding:24px;color:#fff'>
        <h2 style='margin:0'>New Careers Application</h2>
        <p style='margin:4px 0 0;color:#00C2C7'>TASNED INTEGRATED</p>
      </div>
      <table style='width:100%;border-collapse:collapse;background:#fff'>{rows}</table>
      <p style='padding:12px 14px;color:#5B6770;font-size:12px'>CV attached: {cv.filename} ({size // 1024} KB)</p>
    </div>"""
    attach = [{"filename": cv.filename or "cv",
               "content": base64.b64encode(content).decode("ascii"),
               "content_type": cv.content_type or "application/octet-stream"}]
    await send_email(OWNER_EMAIL, "New Careers Application — TASNED INTEGRATED",
                     html, reply_to=email, attachments=attach)
    return {"status": "success",
            "message": "Your application has been received. We will contact you if a suitable opportunity arises."}


@api.get("/careers-applications")
async def list_careers(user: dict = Depends(get_current_user)):
    docs = await db.careers_applications.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


# ================================================================== ENTERPRISE CMS
# --- shared helpers ---
def require_role(*allowed):
    async def _dep(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return _dep


async def audit(request: Request, user: dict, action: str, resource: str, resource_id: str = "", meta: dict = None):
    ip = request.client.host if request and request.client else ""
    await db.audit_logs.insert_one({
        "user_id": user.get("id"), "user_email": user.get("email"), "role": user.get("role"),
        "action": action, "resource": resource, "resource_id": str(resource_id or ""),
        "meta": meta or {}, "ip": ip,
        "ts": datetime.now(timezone.utc).isoformat(),
    })


def _hash_token(t: str) -> str:
    return hashlib.sha256(t.encode()).hexdigest()


# --- Password reset ---
class ForgotBody(BaseModel):
    email: EmailStr


class ResetBody(BaseModel):
    token: str
    password: str


@api.post("/auth/forgot-password")
async def forgot_password(body: ForgotBody):
    user = await db.users.find_one({"email": body.email.lower()})
    if user:
        raw = secrets.token_urlsafe(32)
        await db.password_reset_tokens.insert_one({
            "user_id": str(user["_id"]),
            "token_hash": _hash_token(raw),
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        link = f"{os.environ.get('FRONTEND_URL','')}/admin/reset-password?token={raw}"
        html = f"""<div style='font-family:Arial,sans-serif;max-width:520px;margin:auto'>
          <div style='background:#0A1F3D;padding:24px;color:#fff'><h2 style='margin:0'>Password Reset</h2>
          <p style='margin:4px 0 0;color:#00C2C7'>TASNED INTEGRATED</p></div>
          <div style='padding:20px'><p>You requested to reset your admin password. Click the link below (valid for 1 hour):</p>
          <p><a href='{link}' style='color:#0A1F3D;font-weight:600'>{link}</a></p>
          <p style='color:#5B6770;font-size:12px'>If you did not request this, please ignore this message.</p></div></div>"""
        await send_email(body.email.lower(), "Reset Your Password — TASNED INTEGRATED", html)
    return {"status": "ok"}


@api.post("/auth/reset-password")
async def reset_password(body: ResetBody):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    h = _hash_token(body.token)
    rec = await db.password_reset_tokens.find_one({"token_hash": h, "used": False})
    if not rec:
        raise HTTPException(status_code=400, detail="Invalid or already used token")
    if datetime.fromisoformat(rec["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    await db.users.update_one({"_id": ObjectId(rec["user_id"])},
                              {"$set": {"password_hash": hash_password(body.password)}})
    await db.password_reset_tokens.update_one({"_id": rec["_id"]}, {"$set": {"used": True}})
    return {"status": "ok"}


# --- Users (RBAC — super_admin only) ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str = ""
    role: str = "editor"


_VALID_ROLES = {"super_admin", "admin", "editor"}


@api.get("/admin/users")
async def list_users(user=Depends(require_role("super_admin"))):
    docs = await db.users.find({}, {"password_hash": 0}).sort("created_at", 1).to_list(500)
    out = []
    for d in docs:
        d["id"] = str(d.pop("_id"))
        out.append(d)
    return out


@api.post("/admin/users")
async def create_user_admin(body: UserCreate, request: Request, user=Depends(require_role("super_admin"))):
    if body.role not in _VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {"email": body.email.lower(), "password_hash": hash_password(body.password),
           "name": body.name, "role": body.role,
           "created_at": datetime.now(timezone.utc).isoformat()}
    res = await db.users.insert_one(doc)
    await audit(request, user, "create", "user", str(res.inserted_id), {"email": body.email, "role": body.role})
    return {"id": str(res.inserted_id), "email": body.email.lower(), "role": body.role, "name": body.name}


@api.put("/admin/users/{uid}")
async def update_user_admin(uid: str, body: dict, request: Request, user=Depends(require_role("super_admin"))):
    updates = {}
    if "role" in body and body["role"] in _VALID_ROLES:
        updates["role"] = body["role"]
    if "name" in body:
        updates["name"] = body["name"]
    if body.get("password"):
        if len(body["password"]) < 8:
            raise HTTPException(status_code=400, detail="Password too short")
        updates["password_hash"] = hash_password(body["password"])
    if updates:
        await db.users.update_one({"_id": ObjectId(uid)}, {"$set": updates})
    await audit(request, user, "update", "user", uid,
                {k: ("***" if k == "password_hash" else v) for k, v in updates.items()})
    return {"status": "ok"}


@api.delete("/admin/users/{uid}")
async def delete_user_admin(uid: str, request: Request, user=Depends(require_role("super_admin"))):
    if uid == user.get("id"):
        raise HTTPException(status_code=400, detail="You cannot delete yourself")
    await db.users.delete_one({"_id": ObjectId(uid)})
    await audit(request, user, "delete", "user", uid)
    return {"status": "ok"}


# --- CMS items (generic) ---
_ALLOWED_TYPES = {"service", "team_member", "client", "testimonial", "faq",
                  "homepage_section", "menu_item", "page_content"}


def _cms_out(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


def _published_query(now_iso: str) -> dict:
    return {"status": "published",
            "$or": [{"published_at": {"$lte": now_iso}}, {"published_at": None}, {"published_at": ""}]}


@api.get("/cms/{ctype}")
async def list_cms_public(ctype: str):
    if ctype not in _ALLOWED_TYPES:
        raise HTTPException(status_code=404, detail="Unknown type")
    now_iso = datetime.now(timezone.utc).isoformat()
    docs = await db.cms_items.find({"type": ctype, **_published_query(now_iso)}) \
        .sort([("order", 1), ("created_at", 1)]).to_list(500)
    return [_cms_out(d) for d in docs]


@api.get("/admin/cms/{ctype}")
async def list_cms_admin(ctype: str, user=Depends(require_role("super_admin", "admin", "editor"))):
    if ctype not in _ALLOWED_TYPES:
        raise HTTPException(status_code=404, detail="Unknown type")
    docs = await db.cms_items.find({"type": ctype}) \
        .sort([("order", 1), ("created_at", 1)]).to_list(500)
    return [_cms_out(d) for d in docs]


@api.post("/admin/cms/{ctype}")
async def create_cms(ctype: str, body: dict, request: Request,
                     user=Depends(require_role("super_admin", "admin", "editor"))):
    if ctype not in _ALLOWED_TYPES:
        raise HTTPException(status_code=404, detail="Unknown type")
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "type": ctype, "data": body.get("data", {}),
        "status": body.get("status", "draft"),
        "published_at": body.get("published_at"),
        "order": int(body.get("order", 0)),
        "slug": body.get("slug"),
        "created_at": now, "updated_at": now,
        "created_by": user.get("email"), "updated_by": user.get("email"),
    }
    res = await db.cms_items.insert_one(doc)
    await audit(request, user, "create", f"cms.{ctype}", str(res.inserted_id))
    doc["_id"] = res.inserted_id
    return _cms_out(doc)


@api.put("/admin/cms/{ctype}/{item_id}")
async def update_cms(ctype: str, item_id: str, body: dict, request: Request,
                     user=Depends(require_role("super_admin", "admin", "editor"))):
    old = await db.cms_items.find_one({"_id": ObjectId(item_id)})
    if not old:
        raise HTTPException(status_code=404, detail="Not found")
    await db.cms_versions.insert_one({
        "item_id": item_id, "type": ctype,
        "snapshot": {k: v for k, v in old.items() if k != "_id"},
        "editor": user.get("email"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    updates = {"updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": user.get("email")}
    for k in ("data", "status", "published_at", "order", "slug"):
        if k in body:
            updates[k] = body[k]
    await db.cms_items.update_one({"_id": ObjectId(item_id)}, {"$set": updates})
    await audit(request, user, "update", f"cms.{ctype}", item_id)
    doc = await db.cms_items.find_one({"_id": ObjectId(item_id)})
    return _cms_out(doc)


@api.delete("/admin/cms/{ctype}/{item_id}")
async def delete_cms(ctype: str, item_id: str, request: Request,
                     user=Depends(require_role("super_admin", "admin"))):
    await db.cms_items.delete_one({"_id": ObjectId(item_id)})
    await audit(request, user, "delete", f"cms.{ctype}", item_id)
    return {"status": "ok"}


@api.get("/admin/cms/{ctype}/{item_id}/versions")
async def list_versions(ctype: str, item_id: str,
                        user=Depends(require_role("super_admin", "admin", "editor"))):
    docs = await db.cms_versions.find({"item_id": item_id}).sort("created_at", -1).to_list(50)
    out = []
    for d in docs:
        d["id"] = str(d.pop("_id"))
        out.append(d)
    return out


@api.post("/admin/cms/{ctype}/{item_id}/restore/{version_id}")
async def restore_version(ctype: str, item_id: str, version_id: str, request: Request,
                          user=Depends(require_role("super_admin", "admin"))):
    ver = await db.cms_versions.find_one({"_id": ObjectId(version_id)})
    if not ver:
        raise HTTPException(status_code=404, detail="Version not found")
    snap = ver["snapshot"]
    current = await db.cms_items.find_one({"_id": ObjectId(item_id)})
    if current:
        await db.cms_versions.insert_one({
            "item_id": item_id, "type": ctype,
            "snapshot": {k: v for k, v in current.items() if k != "_id"},
            "editor": user.get("email"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    updates = {k: snap.get(k) for k in ("data", "status", "published_at", "order", "slug", "type")}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    updates["updated_by"] = user.get("email")
    await db.cms_items.update_one({"_id": ObjectId(item_id)}, {"$set": updates})
    await audit(request, user, "restore", f"cms.{ctype}", item_id, {"version_id": version_id})
    return {"status": "ok"}


# --- Site settings (Menu / Footer / Contact / SEO / GA / GTM / GSC) ---
@api.get("/settings")
async def get_settings_public():
    doc = await db.site_settings.find_one({"_id": "main"}) or {}
    doc.pop("_id", None)
    return doc


@api.put("/admin/settings")
async def update_settings(body: dict, request: Request,
                          user=Depends(require_role("super_admin", "admin"))):
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    body["updated_by"] = user.get("email")
    await db.site_settings.update_one({"_id": "main"}, {"$set": body}, upsert=True)
    await audit(request, user, "update", "settings", "main")
    return {"status": "ok"}


# --- Media library ---
UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
(UPLOADS_DIR / "media").mkdir(exist_ok=True)
_IMG_EXTS = {"jpg", "jpeg", "png", "webp", "gif", "bmp"}


@api.post("/admin/media/upload")
async def upload_media(request: Request,
                       file: UploadFile = File(...),
                       folder: str = Form("root"),
                       alt: str = Form(""),
                       caption: str = Form(""),
                       user=Depends(require_role("super_admin", "admin", "editor"))):
    raw = await file.read()
    if len(raw) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 20 MB)")
    fid = uuid.uuid4().hex
    orig_ext = (file.filename.rsplit(".", 1)[-1].lower()
                if file.filename and "." in file.filename else "bin")
    is_image = orig_ext in _IMG_EXTS
    width = height = None
    mime = file.content_type or "application/octet-stream"
    if is_image and orig_ext != "gif":
        try:
            img = Image.open(io.BytesIO(raw))
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            width, height = img.size
            saved_name = f"{fid}.webp"
            img.save(UPLOADS_DIR / "media" / saved_name, "WEBP", quality=85, method=6)
            mime = "image/webp"
        except Exception:
            saved_name = f"{fid}.{orig_ext}"
            (UPLOADS_DIR / "media" / saved_name).write_bytes(raw)
    else:
        saved_name = f"{fid}.{orig_ext}"
        (UPLOADS_DIR / "media" / saved_name).write_bytes(raw)
    file_size = (UPLOADS_DIR / "media" / saved_name).stat().st_size
    url_path = f"/api/media/files/{saved_name}"
    doc = {"id": fid, "filename": file.filename, "stored_name": saved_name, "url": url_path,
           "mime": mime, "size": file_size, "width": width, "height": height,
           "alt": alt, "caption": caption, "folder": folder or "root",
           "created_at": datetime.now(timezone.utc).isoformat(),
           "uploaded_by": user.get("email")}
    await db.media_assets.insert_one({**doc})
    await audit(request, user, "create", "media", fid, {"filename": file.filename})
    return doc


@api.get("/admin/media")
async def list_media(q: str = "", folder: str = "",
                     user=Depends(require_role("super_admin", "admin", "editor"))):
    query = {}
    if folder:
        query["folder"] = folder
    if q:
        query["$or"] = [
            {"filename": {"$regex": q, "$options": "i"}},
            {"alt": {"$regex": q, "$options": "i"}},
            {"caption": {"$regex": q, "$options": "i"}},
        ]
    docs = await db.media_assets.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api.put("/admin/media/{fid}")
async def update_media(fid: str, body: dict, request: Request,
                       user=Depends(require_role("super_admin", "admin", "editor"))):
    updates = {k: body[k] for k in ("alt", "caption", "folder") if k in body}
    await db.media_assets.update_one({"id": fid}, {"$set": updates})
    await audit(request, user, "update", "media", fid)
    return {"status": "ok"}


@api.delete("/admin/media/{fid}")
async def delete_media(fid: str, request: Request,
                       user=Depends(require_role("super_admin", "admin"))):
    doc = await db.media_assets.find_one({"id": fid})
    if doc:
        try:
            (UPLOADS_DIR / "media" / doc["stored_name"]).unlink()
        except Exception:
            pass
        await db.media_assets.delete_one({"id": fid})
    await audit(request, user, "delete", "media", fid)
    return {"status": "ok"}


# --- Audit log ---
@api.get("/admin/audit")
async def get_audit_log(limit: int = 100,
                        user=Depends(require_role("super_admin", "admin"))):
    docs = await db.audit_logs.find({}, {"_id": 0}).sort("ts", -1).to_list(min(limit, 500))
    return docs


# --- SEO: sitemap.xml + robots.txt ---
_PUBLIC_ROUTES = ["/", "/about", "/services", "/ballast-water-testing", "/standards",
                  "/industries", "/faq", "/news", "/contact", "/careers",
                  "/privacy", "/terms"]


@api.get("/sitemap.xml")
async def sitemap():
    from fastapi.responses import Response as _Resp
    settings = await db.site_settings.find_one({"_id": "main"}) or {}
    base = (settings.get("canonical_base") or os.environ.get("FRONTEND_URL", "")).rstrip("/")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    urls = "".join(
        f"<url><loc>{base}{p}</loc><changefreq>weekly</changefreq><lastmod>{now}</lastmod></url>"
        for p in _PUBLIC_ROUTES
    )
    news_docs = await db.news.find({"published": True}, {"slug": 1, "created_at": 1}).to_list(500)
    urls += "".join(
        f"<url><loc>{base}/news/{n['slug']}</loc><changefreq>monthly</changefreq><lastmod>{(n.get('created_at') or now)[:10]}</lastmod></url>"
        for n in news_docs
    )
    xml = f"""<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>"""
    return _Resp(content=xml, media_type="application/xml")


@api.get("/robots.txt")
async def robots():
    from fastapi.responses import PlainTextResponse
    settings = await db.site_settings.find_one({"_id": "main"}) or {}
    base = (settings.get("canonical_base") or os.environ.get("FRONTEND_URL", "")).rstrip("/")
    body = f"User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/admin/\n\nSitemap: {base}/api/sitemap.xml\n"
    return PlainTextResponse(content=body)


@api.get("/")
async def root():
    return {"message": "TASNED INTEGRATED API"}


# ------------------------------------------------------------------ startup
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.cms_items.create_index([("type", 1), ("status", 1), ("published_at", 1)])
    await db.cms_versions.create_index([("item_id", 1), ("created_at", -1)])
    await db.audit_logs.create_index([("ts", -1)])
    await db.media_assets.create_index([("created_at", -1)])
    await db.password_reset_tokens.create_index("token_hash")
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@tasned.sa").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password),
                                   "name": "Admin", "role": "super_admin",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info("Seeded super_admin user")
    else:
        updates = {}
        if not verify_password(admin_password, existing["password_hash"]):
            updates["password_hash"] = hash_password(admin_password)
        if existing.get("role") != "super_admin":
            updates["role"] = "super_admin"
        if updates:
            await db.users.update_one({"email": admin_email}, {"$set": updates})


app.include_router(api)


# --- Security headers middleware ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


app.add_middleware(SecurityHeadersMiddleware)

# --- Static file serving for uploaded media ---
app.mount("/api/media/files",
          StaticFiles(directory=str((ROOT_DIR / "uploads" / "media"))),
          name="media_files")

_cors = os.environ.get("CORS_ORIGINS", os.environ.get("FRONTEND_URL", "http://localhost:3000"))
_origins = [o.strip() for o in _cors.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
