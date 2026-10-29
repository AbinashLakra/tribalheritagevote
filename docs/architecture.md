# Tribal Heritage Vote — Architectural Specification

## 1. Overview
Tribal Heritage Vote is a production-grade digital platform designed and developed to celebrate, preserve, and democratically recognize authentic Adivasi artists across India, based in Rourkela, Sundargarh district, Odisha.

The platform provides four dedicated portals:
1. **Public Showcase & Voting Portal** (`/`, `/artists`, `/artists/[slug]`, `/leaderboard`, `/results`)
2. **Artist Nomination & Profile Portal** (`/artist/dashboard`, `/artist/profile`, `/artist/nomination`)
3. **Voter Verification & Ballot Receipt Hub** (`/vote/verify`, `/vote/receipt/[id]`)
4. **Administrative & Cultural Moderation Console** (`/admin`, `/admin/contest`, `/admin/nominations`, `/admin/audit-logs`)

---

## 2. Technology Stack & Design Decisions

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | High-performance Server Components, edge routing, and streaming SSR. |
| **Language** | TypeScript (Strict Mode) | Complete type-safety preventing runtime errors across client and server boundaries. |
| **Styling** | Tailwind CSS v4 | Earth-inspired, culturally respectful palette (Forest Green, Warm Ivory, Terracotta, Charcoal). |
| **Database** | Supabase (PostgreSQL) | Robust ACID transactional engine, Row Level Security (RLS), and custom PL/pgSQL RPCs. |
| **Auth** | Supabase Auth (Phone OTP) | Native mobile phone verification compliant with Indian E.164 standards (+91). |
| **Storage** | Cloudflare R2 | Direct browser-to-bucket presigned PUT uploads bypassing serverless payload limits. |
| **Testing** | Vitest & Playwright | Rapid unit/integration testing and end-to-end browser automation. |

---

## 3. Modular System Architecture

```text
src/
├── app/
│   ├── (public)/          # Public-facing showcase, directory, profile & leaderboard
│   ├── (artist)/          # Artist onboarding, persistent profile & video submission
│   ├── (voter)/           # Voter verification modals and cryptographic ballot receipts
│   ├── (admin)/           # Contest lifecycle, jury moderation queue & audit trail
│   └── api/               # Protected server endpoints (uploads, voting, moderation)
├── features/              # Co-located domain modules (auth, artists, nominations, voting, admin)
├── lib/                   # Infrastructure clients (Supabase, Cloudflare R2, Security, Utilities)
└── config/                # Platform limits, MIME rules, site metadata
```

