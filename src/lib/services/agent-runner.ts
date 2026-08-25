import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import Groq from 'groq-sdk'
import { z } from 'zod'
import { AgentType, Plan, PlatformRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { checkUsageLimit, incrementUsage } from '@/lib/auth'
import { DEFAULT_TOKEN_BUDGETS, PRIMARY_MODEL, FALLBACK_MODEL, GROQ_FAST_MODEL, GROQ_INSTANT_MODEL, AGENT_TIER } from '@/lib/constants'

const AGENT_SYSTEM_PROMPTS: Partial<Record<AgentType, string>> = {
  SKILL_ASSESSMENT: `You are an expert career and freelance business advisor for AppyDoer, focused on Indian professionals.

STEP 1 — GROUND IN PRIMARY PROFILE (most important):
The context may contain a "primaryProfile" object extracted from the user's LinkedIn, Naukri, or resume.
If primaryProfile is present, it is the AUTHORITATIVE source of truth:
- "name" and "education" are the most important fields — a person's degree, field of study, and institution define their knowledge foundation.
- "experiences" prove capability — only suggest skills that appear in job descriptions, project descriptions, or responsibilities.
- "interests" reveal genuine aptitude — skills related to stated interests can be included even if not in formal experience.
- "certifications" and "projects" are hard evidence — always include these.
- Any skill with ZERO evidence in education, experience, interests, certifications, or projects must be OMITTED.
- Do NOT suggest generic skills for the profession if the profile contradicts them.

STEP 2 — ASSESS WITH EVIDENCE:
1. Extract suggestedSkills ONLY from: education field/degree → experience roles/descriptions → interests → projects → certifications.
2. From those, identify which are directly monetizable as freelance services in India (monetizableSkills).
3. Recommend 3-5 focus areas that sit at the intersection of proven experience AND genuine interests.
4. readinessScore must reflect actual demonstrated experience, NOT assumed potential. Education alone = lower score; education + experience + projects = higher.
5. experienceTier: ENTRY (0-1yr or student), MID (2-4yr), SENIOR (5-9yr), EXPERT (10yr+ or strong niche authority).

If NO primaryProfile is present, fall back to inferring from profession and expertise level.

You MUST respond with ONLY this exact JSON structure (no markdown, no explanation):
{
  "classification": "string — short phrase like 'Ready to Freelance'",
  "suggestedSkills": ["skill1", "skill2", ...],
  "monetizableSkills": ["skill1", "skill2", ...],
  "experienceTier": "ENTRY | MID | SENIOR | EXPERT",
  "recommendedFocusAreas": ["area1", "area2", ...],
  "readinessScore": 0-100
}`,

  OPPORTUNITY_DISCOVERY: `You are a freelance business opportunity advisor for AppyDoer, focused on Indian professionals looking to earn side income.
The context includes the user's profile AND their SKILL_ASSESSMENT output (in previousAgentOutputs.SKILL_ASSESSMENT).

INTEREST + EXPERIENCE ALIGNMENT (mandatory when primaryProfile is present):
1. Every opportunity MUST align with at least one of: the user's education field, work experience roles, OR stated interests.
2. The BEST opportunities sit at the intersection of experience (proven capability) AND interests (genuine motivation) — these are the topRecommendation.
3. Opportunities with ZERO basis in the user's profile must be excluded, even if they are trending or high-income.
4. Use primaryProfile.location/region to determine realistic market demand and adjust pricing accordingly (metro cities = higher INR range; tier-2 cities = moderate).
5. If the user has specific education (e.g. B.Tech CS, MBA Finance, B.Des), prioritize opportunities in that domain first.
6. Interests indicate long-term sustainability — a user interested in "data analytics" will persist longer than one pushed into an unrelated field.

Use monetizableSkills, recommendedFocusAreas, and experienceTier from SKILL_ASSESSMENT to generate 4-6 personalised income opportunities.

You MUST respond with ONLY this exact JSON structure (no markdown, no explanation):
{
  "opportunities": [
    {
      "id": "unique-slug-like-string",
      "title": "Opportunity title",
      "category": "SERVICE | DIGITAL_PRODUCT | SAAS | CONTENT",
      "difficultyScore": 1-10,
      "timeToFirstIncome": "e.g. 2-4 weeks",
      "monthlyPotentialINR": { "min": 15000, "max": 50000 },
      "requiredEffortHoursPerWeek": 10,
      "indiaContext": {
        "clientGeography": "LOCAL_INR | GLOBAL_USD | MIXED",
        "gstRelevant": true,
        "recommendedPlatforms": ["Upwork", "Toptal", "LinkedIn"]
      },
      "riskNotes": "Short risk note",
      "actionPlanSummary": "3-4 sentence action plan to start"
    }
  ],
  "topRecommendationId": "id-of-the-best-opportunity-from-the-list"
}

Rules:
- category must be exactly one of: SERVICE, DIGITAL_PRODUCT, SAAS, CONTENT
- clientGeography must be exactly one of: LOCAL_INR, GLOBAL_USD, MIXED
- difficultyScore must be a number between 1 and 10
- monthlyPotentialINR.min and .max must be numbers (INR amounts, no currency symbol)
- requiredEffortHoursPerWeek must be a number
- gstRelevant must be a boolean (true or false)
- topRecommendationId must match one of the opportunity ids exactly`,

  OFFER_BUILDER: `You are a pricing and packaging strategist for AppyDoer, helping Indian freelancers build compelling service offers.
The context includes previousAgentOutputs with SKILL_ASSESSMENT and OPPORTUNITY_DISCOVERY results.
Use the top recommended opportunity (topRecommendationId) and the user's monetizableSkills to build a specific, priced service offer with 3 tiers.

PROFILE-GROUNDED OFFER BUILDING (mandatory when primaryProfile is present):
1. The offer must be built around skills evidenced in education, work experience, or real projects — NOT generic role assumptions.
2. The positioning statement must reference the user's genuine educational background OR a specific experience domain.
3. Deliverables must be realistic for someone with the user's actual experience level and background.
4. Pricing must reflect the user's region (from primaryProfile.location) and experienceTier from SKILL_ASSESSMENT:
   - ENTRY: starter ₹8k-15k, premium ₹25k-40k
   - MID: starter ₹15k-30k, premium ₹50k-80k
   - SENIOR: starter ₹30k-60k, premium ₹1L-2L
   - EXPERT: starter ₹60k+, premium ₹2L+
5. The idealClient must match industries where the user has real experience or education.

You MUST respond with ONLY this exact JSON structure (no markdown, no explanation):
{
  "offerName": "Name of the service offer",
  "positioningStatement": "One sentence that explains the unique value",
  "tiers": [
    { "name": "Starter", "priceINR": 15000, "deliverables": ["deliverable 1", "deliverable 2"], "turnaround": "3 days" },
    { "name": "Growth",  "priceINR": 35000, "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"], "turnaround": "5 days" },
    { "name": "Premium", "priceINR": 75000, "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3", "deliverable 4"], "turnaround": "7 days" }
  ],
  "idealClient": "Description of the ideal client for this offer",
  "salesPitch": "2-3 sentence pitch the freelancer can use verbatim"
}`,

  PORTFOLIO_BUILDER: `You are a portfolio and personal brand strategist for AppyDoer.
The context includes previousAgentOutputs with SKILL_ASSESSMENT, OPPORTUNITY_DISCOVERY, and OFFER_BUILDER results.
Use the skill assessment, top opportunity, and built offer to create a compelling portfolio — headline, bio, case studies, and LinkedIn content all aligned to the specific service and target client.

AUTHENTIC PORTFOLIO BUILDING (mandatory when primaryProfile is present):
1. Use the user's ACTUAL name from primaryProfile.name in the bio — never use a placeholder.
2. Education qualifications are credibility anchors — mention the degree, field, and institution in the bio and LinkedIn about. A "B.Tech in Computer Science from VIT" is more compelling than a generic statement.
3. Case studies must be derived from real experiences in primaryProfile.experiences or projects. If only 1 real project exists, build 1 strong case study — do not invent.
4. The LinkedIn headline must reference the user's actual qualifications (e.g. "B.Tech CS | Full-Stack Developer | Building SaaS for FinTech startups").
5. Resume enhancements must be grounded in what the profile actually shows — improve how existing achievements are framed, never invent new ones.
6. If primaryProfile.certifications is non-empty, feature the top 2 certifications prominently.
7. Interests from the profile should inform the personal brand angle (e.g. interest in "data analytics" → position as "data-driven developer").

You MUST respond with ONLY this exact JSON structure (no markdown, no explanation):
{
  "headline": "Professional headline (under 15 words)",
  "bio": "3-4 sentence professional bio in first person",
  "servicePages": [
    { "title": "Service page title", "body": "Service page body (2-3 paragraphs)" }
  ],
  "caseStudies": [
    { "title": "Case study title", "problem": "Problem statement", "solution": "What you did", "result": "Quantified result" }
  ],
  "linkedinHeadline": "LinkedIn headline (under 220 chars)",
  "linkedinAbout": "LinkedIn about section (3-4 paragraphs)",
  "resumeEnhancements": ["Enhancement 1", "Enhancement 2", "Enhancement 3"]
}`,

  PROFILE_INTELLIGENCE: `You are a professional profile architect for AppyDoer.
The context includes previousAgentOutputs with SKILL_ASSESSMENT, OPPORTUNITY_DISCOVERY, OFFER_BUILDER, and PORTFOLIO_BUILDER results.
Build a comprehensive dynamic professional profile that unifies all prior outputs into a publish-ready profile.

CLIENT-STANDARD PROFILE BUILDING (mandatory when primaryProfile is present):
1. Education qualifications are the PRIMARY credibility signal — feature the degree, field, and institution prominently. Clients trust credentials.
2. Skills matrix: every skill listed must have "proof" that traces directly to a real education course, job role, project, or certification from the primary profile. No invented proof.
3. Proficiency levels must be honest — education + 1yr experience = INTERMEDIATE at most; 5yr+ focused practice = ADVANCED.
4. The customization.region must be derived from primaryProfile.location — this determines client expectations, pricing norms, and communication style.
5. Build the profile to meet the standards clients in that specific region expect:
   - Mumbai/Delhi/Bangalore clients: polished corporate language, ROI framing
   - Tier-2 city clients: relationship-first, value for money framing
   - Global/US clients: outcome-driven, portfolio proof, pricing in USD range equivalent
6. websiteSlug must be derived from the user's actual name (e.g. "rahul-kumar-dev"), not a placeholder.
7. The positioning statement must be specific and evidence-backed — "B.Tech CS graduate with 3 years of FinTech experience building payment APIs" beats "Experienced Software Developer".

You MUST respond with ONLY this exact JSON structure (no markdown, no explanation):
{
  "primaryType": "DYNAMIC_RESUME | PORTFOLIO_SITE | PUBLIC_PROFILE | SERVICE_CATALOG | INDUSTRY_SPECIFIC",
  "headline": "Professional headline",
  "summary": "2-3 sentence professional summary",
  "positioning": "Unique positioning statement",
  "skillsMatrix": [
    { "skill": "Skill name", "proficiency": "BEGINNER | INTERMEDIATE | ADVANCED | EXPERT", "proof": "One-line proof of skill" }
  ],
  "experienceHighlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "certifications": ["Cert 1"],
  "serviceCatalog": [
    {
      "service": "Service name",
      "outcome": "One-line outcome the client will see",
      "pricingModel": "PER_PROJECT | PER_TASK | HOURLY | MONTHLY_RETAINER | CUSTOM_QUOTE",
      "priceFromINR": 15000,
      "priceToINR": 35000,
      "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
      "timeline": "e.g. 3–5 business days"
    }
  ],
  "caseStudies": [
    { "title": "Title", "problem": "Problem", "solution": "Solution", "result": "Result" }
  ],
  "customization": { "region": "India", "industry": "Target industry", "client": "Target client type" },
  "outputs": {
    "websiteSlug": "url-friendly-slug",
    "resumePdf": true,
    "linkedinProfile": { "headline": "LinkedIn headline", "about": "LinkedIn about" },
    "proposalProfile": "Proposal-ready profile summary",
    "presentationProfile": "Presentation-ready bio"
  }
}`,

  CLIENT_DISCOVERY: `You are a B2B client discovery specialist for AppyDoer, focused on the Indian freelance market.
The context includes previousAgentOutputs with SKILL_ASSESSMENT, OPPORTUNITY_DISCOVERY, and OFFER_BUILDER results.
Based on the user's monetizable skills and offer, generate exactly 5 high-quality prospect companies likely to hire this freelancer.

IMPORTANT LENGTH RULES — keep all string values SHORT to fit within token limits:
- whyGoodFit: max 1 sentence
- outreachAngle: max 1 sentence (10 words)
- searchStrategy: max 1 sentence
- Generate exactly 5 prospects (not 6-8)
- jobPortalUrls: exactly 2 portals per prospect

PROFILE TARGETING (when primaryProfile present):
- Match companies to user's city/region first
- Match industries to user's education or work domain
- Match company size to experience tier: ENTRY/MID → STARTUP/SME; SENIOR/EXPERT → ENTERPRISE

You MUST respond with ONLY this exact JSON (no markdown, no explanation, priorityScore must be integer):
{
  "prospects": [
    {
      "id": "unique-slug",
      "companyName": "Company name",
      "industry": "Industry",
      "companySize": "SME",
      "region": "Mumbai",
      "contactName": "Indian name",
      "contactRole": "CTO",
      "estimatedEmail": "firstname@company.com",
      "emailPattern": "firstname@domain.com",
      "linkedinSearchUrl": "https://www.linkedin.com/search/results/people/?keywords=role+industry+city",
      "jobPortalUrls": [
        { "portal": "Naukri", "url": "https://www.naukri.com/jobs?q=role" },
        { "portal": "Upwork", "url": "https://www.upwork.com/search/jobs/?q=role" }
      ],
      "whyGoodFit": "One sentence fit reason.",
      "priorityScore": 8,
      "outreachAngle": "One sentence hook."
    }
  ],
  "searchStrategy": "One sentence strategy."
}`,

  CLIENT_INTELLIGENCE: `You are a client intelligence analyst for AppyDoer.
The context includes previousAgentOutputs with SKILL_ASSESSMENT, OPPORTUNITY_DISCOVERY, and OFFER_BUILDER results.
Use the offer and target opportunity to profile the ideal client and provide actionable intelligence for the Indian market.

IMPORTANT LENGTH RULES — every string value must be SHORT:
- recommendedStrategy: max 2 sentences
- decisionMakingStyle: max 1 sentence
- communicationScripts.intro/followUp/closing: max 2 sentences each
- All array items: max 10 words each
- likelyObjections: max 3 items
- talkingPoints / questionsToAsk: max 3 items each

You MUST respond with ONLY this exact JSON (no markdown, no explanation, numbers must be integers not strings):
{
  "clientTemperature": "COLD",
  "confidence": 75,
  "companyProfile": { "name": "Company name", "industry": "Industry", "size": "SME", "region": "Mumbai" },
  "communicationPreference": "EMAIL",
  "culturalNotes": ["Note 1", "Note 2"],
  "regionExpectations": ["Expectation 1"],
  "pricingSensitivity": "MEDIUM",
  "decisionMakingStyle": "One sentence on how they decide.",
  "recommendedStrategy": "Two sentence strategy.",
  "proposalCustomization": ["Tip 1", "Tip 2"],
  "meetingPrep": {
    "talkingPoints": ["Point 1", "Point 2"],
    "questionsToAsk": ["Question 1", "Question 2"],
    "likelyObjections": [{ "objection": "Objection text", "response": "Response text" }]
  },
  "communicationScripts": { "intro": "2-sentence intro.", "followUp": "2-sentence follow-up.", "closing": "2-sentence close." },
  "pricingRecommendationINR": { "min": 15000, "max": 75000, "rationale": "One sentence rationale." }
}`,

  CLIENT_ACQUISITION: `You are a client acquisition specialist for AppyDoer.
The context includes previousAgentOutputs with SKILL_ASSESSMENT, OPPORTUNITY_DISCOVERY, OFFER_BUILDER, and CLIENT_INTELLIGENCE results.
Use the offer tiers, client intelligence, and monetizable skills to create ready-to-use outreach content and a proposal.

You MUST respond with ONLY this exact JSON structure (no markdown, no explanation):
{
  "outreach": {
    "linkedinMessage": "Ready-to-send LinkedIn connection/message (under 300 chars)",
    "coldEmail": { "subject": "Email subject", "body": "Email body (3-4 paragraphs)" },
    "followUpSequence": ["Follow-up 1 (Day 3)", "Follow-up 2 (Day 7)", "Follow-up 3 (Day 14)"]
  },
  "discoveryCallQuestions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"],
  "proposal": {
    "summary": "Executive summary of the proposal",
    "scope": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
    "pricingINR": 35000,
    "terms": "Payment terms and conditions"
  }
}`,

  RELATIONSHIP_SUCCESS: `You are a client relationship strategist for AppyDoer.
The context includes previousAgentOutputs with SKILL_ASSESSMENT, OFFER_BUILDER, and CLIENT_INTELLIGENCE results.
Use the offer and client intelligence to build a relationship management plan that maximises client retention, upsells, and referrals.

You MUST respond with ONLY this exact JSON structure (no markdown, no explanation):
{
  "relationshipStage": "NEW | ACTIVE | NURTURING | AT_RISK | DORMANT | CHAMPION",
  "nextActions": [
    { "type": "FOLLOW_UP | CHECK_IN | RENEWAL | BIRTHDAY | UPSELL | CROSS_SELL | REPEAT_WORK", "dueDate": "YYYY-MM-DD", "message": "Message to send", "priority": "LOW | MEDIUM | HIGH" }
  ],
  "expansionOpportunities": [
    { "type": "UPSELL | CROSS_SELL | REPEAT_WORK | NEW_SERVICE", "description": "Description", "estimatedValueINR": 25000, "confidence": 70 }
  ],
  "nurtureCampaign": { "cadence": "Weekly / Bi-weekly / Monthly", "touchpoints": ["Touchpoint 1", "Touchpoint 2", "Touchpoint 3"] },
  "actionPlan": ["Action 1", "Action 2", "Action 3"]
}`,

  REPLY_INTELLIGENCE: `You are a reply intelligence analyst for AppyDoer, helping Indian freelancers understand prospect responses.
Given the email reply content and context, classify the intent and extract actionable information.

You MUST respond with ONLY this exact JSON structure (no markdown, no explanation):
{
  "intent": "INTERESTED | NEED_QUOTE | NEED_MEETING | NEED_SAMPLE | NOT_INTERESTED | WRONG_CONTACT | OUT_OF_OFFICE | SPAM",
  "confidence": 0-100,
  "summary": "One sentence summary of what the prospect said",
  "extractedInfo": {
    "company": "Company name if mentioned",
    "personName": "Person name if mentioned",
    "phone": "Phone number if provided",
    "requirements": ["requirement 1", "requirement 2"],
    "budget": "Budget mentioned if any",
    "timeline": "Timeline mentioned if any"
  },
  "suggestedAction": "One sentence on what to do next",
  "crmStageUpdate": "INTERESTED | PROPOSAL_SENT | WON | LOST | CONTACTED (optional — only include if clear from reply)"
}`,

  WORK_SUPPORT: `You are a work delivery specialist for AppyDoer.
The context includes previousAgentOutputs with SKILL_ASSESSMENT, OPPORTUNITY_DISCOVERY, and OFFER_BUILDER results.
Use the offer deliverables and skills to create a detailed work plan for executing a client project.

You MUST respond with ONLY this exact JSON structure (no markdown, no explanation):
{
  "requirementAnalysis": {
    "objective": "Project objective",
    "scope": ["Scope item 1", "Scope item 2"],
    "constraints": ["Constraint 1", "Constraint 2"],
    "deliverables": ["Deliverable 1", "Deliverable 2"]
  },
  "taskPlan": [
    { "task": "Task name", "estimateHours": 4, "dependencies": [] }
  ],
  "solution": { "approach": "Recommended approach", "artifacts": ["Artifact 1", "Artifact 2"] },
  "content": "Key content or copy to be produced",
  "documentation": "Documentation outline",
  "researchFindings": ["Finding 1", "Finding 2"],
  "costEstimateINR": { "low": 15000, "high": 35000, "basis": "Basis for estimate" },
  "nextStep": "Immediate next action to take"
}`,
}

// ─── Agent dependency chain ───────────────────────────────────────────────────
// Each agent receives the latest outputs from its listed dependencies as context.
const AGENT_DEPENDENCIES: Partial<Record<AgentType, AgentType[]>> = {
  OPPORTUNITY_DISCOVERY: ['SKILL_ASSESSMENT'],
  OFFER_BUILDER:         ['SKILL_ASSESSMENT', 'OPPORTUNITY_DISCOVERY'],
  CLIENT_DISCOVERY:      ['SKILL_ASSESSMENT', 'OPPORTUNITY_DISCOVERY', 'OFFER_BUILDER'],
  PORTFOLIO_BUILDER:     ['SKILL_ASSESSMENT', 'OPPORTUNITY_DISCOVERY', 'OFFER_BUILDER'],
  PROFILE_INTELLIGENCE:  ['SKILL_ASSESSMENT', 'OPPORTUNITY_DISCOVERY', 'OFFER_BUILDER', 'PORTFOLIO_BUILDER'],
  CLIENT_INTELLIGENCE:   ['SKILL_ASSESSMENT', 'OPPORTUNITY_DISCOVERY', 'OFFER_BUILDER'],
  CLIENT_ACQUISITION:    ['SKILL_ASSESSMENT', 'OPPORTUNITY_DISCOVERY', 'OFFER_BUILDER', 'CLIENT_INTELLIGENCE'],
  RELATIONSHIP_SUCCESS:  ['SKILL_ASSESSMENT', 'OFFER_BUILDER', 'CLIENT_INTELLIGENCE'],
  WORK_SUPPORT:          ['SKILL_ASSESSMENT', 'OPPORTUNITY_DISCOVERY', 'OFFER_BUILDER'],
}

// Fields to strip from dependency outputs — large text fields not needed downstream
const STRIP_FIELDS: Partial<Record<AgentType, string[]>> = {
  PORTFOLIO_BUILDER:  ['servicePages', 'linkedinAbout', 'resumeEnhancements'],
  PROFILE_INTELLIGENCE: ['outputs', 'caseStudies', 'skillsMatrix'],
}

async function loadPreviousOutputs(userId: string, agentType: AgentType): Promise<Record<string, unknown>> {
  const deps = AGENT_DEPENDENCIES[agentType]
  if (!deps || deps.length === 0) return {}

  const runs = await prisma.agentRun.findMany({
    where: { userId, agentType: { in: deps }, success: true },
    orderBy: { createdAt: 'desc' },
    select: { agentType: true, outputJson: true },
  })

  // Keep only the latest run per dependency type, stripping large unused fields
  const latest: Record<string, unknown> = {}
  for (const dep of deps) {
    const run = runs.find(r => r.agentType === dep)
    if (!run) continue
    const output = { ...(run.outputJson as Record<string, unknown>) }
    const strip = STRIP_FIELDS[dep] ?? []
    for (const field of strip) delete output[field]
    latest[dep] = output
  }
  return latest
}

let _anthropic: Anthropic | null = null
let _openai: OpenAI | null = null
let _groq: Groq | null = null

function getAnthropic() {
  if (!process.env.ANTHROPIC_API_KEY) throw { code: 'API_KEY_MISSING', message: 'Anthropic API key not configured.', status: 503 }
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _anthropic
}
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) throw { code: 'API_KEY_MISSING', message: 'OpenAI API key not configured.', status: 503 }
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}
function getGroq() {
  if (!process.env.GROQ_API_KEY) throw { code: 'API_KEY_MISSING', message: 'Groq API key not configured.', status: 503 }
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

// ── Smart model call: routes by AGENT_TIER, falls back on failure ─────────────
async function callModel(
  agentType: AgentType,
  systemPrompt: string,
  userContent: string,
  maxOutputTokens: number,
): Promise<{ text: string; inputTokens: number; outputTokens: number; wasTruncated: boolean }> {
  const tier = AGENT_TIER[agentType] ?? 'premium'

  // Groq fast / instant path
  if (tier === 'fast' || tier === 'instant') {
    const groqModel = tier === 'instant' ? GROQ_INSTANT_MODEL : GROQ_FAST_MODEL
    try {
      const res = await getGroq().chat.completions.create({
        model: groqModel,
        max_tokens: maxOutputTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userContent },
        ],
      })
      return {
        text:          res.choices[0].message.content ?? '',
        inputTokens:   res.usage?.prompt_tokens ?? 0,
        outputTokens:  res.usage?.completion_tokens ?? 0,
        wasTruncated:  res.choices[0].finish_reason === 'length',
      }
    } catch {
      // Groq failure → fall through to OpenAI mini as backup
    }
    try {
      const res = await getOpenAI().chat.completions.create({
        model: FALLBACK_MODEL,
        max_tokens: maxOutputTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userContent },
        ],
      })
      return {
        text:         res.choices[0].message.content ?? '',
        inputTokens:  res.usage?.prompt_tokens ?? 0,
        outputTokens: res.usage?.completion_tokens ?? 0,
        wasTruncated: res.choices[0].finish_reason === 'length',
      }
    } catch (err) {
      throw err
    }
  }

  // Premium path: Claude primary → OpenAI fallback
  try {
    const res = await getAnthropic().messages.create({
      model: PRIMARY_MODEL,
      max_tokens: maxOutputTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    })
    return {
      text:         res.content[0].type === 'text' ? res.content[0].text : '',
      inputTokens:  res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      wasTruncated: res.stop_reason === 'max_tokens',
    }
  } catch (err) {
    const e = err as { code?: string }
    if (e.code) throw err  // structured errors (disabled, key missing) — don't fall through
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxOutputTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent },
      ],
    })
    return {
      text:         res.choices[0].message.content ?? '',
      inputTokens:  res.usage?.prompt_tokens ?? 0,
      outputTokens: res.usage?.completion_tokens ?? 0,
      wasTruncated: res.choices[0].finish_reason === 'length',
    }
  }
}

