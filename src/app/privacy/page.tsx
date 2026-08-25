import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — AppyDoer',
  description: 'Privacy Policy for AppyDoer (AI WorkBuddy). Learn how we collect, use, and protect your data.',
}

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information-we-collect', title: '2. Information We Collect' },
  { id: 'how-we-use', title: '3. How We Use Your Information' },
  { id: 'gmail-data', title: '4. Gmail Data' },
  { id: 'data-sharing', title: '5. Data Sharing & Third Parties' },
  { id: 'data-retention', title: '6. Data Retention' },
  { id: 'your-rights', title: '7. Your Rights' },
  { id: 'security', title: '8. Security' },
  { id: 'cookies', title: '9. Cookies' },
  { id: 'childrens-privacy', title: "10. Children's Privacy" },
  { id: 'changes', title: '11. Changes to This Policy' },
  { id: 'contact', title: '12. Contact Us' },
]

export default function PrivacyPage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">
            Effective Date: August 1, 2026 &nbsp;·&nbsp; Last Updated: August 1, 2026
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Also see our{' '}
            <Link href="/terms" className="text-cyan-400 hover:underline">Terms &amp; Conditions</Link>
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

            <section id="introduction" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">1. Introduction</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                Welcome to <strong>AppyDoer</strong> (also known as AI WorkBuddy), operated by AppyDoer (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). AppyDoer is an AI Workforce Operating System designed to help working professionals in India and beyond discover opportunities, acquire clients, deliver work, and build recurring income with an AI-powered virtual team.
              </p>
              <p className="text-slate-600 leading-relaxed mb-3">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, website, and services (collectively, the &ldquo;Service&rdquo;). Please read this policy carefully. By using the Service, you consent to the practices described here.
              </p>
              <p className="text-slate-600 leading-relaxed">
                If you do not agree with the terms of this Privacy Policy, please do not access the Service.
              </p>
            </section>

            <section id="information-we-collect" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">2. Information We Collect</h2>
              <p className="text-slate-600 leading-relaxed mb-4">We collect information in the following categories:</p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Account Information</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                When you register, we collect your name, email address, and password (stored as a secure hash). If you sign in via Google OAuth, we collect your Google account email and display name.
              </p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Profile &amp; Usage Data</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                We collect information you provide while using the Service, including skills, professional background, clients, opportunities, offers, income records, CRM data, portfolio entries, and any content you generate using our AI agents. We also log feature usage, session metadata, and engagement signals (page views, feature interactions) to improve the Service and power personalized recommendations.
              </p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Gmail Access (Optional)</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you choose to connect your Gmail account, we access your Gmail data under Google&apos;s OAuth scopes — specifically <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">gmail.modify</code> and related read scopes — solely to provide the Gmail Outreach feature. See Section 4 for full details.
              </p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Payment Information</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                When you subscribe to a paid plan (Pro or Premium), payment is processed by our payment partners (Razorpay or Cashfree). We do not store your card number, CVV, or full banking credentials on our servers. We receive and store only transaction identifiers, subscription status, and billing metadata.
              </p>

              <h3 className="text-base font-semibold text-slate-800 mb-2">Device &amp; Technical Data</h3>
              <p className="text-slate-600 leading-relaxed">
                We automatically collect your IP address, browser type, operating system, referring URLs, and device identifiers for security, analytics, and service improvement purposes.
              </p>
            </section>

            <section id="how-we-use" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">3. How We Use Your Information</h2>
              <p className="text-slate-600 leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>Provide, operate, and maintain the Service, including running our AI agents on your behalf.</li>
                <li>Personalise your experience — surfacing relevant opportunities, tailoring AI outputs, and generating upgrade offers through our Smart Upgrade Engine based on your usage and engagement data.</li>
                <li>Process payments and manage your subscription (trial, Pro, or Premium).</li>
                <li>Send transactional communications: account verification, trial countdown reminders, subscription receipts, and important service notices.</li>
                <li>Provide customer support and respond to enquiries.</li>
                <li>Detect, prevent, and investigate fraud, abuse, or security incidents.</li>
                <li>Analyse aggregated, anonymised usage trends to improve the platform.</li>
                <li>Comply with applicable laws and regulations.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                We do <strong>not</strong> sell your personal information to third parties for advertising purposes.
              </p>
            </section>

            <section id="gmail-data" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">4. Gmail Data</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                The Gmail Outreach feature is entirely optional. You can use AppyDoer without ever connecting your Gmail account. If you do choose to connect Gmail:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>We request only the OAuth scopes necessary to display your outreach email threads, send emails on your behalf, and generate AI-suggested replies.</li>
                <li>Your email messages are retrieved from Gmail and displayed to you within AppyDoer. We <strong>do not store the body text of your emails</strong> beyond your active browser session — emails are fetched on demand and never persisted in our database.</li>
                <li>Email metadata (thread IDs, message IDs, sender/recipient, subject line, timestamp, and read/replied status) is stored to enable thread tracking and CRM stage updates. This is the minimum data required for the feature to function.</li>
                <li>AI reply suggestions are generated by sending <em>only</em> the email thread context (subject and message text) to our AI provider. No personally identifying information (PII) beyond what you chose to write in the email is included in these prompts.</li>
                <li>We <strong>never share your Gmail data with third parties</strong>, other than the AI provider API call described above (which is a transient processing step, not storage or transfer).</li>
                <li>You can disconnect your Gmail account at any time from your profile settings. Upon disconnection, all stored email metadata is deleted from our servers within 30 days.</li>
                <li>Our use of Gmail data is compliant with Google&apos;s API Services User Data Policy, including the Limited Use requirements.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                AppyDoer&apos;s use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
            </section>

            <section id="data-sharing" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">5. Data Sharing &amp; Third Parties</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We share your data only in the limited circumstances described below. We do not sell or rent your personal data.
              </p>
              <div className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-800 mb-1">Payment Processors — Razorpay &amp; Cashfree</p>
                  <p className="text-slate-600 text-sm">Used to process subscription payments. These providers receive your billing name, email, and payment details under their own privacy policies. We receive only transaction confirmations.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-800 mb-1">AI Providers — Anthropic, OpenAI (fallback), Groq</p>
                  <p className="text-slate-600 text-sm">Your prompts and relevant context are sent to AI providers to generate agent outputs. We do not include your name, email, or account ID in these API calls. AI providers process this data under their own terms of service and do not use your prompts to train their models (as per their enterprise/API agreements).</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-800 mb-1">Email Service — Resend</p>
                  <p className="text-slate-600 text-sm">Used to deliver transactional emails (account verification, trial reminders, subscription receipts). Your email address and the content of these system emails are shared with Resend for delivery purposes.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-800 mb-1">Infrastructure &amp; Hosting</p>
                  <p className="text-slate-600 text-sm">We use Vercel for hosting and deployment, and a managed PostgreSQL database provider. These services process data on our behalf under data processing agreements.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="font-semibold text-slate-800 mb-1">Legal Obligations</p>
                  <p className="text-slate-600 text-sm">We may disclose your information if required by law, court order, or governmental authority, or to protect the rights, property, or safety of AppyDoer, our users, or the public.</p>
                </div>
              </div>
            </section>

            <section id="data-retention" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">6. Data Retention</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                We retain your account data for as long as your account is active. If you close your account, we delete or anonymise your personal data within 90 days, except where we are required to retain it for legal, tax, or fraud-prevention purposes.
              </p>
              <p className="text-slate-600 leading-relaxed mb-3">
                Email metadata collected via Gmail integration is deleted within 30 days of you disconnecting your Gmail account.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Aggregated, anonymised analytics data (with no personally identifying attributes) may be retained indefinitely for product research.
              </p>
            </section>

            <section id="your-rights" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">7. Your Rights</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Depending on your location (including under India&apos;s Digital Personal Data Protection Act, 2023, and other applicable laws), you may have the following rights:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete personal data.</li>
                <li><strong>Deletion:</strong> Request that we delete your personal data, subject to legal retention obligations.</li>
                <li><strong>Data Portability:</strong> Request your data in a structured, machine-readable format.</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for Gmail access at any time via your profile settings.</li>
                <li><strong>Objection:</strong> Object to certain processing activities, such as marketing communications.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                To exercise these rights, email us at{' '}
                <a href="mailto:support@appydoer.com" className="text-indigo-600 hover:underline">support@appydoer.com</a>.
                We will respond within 30 days.
              </p>
            </section>

            <section id="security" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">8. Security</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                We implement industry-standard security measures to protect your data, including:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>HTTPS/TLS encryption for all data in transit.</li>
                <li>Passwords stored as bcrypt hashes — we never store plaintext passwords.</li>
                <li>JWT-based session tokens with expiry and rotation.</li>
                <li>Role-based access controls preventing unauthorised data access.</li>
                <li>Regular security reviews of our codebase and dependencies.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. If you discover a security vulnerability, please report it responsibly to{' '}
                <a href="mailto:support@appydoer.com" className="text-indigo-600 hover:underline">support@appydoer.com</a>.
              </p>
            </section>

            <section id="cookies" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">9. Cookies</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                We use cookies and similar technologies for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li><strong>Authentication cookies:</strong> To keep you signed in across sessions.</li>
                <li><strong>Functional cookies:</strong> To remember your preferences and settings.</li>
                <li><strong>Analytics cookies:</strong> To understand how users interact with the platform (aggregated, not personal-level tracking).</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                We do not use third-party advertising or tracking cookies. You can manage cookies through your browser settings. Disabling authentication cookies will prevent you from staying signed in.
              </p>
            </section>

            <section id="childrens-privacy" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">10. Children&apos;s Privacy</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                AppyDoer is intended for users who are at least 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected data from a child under 13, please contact us immediately at{' '}
                <a href="mailto:support@appydoer.com" className="text-indigo-600 hover:underline">support@appydoer.com</a>{' '}
                and we will delete it promptly.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Users aged 13–17 should use the Service only with the consent and supervision of a parent or legal guardian.
              </p>
            </section>

            <section id="changes" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">11. Changes to This Policy</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600 mb-4">
                <li>Update the &ldquo;Last Updated&rdquo; date at the top of this page.</li>
                <li>Send a notification to your registered email address.</li>
                <li>Display a notice in the dashboard for at least 14 days.</li>
              </ul>
              <p className="text-slate-600 leading-relaxed">
                Your continued use of the Service after the effective date of the updated policy constitutes your acceptance of the changes.
              </p>
            </section>

            <section id="contact" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">12. Contact Us</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
              </p>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <p className="font-semibold text-slate-900 mb-1">AppyDoer (AI WorkBuddy)</p>
                <p className="text-slate-600 text-sm mb-1">
                  Email:{' '}
                  <a href="mailto:support@appydoer.com" className="text-indigo-600 hover:underline">support@appydoer.com</a>
                </p>
                <p className="text-slate-600 text-sm">India-first platform serving professionals worldwide.</p>
              </div>
              <p className="text-slate-600 leading-relaxed mt-4">
                We aim to respond to all privacy-related enquiries within 30 days.
              </p>
            </section>

            {/* Footer navigation */}
            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back to Home
              </Link>
              <Link href="/terms" className="text-indigo-600 hover:underline text-sm">
                View Terms &amp; Conditions →
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
            <Link href="/privacy" className="font-medium text-slate-700">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms &amp; Conditions</Link>
            <Link href="/login" className="hover:text-slate-700 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
