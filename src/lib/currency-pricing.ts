// Complete country → currency → rounded price mapping
// Two tiers: LOW_COST (emerging markets) and GLOBAL (high-income)

export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // South Asia
  IN: 'INR', BD: 'BDT', PK: 'PKR', LK: 'LKR', NP: 'NPR', BT: 'INR', MM: 'MMK', AF: 'AFN',
  // Southeast Asia
  VN: 'VND', PH: 'PHP', ID: 'IDR', KH: 'KHR', LA: 'LAK', TL: 'USD', TH: 'THB', MY: 'MYR',
  // East Asia
  JP: 'JPY', KR: 'KRW', HK: 'HKD', TW: 'TWD', SG: 'SGD', CN: 'CNY', MN: 'MNT',
  // Oceania
  AU: 'AUD', NZ: 'NZD',
  // North America
  US: 'USD', CA: 'CAD', MX: 'MXN',
  // Western Europe (EUR)
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', PT: 'EUR',
  AT: 'EUR', FI: 'EUR', IE: 'EUR', GR: 'EUR', LU: 'EUR', MT: 'EUR', CY: 'EUR',
  SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR',
  GB: 'GBP', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', IS: 'ISK',
  // Central/Eastern Europe
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', HR: 'EUR',
  UA: 'UAH', RS: 'RSD', AL: 'ALL', BA: 'BAM', MD: 'MDL', MK: 'MKD', GE: 'GEL',
  AZ: 'AZN', AM: 'AMD',
  // Middle East (high income)
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
  IL: 'ILS', TR: 'TRY', JO: 'JOD', EG: 'EGP', IQ: 'IQD', LB: 'USD',
  // Africa
  ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS', ET: 'ETB', TZ: 'TZS',
  UG: 'UGX', MA: 'MAD', DZ: 'DZD', TN: 'TND', CM: 'XAF', SN: 'XOF',
  CI: 'XOF', RW: 'RWF', ZM: 'ZMW',
  // Latin America
  BR: 'BRL', AR: 'ARS', CO: 'COP', PE: 'PEN', CL: 'CLP', VE: 'VES',
  EC: 'USD', BO: 'BOB', PY: 'PYG', UY: 'UYU', CR: 'CRC', GT: 'GTQ', DO: 'DOP',
  // Central Asia
  KZ: 'KZT', UZ: 'UZS', TM: 'TMT', KG: 'KGS', TJ: 'TJS',
}

export type CurrencyCode = string

interface CurrencyPrice {
  symbol: string
  name: string
  monthly: number      // Pro monthly
  annual: number       // Premium annual
  annualMonthly: number // annual ÷ 12 rounded
  tier: 'LOW_COST' | 'GLOBAL'
  gateway: 'RAZORPAY' | 'STRIPE'
  locale: string
}

