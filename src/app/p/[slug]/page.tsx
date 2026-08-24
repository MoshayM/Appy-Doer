import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { websiteSlug: params.slug },
  })
  if (!profile) return { title: 'Profile Not Found' }
  return {
    title: profile.headline,
    description: profile.summary,
    openGraph: { title: profile.headline, description: profile.summary },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const profile = await prisma.professionalProfile.findUnique({
    where: { websiteSlug: params.slug, published: true },
    include: { versions: { take: 1, orderBy: { createdAt: 'desc' } } },
  })

  if (!profile) return notFound()

  const detail = profile.detail as Record<string, unknown>
  type ServiceEntry = { service: string; outcome: string; pricingModel?: string; priceFromINR: number; priceToINR?: number; deliverables?: string[]; timeline?: string }
  const serviceCatalog = (detail.serviceCatalog as ServiceEntry[]) ?? []
  const PRICING_LABELS: Record<string, { label: string; icon: string }> = {
    PER_PROJECT:      { label: 'Per Project',      icon: '📦' },
    PER_TASK:         { label: 'Per Task',          icon: '✅' },
    HOURLY:           { label: 'Hourly Rate',       icon: '⏱' },
    MONTHLY_RETAINER: { label: 'Monthly Retainer',  icon: '🔁' },
    CUSTOM_QUOTE:     { label: 'Custom Quote',      icon: '💬' },
  }
  const caseStudies = (detail.caseStudies as Array<{ title: string; problem: string; solution: string; result: string }>) ?? []

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="mb-16">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600">
              {profile.headline.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{profile.headline}</h1>
              {profile.positioning && (
                <p className="text-indigo-600 font-medium mt-1">{profile.positioning}</p>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">{profile.summary}</p>
        </section>

        {/* Service Catalog */}
        {serviceCatalog.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Services</h2>
            <p className="text-gray-500 text-sm mb-6">Clear pricing — know exactly what you pay and what you get</p>
            <div className="grid gap-5 md:grid-cols-2">
              {serviceCatalog.map((svc, i) => {
                const pm     = svc.pricingModel ? (PRICING_LABELS[svc.pricingModel] ?? { label: 'Custom Quote', icon: '💬' }) : null
                const unit   = svc.pricingModel === 'HOURLY' ? '/hr' : svc.pricingModel === 'MONTHLY_RETAINER' ? '/mo' : ''
                const hasRange = svc.priceToINR && svc.priceToINR > svc.priceFromINR
                return (
                  <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{svc.service}</h3>
                        {pm && (
                          <span className="shrink-0 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                            {pm.icon} {pm.label}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{svc.outcome}</p>
                    </div>
                    {/* Price */}
                    <div className="px-6 py-4 bg-indigo-50 flex items-center justify-between border-b border-indigo-100">
                      <div>
                        <div className="text-indigo-700 font-bold text-xl leading-none">
                          ₹{svc.priceFromINR.toLocaleString('en-IN')}{unit}
                          {hasRange && <span className="text-indigo-400 font-normal text-base"> – ₹{svc.priceToINR!.toLocaleString('en-IN')}{unit}</span>}
                        </div>
                        {!pm && <div className="text-indigo-500 text-xs mt-1">Contact for pricing</div>}
                      </div>
                      {svc.timeline && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">⏱ Delivery</div>
                          <div className="text-sm font-semibold text-gray-700">{svc.timeline}</div>
                        </div>
                      )}
                    </div>
                    {/* Deliverables */}
                    {svc.deliverables && svc.deliverables.length > 0 && (
                      <div className="px-6 py-4">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">What&apos;s included</div>
                        <ul className="space-y-1.5">
                          {svc.deliverables.map((d, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-green-500 shrink-0 mt-0.5">✓</span>{d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Case Studies */}
        {caseStudies.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Case Studies</h2>
            <div className="space-y-8">
              {caseStudies.map((cs, i) => (
                <div key={i} className="border-l-4 border-indigo-500 pl-6">
                  <h3 className="font-semibold text-lg text-gray-900 mb-3">{cs.title}</h3>
                  <div className="grid gap-3 md:grid-cols-3 text-sm">
                    <div><span className="font-medium text-gray-500 block">Problem</span>{cs.problem}</div>
                    <div><span className="font-medium text-gray-500 block">Solution</span>{cs.solution}</div>
                    <div><span className="font-medium text-gray-500 block">Result</span><span className="text-green-600">{cs.result}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-indigo-50 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to work together?</h2>
          <p className="text-gray-600 mb-6">Powered by AI WorkBuddy</p>
          <a
            href={`mailto:?subject=Let's work together`}
            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Get in Touch
          </a>
        </section>
      </div>
    </main>
  )
}
