# architecture.md

System architecture for **AI WorkBuddy**. Read after `techstack.md`.

---

## 1. High-level layers

```
┌─────────────────────────────────────────────────────────┐
│  Presentation (Next.js App Router + ShadCN UI)            │
│  - Customer app (Trial / Pro / Premium / Free-locked)     │
│  - Trial countdown + offer banners (every page)           │
│  - Published profile sites (public)                       │
│  - Super Admin / Admin dashboard                          │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  API layer (Next.js Route Handlers)                       │
│  - Auth + session                                         │
│  - Entitlement guard (role + plan + phase + flags)        │
│  - Usage / rate-limit guard                               │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Service layer                                            │
│  - AgentRunner (orchestration state machine)              │
│  - TeamOrchestrator (bounded multi-agent / Virtual Team)  │
│  - SharedMemoryService (user + project scope)             │
│  - PaymentService → adapters                              │
│  - EmailService / NotificationService → adapters          │
│  - OfferEngine (Smart Upgrade) + Scheduler                │
│  - ProfileService (build + publish), ClientIntelService   │
│  - CRMService / RelationshipService, BillingService,      │
│    AnalyticsService                                       │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Data layer (Prisma → PostgreSQL on Supabase)             │
│  + Object storage + external APIs (Anthropic/OpenAI,      │
│    Razorpay/Cashfree, Resend) + scheduler (Cron/pg_cron)  │
└──────────────────────────────────────────────────────────┘
```

---

## 2. AI orchestration — custom state machine

**Decision: custom state machine with shared memory. No LangChain. No autonomous loops.** The user journey is a predictable business workflow.

### Guided flow (state graph)

```
SKILL_ASSESSMENT
   ↓
OPPORTUNITY_DISCOVERY
   ↓
OFFER_BUILDER
   ↓
PORTFOLIO_BUILDER ──► PROFILE_INTELLIGENCE   (build + publish profile/resume/site)
   ↓
CLIENT_ACQUISITION ◄── CLIENT_INTELLIGENCE   (score temperature, tailor proposal)
   ↓
WORK_SUPPORT ──► VIRTUAL_EMPLOYEE_TEAM        (deliver the work; VET is Phase 3)
   ↓
RELATIONSHIP_SUCCESS                          (follow-ups, nurture, upsell/repeat)
   ↓
INCOME_DASHBOARD
   ↓
GROWTH (REVENUE_GROWTH / BUSINESS_SCALING)
```

- New users are guided through states in order.
- After onboarding, users can invoke **any** agent independently (advanced users are not forced through the full flow). The state machine tracks `currentState` but allows direct transitions for onboarded users.
- `CLIENT_INTELLIGENCE`, `RELATIONSHIP_SUCCESS`, and `WORK_SUPPORT` are also reachable as **side-states** triggered by CRM/workspace events (e.g. a lead added → suggest Client Intelligence; a lead won → Work Support; lead stale → Relationship Success).

### `AgentRunner` execution sequence (one agent call)

```
1. Authorize        → role/plan/phase check (Super Admin short-circuits to allow)
2. Check usage      → daily AI-output limit for the plan; reject with upgrade trigger if exceeded
3. Read memory      → load UserContext (+ ProjectWorkspace context if scoped) from SharedMemoryService
4. Build prompt     → agent system prompt (from config) + memory context, capped at the agent's input token budget
5. Call model       → claude-sonnet-4-6 (fallback: OpenAI) with max output = agent's output token budget
6. Validate         → parse + Zod-validate the JSON against the agent's schema; on failure, retry ONCE
7. Persist          → write structured output to shared memory + the relevant domain table
8. Increment usage  → record one AI output against the user's daily counter (IST day)
9. Return           → typed JSON to the API → UI
```

- **Error handling:** state is saved before step 5 so a failed model call never loses prior progress. If validation fails twice, return a typed error; do not write partial output to memory.
- **Token budgets:** per-agent, DB-configurable. Defaults in `agent.md`.

---

## 3. Shared Memory Layer

A single `UserContext` per user, read/written by all agents, plus **project-scoped context** for work delivery. Conceptual shape:

