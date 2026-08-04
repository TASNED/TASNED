"""TASNED INTEGRATED — backend API tests (auth, news CRUD, contact)."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://marine-testing-hub.preview.emergentagent.com").rstrip("/")
# Try to read from frontend/.env if not in env
if "marine-testing-hub" not in BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
    except Exception:
        pass

ADMIN_EMAIL = "admin@tasned.sa"
ADMIN_PASSWORD = "TasnedAdmin2026!"


@pytest.fixture(scope="module")
def session():
    return requests.Session()


@pytest.fixture(scope="module")
def auth_session():
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    assert "access_token" in s.cookies, "access_token cookie not set"
    return s


# --- Auth ---
def test_login_success(session):
    r = session.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == ADMIN_EMAIL
    assert data["role"] == "admin"
    assert "access_token" in session.cookies


def test_login_invalid():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_auth_me_with_cookie(auth_session):
    r = auth_session.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


def test_auth_me_without_cookie():
    r = requests.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 401


# --- News public ---
def test_news_list_public():
    r = requests.get(f"{BASE_URL}/api/news")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_news_create_requires_auth():
    r = requests.post(f"{BASE_URL}/api/news", json={"title_en": "Unauth"})
    assert r.status_code == 401


# --- News CRUD ---
def test_news_crud_flow(auth_session):
    payload = {"title_en": "Marine Testing Hub", "title_ar": "مركز الاختبار",
               "excerpt_en": "e", "body_en": "b", "category": "News", "published": True}
    r = auth_session.post(f"{BASE_URL}/api/news", json=payload)
    assert r.status_code == 200, r.text
    art = r.json()
    assert art["slug"] == "marine-testing-hub"
    assert art["title_en"] == "Marine Testing Hub"
    item_id = art["id"]

    # Get by slug
    r2 = requests.get(f"{BASE_URL}/api/news/marine-testing-hub")
    assert r2.status_code == 200
    assert r2.json()["id"] == item_id

    # Update
    updated = {**payload, "title_en": "Marine Testing Hub", "excerpt_en": "updated"}
    r3 = auth_session.put(f"{BASE_URL}/api/news/{item_id}", json=updated)
    assert r3.status_code == 200
    assert r3.json()["excerpt_en"] == "updated"

    # Delete
    r4 = auth_session.delete(f"{BASE_URL}/api/news/{item_id}")
    assert r4.status_code == 200

    # Verify gone
    r5 = requests.get(f"{BASE_URL}/api/news/marine-testing-hub")
    assert r5.status_code == 404


# --- Contact ---
def test_contact_submit_and_list(auth_session):
    payload = {"name": "TEST_User", "email": "test@example.com", "message": "Hello test"}
    r = requests.post(f"{BASE_URL}/api/contact", json=payload)
    assert r.status_code == 200
    assert r.json().get("status") == "success"

    # Auth required
    r2 = requests.get(f"{BASE_URL}/api/contact-requests")
    assert r2.status_code == 401

    r3 = auth_session.get(f"{BASE_URL}/api/contact-requests")
    assert r3.status_code == 200
    reqs = r3.json()
    assert isinstance(reqs, list)
    assert any(x.get("email") == "test@example.com" and x.get("name") == "TEST_User" for x in reqs)
