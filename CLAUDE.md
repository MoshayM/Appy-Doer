# CLAUDE.md

> Master context file for **AI WorkBuddy**.
> Read this first. It points you to every other spec file and sets the rules for how you work in this repository.

---

## 1. What you are building

AI WorkBuddy is an **AI Workforce Operating System** that helps a working professional **discover opportunities, acquire clients, deliver actual work, maintain relationships, and build recurring income — supported by an AI-powered virtual team.** It is *not* a course platform, freelance marketplace, job board, or generic business-education product.

The product optimizes one expanded outcome chain:

```
Skills → Opportunities → Offers → Profile/Portfolio → Clients → Work Delivery → Relationships → Recurring Revenue → Business Growth
```

**The single primary KPI is still:** *"How many users earned their first online income using the platform?"*
Not course completions, not time spent, not feature usage.

**Secondary KPIs (from the expanded vision):** trial-to-paid conversion, repeat-business rate, recurring revenue, work-delivery success rate, relationship retention. Every feature you build must move a user along the chain above.

- **Market:** India-first. Currency **INR (₹)**. Language v1 **English**.
- **Target user:** working professionals aged 25–45 in tech, marketing, consulting, design, product, business ops.
- **Income goal users have:** ₹25,000 – ₹1,00,000+/month in side and recurring income.

> **Vision statement (canonical):** *"An AI Workforce Operating System that helps users discover opportunities, acquire clients, deliver work, maintain relationships, and build recurring income with an AI-powered virtual team."*

---

## 2. Spec file map — read these before coding

| File | What it defines |
|------|-----------------|
| `docs/architecture.md` | System architecture, layers, state-machine orchestration, abstraction layers, offer engine, RBAC enforcement |
| `docs/agent.md` | The AI agents (14 types incl. virtual-team roles), token budgets, inputs/outputs, JSON schemas, shared memory |
| `docs/database.md` | Prisma schema, all models, relationships, enums |
| `docs/api.md` | REST API surface, route handlers, auth, request/response shapes |
| `docs/features.md` | Feature list by plan (Trial/Pro/Premium/Free-locked) and by phase (MVP→Phase 4) |
| `docs/techstack.md` | Exact stack, versions, services, environment variables |

**Order to read for a fresh build:** `techstack.md` → `architecture.md` → `database.md` → `agent.md` → `api.md` → `features.md`.

---

## 3. Non-negotiable architectural rules

These are **final platform requirements**, not suggestions. Do not deviate without flagging (see §6). The expanded vision is merged *on top of* these rules — none of them are relaxed.

1. **Custom state machine for orchestration.** Do NOT use LangChain as the core framework. Do NOT build open-ended autonomous agent loops. The journey is a predictable, structured workflow. **The Virtual Employee Team is implemented as a *bounded, orchestrated* multi-agent workflow (deterministic fan-out → role agents → fan-in → QA → delivery) on this same state machine — not as autonomous self-directing loops.** (See architecture.md §11.)
2. **All agent outputs are strict JSON** validated against a schema before being written to memory or rendered. Reject + retry once on malformed output. This applies to every new agent (Profile Intelligence, Client Intelligence, Relationship Success, Work Support, Virtual Employee roles, Revenue Growth, Business Scaling).
3. **Shared Memory Layer.** Every agent reads from and writes to one shared user-context store. Agents are never isolated. The Virtual Employee Team additionally shares a **project-scoped context** that lives under the same shared-memory discipline.
4. **Payment Abstraction Layer.** The app NEVER talks to a payment gateway directly. It goes App → Payment Service → Adapter (Razorpay / Cashfree / Stripe / PayPal). Annual (Premium) billing flows through the same abstraction.
5. **Email/Notification Service Layer.** Same adapter pattern: App → Email Service → Adapter (Resend / SendGrid / SES). Trial-countdown reminders, offer/FOMO notifications, and relationship/renewal reminders are all dispatched through the Notification Service, never by constructing provider payloads inline.
6. **Subscription plans ≠ platform roles.** These are two separate axes. A plan (Trial/Pro/Premium/Free) controls customer feature access. A role (Super Admin/Admin) controls platform management. Never merge them into one enum.
7. **Super Admin has full, unrestricted, automatic access to everything** — all phases, all agents (incl. every virtual-employee role), all dashboards, all analytics, all beta/experimental features, all system controls, the entire offer engine — with zero manual permission assignment, now and for every future feature. (See §5.)
8. **Phase gating applies only to end users.** Admins and Super Admins are never phase-restricted.