```ts
interface UserContext {
  userId: string;
  profile: { profession; experienceYears; industry; availableHoursPerWeek; incomeTargetINR };
  skills: string[];
  interests: string[];
  selectedOpportunityId?: string;
  generatedOffers: OfferRef[];
  portfolioAssets: AssetRef[];
  professionalProfiles: ProfileRef[];        // Profile Intelligence outputs
  clientSummaries: ClientRef[];              // Client Intelligence outputs
  relationshipSummary: { active: number; atRisk: number; champions: number };
  crmActivitySummary: { leads: number; won: number };
  revenueMilestones: MilestoneRef[];
  engagementScore: number;                   // 0-100, feeds the offer engine
  profileCompletion: number;                 // 0-100
  version: number;                           // optimistic locking
  updatedAt: Date;
}

interface ProjectContext {                   // one per ProjectWorkspace (Work Support / Virtual Team)
  workspaceId: string;
  objective: string;
  requirements: string[];
  tasks: TaskRef[];
  roleOutputs: Record<EmployeeRole, unknown>; // collaboration memory for the Virtual Team
  status: WorkStatus;
  version: number;
}
```

- **Conflict rule:** writes use optimistic locking on `version`. On mismatch, re-read and merge non-conflicting fields, prefer the newest user-set value for direct profile fields.
- Each agent automatically consumes prior agents' outputs (e.g. Profile Intelligence reads portfolio + skills + opportunities; Client Intelligence feeds Client Acquisition; Work Support reads the won lead + offer).

---

## 4. Payment Abstraction Layer

```
App → PaymentService → GatewayAdapter (interface) → { RazorpayAdapter | CashfreeAdapter | StripeAdapter | PayPalAdapter }
```

- The app NEVER imports a gateway SDK directly.
- `PaymentService` owns: subscription create/upgrade/cancel across **monthly (Pro) and annual (Premium)** intervals, **offer-priced checkout** (a `SubscriptionOffer` resolves to a discounted amount), webhook **normalization**, refunds, failed-payment retries + grace period (default 3 days), GST invoicing (18%, optional GSTIN).
- MVP active adapters: Razorpay (primary), Cashfree (failover). Phase 2: Stripe, PayPal.

---

## 5. Email & Notification Service Layer

```
App → EmailService / NotificationService → Adapter (interface) → { ResendAdapter | SendGridAdapter | SESAdapter }
```

- MVP primary: Resend. Backup: SendGrid. Future: SES.
- `NotificationService` exposes typed methods per event and per channel (`IN_APP | EMAIL | PUSH`): OTP, verification, reset, welcome, subscription, payment, **trialReminder(day)**, **offer(type)**, **firstIncomeCelebration**, achievement, **relationshipReminder(kind)**, **renewalReminder**, **weeklyDigest** — callers never construct provider payloads.
- Campaign sends are recorded in `NotificationCampaign` for analytics (open/read/convert).

---

## 6. RBAC + entitlement enforcement

Two independent axes — never merged:

- **Subscription plan** (`TRIAL | PRO | PREMIUM | FREE`) → customer feature access + usage limits.
- **Platform role** (`SUPER_ADMIN | ADMIN | CUSTOMER`) → platform management.

### The entitlement guard (server-side, on every protected route/agent)

```
function canAccess(user, featureKey):
    if user.role == SUPER_ADMIN: return ALLOW        # full free access — short-circuit
    if user.role == ADMIN and featureKey in user.adminPermissions: return ALLOW
    # customer path:
    if user.plan == FREE and feature.requiresGeneration: return DENY (with upgradeTrigger)  # post-trial locked
    if feature.phase > currentEnabledPhase and not user.isPremiumAutoGrant: return DENY
    if feature not in planFeatures[user.plan]: return DENY (with upgradeTrigger)
    if featureFlag(featureKey) disabled for user: return DENY
    return ALLOW
```

- **Super Admin auto-grant** and **Premium auto-grant** as before — new features need no permission wiring; new customer-facing features auto-join the Premium set.
- **Trial = full Pro-level access** for 7 days. **Free (post-trial) = read-only** (view prior data, 0 new AI generations) + upgrade wall.
- **Phase gating:** end users only; Admin/Super Admin bypass.

