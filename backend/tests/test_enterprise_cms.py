"""Enterprise CMS: auth (RBAC + reset), CMS items+versions, media, settings, audit, SEO."""
import os
import io
import time
import requests
import pytest
from datetime import datetime, timezone, timedelta

BASE_URL = None
try:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
except Exception:
    pass
BASE_URL = BASE_URL or os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "REACT_APP_BACKEND_URL missing"

ADMIN_EMAIL = "admin@tasned.sa"
ADMIN_PASSWORD = "12a34b56cd21"
EDITOR_EMAIL = "editor.test@tasned.sa"
EDITOR_PASSWORD = "EditorTest!2026"


@pytest.fixture(scope="module")
def admin():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def editor(admin):
    # Create editor user (super_admin only)
    # Ensure no existing
    users = admin.get(f"{BASE_URL}/api/admin/users").json()
    existing = next((u for u in users if u["email"] == EDITOR_EMAIL), None)
    if existing:
        admin.delete(f"{BASE_URL}/api/admin/users/{existing['id']}")
    r = admin.post(f"{BASE_URL}/api/admin/users",
                   json={"email": EDITOR_EMAIL, "password": EDITOR_PASSWORD,
                         "name": "Test Editor", "role": "editor"})
    assert r.status_code == 200, r.text
    uid = r.json()["id"]
    s = requests.Session()
    lr = s.post(f"{BASE_URL}/api/auth/login", json={"email": EDITOR_EMAIL, "password": EDITOR_PASSWORD})
    assert lr.status_code == 200, lr.text
    assert lr.json()["role"] == "editor"
    yield s
    # cleanup
    admin.delete(f"{BASE_URL}/api/admin/users/{uid}")


# =============== AUTH & RBAC ===============
def test_login_role_super_admin(admin):
    r = admin.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 200
    body = r.json()
    assert body["email"] == ADMIN_EMAIL
    assert body["role"] == "super_admin"


def test_forgot_password_existing(admin):
    # existing email
    r = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": ADMIN_EMAIL})
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_forgot_password_nonexisting():
    r = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={"email": "does.not.exist.xyz@tasned.sa"})
    assert r.status_code == 200
    assert r.json().get("status") == "ok"  # no user enumeration


def test_reset_password_invalid_token():
    r = requests.post(f"{BASE_URL}/api/auth/reset-password",
                      json={"token": "invalid-token-abc", "password": "longenoughpass"})
    assert r.status_code == 400


def test_reset_password_short():
    r = requests.post(f"{BASE_URL}/api/auth/reset-password",
                      json={"token": "any", "password": "short"})
    assert r.status_code == 400
    assert "8 characters" in r.json().get("detail", "")


def test_admin_users_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/users")
    assert r.status_code == 401


def test_admin_users_list(admin):
    r = admin.get(f"{BASE_URL}/api/admin/users")
    assert r.status_code == 200
    users = r.json()
    assert any(u["email"] == ADMIN_EMAIL for u in users)


def test_editor_cannot_list_users(editor):
    r = editor.get(f"{BASE_URL}/api/admin/users")
    assert r.status_code == 403


def test_admin_user_update_and_delete(admin):
    # Create a throwaway user
    r = admin.post(f"{BASE_URL}/api/admin/users",
                   json={"email": "TEST_throwaway@tasned.sa", "password": "TmpPass1234!",
                         "name": "Tmp", "role": "editor"})
    assert r.status_code == 200
    uid = r.json()["id"]
    # Update
    ru = admin.put(f"{BASE_URL}/api/admin/users/{uid}", json={"name": "Renamed", "role": "admin"})
    assert ru.status_code == 200
    # Delete
    rd = admin.delete(f"{BASE_URL}/api/admin/users/{uid}")
    assert rd.status_code == 200


# =============== CMS ===============
def test_cms_unknown_type_404():
    r = requests.get(f"{BASE_URL}/api/cms/unknown_type_xyz")
    assert r.status_code == 404


def test_cms_public_only_published(admin):
    # Create draft
    r1 = admin.post(f"{BASE_URL}/api/admin/cms/service",
                    json={"data": {"title_en": "TEST_Draft Service"}, "status": "draft"})
    assert r1.status_code == 200
    draft_id = r1.json()["id"]
    # Create published
    r2 = admin.post(f"{BASE_URL}/api/admin/cms/service",
                    json={"data": {"title_en": "TEST_Published Service"}, "status": "published"})
    assert r2.status_code == 200
    pub_id = r2.json()["id"]

    # Public list
    pub_list = requests.get(f"{BASE_URL}/api/cms/service").json()
    ids = [x["id"] for x in pub_list]
    assert pub_id in ids
    assert draft_id not in ids

    # Admin list has both
    admin_list = admin.get(f"{BASE_URL}/api/admin/cms/service").json()
    admin_ids = [x["id"] for x in admin_list]
    assert draft_id in admin_ids and pub_id in admin_ids

    # Cleanup
    admin.delete(f"{BASE_URL}/api/admin/cms/service/{draft_id}")
    admin.delete(f"{BASE_URL}/api/admin/cms/service/{pub_id}")


