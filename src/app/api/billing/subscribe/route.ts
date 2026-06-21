import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { PaymentService } from '@/lib/services/payment'
import { BillingInterval, Plan } from '@prisma/client'
import { getPricingZone } from '@/lib/geo-pricing'

export const POST = withAuth(async (req: NextRequest, user) => {
  try {
    // Accept both JSON and form submissions
    let plan: Plan, interval: BillingInterval, zone: string, offerId: string | undefined
    const ct = req.headers.get('content-type') ?? ''

    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const fd = await req.formData()
      plan     = (fd.get('plan')     as Plan)            ?? 'PRO'
      interval = (fd.get('interval') as BillingInterval) ?? 'MONTH'
      zone     = (fd.get('zone')     as string)           ?? 'INR'
      offerId  = fd.get('offerId') as string | undefined
    } else {
      const body = await req.json()
      plan     = body.plan     ?? 'PRO'
      interval = body.interval ?? 'MONTH'
      zone     = body.zone     ?? getPricingZone(req.headers.get('x-country') ?? 'IN')
      offerId  = body.offerId
    }

    // Route to correct gateway based on pricing zone
    const gateway = zone === 'USD' ? 'STRIPE' : 'RAZORPAY'

    const result = await PaymentService.subscribe({
      userId: user.id,
      email: user.email,
      plan,
      interval,
      gateway,
      offerId,
    })

    // Handle redirect for hosted checkout pages
    if (result && typeof result === 'object' && 'checkoutUrl' in result && result.checkoutUrl) {
      return NextResponse.redirect(result.checkoutUrl as string)
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Subscription failed'
    return NextResponse.json({ error: { code: 'PAYMENT_ERROR', message } }, { status: 500 })
  }
})
