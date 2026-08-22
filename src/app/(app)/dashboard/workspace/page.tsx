'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AgentProgress } from '@/components/AgentProgress'
import { TranslateButton } from '@/components/TranslateButton'

// ── Interfaces ────────────────────────────────────────────────────────────────

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

interface TaskElaboration {
  elaboration: string
  clientContext: string | null
  clientRequirements: string[]
  suggestions: string[]
  solvingRoadmap: { step: number; title: string; description: string; estimateMinutes: number; clientNote: string }[]
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimateHours: number
  emailSource: string | null
}

interface PendingDelete {
  task: TaskItem
  timeoutId: ReturnType<typeof setTimeout>
}

interface PendingWsDelete {
  ws: WorkspaceItem
  tasks: TaskItem[]
  timeoutId: ReturnType<typeof setTimeout>
}

interface AgentStatus {
  agent: string
  role: string
  stage: number
  status: 'waiting' | 'working' | 'done'
  message?: string
}

interface ExecutionResult {
  blueprint: { objective: string; clientNeeds: string; deliverables: string[]; urgency: string; taskType: string }
  plan: { approach: string; stages: { name: string; description: string }[]; estimatedMinutes: number }
  team: string[]
  specialistOutputs: { specialist: string; contribution: string; keyPoints: string[]; recommendations: string[] }[]
  review: { score: number; approved: boolean; improvements: string[]; consolidatedOutput: string; keyFindings: string[] }
  deliverable: { summary: string; mainOutput: string; sections: { title: string; content: string }[]; emailDraft: string; nextSteps: string[] }
}

interface ClarifyQuestion {
  id: string
  question: string
  hint?: string
  type: 'text' | 'select'
  options?: string[]
  required: boolean
}

interface ClarificationState {
  taskId: string
  questions: ClarifyQuestion[]
  answers: Record<string, string>
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  NOT_STARTED: 'bg-gray-300',
  IN_PROGRESS:  'bg-blue-500',
  REVIEW:       'bg-yellow-500',
  DELIVERED:    'bg-green-500',
  BLOCKED:      'bg-red-500',
}
const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS:  'In Progress',
  REVIEW:       'In Review',
  DELIVERED:    'Delivered',
  BLOCKED:      'Blocked',
}
const STATUS_CHIP: Record<string, string> = {
  NOT_STARTED: 'bg-gray-100 text-gray-500',
  IN_PROGRESS:  'bg-blue-50 text-blue-600',
  REVIEW:       'bg-yellow-50 text-yellow-700',
  DELIVERED:    'bg-green-50 text-green-700',
  BLOCKED:      'bg-red-50 text-red-600',
}
const PRIORITY_STYLE: Record<string, { chip: string; dot: string }> = {
  HIGH:   { chip: 'bg-red-50 text-red-600 border border-red-200',    dot: 'bg-red-500' },
  MEDIUM: { chip: 'bg-amber-50 text-amber-600 border border-amber-200', dot: 'bg-amber-500' },
  LOW:    { chip: 'bg-green-50 text-green-600 border border-green-200', dot: 'bg-green-500' },
}

const PIPELINE_STAGES = ['Analyst', 'Planner', 'Specialists', 'Review', 'Delivery']

// ── Spinner ───────────────────────────────────────────────────────────────────

