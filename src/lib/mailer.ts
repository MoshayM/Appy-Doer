import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM   = process.env.RESEND_FROM_EMAIL ?? 'AppyDoer <noreply@workbuddy.ai>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export async function sendEmail({
  to, subject, html,
}: { to: string; subject: string; html: string }) {
  if (!resend) {
    // Dev fallback — log to console when no API key is set
    console.log('\n📧 [MAIL] (no RESEND_API_KEY — logging only)')
    console.log(`   To:      ${to}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Body:    ${html.replace(/<[^>]+>/g, '').trim().slice(0, 200)}\n`)
    return { success: true }
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html })
  if (error) throw new Error(`Resend error: ${error.message}`)
  return { success: true }
}

export function buildResetEmail(resetUrl: string, email: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,sans-serif">
<div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #e5e7eb">
  <div style="text-align:center;margin-bottom:28px">
    <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#4F46E5;border-radius:12px;color:#fff;font-weight:700;font-size:20px">W</div>
    <div style="margin-top:8px;font-weight:700;color:#111827;font-size:18px">AppyDoer</div>
  </div>
  <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700">Reset your password</h2>
  <p style="margin:0 0 20px;color:#6B7280;font-size:14px;line-height:1.6">
    We received a request to reset the password for <strong>${email}</strong>.
    Click the button below — this link expires in <strong>1 hour</strong>.
  </p>
  <a href="${resetUrl}"
     style="display:block;text-align:center;background:#4F46E5;color:#fff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;margin-bottom:20px">
    Reset My Password
  </a>
  <p style="margin:0 0 4px;color:#9CA3AF;font-size:12px">
    If you didn't request this, ignore this email — your password won't change.
  </p>
  <p style="margin:0;color:#9CA3AF;font-size:12px;word-break:break-all">
    Or copy this link: ${resetUrl}
  </p>
</div>
</body>
</html>`
}

export { APP_URL }