---

## 7. Usage limits (server-enforced)

| Plan | AI outputs/day | CRM leads | Roadmaps | Profile gens | Workspaces | History |
|------|----------------|-----------|----------|--------------|-----------|---------|
| Trial (7d) | 100 (Pro-level) | ∞ | ∞ | ∞ | ∞ | full during trial |
| Pro | 100 | ∞ | ∞ | ∞ | ∞ | full |
| Premium | ∞ (fair use: 1,000/mo soft) | ∞ | ∞ | ∞ | ∞ | full |
| Free (post-trial, locked) | 0 (read-only) | view only | view only | view only | view only | 7 days |

- Reset window: **00:00 IST**.
- Premium fair-use: beyond 1,000 outputs/month → soft monitoring + Admin review, no automatic block.
- Hitting any limit (or the Free lock) returns a typed `upgradeTrigger` the UI renders as an upgrade prompt — and signals the **Offer Engine** to consider surfacing a personalized offer.

---

## 8. Trial logic & countdown

- New signups start a **7-day full-access trial** (`SubStatus = TRIALING`, Pro-level entitlements). No payment at signup; one trial per account.
- **Countdown UI on every page:** Day 7 → Day 0, with a progress bar and daily in-app + email reminders ("You have N days remaining.").
- **Daily scheduler job** computes remaining days, fires reminder notifications, and asks the Offer Engine whether to attach an offer (e.g. Day 5/2/1, last 24h FOMO).
- On expiry without subscribing → **auto-transition to `FREE` (locked)**: read-only, 0 generations, persistent upgrade CTA.
- Track: trial start rate, daily-active during trial, trial-to-paid conversion.

---

## 9. Premium Offer Engine (Smart Upgrade Engine)

A service that generates **personalized, limited-time upgrade offers**.

**Inputs (scoring):** user activity, usage frequency, `engagementScore`, opportunity potential, user interests, predicted conversion likelihood, days left in trial.

**Mechanics:**
- Admin-defined `OfferCampaign`s carry targeting `rules` (thresholds on the inputs above), an `OfferType` (`LIMITED_TIME | DYNAMIC_DISCOUNT | PERSONALIZED_UPGRADE | FOMO | TRIAL_CONVERSION`), and a discount band.
- The engine evaluates eligible campaigns for a user, computes a **dynamic discount** (bounded by the campaign band and conversion likelihood), and materializes a `SubscriptionOffer` (original vs discounted INR, `expiresAt`).
- The offer is surfaced via banners/CTAs and a `NotificationCampaign` (in-app + email, FOMO countdown). Accepting routes to `PaymentService` with the discounted price.
- All offer impressions/accepts are logged for **offer conversion rate** analytics.

**Guardrails:** at most one *active* personalized offer per user at a time; discounts never exceed the campaign band; Super Admin can pause the whole engine via a feature flag.

---

## 10. Profile & Client Intelligence services

- **ProfileService** runs the Profile Intelligence Agent, persists `ProfessionalProfile` + per-variant `ProfileVersion` (region/industry/client), generates resume/proposal/presentation PDFs to object storage, and **publishes a profile site** at `NEXT_PUBLIC_PROFILE_BASE_URL/{websiteSlug}` (server-rendered, public, no auth).
- **ClientIntelService** runs the Client Intelligence Agent over a lead/company, persists `ClientProfile` + `ClientInsight`, sets `ClientTemperature` (COLD/WARM/HOT), and feeds proposal customization back into Client Acquisition.

---

## 11. Virtual Employee Team — bounded multi-agent orchestration

> **Honors non-negotiable rule §3.1:** this is a *deterministic, bounded* orchestration on the existing state machine — **not** an autonomous, self-looping agent system.

```
Client Requirement
   → Requirement Analysis           (Business Analyst role)
   → Task Breakdown                 (Project Manager role)
   → Multi-Agent Collaboration      (fan-out to assigned role agents, in parallel where independent)
   → Quality Review                 (QA role)
   → Final Delivery                 (Delivery Coordinator role)
```

