# api.md

API surface for **AI WorkBuddy** (Next.js Route Handlers under `/app/api`). All protected routes pass through the **auth → entitlement guard → usage guard** chain (see `architecture.md` §6–7).

Conventions: JSON in/out, `camelCase`, ISO timestamps, money as integer INR. Errors: `{ error: { code, message, upgradeTrigger? } }`.

---

## Auth

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| POST | `/api/auth/otp/request` | `{ email }` | Sends OTP via Resend |
| POST | `/api/auth/otp/verify` | `{ email, code }` | Returns session |
| POST | `/api/auth/register` | `{ email, name, password? }` | **Starts 7-day TRIAL automatically** |
| POST | `/api/auth/logout` | — | |
| GET  | `/api/auth/me` | — | Current user: role, plan, entitlements, usage, **trial days remaining** |

---

## Onboarding & profile (shared memory)

| Method | Route | Notes |
|--------|-------|-------|
| POST | `/api/onboarding/skill-assessment` | Runs Skill Assessment Agent; writes profile/skills to shared memory |
| GET  | `/api/profile` | Read UserContext |
| PATCH| `/api/profile` | Update profile fields (bumps `version`) |
| GET  | `/api/state` | State-machine cursor + next recommended action (returning-user resume) |

---

## Profile Intelligence

| Method | Route | Body | Plan |
|--------|-------|------|------|
| POST | `/api/profile/intelligence` | `{ targetType?, region?, industry?, client? }` | Runs Profile Intelligence Agent |
| POST | `/api/profile/generate` | `{ profileId, type, region?, industry?, client? }` | Creates a `ProfileVersion` (+ optional PDF) |
| POST | `/api/profile/publish` | `{ profileId, slug? }` | Publishes a public profile site → `websiteSlug` |
| GET  | `/api/profile/list` | — | User's profiles + versions |
| GET  | `/api/p/:slug` | — | **Public** rendered profile site (no auth) |
| GET  | `/api/profile/:id/export` | — | Resume / proposal / presentation PDF |

---

## Client Intelligence

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| POST | `/api/client/intelligence` | `{ leadId?, companyName, website?, industry?, region? }` | Runs Client Intelligence Agent → `ClientProfile` |
| GET  | `/api/client/temperature` | `?clientProfileId=` | Current temperature + confidence |
| POST | `/api/client/temperature` | `{ clientProfileId }` | Recompute temperature from latest insights |
| GET/POST | `/api/clients` | — | List / create client profiles |
| GET  | `/api/clients/:id` | — | Client profile + insights + strategy |

---

## Relationship Success (CRM expansion)

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| POST | `/api/relationship` | `{ clientProfileId }` | Runs Relationship Success Agent → next actions + expansion ops |
| GET  | `/api/relationship/actions` | — | Due/upcoming follow-ups, renewals, birthdays, check-ins |
| GET  | `/api/relationship/opportunities` | — | Detected upsell / cross-sell / repeat-work opportunities |
| POST | `/api/relationship/:id/complete` | `{ actionId }` | Mark an action done |

---

## Work Support & Virtual Team

| Method | Route | Body | Plan |
|--------|-------|------|------|
| GET/POST | `/api/workspace` | `{ title, objective?, leadId?, clientProfileId? }` | List / create `ProjectWorkspace` |
| GET  | `/api/workspace/:id` | — | Workspace + tasks + sessions |
| GET/POST | `/api/workspace/:id/tasks` | `{ title, description?, estimateHours? }` | List / add tasks |
| POST | `/api/work-support` | `{ workspaceId, userPrompt? }` | Runs Work Support Agent (MVP) |
| POST | `/api/virtual-team` | `{ workspaceId, requirement }` | Runs the bounded Virtual Employee Team orchestration (Premium, Phase 3) |
| GET/POST | `/api/virtual-team/employees` | `{ role, name, personality?, systemPrompt? }` | Configure virtual employees |

