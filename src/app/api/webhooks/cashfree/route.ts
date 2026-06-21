import { NextRequest, NextResponse } from 'next/server'
import { PaymentService } from '@/lib/services/payment'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-webhook-signature') ?? ''
  await PaymentService.handleWebhook('CASHFREE', rawBody, signature)
  return NextResponse.json({ ok: true })
}
