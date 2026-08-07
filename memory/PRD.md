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
- **Enterprise SEO (2026-08-07 update):**
  - Pre-hydrated branded `<title>`, meta description, canonical (`https://www.tasned.sa/`), Open Graph and Twitter Card in `public/index.html`.
  - Pre-hydrated Organization + WebSite JSON-LD with `alternateName: ["TASNED", "تسنيد"]`.
  - Runtime `Layout.jsx`: branded per-page titles (`Page | TASNED Integrated`), canonical, hreflang en/ar/x-default, dedupe of pre-hydrated schemas after runtime fetch.
  - Backend `/api/schemas` emits Organization + WebSite + BreadcrumbList (+ Service on /services, + FAQPage on /faq via frontend from static content).
  - `public/sitemap.xml` (12 URLs, hreflang alternates), `public/robots.txt` (allows all public, disallows `/admin`, `/api/admin/`, `/api/private`, `/api/media/upload`).
  - Favicon set: `favicon.ico` (multi-size), `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180x180), `tasned-logo.png` (512), `og-image.png` (1200x630) — generated from the official TASNED brand mark.
- **Enterprise Security:** SlowAPI rate limiting, CSRF Origin/Referer validation, bleach XSS sanitization, CSP + HSTS + XFO + XCTO + Referrer-Policy + Permissions-Policy headers, password policy + bcrypt hashing.
- **Modular skeleton:** `/api/modules` registry + `/api/{portal,crm,erp,bookings,payments}/health`.

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