---

## 4. Primary AI model

- **Primary model:** `claude-sonnet-4-6` (Anthropic) — best balance of intelligence and cost for structured JSON generation.
- **Secondary / fallback model:** an OpenAI GPT model (configurable) for resilience during Anthropic downtime.
- Model IDs, per-agent token budgets, and prompts are **Super Admin configurable** at runtime via the AI Control Center. Build them as DB-backed config, not hardcoded constants. This includes every new agent and every virtual-employee role persona.
- Always read the current model ID from config; never hardcode a model string in business logic.

---

## 5. Access control — "full free access for admin"

The **Super Admin** account operates in **Global Access Mode**:

- All MVP + Phase 2 + Phase 3 + Phase 4 features unlocked from day one.
- All current and future agents (production, premium, beta, experimental, internal) unlocked — including Profile Intelligence, Client Intelligence, Relationship Success, Work Support, the full Virtual Employee Team, Revenue Growth, and Business Scaling.
- All dashboards, all analytics, all system/AI/revenue controls, the entire **Premium Offer Engine** unlocked.
- **No future feature ever requires manual Super Admin permission setup.** When you add any new feature, gate it so Super Admin is automatically included.

**Implementation rule:** authorization checks must short-circuit to `allow` when `role === 'SUPER_ADMIN'` *before* evaluating plan/phase/feature-flag logic. Premium users automatically receive any new *customer-facing* feature by the same auto-grant principle.

Access hierarchy (highest to lowest): `SUPER_ADMIN` → `ADMIN` → `PREMIUM` → `PRO` → `TRIAL` → `FREE`.

---

## 6. Living documents — update flexibility (important)

**These `.md` files are the source of truth, but they are living documents.** As you build, you will discover gaps, ambiguities, or better implementations. When that happens:

- **You ARE allowed and expected to update these files** to keep them in sync with the code you write.
- When you make a change that contradicts or extends a spec, do this in the same change:
  1. Make the code change.
  2. Update the relevant `docs/*.md` (and this file if a top-level rule changes).
  3. Add a one-line entry to the **Decision Log** at the bottom of the affected file: `YYYY-MM-DD — what changed and why`.
- For the **8 non-negotiable rules in §3** and the **Super Admin access rule in §5**: do not change these silently. If you believe one must change, STOP, explain the tradeoff, propose the change, and wait for confirmation before editing.
- For everything else (naming, schema details, endpoint shapes, UI structure, defaults, prices): you have flexibility — make the sensible call, implement it, and record it in the Decision Log.

**Prompt pattern when something is unspecified:** state the assumption, implement against it, log it. Do not block on small ambiguities.

---

## 7. Resolved decisions & remaining defaults

Build against these; the priced/timed ones are reversible config, not architecture.

- **Free plan → 7-day trial (RESOLVED).** There is no longer an unlimited free plan. New users start a **7-day full-access trial**. On expiry without subscribing they drop to a **restricted `FREE` (locked) state**: read-only access to prior data + upgrade wall, **0 new AI generations/day**. A visible **Day 7 → Day 0 countdown**, progress bar, and daily reminders run for the whole trial.
- **Plan structure (RESOLVED):** **Pro = monthly** (₹999/mo default). **Premium = annual only** (₹19,999/yr default ≈ ₹1,667/mo effective — lower effective yearly pricing than monthly equivalent), eligible for **personalized discounts** from the offer engine. Prices are reversible config.
- **Premium Offer Engine (Smart Upgrade Engine) — RESOLVED as a launch feature:** AI-personalized, limited-time, dynamic-discount, FOMO upgrade offers driven by activity, usage frequency, engagement score, opportunity potential, interests, and predicted conversion likelihood.
- **Daily AI-output reset:** reset at **00:00 IST**. Store usage with a date key in IST.
- **Priority AI processing (Premium benefit):** implement at launch as a **higher token budget**, not queue prioritization. Revisit at scale.
- **Proposal Generator & Outreach Generator:** sub-modes/tabs inside the Client Acquisition Agent.
- **Community Success Stories:** Admin-approved submission queue (submit → review → publish).
- **Admin permission presets:** ship 3 templates — Support Admin, Content Admin, Finance Admin.
- **Virtual Employee Team phasing (default):** flagship **Phase 3** capability (most complex orchestration). Profile Intelligence, Client Intelligence, Relationship Success, and Work Support ship in the **MVP**. Logged — confirm if you want VET earlier.

