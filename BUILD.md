# BUILD.md — how to build this in VS Code with Claude

Place this whole folder at the root of an empty repo. Open it in VS Code with Claude Code (or Cursor / Windsurf). `CLAUDE.md` is auto-read by Claude Code; the others are referenced from it.

---

## Recommended model
Use **`claude-opus-4-8`** for architecture/scaffolding and complex tasks, and **`claude-sonnet-4-6`** for day-to-day implementation. (Inside the *app*, the agents run on `claude-sonnet-4-6` — separate from which model you code with.)

---

## Kickoff prompt (paste into Claude Code)

> Read `CLAUDE.md` first, then `docs/techstack.md`, `docs/architecture.md`, `docs/database.md`, `docs/agent.md`, `docs/api.md`, and `docs/features.md`. Confirm you understand the 8 non-negotiable rules and the Super Admin full-access rule — and that the **Virtual Employee Team is a bounded orchestration, not an autonomous loop** (rule §3.1).
>
> Then scaffold the MVP of **AI WorkBuddy** as a single Next.js (App Router) + TypeScript + Tailwind + ShadCN app with Prisma + PostgreSQL (Supabase). Work in this order:
> 1. Project scaffold, env template, Prisma schema from `database.md` (incl. the new profile/client/relationship/work/virtual-team/offer/notification models + enums), initial migration.
> 2. Auth (Supabase email OTP) that **auto-starts the 7-day trial**, plus the entitlement guard (Trial/Pro/Premium/Free-locked) and usage-limit guard from `architecture.md` §6–7.
> 3. The `AgentRunner` state machine + `SharedMemoryService` (user + project scope) + `AgentConfig` (DB-backed model/prompt/token config). Wire the **9 MVP agents** with their JSON schemas (Zod) from `agent.md`: Skill Assessment, Opportunity Discovery, Offer Builder, Portfolio Builder, Profile Intelligence, Client Intelligence, Client Acquisition, Relationship Success, Work Support.
> 4. PaymentService + Razorpay/Cashfree adapters (monthly Pro + annual Premium, offer-discounted checkout, webhooks, 7-day trial, GST invoicing). EmailService/NotificationService + Resend adapter (in-app + email).
> 5. Smart Upgrade Engine (OfferEngine + OfferCampaign targeting) and the Scheduler (`/api/cron/run`) for trial countdown, offer/FOMO, and relationship/renewal/birthday reminders + weekly digest.
> 6. Profile publishing (public `/api/p/:slug` site + resume/proposal PDF export), CRM, Income Dashboard, First Income Celebration, Community Success Stories.
> 7. Super Admin dashboard with full access (incl. AI Control Center and Offer Engine management).
>
> Defer to later phases: Digital Product Builder (Phase 2), Virtual Employee Team + SaaS Opportunity (Phase 3), Revenue Growth + Business Scaling (Phase 4) — but keep the schema/agent enums in place now.
>
> Follow `CLAUDE.md` §6: as you build, keep the `docs/*.md` in sync with the code and append to each file's Decision Log. For anything unspecified, pick a sensible default, implement it, and log it — don't block. For the 8 non-negotiable rules and the Super Admin rule, stop and ask before changing.
>
> Start with step 1 and show me the plan before writing code.

---

## Working agreement (already encoded in CLAUDE.md §6)
- The `.md` files are the source of truth **and** living documents.
- Claude may edit them to match the code, and must log changes in the per-file Decision Log.
- Architecture rules (CLAUDE.md §3) and Super Admin access (§5) require confirmation before any change.
- Everything else: sensible default → implement → log.

---

## Decision Log
- 2026-06-17 — Updated for **AI WorkBuddy**: kickoff prompt now scaffolds the 9 MVP agents, the 7-day trial auto-start, the Smart Upgrade Engine + scheduler, profile publishing, and annual Premium billing; later-phase agents deferred but enum-reserved.
