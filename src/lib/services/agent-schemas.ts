import { z } from 'zod'

// ── 0. Client Discovery ───────────────────────────────────────────────────────
export const ClientDiscoverySchema = z.object({
  prospects: z.array(z.object({
    id: z.string(),
    companyName: z.string(),
    industry: z.string(),
    companySize: z.enum(['STARTUP', 'SME', 'ENTERPRISE']),
    region: z.string(),
    contactName: z.string(),
    contactRole: z.string(),
    estimatedEmail: z.string(),
    emailPattern: z.string(),
    linkedinSearchUrl: z.string(),
    jobPortalUrls: z.array(z.object({ portal: z.string(), url: z.string() })),
    whyGoodFit: z.string(),
    priorityScore: z.number().min(1).max(10),
    outreachAngle: z.string(),
  })),
  searchStrategy: z.string(),
})
export type ClientDiscoveryOutput = z.infer<typeof ClientDiscoverySchema>

// ── 1. Skill Assessment ───────────────────────────────────────────────────────
export const SkillAssessmentSchema = z.object({
  classification: z.string(),
  suggestedSkills: z.array(z.string()),       // editable by user after assessment
  monetizableSkills: z.array(z.string()),
  experienceTier: z.enum(['ENTRY', 'MID', 'SENIOR', 'EXPERT']),
  recommendedFocusAreas: z.array(z.string()),
  readinessScore: z.number().min(0).max(100),
})
export type SkillAssessmentOutput = z.infer<typeof SkillAssessmentSchema>

// ── 2. Opportunity Discovery ──────────────────────────────────────────────────
export const OpportunityDiscoverySchema = z.object({
  opportunities: z.array(z.object({
    id: z.string(),
    title: z.string(),
    category: z.enum(['SERVICE', 'DIGITAL_PRODUCT', 'SAAS', 'CONTENT']),
    difficultyScore: z.number().min(1).max(10),
    timeToFirstIncome: z.string(),
    monthlyPotentialINR: z.object({ min: z.number(), max: z.number() }),
    requiredEffortHoursPerWeek: z.number(),
    indiaContext: z.object({
      clientGeography: z.enum(['LOCAL_INR', 'GLOBAL_USD', 'MIXED']),
      gstRelevant: z.boolean(),
      recommendedPlatforms: z.array(z.string()),
    }),
    riskNotes: z.string(),
    actionPlanSummary: z.string(),
  })),
  topRecommendationId: z.string(),
})
export type OpportunityDiscoveryOutput = z.infer<typeof OpportunityDiscoverySchema>

// ── 3. Offer Builder ──────────────────────────────────────────────────────────
export const OfferBuilderSchema = z.object({
  offerName: z.string(),
  positioningStatement: z.string(),
  tiers: z.array(z.object({
    name: z.string(),
    priceINR: z.number(),
    deliverables: z.array(z.string()),
    turnaround: z.string(),
  })),
  idealClient: z.string(),
  salesPitch: z.string(),
})
export type OfferBuilderOutput = z.infer<typeof OfferBuilderSchema>

// ── 4. Portfolio Builder ──────────────────────────────────────────────────────
export const PortfolioBuilderSchema = z.object({
  headline: z.string(),
  bio: z.string(),
  servicePages: z.array(z.object({ title: z.string(), body: z.string() })),
  caseStudies: z.array(z.object({
    title: z.string(),
    problem: z.string(),
    solution: z.string(),
    result: z.string(),
  })),
  linkedinHeadline: z.string(),
  linkedinAbout: z.string(),
  resumeEnhancements: z.array(z.string()),
})
export type PortfolioBuilderOutput = z.infer<typeof PortfolioBuilderSchema>

// ── 5. Profile Intelligence ───────────────────────────────────────────────────
export const ProfileIntelligenceSchema = z.object({
  primaryType: z.enum(['DYNAMIC_RESUME', 'PORTFOLIO_SITE', 'PUBLIC_PROFILE', 'SERVICE_CATALOG', 'INDUSTRY_SPECIFIC']),
  headline: z.string(),
  summary: z.string(),
  positioning: z.string(),
  skillsMatrix: z.array(z.object({
    skill: z.string(),
    proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
    proof: z.string(),
  })),
  experienceHighlights: z.array(z.string()),
  certifications: z.array(z.string()),
  serviceCatalog: z.array(z.object({
    service: z.string(),
    outcome: z.string(),
    priceFromINR: z.number(),
  })),
  caseStudies: z.array(z.object({
    title: z.string(),
    problem: z.string(),
    solution: z.string(),
    result: z.string(),
  })),
  customization: z.object({ region: z.string(), industry: z.string(), client: z.string() }),
  outputs: z.object({
    websiteSlug: z.string(),
    resumePdf: z.boolean(),
    linkedinProfile: z.object({ headline: z.string(), about: z.string() }),
    proposalProfile: z.string(),
    presentationProfile: z.string(),
  }),
})
export type ProfileIntelligenceOutput = z.infer<typeof ProfileIntelligenceSchema>

