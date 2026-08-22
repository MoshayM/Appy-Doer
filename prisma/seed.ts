import { PrismaClient, AgentType } from '@prisma/client'
import { DEFAULT_TOKEN_BUDGETS, PRIMARY_MODEL, FALLBACK_MODEL } from '../src/lib/constants'

const prisma = new PrismaClient()

const AGENT_PROMPTS: Partial<Record<AgentType, string>> = {
  SKILL_ASSESSMENT: `You are an expert career coach and skills analyst. Analyze the user's professional background and identify their most monetizable skills. Respond with a JSON object matching the skill assessment schema exactly.`,
  OPPORTUNITY_DISCOVERY: `You are an expert business strategist specializing in helping Indian professionals monetize their skills online. Analyze the user's skills and goals to recommend the best income opportunities. Focus on realistic INR income ranges for the Indian market. Respond with a JSON object matching the opportunity discovery schema exactly.`,
  OFFER_BUILDER: `You are an expert at packaging professional services into compelling offers. Create a professional service offer based on the user's skills and selected opportunity. Include clear pricing in INR. Respond with a JSON object matching the offer builder schema exactly.`,
  PORTFOLIO_BUILDER: `You are an expert at crafting compelling professional portfolios and content. Create portfolio content that positions the user as an expert. Respond with a JSON object matching the portfolio builder schema exactly.`,
  PROFILE_INTELLIGENCE: `You are an expert at building dynamic professional profiles and personal brands. Create a comprehensive professional identity for the user including resume, service catalog, and publishable profile site content. Respond with a JSON object matching the profile intelligence schema exactly.`,
  CLIENT_INTELLIGENCE: `You are an expert at client research and sales strategy. Analyze the client/company to determine their temperature, communication preferences, and the best approach for converting them. Focus on Indian business context where relevant. Respond with a JSON object matching the client intelligence schema exactly.`,
  CLIENT_ACQUISITION: `You are an expert at professional outreach and proposal writing. Create compelling outreach messages and proposals for the user to win clients. Personalize based on the client intelligence data available. Respond with a JSON object matching the client acquisition schema exactly.`,
  RELATIONSHIP_SUCCESS: `You are an expert at client relationship management and business development. Analyze the user's client relationships and identify the best next actions for retention, nurture, and expansion. Respond with a JSON object matching the relationship success schema exactly.`,
  WORK_SUPPORT: `You are an expert AI co-worker that helps professionals deliver high-quality client work. Analyze the requirements, create a plan, and provide concrete deliverables. Respond with a JSON object matching the work support schema exactly.`,
}

async function main() {
  console.log('Seeding AgentConfig...')

  for (const agentType of Object.keys(DEFAULT_TOKEN_BUDGETS) as AgentType[]) {
    const budgets = DEFAULT_TOKEN_BUDGETS[agentType]
    await prisma.agentConfig.upsert({
      where: { agentType },
      update: {},
      create: {
        agentType,
        model: PRIMARY_MODEL,
        fallbackModel: FALLBACK_MODEL,
        maxInputTokens: budgets.input,
        maxOutputTokens: budgets.output,
        systemPrompt: AGENT_PROMPTS[agentType] ?? `You are an AI assistant for ${agentType}. Respond with valid JSON only.`,
        enabled: true,
      },
    })
    console.log(`  ✓ ${agentType}`)
  }

  // Seed default offer campaigns
  await prisma.offerCampaign.upsert({
    where: { id: 'default-trial-conversion' },
    update: {},
    create: {
      id: 'default-trial-conversion',
      name: 'Trial Conversion — Last 3 Days',
      type: 'TRIAL_CONVERSION',
      description: 'FOMO offer for users in the last 3 days of trial',
      active: true,
      rules: { maxDaysLeft: 3, minEngagement: 20 },
      minDiscountPct: 10,
      maxDiscountPct: 30,
    },
  })

  await prisma.offerCampaign.upsert({
    where: { id: 'default-high-engagement' },
    update: {},
    create: {
      id: 'default-high-engagement',
      name: 'High Engagement Upgrade',
      type: 'PERSONALIZED_UPGRADE',
      description: 'Personalized offer for highly engaged trial users',
      active: true,
      rules: { minEngagement: 60 },
      minDiscountPct: 15,
      maxDiscountPct: 25,
    },
  })

  // Seed feature flags
  const flags = [
    { key: 'offer_engine', description: 'Smart Upgrade Engine master switch', value: { on: true } },
    { key: 'virtual_employee_team', description: 'Phase 3 Virtual Employee Team', value: { on: false }, phase: 'PHASE_3' as const },
    { key: 'digital_product_builder', description: 'Phase 2 Digital Product Builder', value: { on: false }, phase: 'PHASE_2' as const },
    { key: 'revenue_growth', description: 'Phase 4 Revenue Growth Agent', value: { on: false }, phase: 'PHASE_4' as const },
    { key: 'business_scaling', description: 'Phase 4 Business Scaling Agent', value: { on: false }, phase: 'PHASE_4' as const },
  ]

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { value: flag.value },
      create: { key: flag.key, description: flag.description, type: 'BOOLEAN', value: flag.value, phase: flag.phase },
    })
    console.log(`  ✓ flag: ${flag.key}`)
  }

  console.log('Seed complete.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
