"""Regression tests for the pluggable modules skeleton (portal, crm, erp, bookings, payments)."""
import os
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://marine-testing-hub.preview.emergentagent.com").rstrip("/")
if "marine-testing-hub" not in BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL"):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
    except Exception:
        pass

EXPECTED_MODULES = {"portal", "crm", "erp", "bookings", "payments"}


def test_modules_registry_lists_all_expected_modules():
    r = requests.get(f"{BASE_URL}/api/modules", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["count"] == len(EXPECTED_MODULES)
    names = {m["name"] for m in body["modules"]}
    assert names == EXPECTED_MODULES
    for m in body["modules"]:
        assert m["loaded"] is True
        assert m["error"] is None
        assert m["prefix"] == f"/api/{m['name']}"


def test_each_module_health_endpoint_is_reachable():
    for name in EXPECTED_MODULES:
        r = requests.get(f"{BASE_URL}/api/{name}/health", timeout=15)
        assert r.status_code == 200, f"{name}: {r.status_code} {r.text}"
        data = r.json()
        assert data["module"] == name
        assert data["status"] == "ok"
        assert "version" in data
        assert "timestamp" in data
