# agent.md

The AI agents of **AI WorkBuddy**. All agents are **specialized business functions** running on a custom state machine with shared memory. **All outputs are strict JSON**, validated (Zod) before persistence. The Virtual Employee Team is a *bounded orchestration* over role agents (architecture.md §11) — **not** an autonomous loop.

---

## Common agent contract

Every agent receives:

```ts
interface AgentInput {
  userContext: UserContext;       // shared memory (architecture.md §3)
  projectContext?: ProjectContext;// for WORK_SUPPORT / VIRTUAL_EMPLOYEE_TEAM
  userPrompt?: string;            // optional extra instruction from the user
  config: {
    model: string;               // DB-configured, default "claude-sonnet-4-6"
    maxInputTokens: number;
    maxOutputTokens: number;
    systemPrompt: string;        // DB-configured, Super-Admin editable (per-role for the team)
  };
}
```

Every agent returns `{ data: <agent JSON schema>, usage: { inputTokens, outputTokens } }`.

- Output is validated against the agent's schema; on malformed JSON, retry **once**, then return a typed error.
- On success, `data` is written to shared memory and the relevant domain table.
- Model + token budget + system prompt are runtime config, **not hardcoded**.

---

## Token budgets (defaults — Super Admin configurable)

| Agent | Phase | Token budget | Purpose |
|-------|-------|--------------|---------|
| Skill Assessment | MVP | 2,000 | Profile analysis, skill mapping, classification |
| Opportunity Discovery | MVP | 4,000 | Opportunity research, income projections, ranking |
| Offer Builder | MVP | 3,000 | Service packaging, pricing, deliverables |
| Portfolio Builder | MVP | 5,000 | Portfolio, case studies, landing-page content |
| **Profile Intelligence** | MVP | 6,000 | Dynamic resume / public profile / service catalog / site |
| **Client Intelligence** | MVP | 4,000 | Client analysis, temperature, strategy, scripts |
| Client Acquisition | MVP | 3,000 | Outreach, follow-ups, proposals |
| **Relationship Success** | MVP | 3,000 | Follow-ups, nurture, upsell/cross-sell/repeat |
| **Work Support** | MVP | 6,000 | Requirement analysis → solution/content/docs/estimate |
| **Client Discovery** | MVP | 3,000 | Prospect research, company analysis, fit scoring |
| **Reply Intelligence** | MVP | 1,500 | Email intent analysis, reply suggestion, communication tips |
| Digital Product Builder | Phase 2 | 5,000 | Product ideation, validation, launch planning |
| **Virtual Employee Team** | Phase 3 | 8,000 (per run, across roles) | Multi-role delivery orchestration |
| SaaS Opportunity | Phase 3 | 6,000 | SaaS planning, MVP definition, monetization |
| **Revenue Growth** | Phase 4 | 4,000 | Pricing, upsell, recurring-revenue, forecasting |
| **Business Scaling** | Phase 4 | 4,000 | Automation, delegation, hiring, scaling roadmap |

> "Token budget" = the agent's working ceiling, split into `maxInputTokens` + `maxOutputTokens` in config. Tune after first 100 users' real cost data.

---

## 1. Skill Assessment Agent (MVP)

**Reads:** raw onboarding answers. **Writes:** `profile`, `skills`, `interests`.

```jsonc
{
  "classification": "string",
  "coreSkills": ["string"],
  "monetizableSkills": ["string"],
  "experienceTier": "ENTRY|MID|SENIOR|EXPERT",
  "recommendedFocusAreas": ["string"],
  "readinessScore": 0
}
```

## 2. Opportunity Discovery Agent (MVP)

**Reads:** profile + skills + goals. **Writes:** ranked opportunities → user selects one.

```jsonc
{
  "opportunities": [{
    "id": "string",
    "title": "string",
    "category": "SERVICE|DIGITAL_PRODUCT|SAAS|CONTENT",
    "difficultyScore": 0,
    "timeToFirstIncome": "string",
    "monthlyPotentialINR": { "min": 0, "max": 0 },
    "requiredEffortHoursPerWeek": 0,
    "indiaContext": {
      "clientGeography": "LOCAL_INR|GLOBAL_USD|MIXED",
      "gstRelevant": false,
      "recommendedPlatforms": ["string"]
    },
    "riskNotes": "string",
    "actionPlanSummary": "string"
  }],
  "topRecommendationId": "string"
}
```

