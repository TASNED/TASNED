"""
Bookings module — placeholder skeleton.

Future scope: inspection appointment booking, calendar sync, availability
windows, vessel + port scheduling, confirmations. This file only exposes a
health endpoint today so the module loader can discover it.
"""
from fastapi import APIRouter
from datetime import datetime, timezone

MODULE_NAME = "bookings"
MODULE_VERSION = "0.1.0-skeleton"

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.get("/health")
async def bookings_health():
    return {
        "module": MODULE_NAME,
        "version": MODULE_VERSION,
        "status": "ok",
        "ready": False,
        "note": "Skeleton — bookings endpoints not yet implemented.",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
