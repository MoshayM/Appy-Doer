import { PrismaClient, Plan } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ACCOUNTS = [
  {
    email:    'moshay1996@gmail.com',
    role:     'ADMIN'    as const,
    password: 'BuddyAdmin@1996!M',
    plan:     'PRO'      as Plan,
  },
  {
    email:    'moshaymuthukumar@gmail.com',
    role:     'SUPER_ADMIN' as const,
    password: 'BuddyRoot@Mosh!24',
    plan:     'PRO'      as Plan,
  },
]

async function main() {
  console.log('Setting up admin accounts…\n')

  for (const acc of ACCOUNTS) {
    const hash = await bcrypt.hash(acc.password, 12)

    const user = await prisma.user.upsert({
      where:  { email: acc.email },
      update: { role: acc.role, plan: acc.plan, passwordHash: hash },
      create: {
        email:        acc.email,
        role:         acc.role,
        plan:         acc.plan,
        passwordHash: hash,
      },
    })

    // Ensure UserContext exists
    await prisma.userContext.upsert({
      where:  { userId: user.id },
      update: {},
      create: { userId: user.id },
    })

    console.log(`✅ ${acc.role.padEnd(12)} ${acc.email}`)
    console.log(`   Password: ${acc.password}\n`)
  }

  console.log('Done. Credentials saved to admin-credentials.txt')
}

main()
  .catch(err => { console.error('❌ Error:', err); process.exit(1) })
  .finally(() => prisma.$disconnect())
