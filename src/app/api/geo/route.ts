import { NextRequest, NextResponse } from 'next/server'
import { getPricingZone, GEO_PRICES } from '@/lib/geo-pricing'

export async function GET(req: NextRequest) {
  const country = req.headers.get('x-country') ?? req.headers.get('x-vercel-ip-country') ?? 'IN'
  const zone = getPricingZone(country)
  const prices = GEO_PRICES[zone]
  return NextResponse.json({ country, zone, prices })
}
