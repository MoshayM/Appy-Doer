import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentService } from '@/lib/services/payment'
import { NotificationService } from '@/lib/services/notification'
import { OfferEngine } from '@/lib/services/offer-engine'
import { trialDaysRemaining } from '@/lib/utils'
import { syncGmailForAllUsers } from '@/lib/services/gmail-sync'

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, number> = {}

  // 1. Expire trials
  results.trialsExpired = await PaymentService.expireTrials()

  // 2. Trial countdown reminders
  const trialing = await prisma.subscription.findMany({
    where: { status: 'TRIALING', trialEndsAt: { not: null } },
    select: { userId: true, trialEndsAt: true },
  })

  let reminders = 0
  for (const sub of trialing) {
    if (!sub.trialEndsAt) continue
    const daysLeft = trialDaysRemaining(sub.trialEndsAt)
    if ([5, 3, 2, 1, 0].includes(daysLeft)) {
      await NotificationService.sendTrialReminder(sub.userId, daysLeft)
      reminders++
    }
  }
  results.trialReminders = reminders

  // 3. Offer engine evaluation for trial users
  for (const sub of trialing) {
    if (!sub.trialEndsAt) continue
    const daysLeft = trialDaysRemaining(sub.trialEndsAt)
    if (daysLeft <= 3) {
      await OfferEngine.updateEngagementScore(sub.userId)
      await OfferEngine.evaluateUser(sub.userId)
    }
  }

  // 4. Relationship reminders (next action due today or overdue)
  const dueRelationships = await prisma.clientRelationship.findMany({
    where: { nextActionAt: { lte: new Date() } },
    include: { clientProfile: true, user: true },
  })

  let relationshipReminders = 0
  for (const rel of dueRelationships) {
    await NotificationService.sendRelationshipReminder(
      rel.userId, 'FOLLOW_UP', rel.clientProfile.companyName,
    )
    relationshipReminders++
  }
  results.relationshipReminders = relationshipReminders

  // 5. Birthday reminders
  const today = new Date()
  const birthdays = await prisma.clientRelationship.findMany({
    where: {
      birthday: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        lt:  new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
      },
    },
    include: { clientProfile: true },
  })

  for (const rel of birthdays) {
    await NotificationService.sendRelationshipReminder(
      rel.userId, 'BIRTHDAY', rel.clientProfile.companyName,
    )
  }
  results.birthdayReminders = birthdays.length

  // 6. Gmail reply sync
  try {
    const gmailSync = await syncGmailForAllUsers()
    results.gmailSynced = gmailSync.users
    results.gmailReplies = gmailSync.totalReplies
  } catch (err) {
    console.error('[cron] gmail sync failed', err)
    results.gmailSynced = 0
    results.gmailReplies = 0
  }

  return NextResponse.json({ success: true, results })
}
