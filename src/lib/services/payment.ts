import { PaymentGateway, Plan, BillingInterval } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { gstAmount, getISTDateKey } from '@/lib/utils'
import { PLAN_PRICES, TRIAL_DAYS } from '@/lib/constants'

// ─── Gateway adapter interface ────────────────────────────────────────────────

interface GatewayAdapter {
  createSubscription(params: {
    userId: string
    planId: string
    amountINR: number
    interval: BillingInterval
    customerEmail: string
  }): Promise<{ gatewaySubId: string; checkoutUrl?: string }>

  cancelSubscription(gatewaySubId: string): Promise<void>
  verifyWebhookSignature(payload: string, signature: string): boolean
  normalizeWebhookEvent(payload: unknown): SubscriptionEvent
}

export interface SubscriptionEvent {
  type: 'SUBSCRIPTION_ACTIVATED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'SUBSCRIPTION_CANCELED'
  gatewaySubId: string
  gatewayPaymentId?: string
  amountINR?: number
  gateway: PaymentGateway
  raw: unknown
}

// ─── Razorpay adapter ─────────────────────────────────────────────────────────

class RazorpayAdapter implements GatewayAdapter {
  private keyId     = process.env.RAZORPAY_KEY_ID     ?? ''
  private keySecret = process.env.RAZORPAY_KEY_SECRET  ?? ''