export const CURRENCY_PRICES: Record<string, CurrencyPrice> = {
  // ── LOW_COST tier (INR-equivalent affordable pricing) ──────────────────────
  INR: { symbol: '₹',   name: 'Indian Rupee',       monthly: 399,    annual: 3999,    annualMonthly: 333,   tier: 'LOW_COST', gateway: 'RAZORPAY', locale: 'en-IN' },
  BDT: { symbol: '৳',   name: 'Bangladeshi Taka',   monthly: 499,    annual: 4999,    annualMonthly: 416,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'en-BD' },
  PKR: { symbol: '₨',   name: 'Pakistani Rupee',    monthly: 1199,   annual: 11999,   annualMonthly: 999,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'en-PK' },
  LKR: { symbol: 'Rs',  name: 'Sri Lankan Rupee',   monthly: 1299,   annual: 12999,   annualMonthly: 1083,  tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'en-LK' },
  NPR: { symbol: 'रू',  name: 'Nepalese Rupee',     monthly: 599,    annual: 5999,    annualMonthly: 499,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'ne-NP' },
  MMK: { symbol: 'K',   name: 'Myanmar Kyat',       monthly: 8000,   annual: 79999,   annualMonthly: 6666,  tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'my-MM' },
  VND: { symbol: '₫',   name: 'Vietnamese Dong',    monthly: 99000,  annual: 990000,  annualMonthly: 82500, tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'vi-VN' },
  PHP: { symbol: '₱',   name: 'Philippine Peso',    monthly: 249,    annual: 2499,    annualMonthly: 208,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'en-PH' },
  IDR: { symbol: 'Rp',  name: 'Indonesian Rupiah',  monthly: 64000,  annual: 639000,  annualMonthly: 53250, tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'id-ID' },
  KHR: { symbol: '៛',   name: 'Cambodian Riel',     monthly: 79000,  annual: 790000,  annualMonthly: 65833, tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'km-KH' },
  THB: { symbol: '฿',   name: 'Thai Baht',          monthly: 299,    annual: 2999,    annualMonthly: 249,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'th-TH' },
  MYR: { symbol: 'RM',  name: 'Malaysian Ringgit',  monthly: 39,     annual: 389,     annualMonthly: 32,    tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'ms-MY' },
  // Africa
  NGN: { symbol: '₦',   name: 'Nigerian Naira',     monthly: 1999,   annual: 19999,   annualMonthly: 1666,  tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'en-NG' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling',    monthly: 549,    annual: 5499,    annualMonthly: 458,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'en-KE' },
  GHS: { symbol: '₵',   name: 'Ghanaian Cedi',      monthly: 29,     annual: 289,     annualMonthly: 24,    tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'en-GH' },
  ZAR: { symbol: 'R',   name: 'South African Rand', monthly: 79,     annual: 789,     annualMonthly: 65,    tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'en-ZA' },
  EGP: { symbol: 'E£',  name: 'Egyptian Pound',     monthly: 649,    annual: 6499,    annualMonthly: 541,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'ar-EG' },
  MAD: { symbol: 'MAD', name: 'Moroccan Dirham',    monthly: 45,     annual: 449,     annualMonthly: 37,    tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'ar-MA' },
  ETB: { symbol: 'Br',  name: 'Ethiopian Birr',     monthly: 999,    annual: 9999,    annualMonthly: 833,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'am-ET' },
  TZS: { symbol: 'TSh', name: 'Tanzanian Shilling', monthly: 9999,   annual: 99999,   annualMonthly: 8333,  tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'sw-TZ' },
  XOF: { symbol: 'CFA', name: 'West African CFA',   monthly: 2500,   annual: 24999,   annualMonthly: 2083,  tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'fr-SN' },
  // Eastern Europe
  UAH: { symbol: '₴',   name: 'Ukrainian Hryvnia',  monthly: 749,    annual: 7499,    annualMonthly: 624,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'uk-UA' },
  RSD: { symbol: 'RSD', name: 'Serbian Dinar',      monthly: 2199,   annual: 21999,   annualMonthly: 1833,  tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'sr-RS' },
  RON: { symbol: 'lei', name: 'Romanian Leu',       monthly: 19,     annual: 189,     annualMonthly: 15,    tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'ro-RO' },
  // Latin America
  BRL: { symbol: 'R$',  name: 'Brazilian Real',     monthly: 19,     annual: 189,     annualMonthly: 15,    tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'pt-BR' },
  MXN: { symbol: '$',   name: 'Mexican Peso',       monthly: 79,     annual: 789,     annualMonthly: 65,    tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'es-MX' },
  ARS: { symbol: '$',   name: 'Argentine Peso',     monthly: 1999,   annual: 19999,   annualMonthly: 1666,  tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'es-AR' },
  COP: { symbol: '$',   name: 'Colombian Peso',     monthly: 14999,  annual: 149999,  annualMonthly: 12499, tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'es-CO' },
  PEN: { symbol: 'S/',  name: 'Peruvian Sol',       monthly: 69,     annual: 689,     annualMonthly: 57,    tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'es-PE' },
  CLP: { symbol: '$',   name: 'Chilean Peso',       monthly: 1799,   annual: 17999,   annualMonthly: 1499,  tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'es-CL' },
  BOB: { symbol: 'Bs',  name: 'Bolivian Boliviano', monthly: 139,    annual: 1390,    annualMonthly: 115,   tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'es-BO' },
  // Central Asia
  KZT: { symbol: '₸',   name: 'Kazakhstani Tenge',  monthly: 8999,   annual: 89999,   annualMonthly: 7499,  tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'kk-KZ' },
  UZS: { symbol: 'so\'m',name: 'Uzbekistani Som',   monthly: 229000, annual: 2290000, annualMonthly: 190833,tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'uz-UZ' },
  GEL: { symbol: '₾',   name: 'Georgian Lari',      monthly: 49,     annual: 489,     annualMonthly: 40,    tier: 'LOW_COST', gateway: 'STRIPE',   locale: 'ka-GE' },

  // ── GLOBAL tier (high-income country pricing) ──────────────────────────────
  USD: { symbol: '$',   name: 'US Dollar',           monthly: 19,     annual: 190,     annualMonthly: 15,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'en-US' },
  EUR: { symbol: '€',   name: 'Euro',                monthly: 17,     annual: 170,     annualMonthly: 14,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'de-DE' },
  GBP: { symbol: '£',   name: 'British Pound',       monthly: 15,     annual: 150,     annualMonthly: 12,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'en-GB' },
  AUD: { symbol: 'A$',  name: 'Australian Dollar',   monthly: 29,     annual: 290,     annualMonthly: 24,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'en-AU' },
  CAD: { symbol: 'C$',  name: 'Canadian Dollar',     monthly: 25,     annual: 250,     annualMonthly: 20,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'en-CA' },
  SGD: { symbol: 'S$',  name: 'Singapore Dollar',    monthly: 25,     annual: 250,     annualMonthly: 20,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'en-SG' },
  NZD: { symbol: 'NZ$', name: 'New Zealand Dollar',  monthly: 31,     annual: 310,     annualMonthly: 25,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'en-NZ' },
  JPY: { symbol: '¥',   name: 'Japanese Yen',        monthly: 2800,   annual: 28000,   annualMonthly: 2333,  tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'ja-JP' },
  KRW: { symbol: '₩',   name: 'South Korean Won',    monthly: 25000,  annual: 250000,  annualMonthly: 20833, tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'ko-KR' },
  HKD: { symbol: 'HK$', name: 'Hong Kong Dollar',    monthly: 149,    annual: 1490,    annualMonthly: 124,   tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'zh-HK' },
  TWD: { symbol: 'NT$', name: 'Taiwan Dollar',       monthly: 599,    annual: 5990,    annualMonthly: 499,   tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'zh-TW' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc',         monthly: 17,     annual: 170,     annualMonthly: 14,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'de-CH' },
  SEK: { symbol: 'kr',  name: 'Swedish Krona',       monthly: 199,    annual: 1990,    annualMonthly: 165,   tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'sv-SE' },
  NOK: { symbol: 'kr',  name: 'Norwegian Krone',     monthly: 199,    annual: 1990,    annualMonthly: 165,   tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'nb-NO' },
  DKK: { symbol: 'kr',  name: 'Danish Krone',        monthly: 129,    annual: 1290,    annualMonthly: 107,   tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'da-DK' },
  PLN: { symbol: 'zł',  name: 'Polish Zloty',        monthly: 75,     annual: 750,     annualMonthly: 62,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'pl-PL' },
  CZK: { symbol: 'Kč',  name: 'Czech Koruna',        monthly: 429,    annual: 4290,    annualMonthly: 357,   tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'cs-CZ' },
  HUF: { symbol: 'Ft',  name: 'Hungarian Forint',    monthly: 6999,   annual: 69999,   annualMonthly: 5833,  tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'hu-HU' },
  // Middle East (high income)
  AED: { symbol: 'AED', name: 'UAE Dirham',          monthly: 69,     annual: 690,     annualMonthly: 57,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'ar-AE' },
  SAR: { symbol: 'SAR', name: 'Saudi Riyal',         monthly: 69,     annual: 690,     annualMonthly: 57,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'ar-SA' },
  QAR: { symbol: 'QR',  name: 'Qatari Riyal',        monthly: 69,     annual: 690,     annualMonthly: 57,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'ar-QA' },
  KWD: { symbol: 'KD',  name: 'Kuwaiti Dinar',       monthly: 5,      annual: 49,      annualMonthly: 4,     tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'ar-KW' },
  ILS: { symbol: '₪',   name: 'Israeli Shekel',      monthly: 69,     annual: 690,     annualMonthly: 57,    tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'he-IL' },
  TRY: { symbol: '₺',   name: 'Turkish Lira',        monthly: 499,    annual: 4990,    annualMonthly: 415,   tier: 'GLOBAL',   gateway: 'STRIPE',   locale: 'tr-TR' },
}

// Premium is priced at ~2× Pro monthly, ~1.95× Pro annual (to maintain annual incentive)
export function getPremiumPricing(pricing: CurrencyPrice) {
  const monthly = Math.round(pricing.monthly * 2)
  const annual = Math.round(pricing.annual * 1.95)
  return { monthly, annual, annualMonthly: Math.round(annual / 12) }
}

export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode?.toUpperCase()] ?? 'USD'
}

export function getPricing(currencyCode: string): CurrencyPrice {
  return CURRENCY_PRICES[currencyCode] ?? CURRENCY_PRICES['USD']
}

export function formatLocalPrice(amount: number, pricing: CurrencyPrice): string {
  try {
    return new Intl.NumberFormat(pricing.locale, {
      style: 'currency',
      currency: Object.keys(CURRENCY_PRICES).find(k => CURRENCY_PRICES[k] === pricing) ?? 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `${pricing.symbol}${amount.toLocaleString()}`
  }
}
