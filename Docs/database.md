# database.md

PostgreSQL schema (Prisma) for **AI WorkBuddy**. This is the canonical data model. Prisma is the only data-access path.

---

## Enums

```prisma
enum PlatformRole { SUPER_ADMIN  ADMIN  CUSTOMER }
enum AdminPreset  { SUPPORT  CONTENT  FINANCE }          // default Admin permission templates

enum Plan         { FREE  TRIAL  PRO  PREMIUM }          // FREE = post-trial locked, read-only
enum SubStatus    { TRIALING  ACTIVE  PAST_DUE  GRACE  CANCELED  EXPIRED }
enum BillingInterval { MONTH  YEAR }                     // Pro = MONTH, Premium = YEAR

enum Phase        { MVP  PHASE_2  PHASE_3  PHASE_4 }

enum AgentType {
  // MVP income chain
  SKILL_ASSESSMENT  OPPORTUNITY_DISCOVERY  OFFER_BUILDER  PORTFOLIO_BUILDER
  PROFILE_INTELLIGENCE  CLIENT_INTELLIGENCE  CLIENT_ACQUISITION
  RELATIONSHIP_SUCCESS  WORK_SUPPORT
  // Later phases
  DIGITAL_PRODUCT_BUILDER          // Phase 2
  VIRTUAL_EMPLOYEE_TEAM            // Phase 3
  SAAS_OPPORTUNITY                 // Phase 3
  REVENUE_GROWTH  BUSINESS_SCALING // Phase 4 (split from the former BUSINESS_GROWTH)
}

enum LeadStage   { LEAD_IDENTIFIED  CONTACTED  INTERESTED  PROPOSAL_SENT  WON  LOST }
enum PaymentGateway { RAZORPAY  CASHFREE  STRIPE  PAYPAL }
enum EmailProvider  { RESEND  SENDGRID  SES }
enum OpportunityCategory { SERVICE  DIGITAL_PRODUCT  SAAS  CONTENT }

// --- Expansion enums (AI Workforce features) ---
enum ClientTemperature       { COLD  WARM  HOT }
enum ProfileType             { DYNAMIC_RESUME  PORTFOLIO_SITE  PUBLIC_PROFILE  SERVICE_CATALOG  INDUSTRY_SPECIFIC  PROPOSAL_PROFILE  PRESENTATION_PROFILE }
enum OfferType               { LIMITED_TIME  DYNAMIC_DISCOUNT  PERSONALIZED_UPGRADE  FOMO  TRIAL_CONVERSION }
enum WorkStatus              { NOT_STARTED  REQUIREMENTS  PLANNING  IN_PROGRESS  REVIEW  DELIVERED  BLOCKED }
enum EmployeeRole            { PROJECT_MANAGER  BUSINESS_ANALYST  TECHNICAL_SPECIALIST  QUALITY_ASSURANCE  CREATIVE_SPECIALIST  COMMUNICATION_SPECIALIST  RESEARCH_SPECIALIST  DELIVERY_COORDINATOR }
enum RelationshipStage       { NEW  ACTIVE  NURTURING  AT_RISK  DORMANT  CHAMPION }
enum CommunicationPreference { EMAIL  CALL  MESSAGING  VIDEO  IN_PERSON }
```

---

## Core models

```prisma
model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String?
  role          PlatformRole  @default(CUSTOMER)
  plan          Plan          @default(TRIAL)          // new users start on TRIAL
  adminPresets  AdminPreset[]                          // only used when role = ADMIN
  createdAt     DateTime      @default(now())
  lastActiveAt  DateTime?                              // feeds engagement scoring

  subscription  Subscription?
  context       UserContext?
  usage         DailyUsage[]
  opportunities OpportunityRoadmap[]
  offers        Offer[]
  portfolios    PortfolioAsset[]
  leads         Lead[]
  milestones    RevenueMilestone[]
  agentRuns     AgentRun[]
  activityLogs  ActivityLog[]

  // expansion relations
  profiles          ProfessionalProfile[]
  clientProfiles    ClientProfile[]
  relationships     ClientRelationship[]
  workspaces        ProjectWorkspace[]
  virtualEmployees  VirtualEmployee[]
  subscriptionOffers SubscriptionOffer[]
  notifications     NotificationCampaign[]
}

// One shared-memory record per user (architecture.md §3)
model UserContext {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id])
  profession            String?
  experienceYears       Int?
  industry              String?
  availableHoursPerWeek Int?
  incomeTargetINR       Int?
  skills                String[]
  interests             String[]
  selectedOpportunityId String?
  engagementScore       Int      @default(0)           // 0-100, offer-engine input
  profileCompletion     Int      @default(0)           // 0-100
  version               Int      @default(0)           // optimistic locking
  currentState          AgentType?                     // state-machine cursor
  onboardingComplete    Boolean  @default(false)
  updatedAt             DateTime @updatedAt
}
```

