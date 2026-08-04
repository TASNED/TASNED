# TASNED INTEGRATED — Marine Laboratory Website

## Problem Statement
International corporate website for TASNED INTEGRATED, a marine laboratory specializing EXCLUSIVELY in ballast water sampling, laboratory analysis and compliance testing (IMO Ballast Water Convention + US Coast Guard). Premium, minimal, bilingual (EN/AR), award-worthy. No treatment/repair/engineering/equipment services. No fabricated certifications, history, stats or news.

## Stack & Architecture
- Frontend: React 19 + Tailwind + shadcn/ui + framer-motion (kinetic hero, scroll reveals) + Lenis (smooth scroll) + react-fast-marquee.
- Backend: FastAPI + MongoDB (motor). JWT cookie auth (single admin), News CRUD, Contact/inspection requests.
- Email: Resend (Emergent-managed) — inspection-request notifications to OWNER_EMAIL (info@tasned.sa).
- Bilingual EN/AR with full RTL (dir toggle, Noto Kufi Arabic font, logical properties).

## Brand
- Name "TASNED INTEGRATED" (logo shows "TASNED"). Colors: Navy #0A1F3D, Teal #008B95, Cyan #00C2C7, Slate #5B6770, Light gray #E6EBEF, White. Font: Montserrat + JetBrains Mono accents.
- Contact: Yanbu, Saudi Arabia · info@tasned.sa · www.tasned.sa

## Implemented (2026-08-04)
- Pages: Home (kinetic hero, marquee, services, 5-step workflow, industries, why-choose manifesto, counters, CTA), About (mission/vision/values), Services (6), Ballast Water Testing (12 topics), Laboratory (8 capabilities), Standards (IMO/D-1/D-2/USCG), Industries (8), FAQ (31 Q&A accordion), News (grid + article detail + empty state), Contact (full inspection form + Google Map embed + business hours + emergency button), Privacy, Terms.
- Admin: /admin/login (JWT), /admin/news (news CRUD dialog EN/AR + inspection-requests tab).
- SEO: per-page meta title/description, H1/H2 hierarchy, breadcrumbs, accessible semantics.
- Verified: backend curl (auth, news, contact), screenshots (home, services, about EN+AR RTL, contact, FAQ, admin CRUD).

## Admin
- admin@tasned.sa / TasnedAdmin2026! (see /app/memory/test_credentials.md)

## Backlog / Next
- P1: Schema.org JSON-LD (Organization/FAQ/Breadcrumb) injection per page.
- P2: Rich text / image upload for news body; news pagination.
- P2: Sitemap.xml + robots.txt.
- P2: Contact form field-level validation + honeypot anti-spam.
