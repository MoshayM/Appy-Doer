/**
 * Dev seed script — creates test accounts for local development.
 * Run AFTER configuring Supabase in .env.local
 *
 * Usage:  node scripts/seed-dev.js
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL in .env.local
 */

const path = require('path')
const fs = require('fs')

// Load .env.local
const envFile = path.join(__dirname, '..', '.env.local')
const envLines = fs.readFileSync(envFile, 'utf8').split('\n')
const env = {}
for (const line of envLines) {
  const m = line.match(/^([^#=]+)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim()
}
Object.assign(process.env, env)

const { createClient } = require('@supabase/supabase-js')
const { PrismaClient } = require('@prisma/client')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
const prisma = new PrismaClient()

const TEST_USERS = [
  {
    email: 'trial@aiworkbuddy.dev',
    password: 'Dev@Trial123!',
    plan: 'TRIAL',
    role: 'USER',
    label: 'Trial User',
  },
  {
    email: 'pro@aiworkbuddy.dev',
    password: 'Dev@Pro123!',
    plan: 'PRO',
    role: 'USER',
    label: 'Pro User',
  },
  {
    email: 'premium@aiworkbuddy.dev',
    password: 'Dev@Premium123!',
    plan: 'PREMIUM',
    role: 'USER',
    label: 'Premium User',
  },
  {
    email: 'free@aiworkbuddy.dev',
    password: 'Dev@Free123!',
    plan: 'FREE',
    role: 'USER',
    label: 'Free (Expired) User',
  },
  {
    email: 'admin@aiworkbuddy.dev',
    password: 'Dev@Admin123!',
    plan: 'PRO',
    role: 'ADMIN',
    label: 'Admin',
  },
  {
    email: 'superadmin@aiworkbuddy.dev',
    password: 'Dev@SuperAdmin123!',
    plan: 'PREMIUM',
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
  },
]

async function seedUser(config) {
  console.log(`\n[${config.label}] ${config.email}`)

  // 1. Create Supabase auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: config.email,
    password: config.password,
    email_confirm: true,
  })

  if (authError && !authError.message.includes('already been registered')) {
    console.error(`  ✗ Auth error: ${authError.message}`)
    return
  }

  const supabaseId = authData?.user?.id
  console.log(`  ✓ Supabase user: ${supabaseId ?? 'already exists'}`)

  // 2. Upsert Prisma User record
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 7)

  const dbUser = await prisma.user.upsert({
    where: { email: config.email },
    create: {
      email: config.email,
      name: config.label,
      plan: config.plan,
      role: config.role,
    },
    update: {
      plan: config.plan,
      role: config.role,
    },
  })
  console.log(`  ✓ DB User: ${dbUser.id}`)

  // 3. Subscription record
  const subStatus = config.plan === 'TRIAL' ? 'TRIALING'
    : config.plan === 'FREE' ? 'EXPIRED'
    : config.plan === 'PRO'  ? 'ACTIVE'
    : 'ACTIVE'

  const subInterval = config.plan === 'PREMIUM' ? 'YEAR' : 'MONTH'

  await prisma.subscription.upsert({
    where: { userId: dbUser.id },
    create: {
      userId: dbUser.id,
      plan: config.plan,
      status: subStatus,
      interval: subInterval,
      trialEndsAt: config.plan === 'TRIAL' ? trialEnd : null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: config.plan === 'FREE' ? new Date(Date.now() - 86400000) : trialEnd,
    },
    update: {
      plan: config.plan,
      status: subStatus,
    },
  })
  console.log(`  ✓ Subscription: ${subStatus} (${config.plan})`)

  // 4. UserContext (engagement baseline)
  await prisma.userContext.upsert({
    where: { userId: dbUser.id },
    create: {
      userId: dbUser.id,
      engagementScore: config.role === 'SUPER_ADMIN' ? 80 : config.plan === 'PREMIUM' ? 60 : 20,
      currentPhase: 'DISCOVER',
    },
    update: {},
  })
  console.log(`  ✓ UserContext seeded`)
}

async function main() {
  console.log('=== AI WorkBuddy Dev Seed Script ===')
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30)}...`)
  console.log(`DB URL: ${process.env.DATABASE_URL?.slice(0, 30)}...`)
  console.log('')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    console.error('ERROR: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
    process.exit(1)
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local')
    process.exit(1)
  }

  for (const user of TEST_USERS) {
    try {
      await seedUser(user)
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`)
    }
  }

  console.log('\n=== Done ===')
  console.log('\nTest credentials:')
  console.log('─'.repeat(60))
  for (const u of TEST_USERS) {
    console.log(`  ${u.role.padEnd(12)} ${u.plan.padEnd(8)} ${u.email}`)
    console.log(`  ${''.padEnd(12)} ${''.padEnd(8)} Password: ${u.password}`)
    console.log('')
  }
  console.log('Open http://localhost:3000/login to sign in')
  console.log('Super Admin panel: http://localhost:3000/admin')
  console.log('AI Providers: http://localhost:3000/admin/ai-providers')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