---

## Billing models

```prisma
model Subscription {
  id              String          @id @default(cuid())
  userId          String          @unique
  user            User            @relation(fields: [userId], references: [id])
  plan            Plan
  status          SubStatus       @default(TRIALING)
  interval        BillingInterval @default(MONTH)       // PRO=MONTH, PREMIUM=YEAR
  priceINR        Int                                   // actual charged price (may be offer-discounted)
  listPriceINR    Int?                                  // pre-discount list price
  appliedOfferId  String?                               // SubscriptionOffer used at checkout
  gateway         PaymentGateway
  gatewaySubId    String?
  trialStartedAt  DateTime?
  trialEndsAt     DateTime?
  currentPeriodEnd DateTime?
  graceEndsAt     DateTime?                             // failed-payment grace (default 3 days)
  gstin           String?                               // optional, for GST invoicing
  createdAt       DateTime        @default(now())
  payments        Payment[]
}

model Payment {
  id             String         @id @default(cuid())
  subscriptionId String
  subscription   Subscription   @relation(fields: [subscriptionId], references: [id])
  gateway        PaymentGateway
  gatewayPaymentId String?
  amountINR      Int
  gstAmountINR   Int            @default(0)             // 18% GST
  status         String                                 // SUCCESS|FAILED|REFUNDED|PENDING
  invoiceUrl     String?
  createdAt      DateTime       @default(now())
}
```

---

## Agent / usage models

```prisma
model AgentRun {
  id           String    @id @default(cuid())
  userId       String
  user         User      @relation(fields: [userId], references: [id])
  agentType    AgentType
  workspaceId  String?                                  // set for WORK_SUPPORT / VIRTUAL_EMPLOYEE_TEAM
  model        String                                   // model id actually used
  inputTokens  Int
  outputTokens Int
  outputJson   Json                                     // validated agent output
  success      Boolean   @default(true)
  createdAt    DateTime  @default(now())
}

model DailyUsage {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  dateIST     String                                    // "YYYY-MM-DD" in IST
  aiOutputs   Int      @default(0)
  @@unique([userId, dateIST])
}
```

---

## Domain models (income chain)

```prisma
model OpportunityRoadmap {
  id            String              @id @default(cuid())
  userId        String
  user          User                @relation(fields: [userId], references: [id])
  title         String
  category      OpportunityCategory
  difficulty    Int
  monthlyMinINR Int
  monthlyMaxINR Int
  detail        Json
  selected      Boolean             @default(false)
  createdAt     DateTime            @default(now())
}

model Offer {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  detail    Json                                        // tiers, pricing, deliverables
  createdAt DateTime @default(now())
}

model PortfolioAsset {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String                                      // headline|bio|caseStudy|servicePage|linkedin
  content   Json
  fileUrl   String?
  createdAt DateTime @default(now())
}

model Lead {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  name      String
  company   String?
  contact   String?
  service   String?
  notes     String?
  stage     LeadStage  @default(LEAD_IDENTIFIED)
  lastActivityAt DateTime @default(now())               // drives follow-up reminders
  createdAt DateTime   @default(now())
  artifacts Json?                                        // generated outreach/proposal
  clientProfile ClientProfile?                           // optional Client Intelligence link
}

model RevenueMilestone {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  label       String
  amountINR   Int
  isFirstIncome Boolean @default(false)                 // triggers celebration once
  achievedAt  DateTime @default(now())
}
```

---

## Profile Intelligence models

```prisma
model ProfessionalProfile {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  primaryType ProfileType @default(PUBLIC_PROFILE)
  headline    String
  summary     String
  positioning String?
  detail      Json                                       // full agent output (skills matrix, catalog, case studies)
  websiteSlug String?     @unique                        // published profile-site path
  published   Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  versions    ProfileVersion[]
}

model ProfileVersion {
  id          String      @id @default(cuid())
  profileId   String
  profile     ProfessionalProfile @relation(fields: [profileId], references: [id])
  type        ProfileType
  region      String?                                    // region-specific customization
  industry    String?                                    // industry-specific customization
  client      String?                                    // client-specific customization
  content     Json
  fileUrl     String?                                    // resume / proposal / presentation PDF
  createdAt   DateTime    @default(now())
}
```