## 3. Offer Builder Agent (MVP)

**Reads:** selected opportunity + skills. **Writes:** `generatedOffers`.

```jsonc
{
  "offerName": "string",
  "positioningStatement": "string",
  "tiers": [{ "name": "string", "priceINR": 0, "deliverables": ["string"], "turnaround": "string" }],
  "idealClient": "string",
  "salesPitch": "string"
}
```

## 4. Portfolio Builder Agent (MVP)

**Reads:** profile + offers. **Writes:** `portfolioAssets`.

```jsonc
{
  "headline": "string",
  "bio": "string",
  "servicePages": [{ "title": "string", "body": "string" }],
  "caseStudies": [{ "title": "string", "problem": "string", "solution": "string", "result": "string" }],
  "linkedinHeadline": "string",
  "linkedinAbout": "string",
  "resumeEnhancements": ["string"]
}
```

## 5. Profile Intelligence Agent (MVP)

Builds a dynamic professional identity automatically.
**Reads:** skill assessment, opportunities, portfolio assets, work history, certifications, prior projects, public social (consent only), uploaded data.
**Writes:** `ProfessionalProfile` + per-variant `ProfileVersion`; can publish a profile site.

```jsonc
{
  "primaryType": "DYNAMIC_RESUME|PORTFOLIO_SITE|PUBLIC_PROFILE|SERVICE_CATALOG|INDUSTRY_SPECIFIC",
  "headline": "string",
  "summary": "string",
  "positioning": "string",
  "skillsMatrix": [{ "skill": "string", "proficiency": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT", "proof": "string" }],
  "experienceHighlights": ["string"],
  "certifications": ["string"],
  "serviceCatalog": [{ "service": "string", "outcome": "string", "priceFromINR": 0 }],
  "caseStudies": [{ "title": "string", "problem": "string", "solution": "string", "result": "string" }],
  "customization": { "region": "string", "industry": "string", "client": "string" },
  "outputs": {
    "websiteSlug": "string",
    "resumePdf": true,
    "linkedinProfile": { "headline": "string", "about": "string" },
    "proposalProfile": "string",
    "presentationProfile": "string"
  }
}
```

## 6. Client Intelligence Agent (MVP)

Analyzes a potential client and adapts communication strategy.
**Reads:** company website, public social, past interactions, CRM history, industry info (+ the lead).
**Writes:** `ClientProfile` + `ClientInsight`; sets temperature; feeds Client Acquisition.

```jsonc
{
  "clientTemperature": "COLD|WARM|HOT",
  "confidence": 0,
  "companyProfile": { "name": "string", "industry": "string", "size": "string", "region": "string" },
  "communicationPreference": "EMAIL|CALL|MESSAGING|VIDEO|IN_PERSON",
  "culturalNotes": ["string"],
  "regionExpectations": ["string"],
  "pricingSensitivity": "LOW|MEDIUM|HIGH",
  "decisionMakingStyle": "string",
  "recommendedStrategy": "string",
  "proposalCustomization": ["string"],
  "meetingPrep": {
    "talkingPoints": ["string"],
    "questionsToAsk": ["string"],
    "likelyObjections": [{ "objection": "string", "response": "string" }]
  },
  "communicationScripts": { "intro": "string", "followUp": "string", "closing": "string" },
  "pricingRecommendationINR": { "min": 0, "max": 0, "rationale": "string" }
}
```

## 7. Client Acquisition Agent (MVP)

Hosts two sub-modes: **Proposal Generator** and **Outreach Generator** (tabs, not separate nav).
**Reads:** offers + portfolio/profile + a CRM lead + Client Intelligence output. **Writes:** outreach/proposal artifacts linked to the lead.

```jsonc
{
  "outreach": {
    "linkedinMessage": "string",
    "coldEmail": { "subject": "string", "body": "string" },
    "followUpSequence": ["string"]
  },
  "discoveryCallQuestions": ["string"],
  "proposal": { "summary": "string", "scope": ["string"], "pricingINR": 0, "terms": "string" }
}
```

## 8. Relationship Success Agent (MVP)

*(formerly "CRM Support Agent")* — drives retention, nurture, and expansion.
**Reads:** leads, `ClientRelationship`, won deals, activity recency. **Writes:** next actions, reminders, expansion opportunities; notifies the user when an opportunity is detected.