def test_cms_crud_versions_restore(admin):
    # Create draft
    r = admin.post(f"{BASE_URL}/api/admin/cms/service",
                   json={"data": {"title_en": "TEST_CRUD"}, "status": "draft"})
    assert r.status_code == 200
    item_id = r.json()["id"]

    # Update -> published (creates version snapshot)
    ru = admin.put(f"{BASE_URL}/api/admin/cms/service/{item_id}",
                   json={"data": {"title_en": "TEST_CRUD v2"}, "status": "published"})
    assert ru.status_code == 200
    assert ru.json()["status"] == "published"

    # Versions list >=1
    vs = admin.get(f"{BASE_URL}/api/admin/cms/service/{item_id}/versions").json()
    assert isinstance(vs, list) and len(vs) >= 1
    ver_id = vs[0]["id"]

    # Restore adds another version
    rr = admin.post(f"{BASE_URL}/api/admin/cms/service/{item_id}/restore/{ver_id}")
    assert rr.status_code == 200
    vs2 = admin.get(f"{BASE_URL}/api/admin/cms/service/{item_id}/versions").json()
    assert len(vs2) >= len(vs) + 1

    # Delete
    dd = admin.delete(f"{BASE_URL}/api/admin/cms/service/{item_id}")
    assert dd.status_code == 200


def test_cms_scheduled_publish(admin):
    future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    past = (datetime.now(timezone.utc) - timedelta(minutes=5)).isoformat()

    r = admin.post(f"{BASE_URL}/api/admin/cms/service",
                   json={"data": {"title_en": "TEST_Scheduled"},
                         "status": "published", "published_at": future})
    assert r.status_code == 200
    item_id = r.json()["id"]

    pub_ids = [x["id"] for x in requests.get(f"{BASE_URL}/api/cms/service").json()]
    assert item_id not in pub_ids, "Future-scheduled item should not appear in public list"

    # Move published_at to past
    ru = admin.put(f"{BASE_URL}/api/admin/cms/service/{item_id}", json={"published_at": past})
    assert ru.status_code == 200

    pub_ids2 = [x["id"] for x in requests.get(f"{BASE_URL}/api/cms/service").json()]
    assert item_id in pub_ids2

    admin.delete(f"{BASE_URL}/api/admin/cms/service/{item_id}")


# =============== MEDIA ===============
def _tiny_png_bytes():
    from PIL import Image as _Img
    buf = io.BytesIO()
    _Img.new("RGB", (10, 10), (255, 0, 0)).save(buf, format="PNG")
    return buf.getvalue()


def test_media_upload_requires_auth():
    files = {"file": ("t.png", _tiny_png_bytes(), "image/png")}
    r = requests.post(f"{BASE_URL}/api/admin/media/upload", files=files)
    assert r.status_code == 401


def test_media_upload_convert_update_delete(admin):
    png = _tiny_png_bytes()
    files = {"file": ("tiny.png", png, "image/png")}
    r = admin.post(f"{BASE_URL}/api/admin/media/upload", files=files, data={"folder": "root", "alt": "a"})
    assert r.status_code == 200, r.text
    doc = r.json()
    assert doc["url"].startswith("/api/media/files/")
    assert doc["mime"] == "image/webp"
    assert doc["width"] == 10 and doc["height"] == 10

    # Fetch the file via public URL
    fr = requests.get(f"{BASE_URL}{doc['url']}")
    assert fr.status_code == 200
    assert fr.headers.get("content-type", "").startswith("image/")

    # Update
    ru = admin.put(f"{BASE_URL}/api/admin/media/{doc['id']}",
                   json={"alt": "new alt", "caption": "new cap", "folder": "brand"})
    assert ru.status_code == 200

    # Delete
    rd = admin.delete(f"{BASE_URL}/api/admin/media/{doc['id']}")
    assert rd.status_code == 200


# =============== AUDIT ===============
def test_audit_log_has_entries(admin):
    r = admin.get(f"{BASE_URL}/api/admin/audit")
    assert r.status_code == 200
    entries = r.json()
    assert isinstance(entries, list) and len(entries) > 0
    e = entries[0]
    for k in ("user_email", "action", "resource", "ip", "ts"):
        assert k in e


# =============== SETTINGS ===============
def test_settings_get_public_and_update(admin):
    r = requests.get(f"{BASE_URL}/api/settings")
    assert r.status_code == 200
    assert isinstance(r.json(), dict)

    ru = admin.put(f"{BASE_URL}/api/admin/settings",
                   json={"ga4_measurement_id": "G-TESTING", "canonical_base": "https://www.tasned.sa"})
    assert ru.status_code == 200

    r2 = requests.get(f"{BASE_URL}/api/settings").json()
    assert r2.get("ga4_measurement_id") == "G-TESTING"
    assert r2.get("canonical_base") == "https://www.tasned.sa"


# =============== SEO ===============
def test_sitemap_xml():
    r = requests.get(f"{BASE_URL}/api/sitemap.xml")
    assert r.status_code == 200
    assert "xml" in r.headers.get("content-type", "").lower()
    body = r.text
    assert "<urlset" in body
    assert "/services" in body
    assert "<loc>" in body


def test_robots_txt():
    r = requests.get(f"{BASE_URL}/api/robots.txt")
    assert r.status_code == 200
    body = r.text
    assert "User-agent: *" in body
    assert "Disallow: /admin/" in body
    assert "Sitemap:" in body


# =============== REGRESSION ===============
def test_regression_news_list():
    r = requests.get(f"{BASE_URL}/api/news")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_regression_contact():
    r = requests.post(f"{BASE_URL}/api/contact",
                      json={"name": "TEST_Reg", "email": "test_reg@example.com", "message": "hi"})
    assert r.status_code == 200
    assert r.json().get("status") == "success"


def test_regression_careers():
    pdf = b"%PDF-1.4\n%TEST\n%%EOF"
    files = {"cv": ("r.pdf", pdf, "application/pdf")}
    r = requests.post(f"{BASE_URL}/api/careers", files=files,
                      data={"full_name": "TEST_Reg", "mobile": "+966500000000",
                            "email": "test_reg_careers@example.com", "city": "Riyadh"})
    assert r.status_code == 200
