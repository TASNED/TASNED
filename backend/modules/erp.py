"""
ERP module — placeholder skeleton.

Future scope: quotations, work orders, invoices, purchase orders, inventory,
laboratory job orders, resource planning. This file only exposes a health
endpoint today so the module loader can discover it.
"""
from fastapi import APIRouter
from datetime import datetime, timezone

MODULE_NAME = "erp"
MODULE_VERSION = "0.1.0-skeleton"

router = APIRouter(prefix="/api/erp", tags=["erp"])


@router.get("/health")
async def erp_health():
    return {
        "module": MODULE_NAME,
        "version": MODULE_VERSION,
        "status": "ok",
        "ready": False,
        "note": "Skeleton — ERP endpoints not yet implemented.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