```jsonc
{
  "relationshipStage": "NEW|ACTIVE|NURTURING|AT_RISK|DORMANT|CHAMPION",
  "nextActions": [{
    "type": "FOLLOW_UP|CHECK_IN|RENEWAL|BIRTHDAY|UPSELL|CROSS_SELL|REPEAT_WORK",
    "dueDate": "string",
    "message": "string",
    "priority": "LOW|MEDIUM|HIGH"
  }],
  "expansionOpportunities": [{
    "type": "UPSELL|CROSS_SELL|REPEAT_WORK|NEW_SERVICE",
    "description": "string",
    "estimatedValueINR": 0,
    "confidence": 0
  }],
  "nurtureCampaign": { "cadence": "string", "touchpoints": ["string"] },
  "actionPlan": ["string"]
}
```

## 9. Work Support Agent (MVP)

The AI co-worker that helps the user deliver actual client work.
**Reads:** won lead + offer + `ProjectContext`. **Writes:** `WorkSession`, `ProjectTask` outputs.

```jsonc
{
  "requirementAnalysis": { "objective": "string", "scope": ["string"], "constraints": ["string"], "deliverables": ["string"] },
  "taskPlan": [{ "task": "string", "estimateHours": 0, "dependencies": ["string"] }],
  "solution": { "approach": "string", "artifacts": ["string"] },
  "content": "string",
  "documentation": "string",
  "researchFindings": ["string"],
  "costEstimateINR": { "low": 0, "high": 0, "basis": "string" },
  "nextStep": "string"
}
```

## 10. Client Discovery Agent (MVP)

Finds and researches potential client prospects.
**Reads:** user profile + skill assessment + offer. **Writes:** prospect list with fit scores.

```jsonc
{
  "prospects": [{
    "companyName": "string",
    "website": "string",
    "industry": "string",
    "fitScore": 0,
    "buyingSignals": ["string"],
    "contactEmail": "string",
    "contactName": "string",
    "notes": "string"
  }],
  "totalFound": 0,
  "recommendedFirst": "string"
}
```

## 11. Reply Intelligence Agent (MVP)

Analyzes inbound email threads and suggests the ideal reply.
**Reads:** EmailThread + message history + user context + offer. **Writes:** reply suggestion to WorkSession; CRM stage auto-updates on REPLIED threads.

```jsonc
{
  "intent": "string",
  "urgency": "CRITICAL|HIGH|MEDIUM|LOW",
  "summary": "string",
  "suggestedReply": "string",
  "communicationTips": ["string"],
  "suggestedAttachments": ["string"],
  "nextStep": "string",
  "keyInsight": "string",
  "crmStageUpdate": "CONTACTED|INTERESTED|PROPOSAL_SENT|GOT_REPLY|WON|LOST|null"
}
```

## 12. Digital Product Builder Agent (Phase 2)

```jsonc
{
  "productIdeas": [{ "name": "string", "type": "TEMPLATE|PROMPT_PACK|NOTION|TOOLKIT|EBOOK|DOWNLOAD", "validationScore": 0, "priceINR": 0 }],
  "structure": ["string"],
  "landingPageCopy": "string",
  "launchPlan": ["string"],
  "marketingStrategy": "string"
}
```

## 13. Virtual Employee Team Agent (Phase 3)

A **bounded** multi-role orchestration (architecture.md §11): Requirement → Analysis → Task Breakdown → Multi-Agent Collaboration → QA Review → Delivery. The `TeamOrchestrator` fans out to role agents (each a standard, JSON-validated `AgentRunner` call with a role persona), in parallel where independent, then a single QA pass and a coordinator merge. No autonomous self-direction.

Roles: `PROJECT_MANAGER, BUSINESS_ANALYST, TECHNICAL_SPECIALIST, QUALITY_ASSURANCE, CREATIVE_SPECIALIST, COMMUNICATION_SPECIALIST, RESEARCH_SPECIALIST, DELIVERY_COORDINATOR`.

