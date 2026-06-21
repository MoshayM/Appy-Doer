'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectedAccount {
  platform:          string
  providerAccountId: string | null
  accountEmail:      string | null
  profileUrl:        string | null
  profileData:       Record<string, unknown> | null
  enabled:           boolean
  status:            string
  tokenExpiry:       string | null
  connectedAt:       string
  updatedAt:         string
}

interface EmailTrack {
  id:             string
  trackingId:     string
  recipientEmail: string
  subject:        string
  sentVia:        string
  sentAt:         string
  openedAt:       string | null
  openCount:      number
  repliedAt:      string | null
  leadId:         string | null
  emailThreadId:  string | null
}

// ─── Health status ────────────────────────────────────────────────────────────

type HealthStatus = 'connected' | 'expired' | 'expiring_soon' | 'url_only' | 'imported'

function getHealth(account: ConnectedAccount | undefined, isOAuthPlatform: boolean): HealthStatus {
  if (!account) return 'connected' // not connected — caller handles this
  if (!isOAuthPlatform) return 'url_only'
  if (!account.tokenExpiry) return 'connected'
  const expiry = new Date(account.tokenExpiry).getTime()
  const now    = Date.now()
  if (expiry < now)                     return 'expired'
  if (expiry < now + 3 * 24 * 3600000) return 'expiring_soon'
  return 'connected'
}

function HealthBadge({ status }: { status: HealthStatus }) {
  const map: Record<HealthStatus, { label: string; cls: string }> = {
    connected:     { label: '✓ Connected',     cls: 'bg-green-100 text-green-700' },
    imported:      { label: '✓ Imported',      cls: 'bg-green-100 text-green-700' },
    url_only:      { label: '✓ URL Saved',     cls: 'bg-blue-100 text-blue-700'  },
    expiring_soon: { label: '⚠ Expiring Soon', cls: 'bg-amber-100 text-amber-700' },
    expired:       { label: '⚠ Token Expired', cls: 'bg-red-100 text-red-700'    },
  }
  const { label, cls } = map[status]
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
}

// ─── Platform config ──────────────────────────────────────────────────────────

interface PlatformDef {
  key:              string
  label:            string
  icon:             string
  color:            string
  desc:             string
  dataNote:         string
  oauthOnly?:       boolean
  noOAuth?:         boolean
  urlFallback?:     boolean
  urlPlaceholder?:  string
  urlHint?:         string
  fileUpload?:      boolean
}

const PLATFORMS: PlatformDef[] = [
  {
    key:       'gmail',
    label:     'Gmail',
    icon:      '📧',
    color:     'bg-red-500',
    desc:      'Send cold emails directly from YOUR Gmail inbox and track when prospects open or reply.',
    dataNote:  'Send + read threads only — no inbox browsing or data storage',
    oauthOnly: true,
  },
  {
    key:          'github',
    label:        'GitHub',
    icon:         '🐙',
    color:        'bg-gray-800',
    desc:         'Add your GitHub bio, repositories, and skills as portfolio evidence for AI assessment.',
    dataNote:     'Name, bio, location, public repos, primary email — read-only',
    urlFallback:  true,
    urlPlaceholder: 'https://github.com/username  or just  username',
    urlHint:      'Public API — fetches your name, bio, location, and top repos without any OAuth.',
  },
  {
    key:          'linkedin',
    label:        'LinkedIn',
    icon:         '💼',
    color:        'bg-blue-600',
    desc:         'Import your headline, experience, and education so AI builds richer, evidence-backed profiles.',
    dataNote:     'Name, headline, profile photo, email — read-only',
    urlFallback:  true,
    urlPlaceholder: 'https://www.linkedin.com/in/your-name',
    urlHint:      'Paste your LinkedIn profile URL. Stored as a reference for AI context.',
  },
  {
    key:          'youtube',
    label:        'YouTube',
    icon:         '▶️',
    color:        'bg-red-600',
    desc:         'Link your YouTube channel — subscriber count and content niche strengthen your authority profile.',
    dataNote:     'Channel name, description, subscriber count — read-only',
    urlFallback:  true,
    urlPlaceholder: 'https://www.youtube.com/@YourChannel',
    urlHint:      'Paste your YouTube channel URL to store it as a reference.',
  },
  {
    key:          'upwork',
    label:        'Upwork',
    icon:         '💚',
    color:        'bg-green-600',
    desc:         'Connect Upwork to import your job title, hourly rate, and earnings data.',
    dataNote:     'Profile info, rate, job stats — read-only',
    urlFallback:  true,
    urlPlaceholder: 'https://www.upwork.com/freelancers/~your-id',
    urlHint:      'Paste your Upwork profile URL to store it as a reference.',
  },
  {
    key:          'fiverr',
    label:        'Fiverr',
    icon:         '🟢',
    color:        'bg-emerald-500',
    desc:         'Link your Fiverr profile so AI knows your freelancing niche and positioning.',
    dataNote:     'Profile URL only — no public OAuth API available',
    noOAuth:      true,
    urlFallback:  true,
    urlPlaceholder: 'https://www.fiverr.com/your-username',
    urlHint:      'Fiverr has no public OAuth. Paste your profile URL as a reference.',
  },
]