---

## Agents (generic runner)

Generic runner plus typed convenience routes. Every agent call enforces plan access + daily usage limit.

| Method | Route | Body | Plan |
|--------|-------|------|------|
| POST | `/api/agents/run` | `{ agentType, userPrompt?, workspaceId? }` | per agent (see agent.md) |
| POST | `/api/agents/opportunity-discovery` | `{ }` | Trial/Pro/Premium |
| POST | `/api/agents/offer-builder` | `{ opportunityId }` | Trial/Pro+ |
| POST | `/api/agents/portfolio-builder` | `{ }` | Trial/Pro+ |
| POST | `/api/agents/client-acquisition` | `{ leadId, mode: "outreach"|"proposal" }` | Trial/Pro+ |
| POST | `/api/agents/digital-product-builder` | `{ }` | Premium (Phase 2) |
| POST | `/api/agents/saas-opportunity` | `{ }` | Premium (Phase 3) |
| POST | `/api/agents/revenue-growth` | `{ }` | Premium (Phase 4) |
| POST | `/api/agents/business-scaling` | `{ }` | Premium (Phase 4) |

**Response shape (all agents):**
```jsonc
{ "data": { /* agent JSON schema from agent.md */ },
  "usage": { "inputTokens": 0, "outputTokens": 0 },
  "remainingDailyOutputs": 0 }
```
On limit hit / Free lock: `409 { error: { code: "USAGE_LIMIT", upgradeTrigger: "AI_OUTPUTS" } }`.

---

## Opportunities, offers (services), portfolio

| Method | Route | Notes |
|--------|-------|-------|
| GET  | `/api/opportunities` | List roadmaps |
| POST | `/api/opportunities/:id/select` | Set selected opportunity |
| GET/POST | `/api/offers` | List / create service offers |
| GET/POST | `/api/portfolio` | List / generate assets |
| GET  | `/api/portfolio/:id/export` | PDF export of a portfolio/proposal |

---

## CRM

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| GET  | `/api/leads` | — | List leads |
| POST | `/api/leads` | `{ name, company?, contact?, service?, notes? }` | Create lead |
| PATCH| `/api/leads/:id` | `{ stage?, notes?, ... }` | Moving to `WON` first time → First Income Celebration → Relationship Success handoff |
| DELETE | `/api/leads/:id` | — | |
| GET  | `/api/leads/reminders` | — | Stale-lead nudges (also surfaced via Relationship Success) |

---

## Subscription offers & smart upgrade

| Method | Route | Notes |
|--------|-------|-------|
| GET  | `/api/offers/personalized` | Current active personalized `SubscriptionOffer` for the user (offer engine) |
| POST | `/api/offers/:id/accept` | Accept → routes to discounted checkout |
| POST | `/api/offers/:id/dismiss` | Dismiss / mark shown |
| GET  | `/api/subscription/recommendations` | AI-recommended plan/upgrade for the user |

---

