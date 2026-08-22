import { prisma } from '@/lib/prisma'

export async function getUserContext(userId: string) {
  return prisma.userContext.findUnique({ where: { userId } })
}

export async function upsertUserContext(
  userId: string,
  data: Partial<{
    profession: string
    experienceYears: number
    industry: string
    availableHoursPerWeek: number
    incomeTargetINR: number
    skills: string[]
    interests: string[]
    selectedOpportunityId: string
    engagementScore: number
    profileCompletion: number
    onboardingComplete: boolean
  }>,
) {
  const current = await prisma.userContext.findUnique({ where: { userId } })

  if (!current) {
    return prisma.userContext.create({ data: { userId, ...data } })
  }

  return prisma.userContext.update({
    where: { userId },
    data: { ...data, version: { increment: 1 } },
  })
}

export async function advanceState(userId: string, nextState: string) {
  return prisma.userContext.update({
    where: { userId },
    data: { currentState: nextState as never, version: { increment: 1 } },
  })
}

export async function getProjectContext(workspaceId: string) {
  return prisma.projectWorkspace.findUnique({ where: { id: workspaceId } })
}

export async function updateProjectContext(
  workspaceId: string,
  sharedContext: Record<string, unknown>,
  currentVersion: number,
) {
  const updated = await prisma.projectWorkspace.updateMany({
    where: { id: workspaceId, contextVersion: currentVersion },
    data: { sharedContext: sharedContext as never, contextVersion: { increment: 1 } },
  })

  if (updated.count === 0) {
    throw new Error('Project context version conflict — re-read and retry')
  }
}
