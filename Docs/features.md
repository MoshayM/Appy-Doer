# features.md

Feature catalog for **AI WorkBuddy**, organized by **subscription plan** and **roadmap phase**. Pair this with `agent.md` (agent specs) and `architecture.md` (enforcement).

---

## Plans at a glance

There is **no unlimited free plan**. Every new user starts a **7-day full-access trial**, then chooses **Pro (monthly)** or **Premium (annual)**. On trial expiry without subscribing, the account drops to a **locked Free state** (read-only, 0 AI generations).

| | Trial (7 days) | Pro (₹999/mo) | Premium (₹19,999/yr) | Free (post-trial, locked) |
|--|--|--|--|--|
| Skill Assessment | ✅ | ✅ | ✅ | view only |
| Opportunity Discovery | ✅ full | ✅ full | ✅ full | view only |
| Offer Builder | ✅ | ✅ | ✅ | view only |
| Portfolio Builder | ✅ | ✅ | ✅ | view only |
| Profile Intelligence (resume/site/catalog) | ✅ | ✅ | ✅ | view only |
| Client Intelligence (temperature, strategy) | ✅ | ✅ | ✅ | view only |
| Client Acquisition (Outreach + Proposal) | ✅ | ✅ | ✅ | view only |
| Relationship Success Center | ✅ | ✅ | ✅ | view only |
| Work Support (AI co-worker) | ✅ | ✅ | ✅ | view only |
| CRM | ✅ unlimited | ✅ unlimited | ✅ unlimited | view only |
| Income Dashboard | full | full | full + forecasting | view only |
| First Income Journey | ✅ | ✅ | ✅ | ✅ |
| Community Success Stories | ✅ | ✅ | ✅ | ✅ |
| Digital Product Builder | ❌ | ❌ | ✅ (Phase 2) | ❌ |
| Virtual Employee Team | ❌ | ❌ | ✅ (Phase 3) | ❌ |
| SaaS Opportunity tools | ❌ | ❌ | ✅ (Phase 3) | ❌ |
| Business Growth tools (Revenue Growth + Scaling) | ❌ | ❌ | ✅ (Phase 4) | ❌ |
| AI outputs/day | 100 | 100 | unlimited (fair use 1,000/mo) | 0 |
| Personalized discounts (offer engine) | ✅ targeted | — | ✅ | upgrade CTAs |
| Priority AI | — | — | ✅ (higher budget at launch) | — |
| Priority support | — | — | ✅ | — |
| Early access to new features | — | — | ✅ | — |

**Trial:** 7-day full-access trial, **no card at signup**, one trial per account, **live Day 7 → Day 0 countdown** + progress bar + daily reminders on every page, auto-transition to locked Free on expiry.

---

## Monetization layer — Smart Upgrade Engine (Premium Offer Engine)

AI-personalized upgrade offers that drive trial→paid and Free→paid conversion:

- **Personalized offers** based on user activity, usage frequency, engagement score, opportunity potential, interests, and predicted conversion likelihood.
- **Limited-time offers**, a **dynamic discount engine** (bounded by Admin campaign bands), **personalized upgrade recommendations**, and **FOMO-based notifications** (e.g. "Premium offer expires in 24 hours.").
- Trial countdown banners and upgrade CTAs throughout the app.
- One active personalized offer per user at a time; Super Admin can pause the engine via a flag. (See architecture.md §9.)

---

## Phase roadmap (gated for end users only)

### MVP — 0 to 100 users — *Income, Profile, Client & Delivery layer*
Goal: a user earns their first online income.

- User auth + profile management + **7-day trial with countdown**
- Skill Assessment Agent
- Opportunity Discovery Agent
- Offer Builder Agent
- Portfolio Builder Agent
- **Profile Intelligence Agent + Dynamic Profile Builder** (resume, public profile, service catalog, publishable profile site, region/industry/client variants)
- **Client Intelligence System** (temperature, communication/cultural/pricing strategy, meeting prep, scripts)
- Client Acquisition Agent (Outreach + Proposal sub-modes)
- **Relationship Success Center** (follow-ups, nurture, renewal/birthday/check-in reminders, upsell/cross-sell/repeat-work detection)
- **Work Support Center** (AI co-worker: requirement analysis, planning, content/docs/research, cost estimation)
- CRM pipeline (7 stages: Lead Identified → Contacted → Interested → Proposal Sent → Got Reply → Won → Lost)
- **Gmail Outreach Platform** (OAuth-linked send/receive; thread tracking — sent/opened/replied; CRM auto-stage on reply; SSE notification bell)
- **Support Tickets system** (in-app ticket creation, status tracking, team response)
- **Platform Connections** (LinkedIn, GitHub, Gmail, Upwork, Fiverr — OAuth-linked accounts)
- **REPLY_INTELLIGENCE Agent** (AI-suggests ideal reply for inbound emails — tone, content, next steps)
- **CLIENT_DISCOVERY Agent** (prospect research and identification, works in Client Outreach discover tab)
- Income Dashboard
- Community Success Stories (Admin-moderated)
- **Smart Upgrade Engine** (personalized offers, dynamic discounts, FOMO notifications)
- Subscription billing (Razorpay + Cashfree; monthly Pro + annual Premium; 7-day trial)
- First Income Celebration system
- Super Admin dashboard (full access, incl. offer engine)
- Notification + scheduler service (trial reminders, relationship reminders, digest)

