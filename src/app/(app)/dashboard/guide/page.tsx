'use client'

import { useState } from 'react'

const MODULES = [
  {
    id: 'start',
    icon: '🚀',
    label: 'Getting Started',
    color: 'indigo',
    sections: [
      {
        title: 'Welcome to AI WorkBuddy',
        body: `AI WorkBuddy is your AI-powered freelance command center. It combines intelligent agents, client outreach tools, financial tracking, and workspace automation into a single platform — designed to turn your expertise into a sustainable freelance income.`,
        steps: [
          'Complete your profile with your profession and core skills',
          'Run the Income Planner to identify your most valuable services',
          'Use Client Outreach to find and connect with ideal clients',
          'Manage ongoing work and communication from one place',
        ],
        tip: 'The platform is designed as a sequential workflow: Build your offer first → attract clients → manage work → track income. Follow the roadmap modules in order for best results.',
      },
      {
        title: 'Setting Up Your Profile',
        body: `Your profile is the foundation. The AI agents personalize every output based on your profession, skills, and context — so a complete profile produces significantly better results.`,
        steps: [
          'Go to My Profile from the sidebar',
          'Enter your profession, years of experience, and specializations',
          'Add a professional bio — the AI uses this to personalize outreach emails',
          'Set your target industry and preferred client type',
          'Upload a professional photo (optional, but increases response rates)',
        ],
        tip: 'Be specific. "UX Designer specializing in SaaS onboarding flows for B2B startups" will get you far better AI suggestions than just "Designer".',
      },
      {
        title: 'Understanding Your Dashboard',
        body: `The main dashboard shows a real-time summary of your freelance business: active leads, revenue, pending tasks, recent activity, and AI-generated insights.`,
        steps: [
          'Review the summary cards at the top for quick health checks',
          'Check the "AI Insights" section for daily recommendations',
          'Monitor your income pipeline and conversion metrics',
          'Use quick-action buttons to jump to active workflows',
        ],
        tip: 'The dashboard updates live. Return to it daily to stay on top of follow-ups, deadlines, and AI nudges.',
      },
    ],
  },
  {
    id: 'income-planner',
    icon: '💰',
    label: 'Income Planner',
    color: 'green',
    sections: [
      {
        title: 'What is the Income Planner?',
        body: `The Income Planner is a 3-step AI workflow that transforms your skills into a professional service offering with monetizable pricing. Think of it as your AI business consultant — it analyses your expertise, maps it to market demand, and crafts a compelling offer.`,
        steps: [
          'Navigate to Income Planner from the sidebar',
          'Complete all 3 steps in order: Skills → Opportunities → Offer',
          'Save your results after each step — they are pre-loaded on return visits',
          'Re-run any step anytime with the ↺ button to refresh with new context',
        ],
        tip: 'Each step builds on the last. The Offer Builder knows which opportunities you selected, so always confirm your opportunity selections before generating an offer.',
      },
      {
        title: 'Step 1 — Skill Assessment',
        body: `The AI evaluates your skills and identifies which ones carry the highest market value. It clusters your expertise into categories, highlights monetizable combinations, and suggests which skills to develop next.`,
        steps: [
          'Enter your profession in the text box (e.g. "Full-stack developer, 5 years, React + Node")',
          'Select your expertise level from the dropdown',
          'Click "Assess My Skills" — the AI analyses in ~15 seconds',
          'Review the generated skill chips; edit or remove any that don\'t apply',
          'Pay attention to the "Monetizable Skills" section — these are your highest-value services',
          'Click "Save & Continue" to lock Step 1 and unlock Step 2',
        ],
        tip: 'Add details in the profession field about your niche. The AI rewards specificity with better skill categorization. Example: "React developer specializing in fintech dashboards and data visualization".',
      },
      {
        title: 'Step 2 — Opportunity Discovery',
        body: `Using your skill profile, the AI scans market patterns and identifies specific freelance opportunities with the highest revenue potential for your exact skill set.`,
        steps: [
          'Click "Discover Opportunities" once Step 1 is saved',
          'Review each opportunity card — note the market size, difficulty, and earning potential',
          'Select 2–4 opportunities that match your ambition and capacity',
          'Click "Confirm Selection" to proceed',
        ],
        tip: 'Do not select everything. Picking 2–4 focused opportunities lets the Offer Builder create a sharper, more persuasive service package rather than a diluted generalist offer.',
      },
      {
        title: 'Step 3 — Offer Builder',
        body: `The AI constructs a 3-tier service offer (Starter, Professional, Premium) based on your selected opportunities and skill assessment. Each tier is priced, scoped, and described to convert prospects.`,
        steps: [
          'Review all 3 tiers carefully — edit names, deliverables, or pricing as needed',
          'Use the Translate button to convert your offer to different languages or communication styles',
          'The offer is auto-saved once generated — it feeds into Client Outreach automatically',
          'Return to this step anytime to refine or create a new version',
        ],
        tip: 'Price psychology matters. The middle tier (Professional) is what most clients choose — make it the best value. The Premium tier anchors perception so Professional feels affordable.',
      },
    ],
  },
  {
    id: 'outreach',
    icon: '🔍',
    label: 'Client Outreach',
    color: 'blue',
    sections: [
      {
        title: 'What is Client Outreach?',
        body: `Client Outreach is your AI-powered prospecting and communication hub. It has three tabs: Discover (find clients), Analyse (understand them deeply), and Outreach (contact them intelligently). Together they form a complete client acquisition pipeline.`,
        steps: [
          'Navigate to Client Outreach from the sidebar',
          'Start with the Discover tab to find potential clients',
          'Move to Analyse to understand a prospect before contacting them',
          'Use the Outreach tab to write and send personalized emails with AI assistance',
        ],
        tip: 'Do not skip the Analyse step. Sending generic outreach is the number one reason freelancers get ignored. The AI analysis gives you the context to write emails that feel personal and relevant.',
      },
      {
        title: 'Discover Tab — Finding Clients',
        body: `The Discover tab helps you identify high-potential prospects based on industry, company size, tech stack, and buying signals. The AI filters and ranks prospects by fit with your offer.`,
        steps: [
          'Set your target filters: industry, company size, location, tech stack',
          'Click "Discover" to run the AI search',
          'Browse the lead cards — each shows a fit score and key buying signals',
          'Star leads you want to prioritize; they appear in your Client Hub CRM',
          'Click any lead to open their detail panel for full analysis',
        ],
        tip: 'High fit-score leads are not always the best first contacts. Look for buying signals like "recently funded", "new hire in your specialty", or "job posting matching your skills" — these indicate active need.',
      },
      {
        title: 'Analyse Tab — Deep Client Intelligence',
        body: `Select any lead and the AI runs a comprehensive analysis: company pain points, decision-maker profile, competitive landscape, and the best angle for your outreach.`,
        steps: [
          'Select a lead from the Discover results or Client Hub',
          'Click "Analyse" to run the intelligence agent (~20 seconds)',
          'Read the full analysis: pain points, opportunity, recommended approach',
          'Note the "What to lead with" summary — use this in your email subject line',
          'Save the analysis; it is referenced automatically in the Outreach tab',
        ],
        tip: 'The "Best Angle" section is the most valuable output. It identifies the specific problem your prospect is most likely trying to solve right now — leading with this in your email dramatically increases reply rates.',
      },
      {
        title: 'Outreach Tab — AI-Assisted Email Communication',
        body: `The Outreach tab is a full email client with AI superpowers. For every thread, the AI reads the conversation history and suggests the ideal reply: tone, content, attachments, and next steps.`,
        steps: [
          'Select an email thread from the left panel',
          'The AI Suggestion Panel opens automatically for inbound messages',
          'Review the intent analysis: what is the client communicating, how urgent',
          'Read the suggested reply — it is already drafted for you',
          'Customize as needed, then use the 📎 button to attach relevant documents',
          'Click Send when ready',
        ],
        tip: 'Always check the "Key Insight" at the top of the AI panel — this is the single most important observation about the conversation, often something subtle a human reader might miss.',
      },
      {
        title: 'Understanding AI Suggestions',
        body: `Each AI suggestion panel contains: Intent (what the client wants), Urgency (how time-sensitive), Summary (conversation recap), Draft Reply, Communication Tips, and Suggested Attachments.`,
        steps: [
          'Intent tells you the underlying goal, not just the surface request',
          'Urgency (Critical/High/Medium/Low) tells you how fast to respond',
          'Communication Tips are specific behavioral suggestions for this client',
          'Suggested Attachments lists documents that would strengthen your reply',
          'Next Steps gives you the recommended action after sending',
        ],
        tip: 'High-urgency threads should be answered within 2 hours. The AI flags these clearly. Setting up email notifications ensures you never miss a critical message.',
      },
    ],
  },
  {
    id: 'workspace',
    icon: '⚡',
    label: 'Work Support',
    color: 'amber',
    sections: [
      {
        title: 'What is Work Support?',
        body: `Work Support is your AI-powered task execution environment. It helps you break down complex freelance deliverables into clear steps, generates drafts and outputs, and tracks progress on active client projects.`,
        steps: [
          'Open Work Support from the sidebar',
          'Create a new task describing the deliverable',
          'Let the AI elaborate the task into sub-steps',
          'Execute each step with AI assistance or manually',
          'Mark steps complete as you finish them',
        ],
        tip: 'Use Work Support for any deliverable that takes more than 2 hours. The elaboration step alone — where the AI breaks down the task — saves significant planning time and prevents missed requirements.',
      },
      {
        title: 'Task Lifecycle',
        body: `Every task goes through: Draft → Elaborated → In Progress → Review → Complete. The AI assists at each stage, from scoping to final quality check.`,
        steps: [
          'Start with a clear task title and description; include the client name and deadline',
          'Use "Elaborate" to have the AI generate a detailed step-by-step breakdown',
          'Review and adjust the elaboration to match your working style',
          'Begin execution — AI can draft content, generate code snippets, or structure documents',
          'Use "Review" mode to have the AI check your work before delivery',
        ],
        tip: 'Include the client\'s brief or requirements in the task description. The AI uses this context to make elaborations and outputs much more relevant and client-specific.',
      },
    ],
  },
  {
    id: 'crm',
    icon: '🤝',
    label: 'Client Hub',
    color: 'teal',
    sections: [
      {
        title: 'What is Client Hub?',
        body: `Client Hub is your CRM — a structured view of every client relationship from first contact to won project and beyond. It tracks deal stages, notes, communication history, and key dates.`,
        steps: [
          'Navigate to Client Hub from the sidebar',
          'Add clients manually or they sync from the Outreach tab automatically',
          'Move clients through pipeline stages: Lead → Contacted → Proposal → Negotiation → Won / Lost',
          'Add notes after every interaction to maintain context',
          'Set follow-up reminders so no opportunity goes cold',
        ],
        tip: 'The most important habit in Client Hub: add a note immediately after every client interaction. The AI uses your notes history to generate better outreach suggestions and meeting prep briefs.',
      },
      {
        title: 'Pipeline Management',
        body: `The pipeline board gives you a visual overview of every active opportunity. You can see at a glance where revenue is stuck and what needs attention.`,
        steps: [
          'Use the Kanban board view for visual pipeline management',
          'Color-coded cards indicate deal health: green (on track), amber (follow-up needed), red (at risk)',
          'Click any card to open the full client detail with AI-generated insights',
          'Regularly review deals that have been in "Proposal" for more than 7 days',
          'Archive lost deals with a reason — the AI learns from this pattern',
        ],
        tip: 'A healthy pipeline has 3× the revenue you need in the proposal stage. If yours is thinner, increase Outreach activity. Use the Dashboard revenue view to track this ratio.',
      },
    ],
  },
  {
    id: 'income',
    icon: '📊',
    label: 'Income Dashboard',
    color: 'emerald',
    sections: [
      {
        title: 'Tracking Your Freelance Revenue',
        body: `The Income Dashboard gives you a complete financial view: invoices, payments received, outstanding amounts, monthly trends, and projected income based on your pipeline.`,
        steps: [
          'Review the monthly revenue summary at the top',
          'Check outstanding invoices — follow up on any past-due amounts',
          'Track income against your personal revenue goal',
          'Use the trend chart to identify seasonality in your earnings',
        ],
        tip: 'Set a monthly revenue target in your profile. The Income Dashboard tracks your progress toward it in real time, making it easy to know when to push harder on sales versus when you can focus on delivery.',
      },
      {
        title: 'Connections & Payment Methods',
        body: `Connect your payment accounts (Razorpay, Stripe, bank transfer) so the platform can reconcile invoices automatically and give you accurate revenue data.`,
        steps: [
          'Go to Finance & Account → Connections from the sidebar',
          'Connect your preferred payment gateway',
          'Enable automatic invoice generation from won Client Hub deals',
          'Configure tax/GST settings if applicable',
        ],
        tip: 'Enable automatic reconciliation. When a payment hits your connected gateway, the invoice is automatically marked paid and your revenue dashboard updates instantly.',
      },
    ],
  },
  {
    id: 'account',
    icon: '⚙️',
    label: 'Account & Billing',
    color: 'gray',
    sections: [
      {
        title: 'Account Settings',
        body: `Manage your password, security settings, and connected services. Email users can change their password at any time. Google OAuth users manage security through their Google account.`,
        steps: [
          'Go to the gear icon (⚙) in the sidebar footer, or navigate to Settings',
          'Email users: enter your current password and choose a new one',
          'Google users: click the link to Google Account Security for password management',
          'Forgot your password? Use the "Forgot password?" link on the login screen',
        ],
        tip: 'Use a strong, unique password for your AI WorkBuddy account — it stores sensitive client data and communication. Enable 2FA on your Google account if you use Google Sign-In.',
      },
      {
        title: 'Subscription & Billing',
        body: `Manage your plan, billing cycle, and payment information. Upgrading your plan unlocks more AI agent runs, priority support, and advanced features.`,
        steps: [
          'Go to Finance & Account → Subscription & Billing',
          'Review your current plan limits and usage',
          'Upgrade anytime — new features activate immediately',
          'Annual billing saves approximately 20% compared to monthly',
          'Contact support via My Tickets for billing issues',
        ],
        tip: 'Trial users: your 7-day full-access trial starts from the day you sign up. Upgrade before the trial ends to avoid interruption to your active client workflows.',
      },
      {
        title: 'Getting Help & Support',
        body: `Use the Support Tickets system to report issues, request features, or get help with any part of the platform. The support team also reviews AI quality feedback.`,
        steps: [
          'Navigate to My Tickets from the sidebar',
          'Create a new ticket with a clear title and detailed description',
          'Attach screenshots where helpful',
          'Track your ticket status in real time',
          'For urgent issues, mark the ticket as "Critical"',
        ],
        tip: 'When reporting AI quality issues, include the specific input you provided and the output you received. This helps the team improve the agent for your use case.',
      },
    ],
  },
]