---

## Client Intelligence + Relationship models

```prisma
model ClientProfile {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  leadId        String?  @unique
  lead          Lead?    @relation(fields: [leadId], references: [id])
  companyName   String
  industry      String?
  region        String?
  website       String?
  temperature   ClientTemperature        @default(COLD)
  commPreference CommunicationPreference?
  pricingSensitivity String?                              // LOW|MEDIUM|HIGH
  decisionStyle String?
  detail        Json                                      // full agent output (strategy, scripts, meeting prep)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  insights      ClientInsight[]
  relationship  ClientRelationship?
}

model ClientInsight {
  id              String   @id @default(cuid())
  clientProfileId String
  clientProfile   ClientProfile @relation(fields: [clientProfileId], references: [id])
  source          String                                  // WEBSITE|SOCIAL|CRM|INTERACTION|INDUSTRY
  insight         Json
  createdAt       DateTime @default(now())
}

model ClientRelationship {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  clientProfileId String   @unique
  clientProfile   ClientProfile @relation(fields: [clientProfileId], references: [id])
  stage           RelationshipStage @default(NEW)
  lastContactAt   DateTime?
  nextActionAt    DateTime?                               // drives scheduled reminders
  birthday        DateTime?                               // birthday reminders
  renewalAt       DateTime?                               // renewal reminders
  lifetimeValueINR Int     @default(0)
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## Work Support + Virtual Employee Team models

```prisma
model ProjectWorkspace {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  leadId          String?
  clientProfileId String?
  title           String
  objective       String?
  status          WorkStatus @default(NOT_STARTED)
  sharedContext   Json?                                   // project-scoped shared memory (architecture.md §3, §11)
  contextVersion  Int      @default(0)                    // optimistic locking for ProjectContext
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tasks           ProjectTask[]
  sessions        WorkSession[]
  veTasks         VirtualEmployeeTask[]
}

