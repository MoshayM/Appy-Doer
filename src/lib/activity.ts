import { prisma } from '@/lib/prisma'
import { PlatformRole, Prisma } from '@prisma/client'

export const ACTION_LABELS: Record<string, { label: string; icon: string }> = {
  SKILL_ASSESSMENT:       { label: 'Skill Assessment run',       icon: '🧠' },
  OPPORTUNITY_DISCOVERY:  { label: 'Opportunities discovered',   icon: '🎯' },
  OFFER_BUILDER:          { label: 'Offer built',                icon: '💼' },
  PORTFOLIO_BUILDER:      { label: 'Portfolio generated',        icon: '🖼️' },
  PROFILE_INTELLIGENCE:   { label: 'Profile created',            icon: '👤' },
  CLIENT_INTELLIGENCE:    { label: 'Client analysed',            icon: '🔍' },
  CLIENT_ACQUISITION:     { label: 'Outreach content created',   icon: '📧' },
  RELATIONSHIP_SUCCESS:   { label: 'Relationship plan created',  icon: '🤝' },
  WORK_SUPPORT:           { label: 'Work session completed',     icon: '💻' },
  LEAD_ADDED:             { label: 'Lead added',                 icon: '➕' },
  LEAD_MOVED:             { label: 'Lead stage updated',         icon: '📋' },
  LEAD_WON:               { label: 'Client won',                 icon: '🏆' },
  CONTACT:                { label: 'Client contacted',           icon: '📞' },
  COLD_EMAIL_SENT:        { label: 'Cold email sent',            icon: '📨' },
  PROSPECT_SAVED:         { label: 'Prospect saved to CRM',      icon: '💾' },
  PROFILE_UPDATED:          { label: 'Profile updated',            icon: '✏️' },
  SKILLS_SAVED:             { label: 'Skills saved',               icon: '💾' },
  FIRST_INCOME_CELEBRATED:  { label: 'First income celebrated',    icon: '🎉' },
  TICKET_RAISED:            { label: 'Support ticket raised',      icon: '🎫' },
  GMAIL_CONNECTED:          { label: 'Gmail connected',             icon: '📧' },
  GMAIL_DISCONNECTED:       { label: 'Gmail disconnected',          icon: '📧' },
  GMAIL_RECONNECTED:        { label: 'Gmail reconnected',           icon: '📧' },
  GMAIL_ACCOUNT_CHANGED:    { label: 'Gmail account changed',       icon: '📧' },
}

export async function logActivity(
  userId: string,
  actorRole: PlatformRole,
  action: string,
  meta: Record<string, unknown> = {},
) {
  try {
    await prisma.activityLog.create({
      data: { userId, actorRole, action, meta: meta as Prisma.InputJsonValue },
    })
  } catch {
    // Non-critical — never let logging break the main flow
  }
}