const COLOR: Record<string, { badge: string; ring: string; circle: string; active: string }> = {
  indigo:  { badge: 'bg-indigo-100 text-indigo-700',  ring: 'ring-indigo-500',  circle: 'bg-indigo-600',  active: 'bg-indigo-50 text-indigo-700 border-indigo-200'  },
  green:   { badge: 'bg-green-100 text-green-700',    ring: 'ring-green-500',   circle: 'bg-green-600',   active: 'bg-green-50 text-green-700 border-green-200'    },
  blue:    { badge: 'bg-blue-100 text-blue-700',      ring: 'ring-blue-500',    circle: 'bg-blue-600',    active: 'bg-blue-50 text-blue-700 border-blue-200'       },
  amber:   { badge: 'bg-amber-100 text-amber-700',    ring: 'ring-amber-500',   circle: 'bg-amber-500',   active: 'bg-amber-50 text-amber-700 border-amber-200'    },
  teal:    { badge: 'bg-teal-100 text-teal-700',      ring: 'ring-teal-500',    circle: 'bg-teal-600',    active: 'bg-teal-50 text-teal-700 border-teal-200'       },
  emerald: { badge: 'bg-emerald-100 text-emerald-700',ring: 'ring-emerald-500', circle: 'bg-emerald-600', active: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
  gray:    { badge: 'bg-gray-100 text-gray-600',      ring: 'ring-gray-400',    circle: 'bg-gray-600',    active: 'bg-gray-50 text-gray-700 border-gray-200'       },
}

export default function GuidePage() {
  const [activeModule, setActiveModule] = useState('start')
  const module = MODULES.find(m => m.id === activeModule)!
  const c = COLOR[module.color]

  return (
    <div className="flex h-full gap-0">
      {/* ── Left nav ── */}
      <aside className="w-64 shrink-0 border-r border-gray-100 pr-0 py-2 overflow-y-auto">
        <div className="px-4 pb-3 mb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">📚</span>
            <div>
              <div className="text-sm font-bold text-gray-900">Platform Guide</div>
              <div className="text-xs text-gray-400">Your complete roadmap</div>
            </div>
          </div>
        </div>

        <div className="px-2 space-y-0.5">
          {MODULES.map((mod, i) => {
            const mc = COLOR[mod.color]
            const isActive = mod.id === activeModule
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all border ${
                  isActive ? `${mc.active} border font-semibold` : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }`}
              >
                <span className="text-base w-5 text-center shrink-0">{mod.icon}</span>
                <span className="flex-1 truncate">{mod.label}</span>
                <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${
                  isActive ? `${mc.circle} text-white` : 'bg-gray-100 text-gray-500'
                }`}>{i + 1}</span>
              </button>
            )
          })}
        </div>

        {/* Learning path hint */}
        <div className="mx-3 mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
          <p className="text-xs text-indigo-700 font-semibold mb-1">Recommended Order</p>
          <p className="text-xs text-indigo-600">Follow modules 1→7 for the fastest path to your first paid client.</p>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        {/* Module header */}
        <div className="mb-8">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-4 ${c.badge}`}>
            <span>{module.icon}</span>
            {module.label}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{module.label}</h1>
          <div className="h-1 w-16 rounded-full" style={{ background: `var(--tw-gradient-from, #6366f1)` }}>
            <div className={`h-1 w-16 rounded-full ${c.circle}`}/>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10 max-w-3xl">
          {module.sections.map((section, si) => (
            <div key={si} className="group">
              {/* Section title with numbering */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 ${c.circle}`}>
                  {si + 1}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              </div>

              {/* Overview */}
              <p className="text-gray-600 leading-relaxed mb-5 pl-11 text-sm">{section.body}</p>

              {/* Steps */}
              <div className="pl-11 space-y-2 mb-5">
                {section.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 ${c.circle} opacity-80`}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {/* Pro tip */}
              <div className="ml-11 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <span className="text-lg shrink-0">💡</span>
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-0.5">Pro Tip</p>
                  <p className="text-sm text-amber-700 leading-relaxed">{section.tip}</p>
                </div>
              </div>

              {si < module.sections.length - 1 && (
                <div className="mt-8 border-b border-gray-100"/>
              )}
            </div>
          ))}
        </div>

        {/* Module navigation footer */}
        <div className="max-w-3xl mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
          {(() => {
            const idx = MODULES.findIndex(m => m.id === activeModule)
            const prev = idx > 0 ? MODULES[idx - 1] : null
            const next = idx < MODULES.length - 1 ? MODULES[idx + 1] : null
            return (
              <>
                {prev ? (
                  <button onClick={() => setActiveModule(prev.id)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group">
                    <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span>
                    <div className="text-left">
                      <div className="text-xs text-gray-400">Previous</div>
                      <div className="font-medium">{prev.label}</div>
                    </div>
                  </button>
                ) : <div/>}

                {next ? (
                  <button onClick={() => setActiveModule(next.id)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Next</div>
                      <div className="font-medium">{next.label}</div>
                    </div>
                    <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
                  </button>
                ) : (
                  <div className="text-sm text-gray-400 italic">You have completed all modules 🎉</div>
                )}
              </>
            )
          })()}
        </div>
      </main>
    </div>
  )
}