model ProjectTask {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     ProjectWorkspace @relation(fields: [workspaceId], references: [id])
  title         String
  description   String?
  status        WorkStatus @default(NOT_STARTED)
  estimateHours Int?
  orderIndex    Int      @default(0)
  output        Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model WorkSession {
  id           String   @id @default(cuid())
  workspaceId  String
  workspace    ProjectWorkspace @relation(fields: [workspaceId], references: [id])
  userId       String
  agentType    AgentType                                  // WORK_SUPPORT or VIRTUAL_EMPLOYEE_TEAM
  input        Json
  output       Json
  inputTokens  Int      @default(0)
  outputTokens Int      @default(0)
  createdAt    DateTime @default(now())
}

model VirtualEmployee {
  id           String       @id @default(cuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  role         EmployeeRole
  name         String
  personality  String?                                    // persona / tone
  systemPrompt String?                                     // role-specific prompt (Super-Admin/user configurable)
  enabled      Boolean      @default(true)
  createdAt    DateTime     @default(now())
  tasks        VirtualEmployeeTask[]
}

model VirtualEmployeeTask {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   ProjectWorkspace @relation(fields: [workspaceId], references: [id])
  employeeId  String
  employee    VirtualEmployee  @relation(fields: [employeeId], references: [id])
  role        EmployeeRole
  task        String
  status      WorkStatus @default(NOT_STARTED)
  dependsOn   String[]                                     // task ids → bounded ordering, no autonomous loops
  output      Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Offer engine + notification models

```prisma
model OfferCampaign {
  id              String   @id @default(cuid())
  name            String
  type            OfferType
  description     String?
  active          Boolean  @default(true)
  rules           Json                                     // targeting thresholds: activity/usage/engagement/conversion/daysLeft
  minDiscountPct  Int      @default(0)
  maxDiscountPct  Int      @default(0)
  startsAt        DateTime?
  endsAt          DateTime?
  createdAt       DateTime @default(now())
  offers          SubscriptionOffer[]
}

model SubscriptionOffer {
  id                   String   @id @default(cuid())
  userId               String
  user                 User     @relation(fields: [userId], references: [id])
  campaignId           String?
  campaign             OfferCampaign? @relation(fields: [campaignId], references: [id])
  type                 OfferType
  plan                 Plan
  interval             BillingInterval
  originalINR          Int
  discountedINR        Int
  discountPercent      Int
  conversionLikelihood Int?                                // 0-100 (model-predicted)
  expiresAt            DateTime?
  shown                Boolean  @default(false)
  accepted             Boolean  @default(false)
  createdAt            DateTime @default(now())
}

model NotificationCampaign {
  id          String   @id @default(cuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  type        String                                       // TRIAL_REMINDER|OFFER|FOMO|RELATIONSHIP|RENEWAL|BIRTHDAY|DIGEST|CELEBRATION
  channel     String                                       // IN_APP|EMAIL|PUSH
  title       String
  body        String
  scheduledAt DateTime?
  sentAt      DateTime?
  read        Boolean  @default(false)
  meta        Json?
  createdAt   DateTime @default(now())
  @@index([userId, scheduledAt])
}
```

---

## Platform / ops models

```prisma
model AgentConfig {                                       // Super-Admin editable AI config (incl. every new agent + VE role)
  id            String    @id @default(cuid())
  agentType     AgentType @unique
  model         String    @default("claude-sonnet-4-6")
  fallbackModel String    @default("gpt-4o")
  maxInputTokens  Int
  maxOutputTokens Int
  systemPrompt  String
  enabled       Boolean   @default(true)
  updatedAt     DateTime  @updatedAt
}

model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique
  description String?
  type        String                                       // BOOLEAN|PERCENTAGE|SEGMENT
  value       Json
  phase       Phase?
  updatedAt   DateTime @updatedAt
}

model SuccessStory {
  id         String   @id @default(cuid())
  userId     String?
  title      String
  body       String
  incomeINR  Int?
  approved   Boolean  @default(false)
  createdAt  DateTime @default(now())
}

model ActivityLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  actorRole PlatformRole?
  action    String
  meta      Json?
  createdAt DateTime @default(now())
  @@index([userId, createdAt])
}
```

---

## Notes

- **Plan default is `TRIAL`.** On trial expiry without subscribing, `plan` becomes `FREE` (locked, read-only, 0 AI outputs/day) — see architecture.md §7–8.
- `RevenueMilestone.isFirstIncome = true` is set the first time a `Lead` moves to `WON`; it fires the First Income Celebration exactly once, then hands off to the Relationship Success Agent.
- `DailyUsage` enforces the per-plan outputs-per-day limits, keyed by IST date.
- `AgentConfig` makes model, budgets, and prompts runtime-editable by Super Admin for **all** agent types, including each Virtual Employee role persona — never hardcode.
- The **Offer Engine** reads `UserContext.engagementScore`, usage, and `Subscription.trialEndsAt` to materialize a `SubscriptionOffer` from an eligible `OfferCampaign`; checkout applies `Subscription.appliedOfferId`.
- `ProjectWorkspace.sharedContext` + `contextVersion` implement project-scoped shared memory with the same optimistic-locking discipline as `UserContext`.
- Phase gating: a customer can access a feature only if its `phase` ≤ the platform's currently enabled phase, except Premium auto-grant and Admin/Super-Admin bypass.

## Decision Log
- 2026-05-30 — Schema derived from docs 1–5. Added `version`, `DailyUsage` IST keying, `isFirstIncome`, and `AgentConfig` runtime config.
- 2026-06-17 — **AI WorkBuddy** expansion. Added enums `ClientTemperature, ProfileType, OfferType, WorkStatus, EmployeeRole, RelationshipStage, CommunicationPreference`; added `TRIAL` to `Plan` (default for new users) and reworked `AgentType` (added Profile Intelligence, Client Intelligence, Relationship Success, Work Support, Virtual Employee Team, Revenue Growth, Business Scaling; split the former `BUSINESS_GROWTH`). Added models `ProfessionalProfile, ProfileVersion, ClientProfile, ClientInsight, ClientRelationship, ProjectWorkspace, ProjectTask, WorkSession, VirtualEmployee, VirtualEmployeeTask, OfferCampaign, SubscriptionOffer, NotificationCampaign`. Extended `Subscription` for annual + offer-discounted pricing, `UserContext` with `engagementScore`/`profileCompletion`, and `User` with `lastActiveAt`. All additive; existing models preserved.