## Dashboard & milestones

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/dashboard/income` | Revenue, clients, conversion, recurring-revenue metrics |
| GET | `/api/dashboard/opportunities` | Active opportunities, pipeline, recommended actions |
| GET | `/api/dashboard/relationships` | Stage breakdown, at-risk, expansion pipeline |
| GET | `/api/milestones` | First ₹1k / ₹10k / ₹50k / ₹1L / ₹5L progress |
| GET | `/api/success-stories` | Approved community stories |
| POST| `/api/success-stories` | Submit a story → Admin approval queue |

---

## Notifications

| Method | Route | Notes |
|--------|-------|-------|
| GET  | `/api/notifications` | In-app notifications (trial reminders, offers, relationship/renewal/birthday, digest, celebration) |
| POST | `/api/notifications/:id/read` | Mark read |
| POST | `/api/cron/run` | Scheduler entrypoint (secured by `CRON_SECRET`): trial countdown, offer expiry/FOMO, relationship reminders, weekly digest |

---

## Billing

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| GET  | `/api/billing/plans` | — | INR plans (Pro monthly, Premium annual) + trial info |
| POST | `/api/billing/trial/start` | — | 7-day trial (auto-started at register; this re-affirms / repairs) |
| POST | `/api/billing/subscribe` | `{ plan, interval, gateway, offerId? }` | Through PaymentService → adapter; `offerId` applies discount |
| POST | `/api/billing/cancel` | — | |
| GET  | `/api/billing/invoices` | — | GST invoices |
| POST | `/api/webhooks/razorpay` | (provider payload) | Normalized → SubscriptionEvent |
| POST | `/api/webhooks/cashfree` | (provider payload) | Normalized → SubscriptionEvent |

Webhooks verify provider signatures, then normalize into one internal event handled by `PaymentService`.

---

## Admin (role-gated)

All require `SUPER_ADMIN`, or `ADMIN` with the matching preset. Super Admin bypasses every check.

| Method | Route | Preset | Notes |
|--------|-------|--------|-------|
| GET/PATCH/DELETE | `/api/admin/users[...]` | SUPPORT | View/edit/suspend/delete, manage subscriptions, activity logs |
| GET | `/api/admin/analytics/revenue` | FINANCE | MRR, ARR, churn, conversion |
| GET | `/api/admin/analytics/ai` | SUPER_ADMIN | Token consumption, cost, model performance, agent productivity |
| GET | `/api/admin/analytics/crm` | SUPPORT | Lead conversion, pipeline, repeat-business rate |
| GET | `/api/admin/analytics/business` | FINANCE | Top opportunities, win rate, work-delivery success, milestones |
| GET | `/api/admin/analytics/offers` | FINANCE | Trial + offer conversion, profile completion |
| GET/PUT | `/api/admin/ai-config` | SUPER_ADMIN | Models, prompts, token budgets (all agents + VE roles), workflows |
| GET/PUT | `/api/admin/offers` | FINANCE | Offer campaigns, targeting rules, discount bands, pause engine |
| GET/PUT | `/api/admin/feature-flags` | SUPER_ADMIN | Boolean / percentage / segment flags, A/B, rollouts |
| GET/PUT | `/api/admin/products[...]` | CONTENT | Opportunity DB, skills, frameworks, templates, market intel |
| GET | `/api/admin/payments` | FINANCE | Transactions, refunds, failed payments, chargebacks |
| GET | `/api/admin/email` | SUPER_ADMIN | Provider config, delivery/bounce, notification campaigns |
| GET | `/api/admin/system` | SUPER_ADMIN | API/infra health, error + security logs |
| POST | `/api/admin/success-stories/:id/approve` | CONTENT | Publish a submitted story |
| GET | `/api/admin/reports/export` | varies | PDF / Excel / CSV |

**Super Admin global-access rule:** every admin route checks `role === SUPER_ADMIN` first and allows unconditionally — no new admin endpoint (incl. offers, virtual team, profile) ever needs manual permission wiring.

---

## Decision Log
- 2026-05-30 — API surface derived from docs 1–5. Added `/api/state` and `/api/leads/reminders`.
- 2026-06-17 — **AI WorkBuddy** expansion. Added Profile Intelligence (`/api/profile/intelligence|generate|publish`, public `/api/p/:slug`), Client Intelligence (`/api/client/intelligence|temperature`, `/api/clients`), Relationship Success (`/api/relationship*`), Work Support + Virtual Team (`/api/workspace*`, `/api/work-support`, `/api/virtual-team*`), offer engine (`/api/offers/personalized`, `/api/subscription/recommendations`), notifications + scheduler (`/api/notifications*`, `/api/cron/run`), revenue-growth/business-scaling agent routes, and admin offer/analytics routes. Register now auto-starts the trial; subscribe accepts `interval` (annual) + `offerId` (discount). Existing routes preserved.
