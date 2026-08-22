'use client'

import { useState, useEffect } from 'react'

interface Commission {
  id: string
  commissionRate: number
  commissionAmount: number
  tokensConsumed: number
  tier: string
  status: string
}

interface ProjectIncome {
  id: string
  projectTitle: string
  clientName: string | null
  agreedAmount: number
  receivedAmount: number
  currency: string
  dueDate: string | null
  notes: string | null
  leadId: string | null
  workspaceId: string | null
  createdAt: string
  commissions: Commission[]
}

interface Summary {
  totalReceived: number
  totalPending: number
  totalCommission: number
}

interface Lead      { id: string; name: string; company: string | null }
interface Workspace { id: string; title: string }

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

function pct(received: number, agreed: number) {
  if (!agreed) return 0
  return Math.min(100, Math.round((received / agreed) * 100))
}

const EMPTY_FORM = {
  projectTitle: '', clientName: '', agreedAmount: '',
  receivedAmount: '', leadId: '', workspaceId: '', dueDate: '', notes: '',
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────
function InvoiceModal({ income, onClose }: { income: ProjectIncome; onClose: () => void }) {
  const commission  = income.commissions[0]
  const pending     = Math.max(0, income.agreedAmount - income.receivedAmount)
  const isPaid      = income.receivedAmount >= income.agreedAmount && income.agreedAmount > 0
  const isPartial   = income.receivedAmount > 0 && !isPaid
  const ratePct     = commission ? Math.round(commission.commissionRate * 100) : 0
  const invoiceDate = new Date(income.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">

        {/* Invoice header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-black text-indigo-600">AI WorkBuddy</span>
              <span className="text-xs bg-indigo-50 text-indigo-500 border border-indigo-100 px-2 py-0.5 rounded-full font-medium">Invoice</span>
            </div>
            <div className="text-xs text-gray-400">Issued: {invoiceDate}</div>
          </div>
          <div className="text-right">
            <div className={`text-xs font-bold px-3 py-1 rounded-full ${
              isPaid    ? 'bg-emerald-100 text-emerald-700' :
              isPartial ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
            }`}>
              {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING'}
            </div>
          </div>
        </div>

        {/* Project & client */}
        <div className="px-7 py-5 border-b border-gray-100 space-y-1">
          <div className="font-bold text-gray-900">{income.projectTitle}</div>
          {income.clientName && <div className="text-sm text-gray-500">Client: {income.clientName}</div>}
          {income.dueDate && (
            <div className="text-xs text-gray-400">
              Due: {new Date(income.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
          {income.notes && <div className="text-xs text-gray-400 italic mt-1">{income.notes}</div>}
        </div>

        {/* Line items */}
        <div className="px-7 py-5 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Project value (agreed)</span>
            <span className="font-semibold text-gray-900">{fmt(income.agreedAmount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount received</span>
            <span className="font-semibold text-emerald-600">{fmt(income.receivedAmount)}</span>
          </div>
          {pending > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Balance pending</span>
              <span className="font-semibold text-amber-600">{fmt(pending)}</span>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-dashed border-gray-200 pt-2.5 mt-1">
            {commission ? (
              <div className="flex justify-between items-start text-sm">
                <div>
                  <span className="text-gray-500">Platform service fee</span>
                  <div className="text-xs text-gray-400 mt-0.5">
                    AI-usage commission · {commission.tier} tier ·{' '}
                    <span className="font-semibold text-indigo-600">{ratePct}% of received</span>
                  </div>
                  <div className="text-xs text-gray-300 mt-0.5">{commission.tokensConsumed.toLocaleString()} AI tokens consumed</div>
                </div>
                <span className="text-xs text-gray-400 font-medium ml-4 shrink-0">{ratePct}%</span>
              </div>
            ) : (
              <div className="text-xs text-gray-400">No AI usage fee applicable</div>
            )}
          </div>
        </div>

        {/* Tier explanation */}
        {commission && (
          <div className="mx-7 mb-5 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            <div className="text-xs font-semibold text-gray-500 mb-1.5">Commission tier breakdown</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { tier: 'BASIC',    label: 'Basic',    rate: '3%', sub: '< 5k tokens',   active: commission.tier === 'BASIC' },
                { tier: 'STANDARD', label: 'Standard', rate: '5%', sub: '5k–20k tokens', active: commission.tier === 'STANDARD' },
                { tier: 'PREMIUM',  label: 'Premium',  rate: '7%', sub: '20k+ tokens',   active: commission.tier === 'PREMIUM' },
              ].map(t => (
                <div key={t.tier} className={`rounded-lg px-2.5 py-2 text-center border ${
                  t.active ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'
                }`}>
                  <div className={`text-xs font-bold ${t.active ? 'text-indigo-700' : 'text-gray-400'}`}>{t.rate}</div>
                  <div className={`text-xs font-medium ${t.active ? 'text-indigo-600' : 'text-gray-400'}`}>{t.label}</div>
                  <div className="text-xs text-gray-300">{t.sub}</div>
                  {t.active && <div className="text-xs text-indigo-500 font-semibold mt-0.5">✓ Applied</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 px-7 pb-6">
          <button onClick={onClose} className="px-5 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            🖨 Print Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function IncomeDashboardPage() {
  const [incomes,      setIncomes]      = useState<ProjectIncome[]>([])
  const [summary,      setSummary]      = useState<Summary>({ totalReceived: 0, totalPending: 0, totalCommission: 0 })
  const [leads,        setLeads]        = useState<Lead[]>([])
  const [workspaces,   setWorkspaces]   = useState<Workspace[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [editId,       setEditId]       = useState<string | null>(null)
  const [form,         setForm]         = useState({ ...EMPTY_FORM })
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState<string | null>(null)
  const [invoiceItem,  setInvoiceItem]  = useState<ProjectIncome | null>(null)

  useEffect(() => {
    load()
    fetch('/api/leads').then(r => r.json()).then((d: Lead[]) => setLeads(Array.isArray(d) ? d : [])).catch(() => {})
    fetch('/api/workspace').then(r => r.json()).then((d: { workspaces?: Workspace[] }) => setWorkspaces(d?.workspaces ?? [])).catch(() => {})
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/income/projects')
      if (res.ok) {
        const d = await res.json()
        setIncomes(d.incomes ?? [])
        setSummary(d.summary ?? { totalReceived: 0, totalPending: 0, totalCommission: 0 })
      }
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM }); setEditId(null); setShowModal(true)
  }

  function openEdit(p: ProjectIncome) {
    setForm({
      projectTitle:  p.projectTitle,
      clientName:    p.clientName ?? '',
      agreedAmount:  String(p.agreedAmount),
      receivedAmount:String(p.receivedAmount),
      leadId:        p.leadId ?? '',
      workspaceId:   p.workspaceId ?? '',
      dueDate:       p.dueDate ? p.dueDate.slice(0, 10) : '',
      notes:         p.notes ?? '',
    })
    setEditId(p.id)
    setShowModal(true)
  }

  async function save() {
    if (!form.projectTitle.trim() || !form.agreedAmount) return
    setSaving(true)
    const body = {
      projectTitle:  form.projectTitle.trim(),
      clientName:    form.clientName.trim() || null,
      agreedAmount:  Number(form.agreedAmount),
      receivedAmount:Number(form.receivedAmount || 0),
      leadId:        form.leadId || null,
      workspaceId:   form.workspaceId || null,
      dueDate:       form.dueDate || null,
      notes:         form.notes.trim() || null,
    }
    const url    = editId ? `/api/income/projects/${editId}` : '/api/income/projects'
    const method = editId ? 'PATCH' : 'POST'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSaving(false)
    setShowModal(false)
    load()
  }

  async function del(id: string) {
    setDeleting(id)
    await fetch(`/api/income/projects/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

  const totalAgreed = incomes.reduce((s, i) => s + i.agreedAmount, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track project payments received and pending</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Add Project Income
        </button>
      </div>

      {/* Summary cards — received & pending only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Received</div>
          <div className="text-3xl font-black text-emerald-600">{fmt(summary.totalReceived)}</div>
          {totalAgreed > 0 && (
            <div className="text-xs text-gray-400 mt-1">{Math.round(summary.totalReceived / totalAgreed * 100)}% of {fmt(totalAgreed)} agreed</div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pending to Receive</div>
          <div className="text-3xl font-black text-amber-500">{fmt(summary.totalPending)}</div>
          <div className="text-xs text-gray-400 mt-1">
            Across {incomes.filter(i => i.agreedAmount > i.receivedAmount).length} project{incomes.filter(i => i.agreedAmount > i.receivedAmount).length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Project list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3"/>
              <div className="h-3 bg-gray-100 rounded w-1/2"/>
            </div>
          ))}
        </div>
      ) : incomes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-14 text-center">
          <div className="text-4xl mb-3">💰</div>
          <div className="font-semibold text-gray-700 mb-1">No project income recorded yet</div>
          <div className="text-gray-400 text-sm mb-5">Add a project to track received and pending payments</div>
          <button onClick={openAdd} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700">
            + Add Project Income
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {incomes.map(income => {
            const pending  = Math.max(0, income.agreedAmount - income.receivedAmount)
            const progress = pct(income.receivedAmount, income.agreedAmount)
            const isPaid   = income.receivedAmount >= income.agreedAmount && income.agreedAmount > 0
            const isPartial= income.receivedAmount > 0 && !isPaid

            return (
              <div key={income.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{income.projectTitle}</span>
                      {income.clientName && <span className="text-xs text-gray-400">· {income.clientName}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        isPaid    ? 'bg-emerald-100 text-emerald-700' :
                        isPartial ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-500'
                      }`}>
                        {isPaid ? 'Fully Paid' : isPartial ? 'Partial' : 'Pending'}
                      </span>
                    </div>
                    {income.dueDate && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Due {new Date(income.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setInvoiceItem(income)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-200"
                    >
                      View Invoice
                    </button>
                    <button onClick={() => openEdit(income)} className="text-xs text-gray-400 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50">Edit</button>
                    <button
                      onClick={() => del(income.id)}
                      disabled={deleting === income.id}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-40"
                    >
                      {deleting === income.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>

                {/* Payment amounts */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-gray-50 rounded-xl px-3 py-2.5 text-center">
                    <div className="text-xs text-gray-400 mb-0.5">Agreed</div>
                    <div className="font-bold text-gray-900 text-sm">{fmt(income.agreedAmount)}</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl px-3 py-2.5 text-center">
                    <div className="text-xs text-emerald-500 mb-0.5">Received</div>
                    <div className="font-bold text-emerald-700 text-sm">{fmt(income.receivedAmount)}</div>
                  </div>
                  <div className="bg-amber-50 rounded-xl px-3 py-2.5 text-center">
                    <div className="text-xs text-amber-500 mb-0.5">Pending</div>
                    <div className="font-bold text-amber-700 text-sm">{fmt(pending)}</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Payment progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isPaid ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {income.notes && (
                  <div className="text-xs text-gray-400 mt-2 italic">{income.notes}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Invoice modal */}
      {invoiceItem && <InvoiceModal income={invoiceItem} onClose={() => setInvoiceItem(null)} />}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editId ? 'Edit Project Income' : 'Add Project Income'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Project Title *</label>
                  <input
                    value={form.projectTitle}
                    onChange={e => setForm(f => ({ ...f, projectTitle: e.target.value }))}
                    placeholder="e.g. Website redesign for Acme"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Client Name</label>
                  <input
                    value={form.clientName}
                    onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    placeholder="Optional"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Agreed Amount (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.agreedAmount}
                    onChange={e => setForm(f => ({ ...f, agreedAmount: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.receivedAmount}
                    onChange={e => setForm(f => ({ ...f, receivedAmount: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                {leads.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Link CRM Lead</label>
                    <select
                      value={form.leadId}
                      onChange={e => setForm(f => ({ ...f, leadId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                      <option value="">None</option>
                      {leads.map(l => <option key={l.id} value={l.id}>{l.name}{l.company ? ` · ${l.company}` : ''}</option>)}
                    </select>
                  </div>
                )}
                {workspaces.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Link Workspace</label>
                    <select
                      value={form.workspaceId}
                      onChange={e => setForm(f => ({ ...f, workspaceId: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                      <option value="">None</option>
                      {workspaces.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Optional notes"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={save}
                disabled={saving || !form.projectTitle.trim() || !form.agreedAmount}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Income'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
