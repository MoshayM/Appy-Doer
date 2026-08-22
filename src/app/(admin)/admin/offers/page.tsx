import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function requireSuperAdmin() {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')
}

export default async function AdminOffersPage() {
  await requireSuperAdmin()

  const [campaigns, recentOffers] = await Promise.all([
    prisma.offerCampaign.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.subscriptionOffer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { email: true, plan: true } } },
    }),
  ])

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Offer Engine</h1>
        <p className="text-gray-500 mt-1">Campaigns and issued upgrade offers</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">Offer Campaigns</div>
        <div className="divide-y divide-gray-50">
          {campaigns.map(c => (
            <div key={c.id} className="px-6 py-4 flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">Discount: {c.minDiscountPct}%–{c.maxDiscountPct}%</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {c.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-semibold text-gray-900">Recent Offers Issued</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Plan', 'Discount', 'Accepted', 'Issued'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentOffers.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-700 text-xs">{o.user.email}</td>
                <td className="px-6 py-4 text-gray-700 text-xs">{o.plan}</td>
                <td className="px-6 py-4 text-indigo-700 font-semibold text-xs">{o.discountPercent}%</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${o.accepted ? 'bg-green-100 text-green-700' : o.shown ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
                    {o.accepted ? 'Accepted' : o.shown ? 'Dismissed' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
