# TASNED INTEGRATED — Marine Laboratory Website

## Problem Statement
International corporate website for TASNED INTEGRATED, a marine laboratory specializing EXCLUSIVELY in ballast water sampling, laboratory analysis and compliance testing (IMO Ballast Water Convention). Premium, minimal, bilingual (EN/AR), award-worthy. No treatment/repair/engineering/equipment services. No fabricated certifications, history, stats or news. Public UI must not be redesigned.

## Stack & Architecture
- **Frontend:** React 19 + Tailwind + shadcn/ui + framer-motion + Lenis smooth scroll + react-fast-marquee.
- **Backend:** FastAPI + MongoDB (motor). JWT cookie auth with RBAC (super_admin/admin/editor). Enterprise CMS, SEO, Security layers.
- **Email:** Resend (Emergent-managed) — inspection & careers notifications to OWNER_EMAIL (info@tasned.sa).
- **Bilingual EN/AR** with full RTL (dir toggle, Noto Kufi Arabic).
- **Pluggable Modules (2026-08-07):** `/app/backend/modules/` — auto-discovered at startup. Current skeletons: `portal`, `crm`, `erp`, `bookings`, `payments`. Add a new module by dropping `modules/<name>.py` exposing `router: APIRouter` — no `server.py` edit needed.

## Brand
- "TASNED INTEGRATED" (logo shows "TASNED"). Colors: Navy #0A1F3D, Teal #008B95, Cyan #00C2C7, Slate #5B6770, Light gray #E6EBEF. Font: Montserrat + JetBrains Mono accents.
- Contact: Yanbu, Saudi Arabia · info@tasned.sa · www.tasned.sa

## Implemented
- **Public site:** Home, About, Services, Ballast Water Testing, Laboratory, Standards, Industries, FAQ, News, Contact (map + form + emergency), Careers (with file upload), Privacy, Terms — all bilingual EN/AR with RTL.
- **Enterprise CMS:** RBAC (super_admin/admin/editor), Generic content managers (services, faq, industries, pages…), Media Library w/ upload, Versioning, Settings Manager, Audit Logs — mounted at `/admin`.
- **Enterprise SEO:** `/sitemap.xml`, `/robots.txt`, `/api/sitemap-images.xml`, per-page SEO overrides via CMS, JSON-LD (LocalBusiness / Organization / Service / FAQ) injected on public pages.
- **Enterprise Security:** SlowAPI rate limiting (auth 10/min, contact 10/min, careers/reset 5/min), CSRF Origin/Referer validation on `/api/admin/*` mutations, bleach XSS sanitization for stored content, strict CSP + HSTS + XFO + XCTO + Referrer-Policy + Permissions-Policy headers, password policy + bcrypt hashing, idempotent admin seed.
- **Modular skeleton (2026-08-07):** `/api/modules` registry endpoint; `/api/{portal,crm,erp,bookings,payments}/health` all return 200 with module metadata.

## Admin credentials
See `/app/memory/test_credentials.md` — admin@tasned.sa / 12a34b56cd21 (super_admin).

## Test suite
- `/app/backend/tests/` — pytest. 62 tests total, 60 passing.
- 2 pre-existing failures unrelated to modules work:
  - `backend_test.py::test_login_success` asserts stale role name ("admin" vs current "super_admin").
  - `test_security_layer.py::TestAuditLoginLogout` collides with global rate limiter across parallel test workers.

## Backlog / Next
- **P1:** Update the 2 stale tests noted above (role assertion + rate-limiter-safe login fixture).
- **P2:** Refactor `server.py` (1100+ lines) into `/app/backend/routes/` (cms.py, seo.py, security.py, auth.py) — deferred by user until required.
- **P2:** Wire real business logic into `portal` (client dashboard, tickets, report downloads).
- **P2:** Visual click-to-edit on live public site.
- **P2:** Dynamic drag-and-drop page builder in CMS.
- **P3:** Real CRM/ERP endpoints (leads/accounts/quotations/invoices).

## Notes / Environment
- **CSRF caveat (preview only):** the Emergent Kubernetes ingress rewrites the `Origin` header before it reaches the pod, so external CSRF probes appear to bypass the check. Verified via localhost: foreign Origin/Referer correctly returns **403**. In production (real reverse proxy or direct hosting) the check functions as intended.
- **User declined Supabase/Vercel migration** — staying on FastAPI + MongoDB + Emergent hosting.
