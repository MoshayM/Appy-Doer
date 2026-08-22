# techstack.md

Exact technology stack for **AI WorkBuddy**. Versions are minimums; pin them in `package.json`.

---

## Frontend

| Tool | Purpose | Notes |
|------|---------|-------|
| **Next.js** (App Router, v14+) | Web app + API routes | Server components for data, client components for interactivity. Also serves **published profile sites** (dynamic routes). |
| **TypeScript** (v5+) | Type safety | Strict mode on; no `any` in business logic |
| **Tailwind CSS** (v3+) | Styling | Utility-first |
| **ShadCN UI** | Component library | Radix-based, owned components in `components/ui` |
| **TanStack Query** | Client data fetching/caching | For agent calls, dashboards, offer/notification polling |
| **Zod** | Runtime schema validation | Shared between client + server; validates every agent's JSON output |
| **Recharts** | Dashboard charts | Income/revenue/pipeline/conversion visualizations |

---

## Backend

| Tool | Purpose | Notes |
|------|---------|-------|
| **Node.js** (v20 LTS+) | Runtime | |
| **Next.js Route Handlers** | API layer | Single-app architecture for MVP |
| **PostgreSQL** (v15+) | Primary database | Hosted on Supabase |
| **Prisma ORM** (v5+) | DB access | Only data-access path; see `database.md` |
| **Supabase Auth** | Authentication | Email OTP + password; sessions |
| **Scheduler** (Vercel Cron and/or `pg_cron`) | Time-driven jobs | Trial countdown reminders, offer expiry + FOMO nudges, relationship/renewal/birthday reminders, weekly digest |

---

## AI Layer

| Tool | Purpose | Notes |
|------|---------|-------|
| **Anthropic API** | Primary model | `claude-sonnet-4-6`; structured JSON outputs |
| **OpenAI API** | Secondary/fallback | Configurable GPT model |
| **Custom orchestration** | State machine + shared memory + **bounded multi-agent (Virtual Employee Team)** | NO LangChain, NO autonomous loops; see `architecture.md` and `agent.md` |

- Model IDs, per-agent token budgets, system prompts, **and virtual-employee role personas** are **DB-backed config**, editable by Super Admin. Never hardcode.
- All agent calls go through one `AgentRunner` that enforces token budgets, validates JSON, and writes to shared memory. The Virtual Employee Team runs a `TeamOrchestrator` that fans out to role agents through the same `AgentRunner`.

---

## Payments (Payment Abstraction Layer)

| Provider | Role | Phase |
|----------|------|-------|
| **Razorpay** | Primary (INR, UPI, cards, net banking, wallets, subscriptions — monthly Pro + **annual Premium**) | MVP |
| **Cashfree** | Failover / redundancy | MVP |
| **Stripe** | Global (USD/GBP/EUR) | Phase 2 |
| **PayPal** | Global alternative | Phase 2 |

- App → `PaymentService` → `GatewayAdapter` → provider. App never calls a provider SDK directly.
- Must support: subscription create/cancel/upgrade, **monthly + annual intervals**, **discounted/offer-priced checkout** (from the offer engine), webhook normalization, refunds, failed-payment handling, **18% GST-compliant invoicing** (collect optional GSTIN).

---

## Email & Notification (Service Layer)

| Provider | Role |
|----------|------|
| **Resend** | Primary transactional (MVP) |
| **SendGrid** | Backup |
| **Amazon SES** | Future / high volume |

- App → `EmailService` / `NotificationService` → adapter → provider.
- **Notification channels:** `IN_APP`, `EMAIL`, and `PUSH` (in-app + email at MVP; push optional later). One `NotificationService` API for all campaign types.
- Transactional + campaign events: OTP login, verification, reset, welcome, **trial countdown reminders**, **personalized/FOMO upgrade offers**, subscription + payment notifications, **First Income Celebration**, achievement, **relationship/renewal/birthday/check-in reminders**, weekly digest.

---

## Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting + serverless functions + **Cron** for the Next.js app |
| **Supabase** | Postgres + Auth + object storage + `pg_cron` (alt scheduler) |
| **Supabase Storage / S3-compatible** | Portfolio assets, generated profile sites' assets, **resume/proposal/presentation PDFs**, exports |
| **Analytics layer** | Product + revenue + conversion analytics (PostHog or equivalent) |
| **Redis (optional, recommended)** | Offer-engine scoring cache, rate limiting, scheduled-job locks |

---

## Suggested third-party libraries

- **Feature flags:** PostHog flags, Unleash, or the DB-backed flag table (boolean / percentage / segment).
- **PDF/Excel/CSV export:** admin reports + user proposals/portfolios + **resume/profile PDF generation**.
- **Rate limiting + counters:** per-user, per-tier AI output limits (Postgres counter or Redis).
- **Scheduling:** Vercel Cron / `pg_cron` for all recurring reminders and offer-expiry jobs.

---

## Environment variables (template)

```
# Database
DATABASE_URL=
DIRECT_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_WEBHOOK_SECRET=
# Phase 2:
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Email / Notifications
RESEND_API_KEY=
SENDGRID_API_KEY=
AWS_SES_ACCESS_KEY=
AWS_SES_SECRET_KEY=

# Scheduling / Offer engine
CRON_SECRET=
REDIS_URL=

# App
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_PROFILE_BASE_URL=     # base for published profile sites, e.g. https://workbuddy.app/p
APP_TIMEZONE=Asia/Kolkata
```

---

## Decision Log
- 2026-05-30 — Stack compiled from PRD docs 1–5. `claude-sonnet-4-6` selected as primary model (current Sonnet, $3/$15 per M tokens, strong structured-output + coding performance).
- 2026-06-17 — Rebranded to **AI WorkBuddy**. Added: scheduler (Vercel Cron / pg_cron) for trial countdown, offer/FOMO and relationship reminders; `NotificationService` (in-app + email, push optional); published-profile-site rendering + resume/proposal PDF storage; annual (Premium) + discounted-offer checkout via the payment abstraction; optional Redis for offer scoring/rate limiting/job locks. Added `CRON_SECRET`, `REDIS_URL`, `NEXT_PUBLIC_PROFILE_BASE_URL` env vars.
