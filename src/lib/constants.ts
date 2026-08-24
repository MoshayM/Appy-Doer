import { Plan, AgentType } from '@prisma/client'

export const PLAN_LIMITS: Record<Plan, { aiOutputsPerDay: number; label: string }> = {
  FREE:    { aiOutputsPerDay: 0,    label: 'Free (locked)' },
  TRIAL:   { aiOutputsPerDay: 100,  label: '7-Day Trial' },
  PRO:     { aiOutputsPerDay: 100,  label: 'Pro' },
  PREMIUM: { aiOutputsPerDay: 9999, label: 'Premium' },
}

// Legacy INR fallback — use GEO_PRICES from geo-pricing.ts for all user-facing pricing
export const PLAN_PRICES = {
  PRO:     { priceINR: 399,   interval: 'MONTH' as const },
  PREMIUM: { priceINR: 3999,  interval: 'YEAR'  as const },
}

export const TRIAL_DAYS = 7

// Agent phase mapping — FREE cannot generate, TRIAL/PRO/PREMIUM access MVP agents
export const AGENT_PHASES: Record<AgentType, string> = {
  SKILL_ASSESSMENT:       'MVP',
  OPPORTUNITY_DISCOVERY:  'MVP',
  OFFER_BUILDER:          'MVP',
  PORTFOLIO_BUILDER:      'MVP',
  PROFILE_INTELLIGENCE:   'MVP',
  CLIENT_INTELLIGENCE:    'MVP',
  CLIENT_DISCOVERY:       'MVP',
  CLIENT_ACQUISITION:     'MVP',
  RELATIONSHIP_SUCCESS:   'MVP',
  WORK_SUPPORT:           'MVP',
  DIGITAL_PRODUCT_BUILDER:'PHASE_2',
  VIRTUAL_EMPLOYEE_TEAM:  'PHASE_3',
  SAAS_OPPORTUNITY:       'PHASE_3',
  REVENUE_GROWTH:         'PHASE_4',
  BUSINESS_SCALING:       'PHASE_4',
  REPLY_INTELLIGENCE:     'MVP',
}

// Default token budgets — overridden by AgentConfig in DB
// Output budgets are sized to fit full JSON including all nested fields.
// Input budgets account for userContext + all previousAgentOutputs from the dependency chain.
export const DEFAULT_TOKEN_BUDGETS: Record<AgentType, { input: number; output: number }> = {
  SKILL_ASSESSMENT:        { input: 2000,  output: 1000 },
  OPPORTUNITY_DISCOVERY:   { input: 5000,  output: 2500 }, // carries SKILL_ASSESSMENT output; 4-6 opps × ~300 tokens
  OFFER_BUILDER:           { input: 6000,  output: 2000 }, // carries SKILL + OPPORTUNITY outputs
  PORTFOLIO_BUILDER:       { input: 8000,  output: 3000 }, // carries 3 prior outputs; bio/case studies are verbose
  PROFILE_INTELLIGENCE:    { input: 10000, output: 3500 }, // carries 4 prior outputs; full profile is large
  CLIENT_INTELLIGENCE:     { input: 6000,  output: 5000 }, // carries SKILL + OPPORTUNITY + OFFER outputs; communicationScripts are verbose
  CLIENT_ACQUISITION:      { input: 8000,  output: 2500 }, // carries 4 prior outputs; emails + proposal
  RELATIONSHIP_SUCCESS:    { input: 6000,  output: 2000 }, // carries 3 prior outputs
  WORK_SUPPORT:            { input: 8000,  output: 2500 }, // carries 3 prior outputs; task plan is verbose
  CLIENT_DISCOVERY:        { input: 6000,  output: 5000 }, // carries SKILL + OPPORTUNITY + OFFER; 6-8 prospects with urls
  DIGITAL_PRODUCT_BUILDER: { input: 5000,  output: 2000 },
  VIRTUAL_EMPLOYEE_TEAM:   { input: 8000,  output: 3000 },
  SAAS_OPPORTUNITY:        { input: 6000,  output: 2000 },
  REVENUE_GROWTH:          { input: 5000,  output: 2000 },
  BUSINESS_SCALING:        { input: 5000,  output: 2000 },
  REPLY_INTELLIGENCE:      { input: 2000,  output: 600  },
}

export const PRIMARY_MODEL   = 'claude-sonnet-4-6'
export const FALLBACK_MODEL  = 'gpt-4o'
