import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const IST = process.env.APP_TIMEZONE ?? 'Asia/Kolkata'

export function getISTDateKey(date: Date = new Date()): string {
  return formatInTimeZone(date, IST, 'yyyy-MM-dd')
}

export function getISTMidnight(date: Date = new Date()): Date {
  const zoned = toZonedTime(date, IST)
  zoned.setHours(0, 0, 0, 0)
  return zoned
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function trialDaysRemaining(trialEndsAt: Date): number {
  const now = new Date()
  const diff = trialEndsAt.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function gstAmount(amountINR: number): number {
  return Math.round(amountINR * 0.18)
}