---

## 8. Build conventions

- **Single Next.js app** (App Router) with API routes is the default for MVP.
- TypeScript everywhere. No `any` in business logic.
- Prisma is the only DB access path. No raw SQL except in monitored migrations.
- Every external service (payments, email, AI, storage, scheduling) sits behind a service interface + adapter so it can be swapped and mocked in tests.
- Server-side enforcement of all plan limits and role checks. Never trust the client for entitlement.
- **Scheduled work** (trial countdown notifications, offer expiry/FOMO, relationship/renewal/birthday reminders, weekly digest) runs through a scheduler service (Vercel Cron / pg_cron), never ad-hoc timers.
- **Published profile sites** are server-rendered from `ProfessionalProfile`/`ProfileVersion`; resume/proposal PDFs go to object storage.
- Round and format all currency as INR (`₹` + Indian digit grouping, e.g. ₹1,00,000).
- Write tests for: entitlement checks, usage-limit enforcement, trial-expiry transition, the orchestration state machine (incl. the bounded virtual-team fan-out/fan-in), the offer-engine targeting rules, and the payment/email adapters.

---

## 9. Definition of done for the MVP

A user can: sign up → **start the 7-day trial with a live countdown** → complete skill assessment → discover an opportunity → build an offer → build a portfolio → **generate a Profile Intelligence profile (resume / public profile / service catalog) and publish a profile site** → add a lead → **run Client Intelligence to score the lead's temperature and tailor a proposal** → generate outreach → track it in the CRM → **let the Relationship Success Agent schedule follow-ups/reminders** → **use the Work Support Agent to deliver the work** → mark a client "Won" → trigger the **First Income Celebration** → see it on the Income Dashboard. The **Premium Offer Engine** surfaces a personalized upgrade offer during/after the trial. Subscription billing works via Razorpay (Cashfree failover) for monthly Pro and annual Premium. A Super Admin can manage everything — including the offer engine — from the admin dashboard.

---

## Decision Log
- 2026-05-30 — Initial spec set compiled from product + engineering decision documents 1–5.
- 2026-06-17 — Rebranded **AI-SHOS → AI WorkBuddy** and merged the AI Workforce Studio expansion: vision broadened from side-hustle to AI Workforce OS; income chain extended with Profile, Work Delivery and Relationships; replaced unlimited Free with a 7-day trial + locked post-trial Free state; resolved Pro=monthly / Premium=annual pricing; added the Premium Offer Engine; added Profile Intelligence, Client Intelligence, Relationship Success, Work Support, Virtual Employee Team, Revenue Growth, and Business Scaling agents. **§3.1 preserved** by defining the Virtual Employee Team as a bounded orchestrated workflow, not autonomous loops. All 8 non-negotiable rules and the Super Admin rule kept intact.
- 2026-06-21 — Added full Gmail outreach platform (10 phases): OAuth scopes upgraded to gmail.modify + labels; EmailThread + EmailMessage DB models; Gmail sync service (2-min cron); Reply Intelligence agent (REPLY_INTELLIGENCE); SSE notifications; Outreach dashboard; conversation thread view with reply composer; NotificationBell component; CRM auto-stage update on reply. Cold-email route updated to create EmailThread on Gmail sends.
