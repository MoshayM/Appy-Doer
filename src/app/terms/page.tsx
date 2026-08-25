import Link from 'next/link'

export const metadata = {
  title: 'Terms & Conditions — AppyDoer',
  description: 'Terms and Conditions for AppyDoer (AI WorkBuddy). Read before using our platform.',
}

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Service' },
  { id: 'eligibility', title: '3. Eligibility' },
  { id: 'account-trial', title: '4. Account Registration & Trial' },
  { id: 'billing', title: '5. Subscription Plans & Billing' },
  { id: 'ai-disclaimer', title: '6. AI-Generated Content Disclaimer' },
  { id: 'gmail', title: '7. Gmail Integration' },
  { id: 'acceptable-use', title: '8. Acceptable Use' },
  { id: 'ip', title: '9. Intellectual Property' },
  { id: 'privacy', title: '10. Privacy' },
  { id: 'liability', title: '11. Limitation of Liability' },
  { id: 'termination', title: '12. Termination' },
  { id: 'governing-law', title: '13. Governing Law' },
  { id: 'changes', title: '14. Changes to Terms' },
  { id: 'contact', title: '15. Contact Us' },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="bg-slate-900 py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Terms &amp; Conditions</h1>
          <p className="text-slate-400 text-sm">
            Effective Date: August 1, 2026 &nbsp;·&nbsp; Last Updated: August 1, 2026
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Also see our{' '}
            <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-12">

          {/* Table of Contents (sticky on desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-8">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Contents</p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-slate-600 hover:text-indigo-600 py-1 transition-colors leading-snug"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-indigo-600">

            <section id="acceptance" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                By accessing or using the AppyDoer platform (also known as AI WorkBuddy) at <strong>appydoer.com</strong> or any related mobile or web application (collectively, the &ldquo;Service&rdquo;), you agree to be legally bound by these Terms &amp; Conditions (&ldquo;Terms&rdquo;) and our <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>, which is incorporated herein by reference.
              </p>
              <p className="text-slate-600 leading-relaxed mb-3">
                These Terms constitute a binding legal agreement between you (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and AppyDoer (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
              </p>
              <p className="text-slate-600 leading-relaxed">
                If you do not agree to these Terms, you must not use the Service.
              </p>
            </section>

            <section id="description" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">2. Description of Service</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                AppyDoer is an <strong>AI Workforce Operating System</strong> designed for freelancers, consultants, and working professionals. The Service provides:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>AI-powered tools for skill assessment, opportunity discovery, offer building, and portfolio generation.</li>
                <li>Client acquisition features including a Client Intelligence agent, CRM, and outreach tools.</li>
                <li>Gmail integration for sending, tracking, and replying to client emails with AI-suggested responses.</li>
                <li>Work delivery support via an AI Work Support agent.</li>
                <li>Relationship management and automated follow-up scheduling.</li>
                <li>Income tracking, recurring revenue management, and business growth insights.</li>
                <li>A Smart Upgrade Engine that provides personalised subscription offer recommendations.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                The Service is India-first in design and pricing, denominated in Indian Rupees (INR), though it is accessible to professionals worldwide.
              </p>
            </section>

            <section id="eligibility" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">3. Eligibility</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                To use AppyDoer, you must:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>Be at least <strong>18 years of age</strong>.</li>
                <li>Have the legal capacity to enter into a binding agreement.</li>
                <li>Not be prohibited from using the Service under applicable law.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-3">
                The Service is primarily designed for users in India, though it is open to professionals worldwide. Users outside India acknowledge that subscription prices are displayed in INR and that payment processing may be subject to currency conversion fees by their bank.
              </p>
              <p className="text-slate-600 leading-relaxed">
                By creating an account, you represent and warrant that you meet all eligibility requirements.
              </p>
            </section>

            <section id="account-trial" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">4. Account Registration &amp; Trial</h2>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Account Registration</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                You may register using a valid email address and password, or via Google OAuth. You are responsible for maintaining the confidentiality of your credentials and for all activity that occurs under your account. You agree to provide accurate, complete, and current information and to update it as necessary.
              </p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">7-Day Free Trial</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                New users receive a <strong>7-day free trial</strong> with full access to all features, including all AI agents. No credit card is required to start the trial.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>Each email address is eligible for one free trial only. Creating multiple accounts to circumvent this limit is a violation of these Terms and may result in account suspension.</li>
                <li>At the end of the 7-day trial, if you do not subscribe to a paid plan, your account will transition to a restricted <strong>Free (locked) state</strong>: read-only access to your prior data and zero new AI-generated outputs per day.</li>
                <li>Your data is retained for 90 days after trial expiry. After 90 days without subscription, your account and data may be permanently deleted.</li>
              </ul>
            </section>

            <section id="billing" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">5. Subscription Plans &amp; Billing</h2>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Plan Options</h3>
              <div className="space-y-3 mb-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-800">Pro — ₹999/month</p>
                  <p className="text-slate-600 text-sm mt-1">Monthly subscription. Billed every 30 days. Full access to core AI agents and features.</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <p className="font-semibold text-slate-800">Premium — ₹19,999/year <span className="text-indigo-600 text-sm font-medium">(≈ ₹1,667/month)</span></p>
                  <p className="text-slate-600 text-sm mt-1">Annual subscription only. Full access to all features plus priority AI processing, advanced analytics, and all future Premium features. Best value.</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed mb-4 text-sm italic">Prices are subject to change. We will provide at least 30 days&apos; notice before changing subscription prices for existing subscribers.</p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Billing &amp; Auto-Renewal</h3>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>Subscriptions auto-renew at the end of each billing period unless cancelled before the renewal date.</li>
                <li>Payment is processed via Razorpay (primary) or Cashfree (fallback). By subscribing, you authorise us to charge your chosen payment method.</li>
                <li>All charges are in INR and are non-refundable except where required by applicable law.</li>
                <li>We reserve the right to suspend or downgrade your account if payment fails after retry attempts.</li>
              </ul>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Cancellation</h3>
              <p className="text-slate-600 leading-relaxed mb-3">
                You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period — you retain access until then. We do not provide partial refunds for unused time.
              </p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Personalised Offers</h3>
              <p className="text-slate-600 leading-relaxed">
                Our Smart Upgrade Engine may present you with personalised, time-limited discount offers to upgrade your plan. These offers are generated by AI based on your usage data. Offer terms (discount amount and expiry) are clearly stated at the time of the offer. Offers are non-transferable and cannot be combined.
              </p>
            </section>

            <section id="ai-disclaimer" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">6. AI-Generated Content Disclaimer</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                AppyDoer uses large language models (LLMs) to generate content including, but not limited to: skill assessments, opportunity recommendations, offer copy, profile summaries, outreach emails, proposal drafts, reply suggestions, and income growth plans.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="font-semibold text-amber-800 mb-2">Important — Please Read</p>
                <ul className="list-disc pl-5 space-y-2 text-amber-700 text-sm">
                  <li>AI-generated outputs are <strong>suggestions and drafts</strong>, not professional advice. They should be reviewed and edited by you before use.</li>
                  <li>AppyDoer content does not constitute financial, legal, tax, investment, career, or business advice. Consult a qualified professional for such matters.</li>
                  <li>You are solely responsible for how you use AI-generated content, including any communications you send to clients or third parties.</li>
                  <li>AI models can produce inaccurate, outdated, or inappropriate content. Always verify factual claims before relying on them.</li>
                  <li>AppyDoer is not liable for any outcomes resulting from your use of AI-generated content.</li>
                </ul>
              </div>
              <p className="text-slate-600 leading-relaxed">
                You retain full ownership of the content you generate using our AI tools. See Section 9 (Intellectual Property) for details.
              </p>
            </section>

            <section id="gmail" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">7. Gmail Integration</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                AppyDoer offers an optional Gmail integration to enable outreach email tracking and AI reply suggestions. By connecting your Gmail account, you agree to the following:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>You grant AppyDoer limited OAuth access to your Gmail account for the purpose of reading, sending, and labelling emails related to your outreach activities on the platform.</li>
                <li>You can revoke this access at any time from your account settings or directly from your Google Account at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">myaccount.google.com/permissions</a>.</li>
                <li>We access only the minimum data necessary to provide the Gmail Outreach feature. We do not store email body text beyond your active session.</li>
                <li>You are responsible for ensuring your use of the Gmail integration complies with Google&apos;s Terms of Service and any other applicable policies.</li>
                <li>You must not use the Gmail integration to send spam, unsolicited bulk email, or any communications that violate applicable laws or our Acceptable Use policy (Section 8).</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                For full details of how we handle Gmail data, see our <Link href="/privacy#gmail-data" className="text-indigo-600 hover:underline">Privacy Policy — Section 4: Gmail Data</Link>.
              </p>
            </section>

            <section id="acceptable-use" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">8. Acceptable Use</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You agree to use AppyDoer only for lawful purposes and in a manner consistent with these Terms. You must not:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>Send spam, unsolicited commercial emails, or engage in any form of mass unsolicited outreach using our platform or Gmail integration.</li>
                <li>Harass, threaten, defame, or abuse any individual or organisation.</li>
                <li>Engage in or facilitate any illegal activity, including fraud, money laundering, or intellectual property infringement.</li>
                <li>Attempt to reverse-engineer, decompile, or extract the source code of the Service.</li>
                <li>Use automated bots, scrapers, or crawlers to access the Service without our prior written consent.</li>
                <li>Upload, transmit, or generate content that is defamatory, obscene, hateful, or otherwise objectionable.</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
                <li>Circumvent, disable, or interfere with security-related features of the Service.</li>
                <li>Use the Service in a way that could harm, overburden, or impair our infrastructure.</li>
                <li>Share your account credentials with others or allow third parties to access your account.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate this Acceptable Use policy, with or without prior notice.
              </p>
            </section>

            <section id="ip" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">9. Intellectual Property</h2>

              <h3 className="text-base font-semibold text-slate-800 mb-2">AppyDoer&apos;s Property</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                The AppyDoer platform, including its software, design, trademarks, logos, AI agent architecture, and all underlying technology, is owned by AppyDoer and protected by applicable intellectual property laws. You may not copy, reproduce, distribute, or create derivative works from any part of the platform without our express written permission.
              </p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Your Content &amp; AI Outputs</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                You retain full ownership of:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>All data you input into the Service (profile information, client data, skills, income records, etc.).</li>
                <li>All AI-generated content produced for you by the Service (proposals, outreach emails, skill assessments, profile summaries, offer copy, etc.).</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mb-3">
                By using the Service, you grant AppyDoer a limited, non-exclusive, royalty-free licence to process, store, and display your content solely for the purpose of providing the Service to you.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We do not claim ownership of your data or AI-generated outputs. We do not use your personal data or AI outputs to train our AI models.
              </p>
            </section>

            <section id="privacy" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">10. Privacy</h2>
              <p className="text-slate-600 leading-relaxed">
                Your use of the Service is also governed by our <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices regarding the collection, use, and disclosure of your personal information, including specific provisions relating to Gmail data.
              </p>
            </section>

            <section id="liability" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">11. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                To the fullest extent permitted by applicable law:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>AppyDoer provides the Service on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.</li>
                <li>AppyDoer does not warrant that the Service will be uninterrupted, error-free, or free of harmful components.</li>
                <li>AppyDoer shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, revenue, data, or business opportunities, arising from your use of or inability to use the Service.</li>
                <li>AppyDoer&apos;s total cumulative liability to you for any claims arising out of or related to these Terms or the Service shall not exceed the greater of (a) the amount you paid to AppyDoer in the 12 months preceding the claim, or (b) ₹5,000 INR.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                Some jurisdictions do not allow the exclusion of certain warranties or limitations of liability, so some of the above may not apply to you.
              </p>
            </section>

            <section id="termination" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">12. Termination</h2>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Termination by You</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                You may close your account at any time from your account settings or by contacting <a href="mailto:support@appydoer.com" className="text-indigo-600 hover:underline">support@appydoer.com</a>. Closing your account cancels any active subscription and initiates the data deletion process described in our Privacy Policy.
              </p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Termination by AppyDoer</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                We reserve the right to suspend or terminate your account, with or without notice, if:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>You violate these Terms, including the Acceptable Use policy.</li>
                <li>We are required to do so by law or regulatory authority.</li>
                <li>Continued access poses a security or legal risk to AppyDoer or other users.</li>
                <li>Your payment method fails and is not resolved within a reasonable cure period.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                Upon termination, your right to use the Service ceases immediately. Sections 6, 9, 11, 13, and any other provisions that by their nature should survive, will survive termination.
              </p>
            </section>

            <section id="governing-law" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">13. Governing Law</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                These Terms are governed by and construed in accordance with the laws of the <strong>Republic of India</strong>, without regard to its conflict of law provisions.
              </p>
              <p className="text-slate-600 leading-relaxed mb-3">
                Any dispute arising out of or in connection with these Terms or the Service shall be subject to the exclusive jurisdiction of the competent courts located in <strong>Kolkata, West Bengal, India</strong>.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Before initiating legal proceedings, the parties agree to attempt to resolve any dispute informally by contacting <a href="mailto:support@appydoer.com" className="text-indigo-600 hover:underline">support@appydoer.com</a> and allowing 30 days for good-faith resolution.
              </p>
            </section>

            <section id="changes" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">14. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                We may update these Terms from time to time. When we make material changes, we will:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>Update the &ldquo;Last Updated&rdquo; date at the top of this page.</li>
                <li>Send an email notification to your registered email address at least 14 days before the changes take effect.</li>
                <li>Display a prominent notice in your dashboard.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                Your continued use of the Service after the effective date of the updated Terms constitutes your acceptance of the changes. If you do not agree with the updated Terms, you must stop using the Service before the effective date.
              </p>
            </section>

            <section id="contact" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">15. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you have any questions about these Terms, or if you need to reach us for any other reason, please contact us:
              </p>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <p className="font-semibold text-slate-900 mb-1">AppyDoer (AI WorkBuddy)</p>
                <p className="text-slate-600 text-sm mb-1">
                  Email:{' '}
                  <a href="mailto:support@appydoer.com" className="text-indigo-600 hover:underline">support@appydoer.com</a>
                </p>
                <p className="text-slate-600 text-sm">India-first platform · Jurisdiction: Kolkata, West Bengal, India</p>
              </div>
            </section>

            {/* Footer navigation */}
            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
              <Link href="/privacy" className="text-indigo-600 hover:underline text-sm">
                View Privacy Policy →
              </Link>
            </div>

          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 px-6 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2026 AppyDoer. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="font-medium text-slate-700">Terms &amp; Conditions</Link>
            <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
            <Link href="/login" className="hover:text-slate-700 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