### Phase 2 — 100 to 1,000 users — *Digital Product layer*
- Digital Product Builder Agent
- Product Validation Agent · Pricing Agent · Product Launch Planner
- Landing Page Generator · Product Roadmap Generator
- Payment expansion: Stripe + PayPal (global)

### Phase 3 — 1,000 to 5,000 users — *Virtual Team & SaaS layer*
- **Virtual Employee Team Workspace** (Project Manager, Business Analyst, Technical Specialist, QA, Creative, Communication, Research, Delivery Coordinator — bounded orchestration)
- SaaS Opportunity Agent · MVP Planning Agent · Monetization Strategy Agent
- SaaS Validation Agent · SaaS Roadmap Generator · Feature Planning Agent

### Phase 4 — 5,000+ users — *Business Growth layer*
- **Business Growth Assistant**: Revenue Growth Agent + Business Scaling Agent
- Revenue Optimization · Delegation · Hiring Advisor · Team Building · Scaling Strategy
- Business Intelligence Dashboard

> Admins and Super Admin access **all phases from day one** — phase gating never applies to them.

---

## New modules (summary)

- **Smart Upgrade Engine** — personalized, dynamic-discount, FOMO upgrade offers (MVP).
- **Dynamic Profile Builder** — auto-built resume / public profile / service catalog / publishable site, with region/industry/client variants (MVP).
- **Client Intelligence System** — client temperature + tailored proposal/communication/pricing strategy (MVP).
- **Relationship Success Center** — retention, nurture, renewal/birthday reminders, expansion-opportunity detection (MVP).
- **Work Support Center** — AI co-worker for delivering client work (MVP).
- **Virtual Employee Team Workspace** — multi-role AI delivery team (Phase 3).
- **Business Growth Assistant** — revenue optimization + scaling (Phase 4).

---

## CRM & Relationship (MVP scope)

**In scope:** 7-stage pipeline (Lead Identified → Contacted → Interested → Proposal Sent → Got Reply → Won → Lost); lead data (name, company, contact, service, notes, status); Client Intelligence enrichment + temperature; AI-generated outreach / follow-ups / proposals / discovery-call questions; **Relationship Success** follow-up/nurture/renewal/birthday/check-in reminders and upsell/cross-sell/repeat-work detection; Gmail-linked thread tracking with REPLY_INTELLIGENCE; CRM stage auto-update on reply detection.

**Explicitly out of MVP:** LinkedIn integration (data import), social automation, lead scraping, automated cold email sequences.

---

## Gamification (scoped down for MVP)

Full 8-stage gamification UI is **deferred to Phase 2**. MVP ships **milestone notifications only**, tied to real events:

- First ₹1,000 · First ₹10,000 · First ₹50,000 · First ₹1,00,000 · First ₹5,00,000
- The First Income Celebration (first `WON` lead) is the flagship milestone moment.

---

## Retention layer (build at end of MVP)

- Weekly progress email digest ("your work this week")
- In-app milestone + relationship notifications
- Re-engagement trigger for users inactive 7+ days
- Returning-user home state: resume from last agent + next recommended action
- Trial-conversion + win-back offers via the Smart Upgrade Engine

---

## Super Admin features (full, unrestricted)

User management · full agent access (all 11 MVP agent types + later phases incl. virtual-employee roles; production/premium/beta/experimental/internal) · AI Control Center (models, prompts, workflows, token budgets, memory, cost) · **Offer Engine management** (campaigns, targeting rules, discount bands, pause) · revenue management (analytics, refunds, churn, financial reports) · payment management (all gateways, transactions, refunds, chargebacks) · email/notification management (providers, delivery/bounce, campaigns) · CRM + relationship analytics · feature management (flags, beta, A/B) · product/content management · system monitoring · reports/exports (PDF/Excel/CSV).

**Auto-grant:** every new feature, dashboard, agent, or capability is automatically available to Super Admin with no manual setup, and to Premium users if it is customer-facing.

---

## Analytics (tracked)

- Trial conversion rate · offer conversion rate · profile completion rate
- Client win rate · repeat-business rate · upsell revenue
- Agent productivity · work-delivery success rate
- Plus existing: MRR/ARR, churn, pipeline conversion, milestones achieved, AI token cost.

Primary KPI: **number of users who earned their first online income**. Every feature is justified by its contribution to `Skills → Opportunities → Offers → Profile → Clients → Work → Relationships → Recurring Revenue → Growth`.

## Decision Log
- 2026-05-30 — Features compiled from docs 1–5. Gamification scoped to milestone-notifications-only for MVP; retention layer added as recommended default.
- 2026-06-17 — **AI WorkBuddy** expansion. Replaced unlimited Free with a 7-day trial + locked post-trial Free state; set Pro=monthly / Premium=annual pricing (reversible defaults); added the Smart Upgrade Engine and seven new modules; added Profile Intelligence, Client Intelligence, Relationship Success, and Work Support to the MVP; placed Virtual Employee Team Workspace in Phase 3 and Business Growth Assistant (Revenue Growth + Scaling) in Phase 4; expanded the analytics list. Existing phase structure and the primary KPI preserved.
- 2026-06-21 — Added full Gmail Outreach Platform to MVP: EmailThread/EmailMessage models, Gmail sync cron (2-min), REPLY_INTELLIGENCE agent, CLIENT_DISCOVERY agent, SSE notification bell, ConnectedAccount model, Support Tickets system. CRM extended to 7 stages with GOT_REPLY. Updated 'explicitly out of MVP' section to remove Gmail (now in MVP). Super Admin agent count updated to reflect 11 MVP agents (total across all phases).
