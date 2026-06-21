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
  const serviceCatalog = (detail.serviceCatalog as Array<{ service: string; outcome: string; priceFromINR: number }>) ?? []
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Services</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {serviceCatalog.map((svc, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-6 hover:border-indigo-300 transition-colors">
                  <h3 className="font-semibold text-gray-900 mb-2">{svc.service}</h3>
                  <p className="text-gray-600 text-sm mb-4">{svc.outcome}</p>
                  <p className="text-indigo-600 font-semibold">
                    Starting from ₹{svc.priceFromINR.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
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
