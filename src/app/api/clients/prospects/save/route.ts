import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'

export const POST = withAuth(async (req: NextRequest, user) => {
  const { companyName, contactName, contactRole, email, industry, region } = await req.json()
  if (!companyName) {
    return NextResponse.json({ error: { code: 'INVALID_INPUT', message: 'Company name required' } }, { status: 400 })
  }

  // Create as a Lead in the CRM pipeline
  const lead = await prisma.lead.create({
    data: {
      userId:  user.id,
      name:    contactName ?? companyName,
      company: companyName,
      contact: email ?? null,
      service: contactRole ?? null,
      notes:   `Industry: ${industry ?? ''} | Region: ${region ?? ''} | Role: ${contactRole ?? ''}`,
      stage:   'LEAD_IDENTIFIED',
    },
  })

  await logActivity(user.id, user.role, 'LEAD_ADDED', {
    leadId:  lead.id,
    name:    lead.name,
    company: companyName,
    source:  'CLIENT_DISCOVERY',
  })

  return NextResponse.json({ leadId: lead.id }, { status: 201 })
})
