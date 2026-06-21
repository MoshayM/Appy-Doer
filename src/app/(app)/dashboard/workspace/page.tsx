'use client'

import { useState, useEffect } from 'react'
import RaiseTicketModal from '@/components/tickets/RaiseTicketModal'

interface WorkSupportResult {
  recommendation: string
  focusBlocks: { start: string; end: string; task: string }[]
  bottlenecks: string[]
  templateSuggestions: string[]
  automationOpportunities: string[]
  priorityTask: string
  estimatedOutputValue: number
}

interface WorkspaceItem { id: string; title: string; status: string }
interface TaskItem { id: string; title: string; status: string; workspaceId: string }

const WORK_STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW: 'bg-yellow-100 text-yellow-700',
  DELIVERED: 'bg-green-100 text-green-700',
  BLOCKED: 'bg-red-100 text-red-700',
}

export default function WorkSupportPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [result, setResult] = useState<WorkSupportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [showTicketModal, setShowTicketModal] = useState(false)
  const [ticketContext, setTicketContext] = useState('')

  useEffect(() => { loadWorkspaces() }, [])

  async function loadWorkspaces() {
    const res = await fetch('/api/workspace')
    if (res.ok) {
      const d = await res.json()
      setWorkspaces(d.workspaces ?? [])
      setTasks(d.tasks ?? [])
    }
  }

  async function getSupport() {
    setLoading(true); setError('')
    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType: 'WORK_SUPPORT' }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error?.message ?? 'Failed'); setLoading(false); return }
    setResult(data.data)
    setLoading(false)
  }

  async function addTask(wsId: string) {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    await fetch(`/api/workspace/${wsId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle }),
    })
    await loadWorkspaces()
    setNewTaskTitle(''); setShowAddTask(false); setAddingTask(false)
  }

  return (
    <>
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Support Center</h1>
          <p className="text-gray-500 mt-1">AI-powered work planning, focus blocks, and bottleneck removal</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTicketContext('Work Support'); setShowTicketModal(true) }}
            className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Raise Ticket
          </button>
          {result && (
            <button
              onClick={() => setResult(null)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Clear
            </button>
          )}
          <button onClick={getSupport} disabled={loading} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? 'Analyzing…' : result ? '🔄 Re-run' : 'Get AI Support'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {workspaces.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">🗂️</div>
              <div className="font-semibold text-gray-700 mb-1">No workspaces yet</div>
              <div className="text-gray-400 text-sm mb-4">Create a project workspace to track your client work</div>
            </div>
          ) : workspaces.map(ws => {
            const wsTasks = tasks.filter(t => t.workspaceId === ws.id)
            return (
              <div key={ws.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{ws.title}</div>
                    <div className="text-xs text-gray-400">{ws.status.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setTicketContext(`Workspace: ${ws.title}`); setShowTicketModal(true) }}
                      className="text-xs text-red-500 font-medium hover:underline"
                    >
                      Raise Ticket
                    </button>
                    <button onClick={() => setShowAddTask(!showAddTask)} className="text-xs text-indigo-600 font-medium hover:underline">+ Task</button>
                  </div>
                </div>
                {showAddTask && (
                  <div className="px-5 py-3 bg-indigo-50 border-b border-gray-100 flex gap-2">
                    <input
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      placeholder="Task title..."
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2"
                      onKeyDown={e => { if (e.key === 'Enter') addTask(ws.id) }}
                    />
                    <button onClick={() => addTask(ws.id)} disabled={addingTask} className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium">Add</button>
                  </div>
                )}
                <div className="divide-y divide-gray-50">
                  {wsTasks.length === 0 ? (
                    <div className="px-5 py-4 text-sm text-gray-400">No tasks yet</div>
                  ) : wsTasks.map(t => (
                    <div key={t.id} className="px-5 py-3 flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${WORK_STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm text-gray-700">{t.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="space-y-4">
          {!result && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="text-3xl mb-2">🤖</div>
              <div className="text-sm font-semibold text-gray-700 mb-1">AI Work Coach</div>
              <div className="text-xs text-gray-400">Click "Get AI Support" for your personalized work plan</div>
            </div>
          )}

          {result && (
            <>
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">Today's Focus</div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{result.priorityTask}</div>
                <p className="text-xs text-gray-600">{result.recommendation}</p>
              </div>

              {result.focusBlocks.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Focus Blocks</div>
                  <div className="space-y-2">
                    {result.focusBlocks.map((b, i) => (
                      <div key={i} className="flex gap-3 text-sm">
                        <div className="text-xs font-mono text-gray-400 w-24 flex-shrink-0">{b.start}–{b.end}</div>
                        <div className="text-gray-700">{b.task}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.bottlenecks.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <div className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">Bottlenecks</div>
                  <ul className="space-y-1">
                    {result.bottlenecks.map((b, i) => <li key={i} className="text-xs text-red-700">• {b}</li>)}
                  </ul>
                </div>
              )}

              {result.automationOpportunities.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Automation Ideas</div>
                  <ul className="space-y-1">
                    {result.automationOpportunities.map((a, i) => <li key={i} className="text-xs text-green-700">• {a}</li>)}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>

    {showTicketModal && (
      <RaiseTicketModal
        workflowContext={ticketContext}
        onClose={() => setShowTicketModal(false)}
      />
    )}
    </>
  )
}
