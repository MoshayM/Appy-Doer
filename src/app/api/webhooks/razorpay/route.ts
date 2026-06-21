import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/services/payment'

export async function POST(req: NextRequest) {
  const payload   = await req.text()
  const signature = req.headers.get('x-razorpay-signature') ?? ''

  try {
    await PaymentService.handleWebhook('RAZORPAY', payload, signature)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/razorpay]', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 })
  }
}
