import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { trialDaysRemaining } from '@/lib/utils'

let _resend: Resend | null = null
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder')
  return _resend
}

type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH'

interface SendOptions {
  userId: string
  type: string
  channel: NotificationChannel
  title: string
  body: string
  scheduledAt?: Date
  meta?: Record<string, unknown>
}

export const NotificationService = {
  async send(opts: SendOptions) {
    const { userId, type, channel, title, body, scheduledAt, meta } = opts

    // Always persist in-app notification
    await prisma.notificationCampaign.create({
      data: { userId, type, channel, title, body, scheduledAt, meta: meta as never, sentAt: new Date() },
    })

    // Send email if channel includes EMAIL
    if (channel === 'EMAIL') {
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user?.email) {
        await getResend().emails.send({
          from: 'AppyDoer <noreply@workbuddy.app>',
          to: user.email,
          subject: title,
          html: `<div style="font-family:sans-serif;max-width:600px;margin:auto"><h2>${title}</h2><p>${body}</p></div>`,
        }).catch(() => { /* non-blocking */ })
      }
    }
  },

  async sendTrialReminder(userId: string, daysLeft: number) {
    const urgency = daysLeft <= 1 ? 'FOMO' : daysLeft <= 3 ? 'HIGH' : 'NORMAL'
    const title = daysLeft === 0
      ? 'Your trial has ended — upgrade to keep access'
      : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left in your trial`
    const body = daysLeft === 0
      ? 'Your AppyDoer trial has expired. Upgrade to Pro or Premium to continue generating income.'
      : `You have ${daysLeft} day${daysLeft > 1 ? 's' : ''} remaining. Don't lose your work — subscribe now.`

    await NotificationService.send({
      userId, type: 'TRIAL_REMINDER', channel: 'EMAIL', title, body,
      meta: { daysLeft, urgency },
    })
  },

  async sendFirstIncomeCelebration(userId: string, amountINR: number) {
    const title = '🎉 First Income Achieved!'
    const body  = `Congratulations! You just marked your first client as Won. This is the moment AppyDoer was built for. Your first income milestone has been unlocked.`

    await NotificationService.send({
      userId, type: 'CELEBRATION', channel: 'EMAIL', title, body,
      meta: { amountINR },
    })
  },

  async sendRelationshipReminder(userId: string, kind: string, clientName: string) {
    const messages: Record<string, { title: string; body: string }> = {
      FOLLOW_UP:  { title: `Follow up with ${clientName}`, body: `It's time to follow up with ${clientName}. Tap to generate a personalized message.` },
      BIRTHDAY:   { title: `${clientName}'s birthday today!`, body: `Send ${clientName} a warm birthday message to strengthen your relationship.` },
      RENEWAL:    { title: `Renewal opportunity: ${clientName}`, body: `${clientName}'s contract is up for renewal. Time to reach out.` },
      CHECK_IN:   { title: `Check in with ${clientName}`, body: `${clientName} hasn't heard from you in a while. A quick check-in goes a long way.` },
    }

    const msg = messages[kind] ?? { title: `Action needed: ${clientName}`, body: `Follow up with ${clientName}.` }

    await NotificationService.send({
      userId, type: 'RELATIONSHIP', channel: 'IN_APP', title: msg.title, body: msg.body,
      meta: { kind, clientName },
    })
  },

  async sendWeeklyDigest(userId: string, stats: Record<string, number>) {
    const title = 'Your AppyDoer Week in Review'
    const body  = `This week: ${stats.leadsAdded ?? 0} new leads, ${stats.aiOutputs ?? 0} AI outputs, ${stats.wonLeads ?? 0} deals won.`

    await NotificationService.send({
      userId, type: 'DIGEST', channel: 'EMAIL', title, body, meta: stats,
    })
  },

  async notifyAdminsOfNewTicket(ticketId: string, ticketTitle: string, userName: string, userEmail: string, priority: string) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true, email: true },
    })

    const title = `[Support Ticket] ${ticketTitle}`
    const body  = `${userName || userEmail} raised a ${priority} priority ticket: "${ticketTitle}". Login to the admin panel to view and respond.`

    await Promise.all(admins.map(admin =>
      Promise.all([
        NotificationService.send({
          userId: admin.id, type: 'TICKET_NEW', channel: 'IN_APP', title, body,
          meta: { ticketId, userName, userEmail, priority },
        }),
        NotificationService.send({
          userId: admin.id, type: 'TICKET_NEW', channel: 'EMAIL', title, body,
          meta: { ticketId, userName, userEmail, priority },
        }),
      ])
    ))
  },

  async notifyUserTicketUpdated(userId: string, ticketTitle: string, newStatus: string, resolution?: string) {
    const statusLabel: Record<string, string> = {
      IN_PROGRESS: 'is now being worked on',
      RESOLVED:    'has been resolved',
      CLOSED:      'has been closed',
    }
    const title = `Ticket Update: ${ticketTitle}`
    const body  = resolution
      ? `Your ticket "${ticketTitle}" ${statusLabel[newStatus] ?? 'was updated'}. Resolution: ${resolution}`
      : `Your ticket "${ticketTitle}" ${statusLabel[newStatus] ?? 'was updated'}.`

    await Promise.all([
      NotificationService.send({ userId, type: 'TICKET_UPDATE', channel: 'IN_APP', title, body, meta: { newStatus } }),
      NotificationService.send({ userId, type: 'TICKET_UPDATE', channel: 'EMAIL', title, body, meta: { newStatus } }),
    ])
  },
}