- **Roles** (`EmployeeRole`): Project Manager, Business Analyst, Technical Specialist, Quality Assurance, Creative Specialist, Communication Specialist, Research Specialist, Delivery Coordinator.
- **`TeamOrchestrator`** drives a fixed pipeline: it derives tasks, fans them out to the relevant role agents (each a standard `AgentRunner` call with a role persona + strict JSON), waits (parallel for independent tasks, sequential where `dependsOn` is set), runs a single QA pass, then a coordinator merge.
- **Bounded:** a max iteration count (default 1 QA → fix → re-QA cycle), max parallel fan-out, and per-run token ceiling. No open-ended self-direction.
- **Collaboration memory:** role outputs are written to the `ProjectContext` (project-scoped shared memory) so later roles read earlier ones.
- **Phase:** flagship **Phase 3** capability. Work Support Agent (single AI co-worker) ships in MVP; the multi-role Team builds on it.

---

## 12. Gmail Outreach Platform

Added 2026-06-21. Gmail integration runs as a **bounded service** (not an agent loop) alongside the existing state machine.

### OAuth & Connection
- User connects Gmail via Google OAuth2 (scopes: `gmail.modify`, `gmail.labels`) in the Connections page.
- `ConnectedAccount` stores encrypted `accessToken` + `refreshToken`.
- Connection status exposed via `/api/auth/connect/status`.

### Sync Loop (non-autonomous)
- A 2-minute Vercel Cron job calls `/api/gmail/sync` → `GmailSyncService.syncForUser()`.
- The service fetches new threads/messages from the Gmail API and upserts them into `EmailThread` / `EmailMessage`.
- On each new inbound message in a tracked thread: fires an SSE event on the notification channel → `NotificationBell` updates in real time.

### Reply Intelligence (bounded agent)
- `REPLY_INTELLIGENCE` is a standard `AgentRunner` call (not autonomous).
- Input: thread message history + user context. Output: `{ intent, urgency, suggestedReply, communicationTips, ... }` — validated against the agent schema before rendering.
- Runs on Groq `llama-3.1-8b-instant` for low-latency response.
- CRM stage auto-update: if `crmStageUpdate` is non-null, the linked `Lead.stage` is moved to `GOT_REPLY` (or higher if specified).

### Auth
- Custom JWT auth replaces Supabase Auth. `jose` signs/verifies tokens; `bcryptjs` hashes passwords. Google OAuth2 is used for both user login AND Gmail API access (separate scopes stored in `ConnectedAccount`).

### SSE Notification Channel
- `/api/sse/notifications` — long-lived HTTP connection per authenticated user.
- Events emitted: `new_reply` (Gmail), `trial_reminder`, `relationship_action`, `offer_ready`, `milestone`.
- `NotificationBell` component subscribes and shows a badge + dropdown.

---

## 13. First Income Celebration system

Triggered when a CRM lead transitions to `WON` for the first time for that user:

1. Fire `firstIncomeCelebration` via NotificationService (in-app + email).
2. Surface an in-app celebration screen + achievement.
3. Record a revenue milestone in shared memory + analytics.
4. Hand off to the **Relationship Success Agent** to schedule the first post-win check-in / upsell window.

This event is the platform's core KPI moment — instrument it heavily.

---

## Decision Log
- 2026-05-30 — Architecture compiled from docs 1–5. Optimistic-locking conflict strategy and pre-call state-save chosen for the orchestration runner.
- 2026-06-17 — **AI WorkBuddy** rebrand + expansion merged. Extended the state graph with Profile Intelligence, Client Intelligence, Work Support, Relationship Success and the Virtual Employee Team. Added project-scoped shared memory (`ProjectContext`) with the same optimistic-locking discipline. Added the **Premium Offer Engine** (§9), trial countdown logic (§8), Profile/Client Intelligence services (§10), and the **bounded** Virtual Employee Team orchestration (§11) — explicitly reconciled with non-negotiable rule §3.1 (no autonomous loops). Reworked the usage-limit table for Trial/Free-locked plans.
- 2026-06-21 — Added §12 Gmail Outreach Platform (OAuth, GmailSyncService, Reply Intelligence bounded agent, SSE notification channel). Auth changed to custom JWT (jose + bcryptjs); Supabase Auth no longer used. First Income Celebration renumbered §13.
