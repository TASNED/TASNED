from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import logging
import uuid
import jwt
import bcrypt
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from bson import ObjectId

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


async def send_email(recipient: str, subject: str, html: str, reply_to: Optional[str] = None):
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY missing; skipping email")
        return
    payload = {"to": [recipient], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as c:
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


@api.get("/")
async def root():
    return {"message": "TASNED INTEGRATED API"}


# ------------------------------------------------------------------ startup
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@tasned.sa").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({"email": admin_email, "password_hash": hash_password(admin_password),
                                   "name": "Admin", "role": "admin",
                                   "created_at": datetime.now(timezone.utc).isoformat()})
        logger.info("Seeded admin user")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})


app.include_router(api)
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
