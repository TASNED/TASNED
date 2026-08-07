"""
Backend tests for the enterprise security layer:
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Strong password policy on admin user creation and reset-password
- Rate limits on /auth/login, /contact, /auth/forgot-password
- Audit entries for login / login_failed / logout
- Origin/Referer CSRF check on admin mutations
- HTML sanitization (bleach) on /news body_en/body_ar
- Regression checks for previously passing flows

Notes:
- Rate limit tests are placed LAST because they poison per-IP buckets for 60s.
- We do NOT sleep 60s to reset; we run rate limit tests once and note it.
"""
import os
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: read from frontend/.env
    with open("/app/frontend/.env") as fh:
        for line in fh:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")

ADMIN_EMAIL = "admin@tasned.sa"
ADMIN_PASSWORD = "12a34b56cd21"
CORS_ORIGIN = "https://marine-testing-hub.preview.emergentagent.com"


# ---------------- fixtures ----------------
@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_session(api):
    r = api.post(f"{BASE_URL}/api/auth/login",
                 json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    return api


# ---------------- 1. Security headers ----------------
class TestSecurityHeaders:
    def test_headers_present_on_api(self, api):
        r = api.get(f"{BASE_URL}/api/news")
        assert r.status_code == 200
        h = {k.lower(): v for k, v in r.headers.items()}
        assert "content-security-policy" in h, "CSP header missing"
        assert "default-src" in h["content-security-policy"]
        assert "strict-transport-security" in h
        assert "preload" in h["strict-transport-security"].lower()
        assert h.get("x-frame-options", "").upper() == "SAMEORIGIN"
        assert h.get("x-content-type-options", "").lower() == "nosniff"
        assert "strict-origin-when-cross-origin" in h.get("referrer-policy", "")
        assert "permissions-policy" in h


# ---------------- 2. Audit login/logout ----------------
class TestAuditLoginLogout:
    def test_login_failed_then_success_then_logout_audit(self, api):
        # a failed login
        bad_email = f"nobody-{uuid.uuid4().hex[:6]}@example.com"
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": bad_email, "password": "wrong"})
        assert r.status_code == 401

        # a successful login (also sets session cookie)
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200

        # fetch audit -- requires super_admin
        r = api.get(f"{BASE_URL}/api/admin/audit?limit=200")
        assert r.status_code == 200, r.text
        logs = r.json()
        actions = [(l.get("action"), l.get("user_email")) for l in logs]
        assert any(a == "login" and e == ADMIN_EMAIL for a, e in actions), \
            "audit missing successful login"
        assert any(a == "login_failed" and e == bad_email for a, e in actions), \
            "audit missing failed login"

        # logout — should insert action='logout'
        r = api.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code == 200

        # re-login to inspect audit
        r = api.post(f"{BASE_URL}/api/auth/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        r = api.get(f"{BASE_URL}/api/admin/audit?limit=200")
        assert r.status_code == 200
        logs = r.json()
        assert any(l.get("action") == "logout" and l.get("user_email") == ADMIN_EMAIL
                   for l in logs), "audit missing logout entry"


# ---------------- 3. Password policy ----------------
class TestPasswordPolicy:
    def test_admin_create_user_password_policy(self, admin_session):
        base = {"email": f"TEST_{uuid.uuid4().hex[:8]}@example.com",
                "name": "TEST User", "role": "editor"}

        r = admin_session.post(f"{BASE_URL}/api/admin/users",
                               json={**base, "password": "weak"})
        assert r.status_code == 400
        assert "at least 8" in r.json().get("detail", "").lower()

        r = admin_session.post(f"{BASE_URL}/api/admin/users",
                               json={**base, "password": "onlyletters"})
        assert r.status_code == 400
        assert "letter" in r.json().get("detail", "").lower() and \
               "digit" in r.json().get("detail", "").lower()

        r = admin_session.post(f"{BASE_URL}/api/admin/users",
                               json={**base, "password": "Str0ngPass1"})
        assert r.status_code in (200, 201), r.text
        uid = r.json().get("id")
        # cleanup
        if uid:
            admin_session.delete(f"{BASE_URL}/api/admin/users/{uid}")

    def test_reset_password_policy(self, api):
        # weak password -> 400 regardless of token validity (policy runs first)
        r = api.post(f"{BASE_URL}/api/auth/reset-password",
                     json={"token": "invalid-token", "password": "weak"})
        assert r.status_code == 400
        assert "at least 8" in r.json().get("detail", "").lower()

        r = api.post(f"{BASE_URL}/api/auth/reset-password",
                     json={"token": "invalid-token", "password": "onlyletters"})
        assert r.status_code == 400
        assert "letter" in r.json().get("detail", "").lower()


# ---------------- 4. CSRF Origin check ----------------
# NOTE: The Kubernetes ingress strips/rewrites the Origin header before it reaches
# the backend. To validate the CSRF middleware's rejection behavior, we must hit
# the backend directly at http://localhost:8001 (bypassing ingress). The "allowed"
# cases still pass via ingress because the ingress-stripped origin is treated as
# no-origin (allowed) which is the intended fallback.
LOCAL_BASE = "http://localhost:8001"


class TestCSRFOrigin:
    def _local_admin_session(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{LOCAL_BASE}/api/auth/login",
                   json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200, f"local admin login failed: {r.status_code} {r.text}"
        return s

    def test_admin_mutation_bogus_origin_rejected(self, admin_session):
        # Hit backend directly so ingress does not strip Origin
        s = self._local_admin_session()
        payload = {"data": {"title": "TEST CSRF"}, "status": "draft"}
        r = s.post(
            f"{LOCAL_BASE}/api/admin/cms/service",
            json=payload,
            headers={"Origin": "https://evil.example"},
        )
        assert r.status_code == 403, r.text
        assert "csrf" in r.json().get("detail", "").lower()

    def test_admin_mutation_no_origin_allowed(self, admin_session):
        payload = {"data": {"title": "TEST CSRF no-origin"}, "status": "draft"}
        # requests.Session default has no Origin header
        r = admin_session.post(
            f"{BASE_URL}/api/admin/cms/service",
            json=payload,
        )
        assert r.status_code in (200, 201), r.text
        item_id = r.json().get("id")
        if item_id:
            admin_session.delete(f"{BASE_URL}/api/admin/cms/service/{item_id}")

    def test_admin_mutation_matching_origin_allowed(self, admin_session):
        payload = {"data": {"title": "TEST CSRF good-origin"}, "status": "draft"}
        r = admin_session.post(
            f"{BASE_URL}/api/admin/cms/service",
            json=payload,
            headers={"Origin": CORS_ORIGIN},
        )
        # After fix: CSRF middleware matches exact hostname from CORS_ORIGINS OR
        # suffix from CSRF_ALLOWED_SUFFIXES; the ingress-rewritten cluster host
        # matches the suffix allow-list. Assert strict success.
        assert r.status_code in (200, 201), r.text
        item_id = r.json().get("id")
        if item_id:
            admin_session.delete(f"{BASE_URL}/api/admin/cms/service/{item_id}")


# ---------------- 5. XSS sanitization on news ----------------
class TestXSSSanitization:
    def test_news_body_sanitized(self, admin_session):
        slug_title = f"TEST-XSS-{uuid.uuid4().hex[:6]}"
        payload = {
            "title_en": slug_title,
            "title_ar": slug_title,
            "body_en": "<script>alert(1)</script>Hello <b>world</b>",
            "body_ar": "<script>alert(2)</script>مرحبا",
            "category": "News",
            "published": True,
        }
        r = admin_session.post(f"{BASE_URL}/api/news", json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        slug = created["slug"]
        item_id = created["id"]

        # public GET
        r = requests.get(f"{BASE_URL}/api/news/{slug}")
        assert r.status_code == 200
        doc = r.json()
        assert "<script>" not in doc["body_en"].lower()
        assert "alert(1)" not in doc["body_en"] or "<script>" not in doc["body_en"]
        # <b> is not in the allowlist -> stripped; content should remain
        assert "Hello" in doc["body_en"] and "world" in doc["body_en"]
        # arabic body script tag removed
        assert "<script>" not in doc["body_ar"].lower()

        # cleanup
        admin_session.delete(f"{BASE_URL}/api/news/{item_id}")


# ---------------- 6. Regression ----------------
class TestRegression:
    def test_public_news_list(self):
        r = requests.get(f"{BASE_URL}/api/news")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_sitemap_robots_schemas_llms(self):
        for path in ["/api/sitemap.xml", "/api/robots.txt", "/api/schemas", "/api/llms.txt"]:
            r = requests.get(f"{BASE_URL}{path}")
            assert r.status_code == 200, f"{path} -> {r.status_code}"

    def test_admin_me(self, admin_session):
        r = admin_session.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json().get("email") == ADMIN_EMAIL

    def test_admin_cms_crud(self, admin_session):
        r = admin_session.post(f"{BASE_URL}/api/admin/cms/service",
                               json={"data": {"title": "TEST CMS reg"}, "status": "draft"})
        assert r.status_code in (200, 201)
        item = r.json()
        iid = item["id"]
        r = admin_session.put(f"{BASE_URL}/api/admin/cms/service/{iid}",
                              json={"status": "published"})
        assert r.status_code == 200
        r = admin_session.delete(f"{BASE_URL}/api/admin/cms/service/{iid}")
        assert r.status_code == 200

    def test_single_contact_not_rate_limited(self):
        r = requests.post(f"{BASE_URL}/api/contact",
                          json={"name": "TEST Contact Reg",
                                "email": f"test-{uuid.uuid4().hex[:6]}@example.com",
                                "phone": "+966500000000",
                                "message": "regression"})
        assert r.status_code == 200, r.text


# ---------------- 7. Rate limits (run LAST - poisons per-IP buckets) ----------------
# Ordered by pytest via alphabetical class name — prefix with 'Z' to force last.
class TestZRateLimits:
    def test_login_rate_limit(self):
        # 10/minute -> a 429 should appear within a burst of 40 attempts
        got_429 = False
        codes = []
        for i in range(40):
            r = requests.post(f"{BASE_URL}/api/auth/login",
                              json={"email": f"ratelimit-{uuid.uuid4().hex[:4]}@example.com",
                                    "password": "nope"})
            codes.append(r.status_code)
            if r.status_code == 429:
                got_429 = True
                assert "too many" in r.json().get("detail", "").lower()
                break
        assert got_429, f"no 429 seen for login rate limit in 40 attempts, codes={codes}"

    def test_contact_rate_limit(self):
        got_429 = False
        codes = []
        for i in range(40):
            r = requests.post(f"{BASE_URL}/api/contact",
                              json={"name": "TEST RL", "email": "rl@example.com",
                                    "phone": "1", "message": "x"})
            codes.append(r.status_code)
            if r.status_code == 429:
                got_429 = True
                break
        assert got_429, f"no 429 for contact rate limit in 40 attempts, codes={codes}"

    def test_forgot_password_rate_limit(self):
        got_429 = False
        codes = []
        for i in range(30):
            r = requests.post(f"{BASE_URL}/api/auth/forgot-password",
                              json={"email": f"rl-{i}@example.com"})
            codes.append(r.status_code)
            if r.status_code == 429:
                got_429 = True
                break
        assert got_429, f"no 429 for forgot-password rate limit in 30 attempts, codes={codes}"
