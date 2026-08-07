"""
Payments module — placeholder skeleton.

Future scope: Stripe checkout for retainers/deposits, invoice payment links,
receipts, refunds. This file only exposes a health endpoint today so the
module loader can discover it.
"""
from fastapi import APIRouter
from datetime import datetime, timezone

MODULE_NAME = "payments"
MODULE_VERSION = "0.1.0-skeleton"

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/health")
async def payments_health():
    return {
        "module": MODULE_NAME,
        "version": MODULE_VERSION,
        "status": "ok",
        "ready": False,
        "note": "Skeleton — payments endpoints not yet implemented.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