// ── 6. Client Intelligence ────────────────────────────────────────────────────
export const ClientIntelligenceSchema = z.object({
  clientTemperature: z.enum(['COLD', 'WARM', 'HOT']),
  confidence: z.number().min(0).max(100),
  companyProfile: z.object({
    name: z.string(),
    industry: z.string(),
    size: z.string(),
    region: z.string(),
  }),
  communicationPreference: z.enum(['EMAIL', 'CALL', 'MESSAGING', 'VIDEO', 'IN_PERSON']),
  culturalNotes: z.array(z.string()),
  regionExpectations: z.array(z.string()),
  pricingSensitivity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  decisionMakingStyle: z.string(),
  recommendedStrategy: z.string(),
  proposalCustomization: z.array(z.string()),
  meetingPrep: z.object({
    talkingPoints: z.array(z.string()),
    questionsToAsk: z.array(z.string()),
    likelyObjections: z.array(z.object({ objection: z.string(), response: z.string() })),
  }),
  communicationScripts: z.object({ intro: z.string(), followUp: z.string(), closing: z.string() }),
  pricingRecommendationINR: z.object({ min: z.number(), max: z.number(), rationale: z.string() }),
})
export type ClientIntelligenceOutput = z.infer<typeof ClientIntelligenceSchema>

// ── 7. Client Acquisition ─────────────────────────────────────────────────────
export const ClientAcquisitionSchema = z.object({
  outreach: z.object({
    linkedinMessage: z.string(),
    coldEmail: z.object({ subject: z.string(), body: z.string() }),
    followUpSequence: z.array(z.string()),
  }),
  discoveryCallQuestions: z.array(z.string()),
  proposal: z.object({
    summary: z.string(),
    scope: z.array(z.string()),
    pricingINR: z.number(),
    terms: z.string(),
  }),
})
export type ClientAcquisitionOutput = z.infer<typeof ClientAcquisitionSchema>

// ── 8. Relationship Success ───────────────────────────────────────────────────
export const RelationshipSuccessSchema = z.object({
  relationshipStage: z.enum(['NEW', 'ACTIVE', 'NURTURING', 'AT_RISK', 'DORMANT', 'CHAMPION']),
  nextActions: z.array(z.object({
    type: z.enum(['FOLLOW_UP', 'CHECK_IN', 'RENEWAL', 'BIRTHDAY', 'UPSELL', 'CROSS_SELL', 'REPEAT_WORK']),
    dueDate: z.string(),
    message: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  })),
  expansionOpportunities: z.array(z.object({
    type: z.enum(['UPSELL', 'CROSS_SELL', 'REPEAT_WORK', 'NEW_SERVICE']),
    description: z.string(),
    estimatedValueINR: z.number(),
    confidence: z.number(),
  })),
  nurtureCampaign: z.object({ cadence: z.string(), touchpoints: z.array(z.string()) }),
  actionPlan: z.array(z.string()),
})
export type RelationshipSuccessOutput = z.infer<typeof RelationshipSuccessSchema>

// ── 9. Work Support ───────────────────────────────────────────────────────────
export const WorkSupportSchema = z.object({
  requirementAnalysis: z.object({
    objective: z.string(),
    scope: z.array(z.string()),
    constraints: z.array(z.string()),
    deliverables: z.array(z.string()),
  }),
  taskPlan: z.array(z.object({
    task: z.string(),
    estimateHours: z.number(),
    dependencies: z.array(z.string()),
  })),
  solution: z.object({ approach: z.string(), artifacts: z.array(z.string()) }),
  content: z.string(),
  documentation: z.string(),
  researchFindings: z.array(z.string()),
  costEstimateINR: z.object({ low: z.number(), high: z.number(), basis: z.string() }),
  nextStep: z.string(),
})
export type WorkSupportOutput = z.infer<typeof WorkSupportSchema>

// ── 10. Reply Intelligence ────────────────────────────────────────────────────
export const ReplyIntelligenceSchema = z.object({
  intent: z.enum(['INTERESTED', 'NEED_QUOTE', 'NEED_MEETING', 'NEED_SAMPLE', 'NOT_INTERESTED', 'WRONG_CONTACT', 'OUT_OF_OFFICE', 'SPAM']),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
  extractedInfo: z.object({
    company:      z.string().optional(),
    personName:   z.string().optional(),
    phone:        z.string().optional(),
    requirements: z.array(z.string()),
    budget:       z.string().optional(),
    timeline:     z.string().optional(),
  }),
  suggestedAction: z.string(),
  crmStageUpdate:  z.enum(['INTERESTED', 'PROPOSAL_SENT', 'WON', 'LOST', 'CONTACTED']).optional(),
})
export type ReplyIntelligenceOutput = z.infer<typeof ReplyIntelligenceSchema>
