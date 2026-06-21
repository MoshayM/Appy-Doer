// Countries that receive INR pricing (India + emerging markets)
export const LOW_COST_COUNTRIES = new Set([
  // South Asia
  'IN', 'BD', 'PK', 'LK', 'NP', 'BT', 'MM', 'AF',
  // Southeast Asia (emerging)
  'VN', 'PH', 'ID', 'KH', 'LA', 'TL', 'TH', 'MY',
  // East Asia (emerging)
  'CN', 'MN',
  // Africa
  'NG', 'KE', 'GH', 'ET', 'TZ', 'UG', 'ZA', 'EG', 'MA', 'DZ', 'TN',
  'CI', 'CM', 'SN', 'RW', 'ZM', 'MZ', 'AO', 'ZW', 'SD', 'SO', 'LY',
  // Eastern Europe
  'UA', 'RS', 'RO', 'BG', 'AL', 'BA', 'MD', 'MK', 'ME', 'XK',
  // Latin America
  'BR', 'MX', 'AR', 'CO', 'PE', 'CL', 'VE', 'EC', 'BO', 'PY',
  'UY', 'CR', 'GT', 'HN', 'SV', 'NI', 'DO', 'CU', 'PA', 'JM',
  // Middle East (emerging)
  'IQ', 'JO', 'SY', 'YE', 'PS', 'LB',
  // Central Asia
  'KZ', 'UZ', 'TM', 'KG', 'TJ', 'AZ', 'AM', 'GE',
])

export type PricingZone = 'INR' | 'USD'

export function getPricingZone(countryCode: string | null | undefined): PricingZone {
  if (!countryCode) return 'INR' // default to INR for unknown / local dev
  return LOW_COST_COUNTRIES.has(countryCode.toUpperCase()) ? 'INR' : 'USD'
}

export const GEO_PRICES = {
  INR: {
    currency: 'INR',
    symbol: '₹',
    locale: 'en-IN',
    gateway: 'RAZORPAY' as const,
    PRO:     { monthly: 399,  annual: 3599,  annualMonthly: 300  },
    PREMIUM: { monthly: 799,  annual: 6999,  annualMonthly: 583  },
  },
  USD: {
    currency: 'USD',
    symbol: '$',
    locale: 'en-US',
    gateway: 'STRIPE' as const,
    PRO:     { monthly: 19,   annual: 149,   annualMonthly: 12   },
    PREMIUM: { monthly: 39,   annual: 299,   annualMonthly: 25   },
  },
} as const

export type GeoPricing = (typeof GEO_PRICES)[PricingZone]

export function formatPrice(amount: number, zone: PricingZone): string {
  const { symbol, locale, currency } = GEO_PRICES[zone]
  if (zone === 'INR') return `${symbol}${amount.toLocaleString(locale)}`
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}
