"""
CRM module — placeholder skeleton.

Future scope: leads, accounts, contacts, opportunities, activity timeline,
pipeline stages, deal owner assignment. This file only exposes a health
endpoint today so the module loader can discover it.
"""
from fastapi import APIRouter
from datetime import datetime, timezone

MODULE_NAME = "crm"
MODULE_VERSION = "0.1.0-skeleton"

router = APIRouter(prefix="/api/crm", tags=["crm"])


@router.get("/health")
async def crm_health():
    return {
        "module": MODULE_NAME,
        "version": MODULE_VERSION,
        "status": "ok",
        "ready": False,
        "note": "Skeleton — CRM endpoints not yet implemented.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
