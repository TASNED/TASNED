"""
Client Portal module — placeholder skeleton.

Future scope: authenticated client dashboard, ticket submission, document
downloads (reports/certificates), inspection status tracking. This file only
exposes a health endpoint today so the module loader can discover it.
"""
from fastapi import APIRouter
from datetime import datetime, timezone

MODULE_NAME = "portal"
MODULE_VERSION = "0.1.0-skeleton"

router = APIRouter(prefix="/api/portal", tags=["portal"])


@router.get("/health")
async def portal_health():
    return {
        "module": MODULE_NAME,
        "version": MODULE_VERSION,
        "status": "ok",
        "ready": False,
        "note": "Skeleton — client portal endpoints not yet implemented.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
