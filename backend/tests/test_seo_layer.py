"""Enterprise SEO layer tests — public-routes, schemas, page-seo, sitemap-images, llms.txt, robots.txt."""
import os
import json
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
    except Exception:
        pass

ADMIN_EMAIL = "admin@tasned.sa"
ADMIN_PASSWORD = "12a34b56cd21"

EXPECTED_ROUTES = ["/", "/about", "/services", "/faq", "/contact"]


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return s


@pytest.fixture(scope="module")
def editor_session(admin_session):
    """Create an ephemeral editor user via admin, return logged-in session."""
    email = "TEST_editor_seo@tasned.sa"
    pwd = "EditorPass123!"
    # Try to create
    r = admin_session.post(f"{BASE_URL}/api/admin/users",
                           json={"email": email, "password": pwd, "role": "editor", "name": "SEO Editor"})
    created_id = None
    if r.status_code == 200:
        created_id = r.json().get("id")
    # login
    s = requests.Session()
    lr = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pwd})
    assert lr.status_code == 200, f"Editor login failed: {lr.text}"
    yield s
    # cleanup
    if created_id:
        admin_session.delete(f"{BASE_URL}/api/admin/users/{created_id}")


# --- Public routes ---
def test_public_routes():
    r = requests.get(f"{BASE_URL}/api/public-routes")
    assert r.status_code == 200
    routes = r.json()
    assert isinstance(routes, list)
    for req in EXPECTED_ROUTES:
        assert req in routes, f"Missing route {req} in {routes}"


# --- Schemas ---
def test_schemas_root_has_org_and_website():
    r = requests.get(f"{BASE_URL}/api/schemas", params={"route": "/"})
    assert r.status_code == 200
    schemas = r.json()
    types = [s.get("@type") for s in schemas]
    assert "Organization" in types
    assert "WebSite" in types
    # Organization must carry brand alternate names for TASNED / تسنيد recognition
    org = next(s for s in schemas if s.get("@type") == "Organization")
    assert "TASNED" in (org.get("alternateName") or [])


def test_schemas_about_has_breadcrumb():
    r = requests.get(f"{BASE_URL}/api/schemas", params={"route": "/about"})
    assert r.status_code == 200
    types = [s.get("@type") for s in r.json()]
    assert "BreadcrumbList" in types


def test_schemas_services_reflects_published_service(admin_session):
    # Baseline
    r0 = requests.get(f"{BASE_URL}/api/schemas", params={"route": "/services"})
    baseline_service_count = sum(1 for s in r0.json() if s.get("@type") == "Service")

    # Publish a TEST_ service
    payload = {"type": "service", "status": "published",
               "data": {"title_en": "TEST_SEO_Service", "description_en": "seo test svc"}}
    cr = admin_session.post(f"{BASE_URL}/api/admin/cms/service", json=payload)
    assert cr.status_code == 200, cr.text
    item_id = cr.json().get("id")

    try:
        r1 = requests.get(f"{BASE_URL}/api/schemas", params={"route": "/services"})
        assert r1.status_code == 200
        svcs = [s for s in r1.json() if s.get("@type") == "Service"]
        assert len(svcs) >= baseline_service_count + 1
        assert any(s.get("name") == "TEST_SEO_Service" for s in svcs)
    finally:
        admin_session.delete(f"{BASE_URL}/api/admin/cms/service/{item_id}")

    # After delete → baseline restored
    r2 = requests.get(f"{BASE_URL}/api/schemas", params={"route": "/services"})
    svcs2 = [s for s in r2.json() if s.get("@type") == "Service"]
    assert len(svcs2) == baseline_service_count


def test_schemas_faq_reflects_published_faq(admin_session):
    payload = {"type": "faq", "status": "published",
               "data": {"question_en": "TEST_SEO_Question?", "answer_en": "TEST answer."}}
    cr = admin_session.post(f"{BASE_URL}/api/admin/cms/faq", json=payload)
    assert cr.status_code == 200, cr.text
    item_id = cr.json().get("id")
    try:
        r = requests.get(f"{BASE_URL}/api/schemas", params={"route": "/faq"})
        assert r.status_code == 200
        faq_pages = [s for s in r.json() if s.get("@type") == "FAQPage"]
        assert len(faq_pages) >= 1
        names = [q.get("name") for fp in faq_pages for q in fp.get("mainEntity", [])]
        assert "TEST_SEO_Question?" in names
    finally:
        admin_session.delete(f"{BASE_URL}/api/admin/cms/faq/{item_id}")


# --- Sitemap-images ---
def test_sitemap_images_xml():
    r = requests.get(f"{BASE_URL}/api/sitemap-images.xml")
    assert r.status_code == 200
    ct = r.headers.get("content-type", "")
    assert "application/xml" in ct or "xml" in ct
    body = r.text
    assert "<urlset" in body
    assert 'xmlns:image=' in body


# --- Robots ---
def test_robots_contains_both_sitemaps():
    r = requests.get(f"{BASE_URL}/api/robots.txt")
    assert r.status_code == 200
    body = r.text
    assert "Sitemap:" in body
    assert "sitemap.xml" in body
    assert "sitemap-images.xml" in body


# --- llms.txt ---
def test_llms_txt():
    r = requests.get(f"{BASE_URL}/api/llms.txt")
    assert r.status_code == 200
    body = r.text
    assert body.lstrip().startswith("# TASNED INTEGRATED")
    assert "## Services" in body
    assert "info@tasned.sa" in body


# --- Page SEO CRUD ---
def test_page_seo_full_flow(admin_session):
    route = "/services"
    # baseline empty
    requests.delete(f"{BASE_URL}/api/admin/page-seo",
                    params={"route": route}, cookies=admin_session.cookies)
    r = requests.get(f"{BASE_URL}/api/page-seo", params={"route": route})
    assert r.status_code == 200
    assert r.json() == {}

    # upsert
    body = {"route": route, "title": "Custom Services Title",
            "description": "Custom desc", "robots": "noindex, follow",
            "og_image": "https://x/y.jpg"}
    pr = admin_session.put(f"{BASE_URL}/api/admin/page-seo", json=body)
    assert pr.status_code == 200

    r2 = requests.get(f"{BASE_URL}/api/page-seo", params={"route": route})
    assert r2.status_code == 200
    d = r2.json()
    assert d["title"] == "Custom Services Title"
    assert d["description"] == "Custom desc"
    assert d["robots"] == "noindex, follow"
    assert d["og_image"] == "https://x/y.jpg"

    # delete
    dr = admin_session.delete(f"{BASE_URL}/api/admin/page-seo", params={"route": route})
    assert dr.status_code == 200

    r3 = requests.get(f"{BASE_URL}/api/page-seo", params={"route": route})
    assert r3.json() == {}


# --- RBAC ---
def test_page_seo_admin_list_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/page-seo")
    assert r.status_code == 401


def test_editor_can_put_but_not_delete(editor_session, admin_session):
    route = "/TEST_editor_route"
    body = {"route": route, "title": "Editor Title"}
    pr = editor_session.put(f"{BASE_URL}/api/admin/page-seo", json=body)
    assert pr.status_code == 200, pr.text

    dr = editor_session.delete(f"{BASE_URL}/api/admin/page-seo", params={"route": route})
    assert dr.status_code == 403

    # cleanup as admin
    admin_session.delete(f"{BASE_URL}/api/admin/page-seo", params={"route": route})