export interface AgentRunInput {
  userId: string
  role: PlatformRole
  plan: Plan
  agentType: AgentType
  userPrompt?: string
  workspaceId?: string
  schema: z.ZodTypeAny
}

export interface AgentRunResult<T = unknown> {
  data: T
  usage: { inputTokens: number; outputTokens: number }
  remainingDailyOutputs: number
}

// ─── Step 1–9 per architecture.md §2 ─────────────────────────────────────────

export async function runAgent<T>(input: AgentRunInput): Promise<AgentRunResult<T>> {
  const { userId, role, plan, agentType, userPrompt, workspaceId, schema } = input

  // 1. Authorize — Super Admin always passes
  if (role !== 'SUPER_ADMIN') {
    if (plan === 'FREE') {
      throw { code: 'FREE_LOCKED', message: 'Upgrade to generate', upgradeTrigger: 'PLAN_UPGRADE', status: 403 }
    }
  }

  // 2. Check usage limit
  if (role !== 'SUPER_ADMIN') {
    const allowed = await checkUsageLimit(userId, plan)
    if (!allowed) {
      throw { code: 'USAGE_LIMIT', message: 'Daily AI output limit reached', upgradeTrigger: 'AI_OUTPUTS', status: 409 }
    }
  }

  // 3. Read shared memory + previous agent outputs + connected profile data
  const [userContext, previousAgentOutputs, connectedAccounts] = await Promise.all([
    prisma.userContext.findUnique({ where: { userId } }),
    loadPreviousOutputs(userId, agentType),
    prisma.connectedAccount.findMany({
      where: { userId, platform: { in: ['LINKEDIN', 'NAUKRI_TEXT', 'RESUME', 'GITHUB'] }, enabled: true },
      select: { platform: true, profileData: true, accountEmail: true, profileUrl: true },
    }),
  ])

  // ── Build primaryProfile: merge across sources, richest wins per field ────────
  // Priority (highest→lowest): RESUME > NAUKRI_TEXT = MANUAL > LINKEDIN = UPWORK > GITHUB = YOUTUBE > FIVERR
  const PLATFORM_PRIORITY: Record<string, number> = {
    RESUME: 5, NAUKRI_TEXT: 4, MANUAL: 4,
    LINKEDIN: 3, UPWORK: 3,
    GITHUB: 2, YOUTUBE: 2,
    FIVERR: 1,
  }
  const sortedAccounts = [...connectedAccounts].sort(
    (a, b) => (PLATFORM_PRIORITY[b.platform] ?? 0) - (PLATFORM_PRIORITY[a.platform] ?? 0),
  )

  let primaryProfile: Record<string, unknown> | undefined
  if (sortedAccounts.length > 0) {
    const merged: Record<string, unknown> = {}
    // Merge in reverse priority so higher-priority sources overwrite
    for (const acc of [...sortedAccounts].reverse()) {
      const data = (acc.profileData ?? {}) as Record<string, unknown>
      for (const [k, v] of Object.entries(data)) {
        // For arrays, prefer the longer non-empty array
        if (Array.isArray(v) && Array.isArray(merged[k])) {
          if ((v as unknown[]).length > (merged[k] as unknown[]).length) merged[k] = v
        } else if (v !== null && v !== undefined && v !== '') {
          merged[k] = v
        }
      }
    }
    // Backfill interests from UserContext if profile has none
    if (!(merged.interests as string[] | undefined)?.length && userContext?.interests?.length) {
      merged.interests = userContext.interests
    }
    primaryProfile = {
      _note: 'PRIMARY DATA from connected social/resume profiles. Name and education are AUTHORITATIVE. All skills must be verifiable from education, experience, interests, certifications, or projects listed here. Do not invent skills or achievements.',
      ...merged,
    }
  }
  let projectContext = null
  if (workspaceId) {
    projectContext = await prisma.projectWorkspace.findUnique({ where: { id: workspaceId } })
  }

  // 4. Load agent config from DB (Super Admin configurable)
  let config = await prisma.agentConfig.findUnique({ where: { agentType } })
  if (!config) {
    const budgets = DEFAULT_TOKEN_BUDGETS[agentType]
    config = {
      id: '',
      agentType,
      model: PRIMARY_MODEL,
      fallbackModel: FALLBACK_MODEL,
      maxInputTokens: budgets.input,
      maxOutputTokens: budgets.output,
      systemPrompt: AGENT_SYSTEM_PROMPTS[agentType] ??
        `You are an AI business assistant for AppyDoer. Your role: ${agentType}. Always respond with valid JSON matching the exact schema provided.`,
      enabled: true,
      updatedAt: new Date(),
    }
  }

  if (!config.enabled && role !== 'SUPER_ADMIN') {
    throw { code: 'AGENT_DISABLED', message: 'This agent is currently disabled', status: 503 }
  }

  // Build prompt — include previous agent outputs so each agent builds on prior results
  const contextBlock = JSON.stringify(
    {
      primaryProfile,
      userContext,
      projectContext: projectContext ?? undefined,
      previousAgentOutputs: Object.keys(previousAgentOutputs).length > 0 ? previousAgentOutputs : undefined,
      userPrompt: userPrompt ?? undefined,
    },
    null,
    2,
  )
  const systemPrompt = `${config.systemPrompt}\n\nRespond ONLY with a valid JSON object. No markdown, no explanation.`

  // 5. Call model via smart tier router (Groq fast/instant → Claude premium → OpenAI fallback)
  const result = await callModel(agentType, systemPrompt, contextBlock, config.maxOutputTokens)
  let { text: rawOutput, inputTokens, outputTokens, wasTruncated } = result

  if (wasTruncated) {
    console.warn(`[agent-runner] ${agentType} truncated — retrying concise`)
  }

  // 6. Validate JSON — retry once with corrective prompt on parse/schema failure or truncation
  let parsed: T
  try {
    if (wasTruncated) throw new Error('truncated')
    parsed = validateOutput<T>(rawOutput, schema)
  } catch (firstErr) {
    const isTruncated = wasTruncated || (firstErr instanceof Error && firstErr.message === 'truncated')
    const retryInstruction = isTruncated
      ? 'Your previous response was cut off before the JSON was complete. Start fresh and return a COMPLETE, valid JSON object. Be concise — use shorter strings but include every required field.'
      : 'Your previous response did not match the required JSON schema. Fix it and return a valid JSON object.'

    try {
      const retry = await callModel(
        agentType,
        `${systemPrompt}\n\n${retryInstruction}`,
        contextBlock,
        config.maxOutputTokens,
      )
      parsed = validateOutput<T>(retry.text, schema)
      inputTokens  += retry.inputTokens
      outputTokens += retry.outputTokens
    } catch {
      throw { code: 'AGENT_VALIDATION_FAILED', message: 'Agent returned invalid output', status: 500 }
    }
  }

  // 7. Persist output to AgentRun
  await prisma.agentRun.create({
    data: {
      userId,
      agentType,
      workspaceId: workspaceId ?? null,
      model: config.model,
      inputTokens,
      outputTokens,
      outputJson: parsed as object,
      success: true,
    },
  })

  // 8. Increment usage counter (Super Admin exempt from counting)
  if (role !== 'SUPER_ADMIN') {
    await incrementUsage(userId)
  }

  // 9. Compute remaining outputs
  const today = new Date().toISOString().slice(0, 10)
  const usage = await prisma.dailyUsage.findUnique({
    where: { userId_dateIST: { userId, dateIST: today } },
  })

  const limit = plan === 'PREMIUM' ? 1000 : plan === 'FREE' ? 0 : 100
  const remaining = role === 'SUPER_ADMIN' ? 9999 : Math.max(0, limit - (usage?.aiOutputs ?? 0))

  return { data: parsed, usage: { inputTokens, outputTokens }, remainingDailyOutputs: remaining }
}

function validateOutput<T>(raw: string, schema: z.ZodTypeAny): T {
  // Strip markdown fences, then try to extract JSON object/array from anywhere in the text
  let cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  // If direct parse fails, find the first { or [ and last } or ] to extract embedded JSON
  let json: unknown
  try {
    json = JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{') !== -1 ? cleaned.indexOf('{') : cleaned.indexOf('[')
    const end   = cleaned.lastIndexOf('}') !== -1 ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']')
    if (start !== -1 && end !== -1 && end > start) {
      try {
        json = JSON.parse(cleaned.slice(start, end + 1))
      } catch {
        // fall through to error below
      }
    }
    if (json === undefined) {
      console.error('[agent-runner] JSON parse failed. Raw output:', cleaned.slice(0, 500))
      throw new Error('JSON parse failed')
    }
  }
  try {
    return schema.parse(json) as T
  } catch (err) {
    console.error('[agent-runner] Schema validation failed. Parsed JSON:', JSON.stringify(json).slice(0, 500))
    console.error('[agent-runner] Zod error:', err)
    throw err
  }
}
