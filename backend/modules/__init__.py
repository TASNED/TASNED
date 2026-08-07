"""
TASNED INTEGRATED — pluggable module registry.

Every file in this package that exposes `router: APIRouter` is auto-discovered
by `collect_modules()` and mounted onto the FastAPI app at startup — no
`server.py` change is required to add a new module.

Convention (kept intentionally simple):
  1. Create `modules/<name>.py`.
  2. Define `MODULE_NAME = "<name>"`, `MODULE_VERSION = "<semver>"`.
  3. Define `router = APIRouter(prefix="/api/<name>", tags=["<name>"])`.
  4. Add at least one route (e.g. `GET /health`).
  5. Restart the backend.

`collect_modules()` returns metadata used by `/api/modules` so admins can see
which modules are loaded, their version, and whether they are ready.
"""
import importlib
import logging
import pkgutil
from dataclasses import dataclass
from typing import List, Optional

from fastapi import APIRouter

logger = logging.getLogger("tasned.modules")


@dataclass
class LoadedModule:
    name: str
    version: str
    router: APIRouter
    error: Optional[str] = None


def collect_modules() -> List[LoadedModule]:
    loaded: List[LoadedModule] = []
    for _, name, is_pkg in pkgutil.iter_modules(__path__):
        if is_pkg or name.startswith("_"):
            continue
        try:
            mod = importlib.import_module(f"{__name__}.{name}")
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to import module '%s'", name)
            loaded.append(LoadedModule(name=name, version="?", router=None, error=str(exc)))  # type: ignore[arg-type]
            continue

        router = getattr(mod, "router", None)
        if not isinstance(router, APIRouter):
            logger.warning("Module '%s' has no APIRouter — skipped", name)
            continue

        loaded.append(
            LoadedModule(
                name=getattr(mod, "MODULE_NAME", name),
                version=getattr(mod, "MODULE_VERSION", "0.0.0"),
                router=router,
            )
        )
    return loaded