const TEXT_PLATFORMS = [
  {
    key:         'resume',
    label:       'Resume / CV',
    icon:        '📄',
    color:       'bg-teal-600',
    desc:        'Upload your PDF resume or paste text. AI parses name, qualifications, experience, projects, and skills.',
    dataNote:    'Only the text you paste or file you upload — no file stored permanently',
    placeholder: 'Paste your full resume or CV text here…',
    fileUpload:  true,
  },
]

const PLATFORM_DB: Record<string, string> = {
  LINKEDIN:    'linkedin', GITHUB:  'github',  GMAIL:  'gmail',
  YOUTUBE:     'youtube',  FIVERR:  'fiverr',  UPWORK: 'upwork',
  NAUKRI_TEXT: 'naukri',  RESUME:  'resume',  MANUAL: 'manual',
}

const OAUTH_PLATFORMS = new Set(['gmail', 'github', 'linkedin', 'youtube', 'upwork'])

// ─── Progress bar ─────────────────────────────────────────────────────────────

const SETUP_STEPS = [
  { key: 'gmail',  label: 'Connect Gmail',    icon: '📧' },
  { key: 'github', label: 'Connect GitHub',   icon: '🐙' },
  { key: 'linkedin', label: 'Connect LinkedIn', icon: '💼' },
  { key: 'resume', label: 'Upload Resume',    icon: '📄' },
]

