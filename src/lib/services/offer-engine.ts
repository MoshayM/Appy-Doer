import { prisma } from '@/lib/prisma'
import { Plan, BillingInterval, OfferType } from '@prisma/client'
import { PLAN_PRICES } from '@/lib/constants'
import { trialDaysRemaining } from '@/lib/utils'
import { NotificationService } from './notification'

export const OfferEngine = {
  async evaluateUser(userId: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { context: true, subscription: true, subscriptionOffers: { where: { accepted: false } } },
    })
    if (!user) return

    // Don't surface a second offer if one is already active
    const active = user.subscriptionOffers.find(
      o => !o.accepted && (!o.expiresAt || o.expiresAt > new Date()),
    )
    if (active) return

    const engagementScore = user.context?.engagementScore ?? 0
    const daysLeft = user.subscription?.trialEndsAt ? trialDaysRemaining(user.subscription.trialEndsAt) : null

    // Find eligible campaigns
    const campaigns = await prisma.offerCampaign.findMany({
      where: { active: true },
      orderBy: { maxDiscountPct: 'desc' },
    })

    for (const campaign of campaigns) {
      const rules = campaign.rules as Record<string, number>

      const meetsEngagement = !rules.minEngagement || engagementScore >= rules.minEngagement
      const meetsDaysLeft   = daysLeft === null || !rules.maxDaysLeft || daysLeft <= rules.maxDaysLeft

      if (!meetsEngagement || !meetsDaysLeft) continue

      // Compute dynamic discount based on engagement
      const score   = Math.min(100, engagementScore)
      const discount = Math.round(
        campaign.minDiscountPct + ((campaign.maxDiscountPct - campaign.minDiscountPct) * score) / 100,
      )

      const targetPlan: Plan = user.plan === 'FREE' || user.plan === 'TRIAL' ? 'PRO' : 'PREMIUM'
      const interval: BillingInterval = targetPlan === 'PREMIUM' ? 'YEAR' : 'MONTH'
      const originalINR = targetPlan === 'PREMIUM' ? PLAN_PRICES.PREMIUM.priceINR : PLAN_PRICES.PRO.priceINR
      const discountedINR = Math.round(originalINR * (1 - discount / 100))

      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48-hour offer window

      const offer = await prisma.subscriptionOffer.create({
        data: {
          userId,
          campaignId: campaign.id,
          type: campaign.type as OfferType,
          plan: targetPlan,
          interval,
          originalINR,
          discountedINR,
          discountPercent: discount,
          conversionLikelihood: score,
          expiresAt,
          shown: true,
        },
      })

      // Fire FOMO notification
      await NotificationService.send({
        userId,
        type: 'OFFER',
        channel: 'IN_APP',
        title: `${discount}% off ${targetPlan} — expires in 48 hours`,
        body: `Personalized offer: get ${targetPlan} for ₹${discountedINR.toLocaleString('en-IN')} instead of ₹${originalINR.toLocaleString('en-IN')}. Offer expires soon.`,
        meta: { offerId: offer.id, discount, expiresAt: expiresAt.toISOString() },
      })

      break // Only one active offer at a time
    }
  },

  async updateEngagementScore(userId: string) {
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [recentRuns, totalLeads, wonLeads] = await Promise.all([
      prisma.agentRun.count({ where: { userId, createdAt: { gte: weekAgo } } }),
      prisma.lead.count({ where: { userId } }),
      prisma.lead.count({ where: { userId, stage: 'WON' } }),
    ])

    const score = Math.min(
      100,
      recentRuns * 5 + totalLeads * 3 + wonLeads * 15,
    )

    await prisma.userContext.upsert({
      where: { userId },
      update: { engagementScore: score },
      create: { userId, engagementScore: score },
    })

    return score
  },
}