```jsonc
{
  "projectId": "string",
  "phase": "REQUIREMENT|ANALYSIS|BREAKDOWN|COLLABORATION|QA_REVIEW|DELIVERY",
  "assignments": [{
    "role": "PROJECT_MANAGER|BUSINESS_ANALYST|TECHNICAL_SPECIALIST|QUALITY_ASSURANCE|CREATIVE_SPECIALIST|COMMUNICATION_SPECIALIST|RESEARCH_SPECIALIST|DELIVERY_COORDINATOR",
    "task": "string",
    "dependsOn": ["string"],
    "status": "NOT_STARTED|IN_PROGRESS|DONE|BLOCKED",
    "output": "string"
  }],
  "qaReview": { "passed": true, "issues": ["string"] },
  "finalDeliverable": { "summary": "string", "assets": ["string"] },
  "sharedContextUpdates": ["string"]
}
```

## 14. SaaS Opportunity Agent (Phase 3)

```jsonc
{
  "saasIdeas": [{ "name": "string", "targetAudience": "string", "validationScore": 0 }],
  "mvpSpec": { "coreFeatures": ["string"], "outOfScope": ["string"] },
  "monetization": { "model": "string", "tiersINR": [0] },
  "technicalRoadmap": ["string"],
  "goToMarket": ["string"]
}
```

## 15. Revenue Growth Agent (Phase 4)

```jsonc
{
  "revenueOptimization": ["string"],
  "pricingAdjustments": [{ "service": "string", "currentINR": 0, "recommendedINR": 0, "rationale": "string" }],
  "upsellPlays": ["string"],
  "recurringRevenueIdeas": ["string"],
  "forecastINR": { "next30d": 0, "next90d": 0 }
}
```

## 16. Business Scaling Agent (Phase 4)

```jsonc
{
  "automationOpportunities": ["string"],
  "delegationPlan": ["string"],
  "hiringRecommendations": ["string"],
  "systemsToBuild": ["string"],
  "scalingRoadmap": ["string"]
}
```

---

## Agent access by plan

(Trial gets full Pro-level access for 7 days. Free = post-trial locked, read-only, 0 generations.)

| Agent | Free (locked) | Trial / Pro | Premium |
|-------|------|-----|---------|
| Skill Assessment | view | ✅ | ✅ |
| Opportunity Discovery | view | ✅ | ✅ |
| Offer Builder | view | ✅ | ✅ |
| Portfolio Builder | view | ✅ | ✅ |
| Profile Intelligence | view | ✅ | ✅ |
| Client Intelligence | view | ✅ | ✅ |
| Client Acquisition | view | ✅ | ✅ |
| Relationship Success | view | ✅ | ✅ |
| Work Support | view | ✅ | ✅ |
| Client Discovery | view | ✅ | ✅ |
| Reply Intelligence | view | ✅ | ✅ |
| Digital Product Builder | ❌ | ❌ | ✅ (Phase 2) |
| Virtual Employee Team | ❌ | ❌ | ✅ (Phase 3) |
| SaaS Opportunity | ❌ | ❌ | ✅ (Phase 3) |
| Revenue Growth | ❌ | ❌ | ✅ (Phase 4) |
| Business Scaling | ❌ | ❌ | ✅ (Phase 4) |

Super Admin: all agents, all phases, always. Premium auto-gets each phase's agents as phases unlock.

---

## Decision Log
- 2026-05-30 — Agent schemas authored from doc descriptions; `indiaContext` block added to Opportunity Discovery.
- 2026-06-17 — **AI WorkBuddy** expansion. Added Profile Intelligence, Client Intelligence, Relationship Success (renamed from CRM Support), Work Support, Virtual Employee Team, Revenue Growth, and Business Scaling agents with strict-JSON schemas + token budgets. Placed Profile/Client/Relationship/Work agents in MVP; Virtual Employee Team in Phase 3 (most complex — bounded orchestration honoring CLAUDE.md §3.1); split the former Business Growth into Revenue Growth + Business Scaling (Phase 4). Existing 5 income-chain agents preserved.
- 2026-06-21 — Added Client Discovery Agent (#10) and Reply Intelligence Agent (#11) for the Gmail Outreach Platform MVP. Renumbered subsequent agents: Digital Product Builder (#12), Virtual Employee Team (#13), SaaS Opportunity (#14), Revenue Growth (#15), Business Scaling (#16). Total agents: 16. Reply Intelligence runs on Groq instant tier (speed-critical, short output). Both agents added to the access table (view for Free, ✅ for Trial/Pro/Premium).