function SetupProgress({ accounts }: { accounts: ConnectedAccount[] }) {
  const done = SETUP_STEPS.filter(s => accounts.some(a => PLATFORM_DB[a.platform] === s.key)).length
  const pct  = Math.round((done / SETUP_STEPS.length) * 100)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">Profile Setup</h2>
          <p className="text-xs text-gray-400 mt-0.5">Connect your accounts so AI has real context about you</p>
        </div>
        <span className={`text-2xl font-bold ${pct === 100 ? 'text-green-600' : 'text-indigo-600'}`}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SETUP_STEPS.map(step => {
          const connected = accounts.some(a => PLATFORM_DB[a.platform] === step.key)
          return (
            <div key={step.key} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${connected ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400'}`}>
              <span>{step.icon}</span>
              <span className="font-medium truncate">{step.label}</span>
              {connected && <span className="ml-auto shrink-0">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Manual form ──────────────────────────────────────────────────────────────

interface ManualForm {
  name: string; headline: string; bio: string; location: string
  skillsRaw: string; education: string; interestsRaw: string
  experienceYears: string; website: string
  linkedinUrl: string; githubUrl: string; fiverrUrl: string; upworkUrl: string; youtubeUrl: string
}
const BLANK_MANUAL: ManualForm = {
  name: '', headline: '', bio: '', location: '',
  skillsRaw: '', education: '', interestsRaw: '',
  experienceYears: '', website: '',
  linkedinUrl: '', githubUrl: '', fiverrUrl: '', upworkUrl: '', youtubeUrl: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dt: string) {
  const s = Math.floor((Date.now() - new Date(dt).getTime()) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function flashMessage(params: URLSearchParams): { text: React.ReactNode; ok: boolean } | null {
  const connected = params.get('connected')
  const error     = params.get('error')
  const platform  = params.get('platform')
  if (connected) return { text: `✓ ${connected} connected successfully!`, ok: true }
  if (!error)    return null
  const msgs: Record<string, React.ReactNode> = {
    not_configured:       <><strong>Platform not configured</strong>{platform && <> — {platform} OAuth credentials are missing.</>}<span className="block text-xs opacity-80 mt-0.5">Use the URL import or text import fallback instead.</span></>,
    unknown_platform:     'Unknown platform — not supported.',
    token_exchange_failed:'Connection failed — could not exchange auth code. Please try again.',
    no_email:             'Connection failed — no email returned by provider.',
    oauth_denied:         'Connection cancelled — you denied the permission request.',
    invalid_state:        'Connection failed — session expired. Please try again.',
    callback_failed:      'Connection failed — an error occurred. Please try again.',
  }
  return { text: msgs[error] ?? `Connection failed — ${error.replace(/_/g, ' ')}`, ok: false }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
  const params = useSearchParams()

  const [accounts,    setAccounts]    = useState<ConnectedAccount[]>([])
  const [tracks,      setTracks]      = useState<EmailTrack[]>([])
  const [loading,     setLoading]     = useState(true)
  const [configured,  setConfigured]  = useState<Record<string, boolean>>({})

  // OAuth popup
  const [connecting,  setConnecting]  = useState<string | null>(null)
  const [oauthMsg,    setOauthMsg]    = useState<{ text: string; ok: boolean } | null>(null)
  const popupRef = useRef<Window | null>(null)
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  // Inline URL import (per-platform)
  const [urlExpanded,  setUrlExpanded]  = useState<string | null>(null)
  const [urlInputs,    setUrlInputs]    = useState<Record<string, string>>({})
  const [urlImporting, setUrlImporting] = useState<string | null>(null)
  const [urlMsgs,      setUrlMsgs]      = useState<Record<string, { text: string; ok: boolean }>>({})

  // Text paste modal
  const [pasteTarget, setPasteTarget] = useState<string | null>(null)
  const [pasteText,   setPasteText]   = useState('')
  const [importing,   setImporting]   = useState(false)
  const [importMsg,   setImportMsg]   = useState('')

  // File upload
  const [uploadTarget,  setUploadTarget]  = useState<string | null>(null)
  const [uploadFile,    setUploadFile]    = useState<File | null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [uploadMsg,     setUploadMsg]     = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Manual entry modal
  const [manualOpen,   setManualOpen]   = useState(false)
  const [manualForm,   setManualForm]   = useState<ManualForm>(BLANK_MANUAL)
  const [manualSaving, setManualSaving] = useState(false)
  const [manualMsg,    setManualMsg]    = useState('')

  // Email tracking
  const [checking, setChecking] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const flash = flashMessage(params)

  useEffect(() => {
    Promise.all([fetchAccounts(), fetchTracks(), fetchStatus()])

    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return
      const d = e.data as { type?: string; platform?: string; message?: string }
      if (!d?.type) return
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
      if (d.type === 'OAUTH_SUCCESS') {
        setConnecting(null)
        setOauthMsg({ text: `✓ ${d.platform ?? 'Account'} connected successfully! Fetching profile…`, ok: true })
        fetchAccounts()
        setTimeout(() => setOauthMsg(null), 5000)
      } else if (d.type === 'OAUTH_ERROR') {
        setConnecting(null)
        setOauthMsg({ text: d.message ?? 'Connection failed — please try again', ok: false })
      }
    }
    window.addEventListener('message', onMessage)
    return () => {
      window.removeEventListener('message', onMessage)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchAccounts() {
    setLoading(true)
    const res = await fetch('/api/connections')
    if (res.ok) setAccounts(await res.json())
    setLoading(false)
  }

  async function fetchTracks() {
    const res = await fetch('/api/email/tracks')
    if (res.ok) setTracks(await res.json())
  }

  async function fetchStatus() {
    try {
      const res = await fetch('/api/auth/connect/status')
      if (res.ok) setConfigured(await res.json())
    } catch {}
  }

  const isConnected = (key: string) => accounts.some(a => PLATFORM_DB[a.platform] === key)
  const getAccount  = (key: string) => accounts.find(a => PLATFORM_DB[a.platform] === key)

  async function disconnect(key: string) {
    await fetch(`/api/connections/${key}`, { method: 'DELETE' })
    fetchAccounts()
  }

  function openOAuth(key: string) {
    const W = 540, H = 660
    const left = Math.round(window.screenX + (window.outerWidth  - W) / 2)
    const top  = Math.round(window.screenY + (window.outerHeight - H) / 2)
    const popup = window.open(`/api/auth/connect/${key}`, `wb_oauth_${key}`,
      `width=${W},height=${H},left=${left},top=${top},scrollbars=yes,resizable=yes`)
    if (!popup || popup.closed) { window.location.href = `/api/auth/connect/${key}`; return }
    popupRef.current = popup
    setConnecting(key)
    setOauthMsg(null)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        clearInterval(pollRef.current!); pollRef.current = null
        setConnecting(null); fetchAccounts()
      }
    }, 800)
  }

  // ── Inline URL import ────────────────────────────────────────────────────────

  async function importUrl(key: string) {
    const url = (urlInputs[key] ?? '').trim()
    if (!url) return
    setUrlImporting(key)
    setUrlMsgs(m => ({ ...m, [key]: { text: '', ok: true } }))
    try {
      const res  = await fetch('/api/connections/import-url', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url, platform: key.toUpperCase() }),
      })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch {}
      if (res.ok) {
        setUrlMsgs(m => ({ ...m, [key]: { text: `✓ ${key} profile saved successfully.`, ok: true } }))
        setUrlInputs(u => ({ ...u, [key]: '' }))
        setUrlExpanded(null)
        fetchAccounts()
      } else {
        const msg = (data.error as { message?: string } | undefined)?.message ?? 'Import failed — please try again'
        setUrlMsgs(m => ({ ...m, [key]: { text: msg, ok: false } }))
      }
    } catch {
      setUrlMsgs(m => ({ ...m, [key]: { text: 'Network error — please try again', ok: false } }))
    } finally {
      setUrlImporting(null)
    }
  }

  // ── Text paste import ─────────────────────────────────────────────────────────

  async function importText() {
    if (!pasteTarget || pasteText.length < 50) return
    setImporting(true); setImportMsg('')
    try {
      const res = await fetch('/api/profile/import', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: pasteText, source: pasteTarget }),
      })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch {}
      if (res.ok) {
        setImportMsg('Imported! Your profile data is ready for AI assessments.')
        setPasteText(''); setPasteTarget(null); fetchAccounts()
      } else {
        setImportMsg((data.error as { message?: string } | undefined)?.message ?? 'Import failed — please try again')
      }
    } catch {
      setImportMsg('Network error — please try again')
    } finally {
      setImporting(false)
    }
  }

  // ── File upload ────────────────────────────────────────────────────────────────

  async function uploadResume() {
    if (!uploadFile || !uploadTarget) return
    setUploading(true); setUploadMsg('')
    try {
      const fd = new FormData()
      fd.append('file',   uploadFile)
      fd.append('source', uploadTarget)
      const res  = await fetch('/api/connections/upload-file', { method: 'POST', body: fd })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch {}
      if (res.ok) {
        setUploadMsg('✓ Resume parsed and saved successfully!')
        setUploadFile(null)
        setUploadTarget(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchAccounts()
      } else {
        setUploadMsg((data.error as { message?: string } | undefined)?.message ?? 'Upload failed — please try again')
      }
    } catch {
      setUploadMsg('Network error — please try again')
    } finally {
      setUploading(false)
    }
  }

  // ── Manual entry ──────────────────────────────────────────────────────────────

  const mf = (field: keyof ManualForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setManualForm(p => ({ ...p, [field]: e.target.value }))

  async function saveManual() {
    if (!manualForm.name.trim() && !manualForm.headline.trim()) { setManualMsg('Enter at least your name or headline'); return }
    setManualSaving(true); setManualMsg('')
    try {
      const res = await fetch('/api/connections/manual-entry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:            manualForm.name.trim()      || undefined,
          headline:        manualForm.headline.trim()  || undefined,
          bio:             manualForm.bio.trim()        || undefined,
          location:        manualForm.location.trim()  || undefined,
          skills:          manualForm.skillsRaw ? manualForm.skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
          interests:       manualForm.interestsRaw ? manualForm.interestsRaw.split(',').map(s => s.trim()).filter(Boolean) : [],
          experienceYears: manualForm.experienceYears ? parseInt(manualForm.experienceYears) : undefined,
          education:       manualForm.education.trim()   || undefined,
          website:         manualForm.website.trim()     || undefined,
          linkedinUrl:     manualForm.linkedinUrl.trim() || undefined,
          githubUrl:       manualForm.githubUrl.trim()   || undefined,
          fiverrUrl:       manualForm.fiverrUrl.trim()   || undefined,
          upworkUrl:       manualForm.upworkUrl.trim()   || undefined,
          youtubeUrl:      manualForm.youtubeUrl.trim()  || undefined,
        }),
      })
      let data: Record<string, unknown> = {}
      try { data = await res.json() } catch {}
      if (res.ok) {
        setManualMsg('Profile saved! AI will use this data for all assessments.')
        fetchAccounts()
      } else {
        setManualMsg((data.error as { message?: string } | undefined)?.message ?? 'Save failed — please try again')
      }
    } catch {
      setManualMsg('Network error — please try again')
    } finally {
      setManualSaving(false)
    }
  }

  // ── Email tracking ────────────────────────────────────────────────────────────

  async function checkReply(trackId: string) {
    setChecking(trackId)
    await fetch(`/api/email/tracks/${trackId}/check-reply`, { method: 'POST' })
    setChecking(null)
    fetchTracks()
  }

  async function navigateToThread(emailThreadId: string) {
    window.location.href = `/dashboard/outreach?thread=${emailThreadId}`
  }

  async function deleteTrack(trackId: string) {
    setDeleting(trackId)
    await fetch(`/api/email/tracks/${trackId}`, { method: 'DELETE' })
    setDeleting(null)
    fetchTracks()
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Connect your profiles so AI uses your real experience, skills, and identity for assessments, prospect discovery, and email outreach.
        </p>
      </div>

      {/* Banners */}
      {oauthMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border flex items-start gap-2 ${oauthMsg.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          <span>{oauthMsg.text}</span>
          <button onClick={() => setOauthMsg(null)} className="ml-auto opacity-50 hover:opacity-100 shrink-0 text-lg leading-none">×</button>
        </div>
      )}
      {flash && !oauthMsg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${flash.ok ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {flash.text}
        </div>
      )}

      {/* Progress bar */}
      {!loading && <SetupProgress accounts={accounts} />}

      {/* Privacy notice */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-5 py-4 flex gap-3 items-start">
        <div className="text-xl shrink-0 mt-0.5">🔒</div>
        <div>
          <div className="font-semibold text-indigo-900 text-sm">Your data stays private and isolated</div>
          <p className="text-indigo-700 text-xs mt-1">OAuth tokens are encrypted with AES-256-GCM before storage. Each user&apos;s connections are fully isolated — no data is shared between accounts. Disconnect any account at any time.</p>
        </div>
      </div>

      {/* ── Platform integrations ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Integrations</h2>

        {PLATFORMS.map(p => {
          const connected        = isConnected(p.key)
          const account          = getAccount(p.key)
          const profile          = account?.profileData as Record<string, unknown> | null
          const isConfigured     = configured[p.key] !== false
          const oauthAvailable   = !p.noOAuth && isConfigured
          const isConnectingThis = connecting === p.key
          const urlOpen          = urlExpanded === p.key
          const urlVal           = urlInputs[p.key] ?? ''
          const urlMsg           = urlMsgs[p.key]
          const isImportingThis  = urlImporting === p.key

          const showUrlFallback = p.urlFallback && (!oauthAvailable || p.noOAuth)
          const showUrlOption   = p.urlFallback && oauthAvailable && !p.noOAuth && !connected

          const health = connected && account
            ? getHealth(account, OAUTH_PLATFORMS.has(p.key))
            : null

          return (
            <div key={p.key} className={`bg-white border rounded-2xl transition-all ${urlOpen ? 'border-indigo-300 shadow-sm' : 'border-gray-200'}`}>
              <div className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 ${p.color} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                  {p.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{p.label}</span>
                    {connected && health && <HealthBadge status={health} />}
                    {!connected && p.noOAuth && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">URL only</span>}
                    {!connected && !p.noOAuth && !isConfigured && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">OAuth not configured</span>}
                  </div>

                  <p className="text-sm text-gray-500 mt-0.5">{p.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">🔐 {p.dataNote}</p>

                  {p.key === 'gmail' && !isConfigured && !connected && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      Gmail integration requires <strong>GOOGLE_CLIENT_ID</strong> and <strong>GOOGLE_CLIENT_SECRET</strong> environment variables.
                    </div>
                  )}
                  {p.key === 'gmail' && isConfigured && !connected && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      Connects your personal Gmail — you choose which account. Completely separate from your login method.
                    </div>
                  )}

                  {/* Token expiry warning */}
                  {connected && (health === 'expired' || health === 'expiring_soon') && (
                    <div className={`mt-2 text-xs rounded-lg px-3 py-2 border ${health === 'expired' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {health === 'expired'
                        ? 'Your OAuth token has expired. Click Reconnect to restore access.'
                        : 'Your OAuth token expires soon. Reconnect now to avoid interruption.'}
                    </div>
                  )}

                  {/* Connected profile details */}
                  {connected && account && (
                    <div className="mt-2.5 space-y-1.5 text-xs text-gray-500">
                      {p.key === 'gmail' ? (
                        /* Gmail-specific detail layout */
                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 space-y-1.5">
                          {account.accountEmail && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-semibold">📧 Connected account:</span>
                              <strong className="text-green-800">{account.accountEmail}</strong>
                              <span className="text-green-600 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded font-medium">Sending enabled</span>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4 text-green-700">
                            <span>Connected: {new Date(account.connectedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span>Last sync: {timeAgo(account.updatedAt)}</span>
                            {health === 'expiring_soon' && <span className="text-amber-600 font-medium">⚠ Token expiring soon — reconnect</span>}
                            {health === 'expired'       && <span className="text-red-600 font-medium">⚠ Token expired — reconnect required</span>}
                          </div>
                        </div>
                      ) : (
                        /* Default detail layout for all other platforms */
                        <div className="flex flex-wrap gap-3 items-center">
                          {account.accountEmail && (
                            <span className="flex items-center gap-1">
                              📧 <strong className="text-gray-700">{account.accountEmail}</strong>
                            </span>
                          )}
                          {!!profile?.name        && <span>👤 {String(profile.name)}</span>}
                          {!!profile?.location    && <span>📍 {String(profile.location)}</span>}
                          {!!profile?.subscribers && <span>👥 {Number(profile.subscribers).toLocaleString()} subscribers</span>}
                          {!!profile?.hourlyRate  && <span>💰 {String(profile.hourlyRate)}</span>}
                          {!!profile?.username    && <span>@{String(profile.username)}</span>}
                          {account.providerAccountId && <span className="text-gray-300">ID: {account.providerAccountId}</span>}
                          <span className="text-gray-300">· connected {timeAgo(account.connectedAt)}</span>
                        </div>
                      )}

                      {(profile?.skills as string[] | undefined)?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-gray-400">Skills:</span>
                          {(profile!.skills as string[]).slice(0, 6).map((s, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 shrink-0 items-end">
                  {connected ? (
                    <div className="flex flex-col gap-1.5 items-end">
                      {account?.profileUrl && (
                        <a href={account.profileUrl} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                          View ↗
                        </a>
                      )}
                      {p.key === 'gmail' && (
                        <a href="/dashboard/clients" className="px-3 py-1.5 text-xs border border-green-200 rounded-lg text-green-700 hover:bg-green-50 transition-colors">
                          Send Email →
                        </a>
                      )}
                      {p.key === 'gmail' && oauthAvailable && (
                        <button onClick={() => openOAuth(p.key)}
                          className="px-3 py-1.5 text-xs border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                          Change Account
                        </button>
                      )}
                      {oauthAvailable && (
                        <button onClick={() => openOAuth(p.key)}
                          className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${health === 'expired' ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>
                          {health === 'expired' ? 'Reconnect' : p.key === 'gmail' ? 'Reconnect' : 'Reconnect'}
                        </button>
                      )}
                      <button onClick={() => disconnect(p.key)}
                        className="px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                        Disconnect
                      </button>
                    </div>
                  ) : isConnectingThis ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700 text-xs font-medium">
                        <span className="inline-block w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                        Connecting…
                      </div>
                      <button onClick={() => {
                        if (popupRef.current && !popupRef.current.closed) popupRef.current.close()
                        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
                        setConnecting(null)
                      }} className="text-xs text-gray-400 hover:text-red-500 underline">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 items-end">
                      {oauthAvailable && !p.noOAuth && (
                        <button onClick={() => openOAuth(p.key)}
                          className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                          Connect
                        </button>
                      )}
                      {p.key === 'gmail' && !isConfigured && (
                        <span className="text-xs text-gray-400 max-w-[140px] text-right">Requires server credentials</span>
                      )}
                      {(showUrlFallback || showUrlOption) && (
                        <button
                          onClick={() => setUrlExpanded(urlOpen ? null : p.key)}
                          className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-colors border ${
                            showUrlFallback
                              ? 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {showUrlFallback ? 'Add Profile URL' : 'Import URL instead'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Inline URL import */}
              {urlOpen && !connected && p.urlFallback && (
                <div className="border-t border-indigo-100 px-5 pb-5 pt-4 space-y-3">
                  {p.urlHint && (
                    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                      {p.key === 'github' && <span className="text-green-700 font-medium mr-1">✓ Public API —</span>}
                      {p.urlHint}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={p.urlPlaceholder}
                      value={urlVal}
                      onChange={e => setUrlInputs(u => ({ ...u, [p.key]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') importUrl(p.key); if (e.key === 'Escape') setUrlExpanded(null) }}
                    />
                    <button
                      onClick={() => importUrl(p.key)}
                      disabled={isImportingThis || !urlVal}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {isImportingThis ? 'Saving…' : p.key === 'github' ? 'Fetch & Save' : 'Save URL'}
                    </button>
                    <button onClick={() => { setUrlExpanded(null); setUrlMsgs(m => ({ ...m, [p.key]: { text: '', ok: true } })) }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                  {urlMsg?.text && (
                    <p className={`text-sm ${urlMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{urlMsg.text}</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* ── Resume / Text Import ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Resume & Profile Import</h2>
          <p className="text-xs text-gray-400 mt-0.5">Upload a PDF or paste text — AI extracts the relevant data automatically.</p>
        </div>
        {TEXT_PLATFORMS.map(p => {
          const connected = isConnected(p.key)
          return (
            <div key={p.key} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 ${p.color} rounded-xl flex items-center justify-center text-xl shrink-0`}>{p.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{p.label}</span>
                    {connected && <HealthBadge status="imported" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{p.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">🔐 {p.dataNote}</p>
                </div>
                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  {p.fileUpload && (
                    <button
                      onClick={() => { setUploadTarget(p.key); setUploadFile(null); setUploadMsg('') }}
                      className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                      {connected ? 'Re-upload PDF' : 'Upload PDF'}
                    </button>
                  )}
                  <button
                    onClick={() => { setPasteTarget(p.key); setPasteText(''); setImportMsg('') }}
                    className="px-4 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    {connected ? 'Re-import Text' : 'Paste Text'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* ── Manual Entry ──────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Manual Entry</h2>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-xl shrink-0">✍️</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Manual Profile</span>
              {isConnected('manual') && <HealthBadge status="imported" />}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Fill in your name, skills, education, and interests directly — gives AI the highest-quality, most accurate context.</p>
            <p className="text-xs text-gray-400 mt-1">🔐 Only what you enter — full control</p>
          </div>
          <button onClick={() => { setManualOpen(true); setManualMsg('') }}
            className="px-4 py-1.5 text-xs bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shrink-0">
            {isConnected('manual') ? 'Update' : 'Fill in'}
          </button>
        </div>
      </section>

      {/* ── Email Tracking ────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email Tracking</h2>
          {tracks.length > 0 && <span className="text-xs text-gray-400">{tracks.length} emails sent</span>}
        </div>

        {tracks.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500">To</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Sent via</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Opens</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Reply</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Conversation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tracks.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700 max-w-[140px] truncate">{t.recipientEmail}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{t.subject}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded font-medium ${t.sentVia === 'GMAIL' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {t.sentVia}
                      </span>
                      <span className="ml-1.5 text-gray-300">{timeAgo(t.sentAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {t.openCount > 0
                        ? <span className="text-green-600 font-semibold">{t.openCount}×{t.openedAt && <span className="text-xs font-normal text-gray-400 ml-1">({timeAgo(t.openedAt)})</span>}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {t.repliedAt
                        ? <span className="text-green-600 font-medium text-xs">✓ Replied</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {t.emailThreadId ? (
                        <button
                          onClick={() => navigateToThread(t.emailThreadId!)}
                          className="text-xs text-indigo-600 hover:underline font-medium"
                        >
                          View →
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => checkReply(t.id)} disabled={checking === t.id || deleting === t.id}
                          className="text-xs text-indigo-600 hover:underline disabled:opacity-50">
                          {checking === t.id ? 'Checking…' : 'Check reply'}
                        </button>
                        <button onClick={() => deleteTrack(t.id)} disabled={deleting === t.id || checking === t.id}
                          className="text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                          title="Delete">
                          {deleting === t.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center">
            <div className="text-3xl mb-2">📬</div>
            <p className="text-sm text-gray-400">No emails tracked yet.</p>
            <p className="text-xs text-gray-300 mt-1">Send cold emails from the <a href="/dashboard/clients" className="text-indigo-500 hover:underline">Client Intelligence</a> page to start tracking opens and replies.</p>
          </div>
        ) : null}
      </section>

      {/* ═══════════ PDF Upload Modal ═══════════ */}
      {uploadTarget && (() => {
        const meta = TEXT_PLATFORMS.find(p => p.key === uploadTarget)!
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setUploadTarget(null) }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Upload {meta.label}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">PDF only — AI will extract all relevant professional data.</p>
                </div>
                <button onClick={() => setUploadTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
              <div className="p-6 space-y-4">
                {/* Drop zone */}
                <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-colors ${uploadFile ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={e => { setUploadFile(e.target.files?.[0] ?? null); setUploadMsg('') }}
                  />
                  <div className="text-3xl">{uploadFile ? '📄' : '⬆️'}</div>
                  {uploadFile
                    ? <div className="text-center"><p className="text-sm font-medium text-indigo-700">{uploadFile.name}</p><p className="text-xs text-gray-400 mt-0.5">{(uploadFile.size / 1024).toFixed(0)} KB</p></div>
                    : <div className="text-center"><p className="text-sm text-gray-600">Click to select or drag &amp; drop your PDF</p><p className="text-xs text-gray-400 mt-0.5">PDF only · Max 10 MB</p></div>
                  }
                </label>

                {uploadMsg && (
                  <p className={`text-sm ${uploadMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{uploadMsg}</p>
                )}

                <div className="bg-gray-50 rounded-lg px-4 py-3 text-xs text-gray-500">
                  <strong>No PDF?</strong> Close this and use <span className="text-indigo-600">Paste Text</span> instead — copy your resume text from Word or Google Docs.
                </div>

                <div className="flex gap-2 justify-end">
                  <button onClick={() => setUploadTarget(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button
                    onClick={uploadResume}
                    disabled={!uploadFile || uploading}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {uploading ? 'Parsing with AI…' : 'Upload & Parse'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══════════ Text Paste Modal ═══════════ */}
      {pasteTarget && (() => {
        const meta = TEXT_PLATFORMS.find(p => p.key === pasteTarget)!
        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setPasteTarget(null) }}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900">Import {meta.label}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">AI will extract name, education, skills, and interests automatically.</p>
                </div>
                <button onClick={() => setPasteTarget(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
              </div>
              <div className="p-6 space-y-4">
                <textarea rows={10}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none font-mono"
                  placeholder={meta.placeholder}
                  value={pasteText}
                  onChange={e => setPasteText(e.target.value)} />
                {importMsg && (
                  <p className={`text-sm ${importMsg.startsWith('Imported') ? 'text-green-600' : 'text-red-600'}`}>{importMsg}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setPasteTarget(null)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={importText} disabled={importing || pasteText.length < 50}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                    {importing ? 'Parsing with AI…' : 'Import with AI'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══════════ Manual Entry Modal ═══════════ */}
      {manualOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setManualOpen(false) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Manual Profile Entry</h2>
                <p className="text-xs text-gray-400 mt-0.5">Fill in your details directly — AI uses this as authoritative profile data.</p>
              </div>
              <button onClick={() => setManualOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. Priya Sharma" value={manualForm.name} onChange={mf('name')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Headline / Job Title</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. Full-Stack Developer" value={manualForm.headline} onChange={mf('headline')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Education</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. MBA in Finance — IIM Calcutta, 2023" value={manualForm.education} onChange={mf('education')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. Bangalore, India" value={manualForm.location} onChange={mf('location')} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input type="number" min="0" max="50"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. 5" value={manualForm.experienceYears} onChange={mf('experienceYears')} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Skills <span className="font-normal text-gray-400">(comma-separated)</span></label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. Python, Data Analysis, Excel, Power BI" value={manualForm.skillsRaw} onChange={mf('skillsRaw')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Interests <span className="font-normal text-gray-400">(comma-separated)</span></label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="e.g. Finance, SaaS, EdTech, AI" value={manualForm.interestsRaw} onChange={mf('interestsRaw')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">About / Bio</label>
                <textarea rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  placeholder="Brief professional summary…" value={manualForm.bio} onChange={mf('bio')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Website / Portfolio</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="https://yourwebsite.com" value={manualForm.website} onChange={mf('website')} />
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Social profile URLs <span className="font-normal text-gray-400">(optional)</span></p>
                <div className="space-y-2">
                  {([
                    ['linkedinUrl', '💼 LinkedIn', 'https://linkedin.com/in/…'],
                    ['githubUrl',   '🐙 GitHub',   'https://github.com/…'],
                    ['fiverrUrl',   '🟢 Fiverr',   'https://fiverr.com/…'],
                    ['upworkUrl',   '💚 Upwork',   'https://upwork.com/freelancers/…'],
                    ['youtubeUrl',  '▶️ YouTube',  'https://youtube.com/@…'],
                  ] as [keyof ManualForm, string, string][]).map(([field, label, ph]) => (
                    <div key={field} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
                      <input className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder={ph} value={manualForm[field] as string} onChange={mf(field)} />
                    </div>
                  ))}
                </div>
              </div>
              {manualMsg && (
                <p className={`text-sm ${manualMsg.includes('saved') ? 'text-green-600' : 'text-red-600'}`}>{manualMsg}</p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setManualOpen(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={saveManual} disabled={manualSaving}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {manualSaving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