function Spinner({ size = 'sm', color = 'indigo' }: { size?: 'sm' | 'xs'; color?: string }) {
  const s = size === 'xs' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <svg className={`${s} animate-spin text-${color}-600`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function TabBar<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-all ${active === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WorkSupportPage() {
  const router = useRouter()
  const [workspaces, setWorkspaces]   = useState<WorkspaceItem[]>([])
  const [tasks, setTasks]             = useState<TaskItem[]>([])
  const [result, setResult]           = useState<WorkSupportResult | null>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [showAddTask, setShowAddTask] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask]   = useState(false)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  // Elaboration
  const [elaborations, setElaborations]       = useState<Record<string, TaskElaboration>>({})
  const [elaboratingTask, setElaboratingTask]  = useState<string | null>(null)
  const [elaborateErrors, setElaborateErrors]  = useState<Record<string, string>>({})
  const [translatedElaborations, setTranslatedElaborations] =
    useState<Record<string, { data: TaskElaboration; lang: string }>>({})
  const [elaborateTabs, setElaborateTabs]      = useState<Record<string, 'overview' | 'roadmap' | 'suggestions'>>({})

  // Pre-execution clarification
  const [clarifyingTask, setClarifyingTask]     = useState<string | null>(null)
  const [clarification, setClarification]       = useState<ClarificationState | null>(null)
  const [taskNotes, setTaskNotes]               = useState<Record<string, string>>({})

  // Execution
  const [executingTask, setExecutingTask]       = useState<string | null>(null)
  const [executionAgents, setExecutionAgents]   = useState<AgentStatus[]>([])
  const [executionTeam, setExecutionTeam]       = useState<{ team: string[]; estimatedMinutes: number; approach: string } | null>(null)
  const [executionResults, setExecutionResults] = useState<Record<string, string>>({}) // taskId → 'done'
  const [executionError, setExecutionError]     = useState('')

  // Delete / undo
  const [undoToast, setUndoToast]   = useState<{ taskTitle: string; taskId: string } | null>(null)
  const pendingDeletes = useRef<Record<string, PendingDelete>>({})
  const [wsUndoToast, setWsUndoToast] = useState<{ wsTitle: string; wsId: string } | null>(null)
  const pendingWsDeletes = useRef<Record<string, PendingWsDelete>>({})

  useEffect(() => { loadWorkspaces() }, [])

  // ── Data loaders ──────────────────────────────────────────────────────────

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

  // ── Task CRUD ─────────────────────────────────────────────────────────────

  async function addTask(wsId: string) {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    const res = await fetch(`/api/workspace/${wsId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle }),
    })
    if (res.ok) {
      const newTask: TaskItem = { ...(await res.json()), workspaceId: wsId }
      setTasks(prev => [...prev, newTask])
      setNewTaskTitle(''); setShowAddTask(null); setAddingTask(false)
      setExpandedTask(newTask.id)
      elaborateTask(newTask.id)
    } else { setAddingTask(false) }
  }

  const deleteTask = useCallback((task: TaskItem) => {
    setTasks(prev => prev.filter(t => t.id !== task.id))
    if (expandedTask === task.id) setExpandedTask(null)
    setUndoToast({ taskTitle: task.title, taskId: task.id })
    const timeoutId = setTimeout(async () => {
      await fetch(`/api/workspace/tasks/${task.id}`, { method: 'DELETE' })
      delete pendingDeletes.current[task.id]
      setUndoToast(prev => prev?.taskId === task.id ? null : prev)
    }, 5000)
    pendingDeletes.current[task.id] = { task, timeoutId }
  }, [expandedTask])

  function undoDelete(taskId: string) {
    const p = pendingDeletes.current[taskId]
    if (!p) return
    clearTimeout(p.timeoutId)
    delete pendingDeletes.current[taskId]
    setTasks(prev => [...prev, p.task])
    setUndoToast(null)
  }

  const deleteWorkspace = useCallback((ws: WorkspaceItem) => {
    const wsTasks = tasks.filter(t => t.workspaceId === ws.id)
    setWorkspaces(prev => prev.filter(w => w.id !== ws.id))
    setTasks(prev => prev.filter(t => t.workspaceId !== ws.id))
    if (wsTasks.some(t => t.id === expandedTask)) setExpandedTask(null)
    setWsUndoToast({ wsTitle: ws.title, wsId: ws.id })
    const timeoutId = setTimeout(async () => {
      await fetch(`/api/workspace/${ws.id}`, { method: 'DELETE' })
      delete pendingWsDeletes.current[ws.id]
      setWsUndoToast(prev => prev?.wsId === ws.id ? null : prev)
    }, 5000)
    pendingWsDeletes.current[ws.id] = { ws, tasks: wsTasks, timeoutId }
  }, [tasks, expandedTask])

  function undoDeleteWorkspace(wsId: string) {
    const p = pendingWsDeletes.current[wsId]
    if (!p) return
    clearTimeout(p.timeoutId)
    delete pendingWsDeletes.current[wsId]
    setWorkspaces(prev => [...prev, p.ws])
    setTasks(prev => [...prev, ...p.tasks])
    setWsUndoToast(null)
  }

  // ── Elaboration ───────────────────────────────────────────────────────────

  async function elaborateTask(taskId: string) {
    setElaboratingTask(taskId)
    setElaborateErrors(prev => { const n = { ...prev }; delete n[taskId]; return n })
    try {
      const res = await fetch(`/api/workspace/tasks/${taskId}/elaborate`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) setElaborations(prev => ({ ...prev, [taskId]: data as TaskElaboration }))
      else setElaborateErrors(prev => ({ ...prev, [taskId]: data?.error?.message ?? 'AI elaboration failed.' }))
    } catch {
      setElaborateErrors(prev => ({ ...prev, [taskId]: 'Network error. Please try again.' }))
    } finally { setElaboratingTask(null) }
  }

  function toggleTask(taskId: string) {
    if (expandedTask === taskId) { setExpandedTask(null); return }
    setExpandedTask(taskId)
    if (!elaborations[taskId]) elaborateTask(taskId)
  }

  function setElabTab(taskId: string, tab: 'overview' | 'roadmap' | 'suggestions') {
    setElaborateTabs(prev => ({ ...prev, [taskId]: tab }))
  }

  // ── Pre-execution clarification flow ─────────────────────────────────────

  async function startExecuteFlow(taskId: string) {
    setExecutionError('')
    setClarification(null)
    setClarifyingTask(taskId)
    try {
      const res = await fetch(`/api/workspace/tasks/${taskId}/clarify`, { method: 'POST' })
      const data = await res.json()
      if (data.needsClarification && Array.isArray(data.questions) && data.questions.length > 0) {
        setClarification({ taskId, questions: data.questions, answers: {} })
        setClarifyingTask(null)
      } else {
        setClarifyingTask(null)
        executeTask(taskId, {}, taskNotes[taskId])
      }
    } catch {
      setClarifyingTask(null)
      executeTask(taskId, {}, taskNotes[taskId])
    }
  }

  function submitClarifications() {
    if (!clarification) return
    const { taskId, questions, answers } = clarification
    const allRequired = questions.filter(q => q.required).every(q => answers[q.id]?.trim())
    if (!allRequired) return
    setClarification(null)
    executeTask(taskId, answers, taskNotes[taskId])
  }

  // ── Execution (SSE) ───────────────────────────────────────────────────────

  async function executeTask(taskId: string, clarifications: Record<string, string> = {}, userNotes?: string) {
    setExecutingTask(taskId)
    setExecutionAgents([])
    setExecutionTeam(null)
    setExecutionError('')

    try {
      const res = await fetch(`/api/workspace/tasks/${taskId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clarifications, userNotes: userNotes?.trim() || undefined }),
      })
      if (!res.ok || !res.body) { setExecutionError('Failed to start execution.'); setExecutingTask(null); return }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const msgs = buf.split('\n\n')
        buf = msgs.pop() ?? ''

        for (const msg of msgs) {
          let eventType = 'message', dataStr = ''
          for (const line of msg.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            else if (line.startsWith('data: ')) dataStr = line.slice(6).trim()
          }
          if (!dataStr) continue
          try {
            const payload = JSON.parse(dataStr)
            if (eventType === 'progress') {
              setExecutionAgents(prev => {
                const idx = prev.findIndex(a => a.agent === payload.agent)
                const entry: AgentStatus = { agent: payload.agent, role: payload.role, stage: payload.stage, status: payload.status, message: payload.message }
                if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n }
                return [...prev, entry]
              })
            } else if (eventType === 'team_formed') {
              setExecutionTeam({ team: payload.team, estimatedMinutes: payload.estimatedMinutes, approach: payload.approach })
            } else if (eventType === 'complete') {
              setExecutionResults(prev => ({ ...prev, [taskId]: 'done' }))
              setExecutingTask(null)
              // Navigate to the full review page
              router.push(`/dashboard/workspace/deliverable/${taskId}`)
            } else if (eventType === 'error') {
              setExecutionError(payload.message ?? 'Execution failed.')
              setExecutingTask(null)
            }
          } catch { /* skip bad chunk */ }
        }
      }
    } catch {
      setExecutionError('Network error during execution.')
      setExecutingTask(null)
    }
  }


  // ── Derived ───────────────────────────────────────────────────────────────

  const isExecuting   = !!executingTask
  const isClarifying  = !!clarifyingTask
  const showCoach     = isExecuting || !!clarification || isClarifying
  const doneStage   = executionAgents.length > 0 ? Math.max(0, ...executionAgents.filter(a => a.status === 'done').map(a => a.stage)) : 0
  const workingStage = executionAgents.find(a => a.status === 'working')?.stage ?? 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="max-w-7xl mx-auto px-1">

      {/* ── Page Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl mb-6 px-7 py-6">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">Work Support Center</h1>
            <p className="text-indigo-200 text-sm mt-0.5">Assign work — your invisible AI team handles the rest</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {result && !showCoach && (
              <button onClick={() => setResult(null)} className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium text-white transition-colors">
                Clear
              </button>
            )}
            {!showCoach && (
              <button onClick={getSupport} disabled={loading} className="px-4 py-2 bg-white text-indigo-700 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-60 flex items-center gap-2">
                {loading ? <><Spinner size="xs" color="indigo" /> Running…</> : result ? '↻ Re-run' : '✦ Get AI Support'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2"><span>⚠</span>{error}</div>}

      <div className="grid xl:grid-cols-5 lg:grid-cols-3 gap-5">

        {/* ── Left: Workspaces (3/5 on xl, 2/3 on lg) ── */}
        <div className="xl:col-span-3 lg:col-span-2 space-y-4">

          {workspaces.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-14 text-center">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">🗂️</div>
              <div className="font-semibold text-gray-800 mb-1">No project workspaces yet</div>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">Create a workspace to start tracking client work and let AI execute it for you</p>
            </div>
          ) : workspaces.map(ws => {
            const wsTasks    = tasks.filter(t => t.workspaceId === ws.id)
            const doneTasks  = wsTasks.filter(t => t.status === 'DELIVERED').length
            const statusDot  = STATUS_DOT[ws.status] ?? 'bg-gray-300'

            return (
              <div key={ws.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                {/* Workspace header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{ws.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{STATUS_LABEL[ws.status] ?? ws.status.replace(/_/g, ' ')}</div>
                  </div>
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">{doneTasks}/{wsTasks.length} done</span>
                  <button
                    onClick={() => deleteWorkspace(ws)}
                    title="Delete workspace"
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setShowAddTask(showAddTask === ws.id ? null : ws.id)}
                    className="flex-shrink-0 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    + Task
                  </button>
                </div>

                {/* Add task row */}
                {showAddTask === ws.id && (
                  <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 flex gap-2">
                    <input
                      value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} autoFocus
                      placeholder="Describe the task…"
                      className="flex-1 text-sm bg-white border border-indigo-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      onKeyDown={e => { if (e.key === 'Enter') addTask(ws.id); if (e.key === 'Escape') setShowAddTask(null) }}
                    />
                    <button onClick={() => addTask(ws.id)} disabled={addingTask || !newTaskTitle.trim()}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                      {addingTask ? <Spinner size="xs" color="white" /> : 'Add'}
                    </button>
                    <button onClick={() => setShowAddTask(null)} className="text-gray-400 hover:text-gray-600 px-2">✕</button>
                  </div>
                )}

                {/* Task list */}
                <div className="divide-y divide-gray-50">
                  {wsTasks.length === 0 ? (
                    <div className="px-5 py-5 text-center">
                      <p className="text-sm text-gray-400">No tasks yet — click <strong>+ Task</strong> to add one</p>
                    </div>
                  ) : wsTasks.map(t => {
                    const isExpanded    = expandedTask === t.id
                    const elab          = elaborations[t.id]
                    const isElaborating = elaboratingTask === t.id
                    const translatedElab = translatedElaborations[t.id]
                    const displayElab   = translatedElab?.data ?? elab
                    const execResult    = executionResults[t.id]
                    const isRunning     = executingTask === t.id
                    const elabTab       = elaborateTabs[t.id] ?? 'overview'
                    const statusDotT    = STATUS_DOT[t.status] ?? 'bg-gray-300'

                    return (
                      <div key={t.id} className={isExpanded ? 'bg-gray-50/70' : ''}>

                        {/* Task row */}
                        <div
                          className="px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors group"
                          onClick={() => toggleTask(t.id)}
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotT}`} />

                          <span className="text-sm font-medium text-gray-800 flex-1 min-w-0 truncate">{t.title}</span>

                          {/* Chips */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {elab && (
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLE[elab.priority]?.chip ?? ''}`}>
                                {elab.priority}
                              </span>
                            )}
                            {elab && (
                              <span className="text-xs text-gray-400 hidden sm:block">{elab.estimateHours}h</span>
                            )}
                            {execResult && (
                              <span className="text-xs bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full border border-green-200">
                                ✓ Done
                              </span>
                            )}
                            {isRunning && (
                              <span className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-2 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                                <Spinner size="xs" /> Working
                              </span>
                            )}
                          </div>

                          {/* Delete (hover only) */}
                          <button
                            onClick={e => { e.stopPropagation(); deleteTask(t) }}
                            className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-all flex-shrink-0"
                          >
                            Delete
                          </button>

                          <svg className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                          </svg>
                        </div>

                        {/* ── Expanded panel ── */}
                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-gray-100">

                            {/* Loading shimmer */}
                            {isElaborating && (
                              <div className="pt-4 space-y-3">
                                <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                                  <Spinner /> Reading client emails & building AI plan…
                                </div>
                                <div className="space-y-2 animate-pulse">
                                  <div className="h-3 bg-gray-200 rounded w-3/4"/>
                                  <div className="h-3 bg-gray-200 rounded w-1/2"/>
                                  <div className="h-3 bg-gray-200 rounded w-5/6"/>
                                </div>
                              </div>
                            )}

                            {/* Error */}
                            {!isElaborating && !elab && elaborateErrors[t.id] && (
                              <div className="pt-4 bg-red-50 rounded-xl p-3 flex items-start gap-3">
                                <span className="text-red-400 flex-shrink-0 mt-0.5">⚠</span>
                                <div className="flex-1">
                                  <p className="text-xs text-red-700">{elaborateErrors[t.id]}</p>
                                  <button onClick={e => { e.stopPropagation(); elaborateTask(t.id) }} className="mt-1 text-xs text-indigo-600 font-semibold hover:underline">
                                    ↻ Try again
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* No elab yet */}
                            {!isElaborating && !elab && !elaborateErrors[t.id] && (
                              <div className="pt-4">
                                <button onClick={e => { e.stopPropagation(); elaborateTask(t.id) }}
                                  className="w-full py-2.5 border-2 border-dashed border-indigo-300 rounded-xl text-sm text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors">
                                  ✦ Analyse with AI
                                </button>
                              </div>
                            )}

                            {/* Elaboration content */}
                            {elab && displayElab && (
                              <div className="pt-4 space-y-3">

                                {/* Top row: meta chips + translate */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PRIORITY_STYLE[elab.priority]?.chip}`}>
                                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${PRIORITY_STYLE[elab.priority]?.dot}`} />
                                      {elab.priority}
                                    </span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">⏱ {elab.estimateHours}h</span>
                                    {elab.emailSource && (
                                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                        Email
                                      </span>
                                    )}
                                  </div>
                                  <div onClick={e => e.stopPropagation()}>
                                    <TranslateButton size="sm" content={elab}
                                      onTranslated={(data, lang) => setTranslatedElaborations(prev => ({ ...prev, [t.id]: { data: data as TaskElaboration, lang } }))}
                                      isTranslated={!!translatedElab} activeLanguage={translatedElab?.lang}
                                      onReset={() => setTranslatedElaborations(prev => { const n = { ...prev }; delete n[t.id]; return n })}
                                    />
                                  </div>
                                </div>

                                {/* Tab bar */}
                                <div onClick={e => e.stopPropagation()}>
                                  <TabBar
                                    tabs={[
                                      { id: 'overview' as const, label: 'Overview' },
                                      { id: 'roadmap'  as const, label: 'Roadmap' },
                                      { id: 'suggestions' as const, label: 'Suggestions' },
                                    ]}
                                    active={elabTab}
                                    onChange={tab => setElabTab(t.id, tab)}
                                  />
                                </div>

                                {/* ── Tab: Overview ── */}
                                {elabTab === 'overview' && (
                                  <div className="space-y-3">
                                    <p className="text-sm text-gray-600 leading-relaxed">{displayElab.elaboration}</p>

                                    {displayElab.clientContext && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                          <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                          <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Client Request</span>
                                        </div>
                                        <p className="text-sm text-blue-800 leading-relaxed">{displayElab.clientContext}</p>
                                      </div>
                                    )}

                                    {displayElab.clientRequirements.length > 0 && (
                                      <div className="bg-white border border-gray-200 rounded-xl p-3.5">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">Requirements</div>
                                        <ul className="space-y-2">
                                          {displayElab.clientRequirements.map((r, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-gray-700">
                                              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                                              <span>{r}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* ── Tab: Roadmap ── */}
                                {elabTab === 'roadmap' && (
                                  <div className="relative pl-4">
                                    {/* Connecting line */}
                                    <div className="absolute left-4 top-3 bottom-3 w-px bg-gradient-to-b from-indigo-300 to-purple-300" />
                                    <div className="space-y-4">
                                      {displayElab.solvingRoadmap.map((w, i) => (
                                        <div key={i} className="relative flex gap-3 pl-3">
                                          <div className="absolute -left-1 w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                                            {w.step}
                                          </div>
                                          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-3.5 hover:border-indigo-200 transition-colors">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                              <span className="text-sm font-semibold text-gray-800">{w.title}</span>
                                              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                                {elab.solvingRoadmap[i]?.estimateMinutes ?? w.estimateMinutes}m
                                              </span>
                                            </div>
                                            <p className="text-xs text-gray-600 leading-relaxed">{w.description}</p>
                                            {w.clientNote && (
                                              <p className="text-xs text-indigo-500 italic mt-1.5 flex items-start gap-1">
                                                <span className="flex-shrink-0">→</span> {w.clientNote}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* ── Tab: Suggestions ── */}
                                {elabTab === 'suggestions' && (
                                  <div className="space-y-2.5">
                                    {displayElab.suggestions.map((s, i) => (
                                      <div key={i} className="flex gap-3 bg-white border border-gray-200 rounded-xl p-3 hover:border-indigo-200 transition-colors">
                                        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0 flex items-center justify-center text-sm font-bold">{i + 1}</div>
                                        <p className="text-sm text-gray-700 leading-relaxed">{s}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* ── User notes ── */}
                                <div onClick={e => e.stopPropagation()} className="pt-1">
                                  <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                    <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                                      <svg className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                      </svg>
                                      <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">Your Instructions</span>
                                      {taskNotes[t.id]?.trim() && (
                                        <span className="ml-auto text-xs text-indigo-400 font-medium">Saved</span>
                                      )}
                                    </div>
                                    <textarea
                                      rows={2}
                                      value={taskNotes[t.id] ?? ''}
                                      onChange={e => setTaskNotes(prev => ({ ...prev, [t.id]: e.target.value }))}
                                      placeholder="Add specific instructions, preferences, or context for the AI team…"
                                      className="w-full text-sm text-gray-700 placeholder-gray-400 px-3 pb-2.5 pt-1 bg-transparent focus:outline-none resize-none"
                                    />
                                  </div>
                                </div>

                                {/* ── CTA button ── */}
                                <div onClick={e => e.stopPropagation()} className="pt-0">
                                  {execResult ? (
                                    <button
                                      onClick={() => router.push(`/dashboard/workspace/deliverable/${t.id}`)}
                                      className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:from-green-600 hover:to-teal-600 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                      Review &amp; Send Deliverable →
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => startExecuteFlow(t.id)}
                                      disabled={isRunning || !!executingTask || clarifyingTask === t.id || isClarifying}
                                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                      {isRunning ? (
                                        <><Spinner size="xs" color="white" /> AI Team Working…</>
                                      ) : clarifyingTask === t.id ? (
                                        <><Spinner size="xs" color="white" /> Checking requirements…</>
                                      ) : (
                                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Execute with AI Team</>
                                      )}
                                    </button>
                                  )}
                                </div>

                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Right: AI Work Coach (2/5 on xl, 1/3 on lg) ── */}
        <div className="xl:col-span-2 lg:col-span-1 space-y-4">

          {loading && !showCoach && <AgentProgress agentType="WORK_SUPPORT" compact />}

          {/* Execution error banner */}
          {executionError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <span className="text-red-400 flex-shrink-0 text-lg">⚠</span>
              <div>
                <p className="text-xs font-bold text-red-600 mb-0.5">Execution Failed</p>
                <p className="text-xs text-red-700">{executionError}</p>
              </div>
            </div>
          )}

          {/* ── Clarification card (pre-execution questions) ── */}
          {clarification && !isExecuting && (
            <div className="bg-white border border-indigo-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 text-white">
                <div className="flex items-center gap-2 mb-0.5">
                  <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Before We Start</span>
                </div>
                <div className="font-bold text-base">AI needs a few details</div>
                <div className="text-xs opacity-75 mt-0.5">Answer below so the AI team can work accurately</div>
              </div>

              <div className="px-5 py-4 space-y-4">
                {clarification.questions.map((q, i) => (
                  <div key={q.id}>
                    <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                      {i + 1}. {q.question}
                      {q.required && <span className="text-red-400 ml-0.5">*</span>}
                    </label>

                    {q.type === 'select' && q.options ? (
                      <div className="grid gap-1.5">
                        {q.options.map(opt => (
                          <button key={opt}
                            onClick={() => setClarification(prev => prev ? { ...prev, answers: { ...prev.answers, [q.id]: opt } } : prev)}
                            className={`text-left px-3 py-2 rounded-xl border-2 text-sm transition-all ${clarification.answers[q.id] === opt ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold' : 'border-gray-200 hover:border-indigo-300 text-gray-700'}`}
                          >
                            {clarification.answers[q.id] === opt && <span className="mr-1.5">✓</span>}{opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        rows={2}
                        value={clarification.answers[q.id] ?? ''}
                        onChange={e => setClarification(prev => prev ? { ...prev, answers: { ...prev.answers, [q.id]: e.target.value } } : prev)}
                        placeholder={q.hint ?? 'Your answer…'}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={submitClarifications}
                    disabled={clarification.questions.filter(q => q.required).some(q => !clarification.answers[q.id]?.trim())}
                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    Start Execution
                  </button>
                  <button
                    onClick={() => { const { taskId } = clarification; setClarification(null); executeTask(taskId, {}, taskNotes[taskId]) }}
                    className="px-3 py-2.5 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl transition-colors"
                    title="Skip questions and execute anyway"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Checking requirements loading card ── */}
          {isClarifying && !clarification && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-3">
              <Spinner />
              <div>
                <div className="text-sm font-semibold text-gray-800">Checking requirements…</div>
                <div className="text-xs text-gray-400 mt-0.5">AI is reviewing what's needed before starting</div>
              </div>
            </div>
          )}

          {/* ── Work Coach card ── */}
          {isExecuting && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Header */}
              <div className="px-5 py-4 text-white bg-gradient-to-r from-indigo-600 to-purple-600">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold uppercase tracking-widest opacity-70">AI Work Coach</span>
                </div>
                <div className="font-bold text-base">AI Team at Work…</div>
                {executionTeam && (
                  <div className="text-xs opacity-75 mt-0.5">
                    {executionTeam.team.length} specialists · ~{executionTeam.estimatedMinutes} min remaining
                  </div>
                )}
              </div>

              {/* Pipeline stages */}
              {executionAgents.length > 0 && (
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center gap-1">
                    {PIPELINE_STAGES.map((name, i) => {
                      const stageNum  = i + 1
                      const isDone    = doneStage >= stageNum
                      const isWorking = workingStage === stageNum && !isDone
                      return (
                        <div key={i} className="flex items-center flex-1 min-w-0">
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${isDone ? 'bg-green-500 text-white' : isWorking ? 'bg-indigo-500 text-white ring-4 ring-indigo-100' : 'bg-gray-100 text-gray-400'}`}>
                              {isDone ? '✓' : isWorking ? <Spinner size="xs" color="white" /> : stageNum}
                            </div>
                            <span className={`text-xs truncate max-w-full ${isDone ? 'text-green-600' : isWorking ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`} style={{ fontSize: '9px' }}>
                              {name}
                            </span>
                          </div>
                          {i < PIPELINE_STAGES.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-0.5 mb-3 rounded-full transition-colors ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Agent list */}
              {executionAgents.length > 0 && (
                <div className="px-4 py-3 space-y-2 border-t border-gray-100">
                  {executionAgents.map((a, i) => (
                    <div key={i} className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${a.status === 'working' ? 'bg-indigo-50' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${a.status === 'done' ? 'bg-green-100 text-green-600' : a.status === 'working' ? 'bg-indigo-100' : 'bg-gray-100 text-gray-400'}`}>
                        {a.status === 'done' ? '✓' : a.status === 'working' ? <Spinner size="xs" /> : '·'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-semibold truncate ${a.status === 'working' ? 'text-indigo-700' : 'text-gray-700'}`}>{a.agent}</div>
                        <div className="text-xs text-gray-400 truncate">{a.status === 'working' && a.message ? a.message : a.role}</div>
                      </div>
                      {a.status === 'done' && <span className="text-xs text-green-500 font-medium flex-shrink-0">Done</span>}
                    </div>
                  ))}
                </div>
              )}

              {executionTeam?.approach && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 leading-relaxed">{executionTeam.approach}</p>
                </div>
              )}
            </div>
          )}


          {/* ── Idle state ── */}
          {!showCoach && !loading && !result && (
            <div className="bg-white border border-gray-200 rounded-2xl p-7 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-xl">🤖</div>
              <div className="font-semibold text-gray-800 mb-1.5">AI Work Coach</div>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Add a task, expand it, and click <strong className="text-gray-600">"Execute with AI Team"</strong> to see your AI specialists work in real time
              </p>
              <div className="space-y-2 text-left">
                {[['🔍', 'Analyst reads your emails + drawings'], ['📋', 'Planner selects the right specialists'], ['⚙️', 'Team delivers quality work'], ['📤', 'You send the result to client']].map(([icon, text], i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-gray-500">
                    <span className="text-sm">{icon}</span>{text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── WORK_SUPPORT result ── */}
          {!loading && !showCoach && result && (
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1.5">Today's Focus</p>
                <p className="font-semibold text-gray-900 text-sm mb-1">{result.priorityTask}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{result.recommendation}</p>
              </div>
              {result.focusBlocks.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">Focus Blocks</p>
                  <div className="space-y-2">
                    {result.focusBlocks.map((b, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-xs font-mono text-gray-400 w-24 flex-shrink-0 pt-px">{b.start}–{b.end}</span>
                        <span className="text-xs text-gray-700 leading-relaxed">{b.task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.bottlenecks.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">Bottlenecks</p>
                  <ul className="space-y-1.5">{result.bottlenecks.map((b, i) => <li key={i} className="text-xs text-red-700 flex gap-2"><span>•</span><span>{b}</span></li>)}</ul>
                </div>
              )}
              {result.automationOpportunities.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Automation Ideas</p>
                  <ul className="space-y-1.5">{result.automationOpportunities.map((a, i) => <li key={i} className="text-xs text-green-700 flex gap-2"><span>→</span><span>{a}</span></li>)}</ul>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>

    {/* ── Workspace undo toast ── */}
    {wsUndoToast && (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm backdrop-blur-sm">
        <span className="text-gray-300">Workspace "<span className="text-white font-semibold">{wsUndoToast.wsTitle}</span>" deleted</span>
        <button onClick={() => undoDeleteWorkspace(wsUndoToast.wsId)} className="text-indigo-300 font-bold hover:text-indigo-200 transition-colors">Undo</button>
        <button onClick={() => setWsUndoToast(null)} className="text-gray-500 hover:text-gray-300 ml-1 transition-colors">✕</button>
      </div>
    )}

    {/* ── Undo toast ── */}
    {undoToast && (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm backdrop-blur-sm">
        <span className="text-gray-300">"<span className="text-white font-semibold">{undoToast.taskTitle}</span>" deleted</span>
        <button onClick={() => undoDelete(undoToast.taskId)} className="text-indigo-300 font-bold hover:text-indigo-200 transition-colors">Undo</button>
        <button onClick={() => setUndoToast(null)} className="text-gray-500 hover:text-gray-300 ml-1 transition-colors">✕</button>
      </div>
    )}

</>
  )
}