  async createSubscription(params: {
    userId: string; planId: string; amountINR: number; interval: BillingInterval; customerEmail: string
  }) {
    // Razorpay Subscriptions API
    const body = JSON.stringify({
      plan_id: params.planId,
      total_count: params.interval === 'YEAR' ? 1 : 12,
      quantity: 1,
      notify_info: { notify_email: params.customerEmail },
    })

    const resp = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64'),
      },
      body,
    })

    if (!resp.ok) throw new Error(`Razorpay error: ${resp.status}`)
    const data = await resp.json()
    return { gatewaySubId: data.id, checkoutUrl: data.short_url }
  }

  async cancelSubscription(gatewaySubId: string) {
    await fetch(`https://api.razorpay.com/v1/subscriptions/${gatewaySubId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64'),
      },
    })
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto')
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET ?? '')
      .update(payload)
      .digest('hex')
    return expected === signature
  }

  normalizeWebhookEvent(payload: unknown): SubscriptionEvent {
    const p = payload as Record<string, unknown>
    const entity = (p.payload as Record<string, unknown>)?.subscription as Record<string, unknown> | undefined
    const payment = (p.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined

    const typeMap: Record<string, SubscriptionEvent['type']> = {
      'subscription.activated': 'SUBSCRIPTION_ACTIVATED',
      'payment.captured':       'PAYMENT_SUCCESS',
      'payment.failed':         'PAYMENT_FAILED',
      'subscription.cancelled': 'SUBSCRIPTION_CANCELED',
    }

    return {
      type: typeMap[p.event as string] ?? 'PAYMENT_FAILED',
      gatewaySubId: (entity?.id as string) ?? '',
      gatewayPaymentId: payment?.id as string | undefined,
      amountINR: payment?.amount ? Number(payment.amount) / 100 : undefined,
      gateway: 'RAZORPAY',
      raw: payload,
    }
  }
}

// ─── Cashfree adapter (stub — same interface) ─────────────────────────────────

class CashfreeAdapter implements GatewayAdapter {
  async createSubscription(_params: {
    userId: string; planId: string; amountINR: number; interval: BillingInterval; customerEmail: string
  }): Promise<{ gatewaySubId: string; checkoutUrl?: string }> {
    // TODO: implement Cashfree subscription API
    throw new Error('Cashfree adapter not yet implemented')
  }

  async cancelSubscription(_gatewaySubId: string) {
    throw new Error('Cashfree adapter not yet implemented')
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    return false
  }

  normalizeWebhookEvent(_payload: unknown): SubscriptionEvent {
    throw new Error('Cashfree adapter not yet implemented')
  }
}

// ─── PaymentService ───────────────────────────────────────────────────────────

const adapters: Record<PaymentGateway, GatewayAdapter> = {
  RAZORPAY: new RazorpayAdapter(),
  CASHFREE: new CashfreeAdapter(),
  STRIPE:   new CashfreeAdapter(), // Phase 2
  PAYPAL:   new CashfreeAdapter(), // Phase 2
}

export const PaymentService = {
  async startTrial(userId: string) {
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

    await prisma.subscription.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        plan: 'TRIAL',
        status: 'TRIALING',
        interval: 'MONTH',
        priceINR: 0,
        gateway: 'RAZORPAY',
        trialStartedAt: new Date(),
        trialEndsAt,
      },
    })

    return trialEndsAt
  },

  async subscribe(params: {
    userId: string
    email: string
    plan: Plan
    interval: BillingInterval
    gateway: PaymentGateway
    offerId?: string
  }) {
    const { userId, email, plan, interval, gateway, offerId } = params

    let priceINR = plan === 'PRO' ? PLAN_PRICES.PRO.priceINR : PLAN_PRICES.PREMIUM.priceINR
    let listPriceINR = priceINR

    // Apply offer discount
    if (offerId) {
      const offer = await prisma.subscriptionOffer.findUnique({ where: { id: offerId } })
      if (offer && offer.userId === userId && !offer.accepted && offer.discountedINR < priceINR) {
        priceINR = offer.discountedINR
        await prisma.subscriptionOffer.update({ where: { id: offerId }, data: { accepted: true } })
      }
    }

    const adapter  = adapters[gateway]
    const planId   = `workbuddy_${plan.toLowerCase()}_${interval.toLowerCase()}`
    const { gatewaySubId, checkoutUrl } = await adapter.createSubscription({
      userId, planId, amountINR: priceINR, interval, customerEmail: email,
    })

    await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan, status: 'ACTIVE', interval, priceINR, listPriceINR, appliedOfferId: offerId,
        gateway, gatewaySubId,
      },
      create: {
        userId, plan, status: 'ACTIVE', interval, priceINR, listPriceINR, appliedOfferId: offerId,
        gateway, gatewaySubId,
      },
    })

    await prisma.user.update({ where: { id: userId }, data: { plan } })

    return { checkoutUrl, priceINR, gstINR: gstAmount(priceINR) }
  },

  async cancel(userId: string) {
    const sub = await prisma.subscription.findUnique({ where: { userId } })
    if (!sub?.gatewaySubId) return

    const adapter = adapters[sub.gateway]
    await adapter.cancelSubscription(sub.gatewaySubId)

    await prisma.subscription.update({
      where: { userId },
      data: { status: 'CANCELED' },
    })
  },

  async handleWebhook(gateway: PaymentGateway, payload: string, signature: string) {
    const adapter = adapters[gateway]
    if (!adapter.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature')
    }

    const event = adapter.normalizeWebhookEvent(JSON.parse(payload))
    const sub = await prisma.subscription.findFirst({ where: { gatewaySubId: event.gatewaySubId } })
    if (!sub) return

    if (event.type === 'PAYMENT_SUCCESS' && event.amountINR) {
      await prisma.payment.create({
        data: {
          subscriptionId: sub.id,
          gateway,
          gatewayPaymentId: event.gatewayPaymentId,
          amountINR: event.amountINR,
          gstAmountINR: gstAmount(event.amountINR),
          status: 'SUCCESS',
        },
      })
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'ACTIVE' } })
    }

    if (event.type === 'PAYMENT_FAILED') {
      const graceEndsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3-day grace
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'GRACE', graceEndsAt } })
    }

    if (event.type === 'SUBSCRIPTION_CANCELED') {
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELED' } })
      await prisma.user.update({ where: { id: sub.userId }, data: { plan: 'FREE' } })
    }
  },

  async expireTrials() {
    // Called by the cron job — auto-downgrades expired trials
    const expired = await prisma.subscription.findMany({
      where: { status: 'TRIALING', trialEndsAt: { lt: new Date() } },
    })

    for (const sub of expired) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'EXPIRED' } })
      await prisma.user.update({ where: { id: sub.userId }, data: { plan: 'FREE' } })
    }

    return expired.length
  },
}
