'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

const LANGUAGES = [
  { code: 'Hindi',     label: 'हिंदी — Hindi' },
  { code: 'Bengali',   label: 'বাংলা — Bengali' },
  { code: 'Tamil',     label: 'தமிழ் — Tamil' },
  { code: 'Telugu',    label: 'తెలుగు — Telugu' },
  { code: 'Marathi',   label: 'मराठी — Marathi' },
  { code: 'Gujarati',  label: 'ગુજરાતી — Gujarati' },
  { code: 'Kannada',   label: 'ಕನ್ನಡ — Kannada' },
  { code: 'Malayalam', label: 'മലയാളം — Malayalam' },
  { code: 'Punjabi',   label: 'ਪੰਜਾਬੀ — Punjabi' },
  { code: 'Odia',      label: 'ଓଡ଼ିଆ — Odia' },
  { code: 'Urdu',      label: 'اردو — Urdu' },
]

const DROPDOWN_W = 232 // px — matches w-58 below

interface DropPos { top: number; left: number }

interface TranslateButtonProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTranslated: (data: Record<string, any>, lang: string) => void
  isTranslated: boolean
  activeLanguage?: string
  onReset: () => void
  size?: 'sm' | 'md'
}

export function TranslateButton({
  content,
  onTranslated,
  isTranslated,
  activeLanguage = '',
  onReset,
  size = 'md',
}: TranslateButtonProps) {
  const [open, setOpen]       = useState(false)
  const [dropPos, setDropPos] = useState<DropPos | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const btnRef      = useRef<HTMLButtonElement>(null)
  const dropRef     = useRef<HTMLDivElement>(null)

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (
        dropRef.current && !dropRef.current.contains(e.target as Node) &&
        btnRef.current  && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    function onScroll() { setOpen(false) }
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  function toggleOpen() {
    if (open) { setOpen(false); return }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      // Align right edge of dropdown with right edge of button, clamp to viewport
      const left = Math.max(8, Math.min(r.right - DROPDOWN_W, window.innerWidth - DROPDOWN_W - 8))
      setDropPos({ top: r.bottom + 6, left })
    }
    setOpen(true)
  }

  async function translate(lang: string) {
    setOpen(false)
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, targetLanguage: lang }),
      })
      const data = await res.json()
      if (res.ok) {
        onTranslated(data.translated, lang)
      } else {
        setError(data.error?.message ?? 'Translation failed')
      }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const sm   = size === 'sm'
  const base = sm
    ? 'text-xs px-2 py-1 rounded-lg font-medium inline-flex items-center gap-1.5 transition-colors'
    : 'text-sm px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1.5 transition-colors'

  if (isTranslated) {
    return (
      <div className="inline-flex items-center gap-2 flex-wrap">
        <span className={`${base} bg-green-50 text-green-700 border border-green-200`}>
          🌐 {activeLanguage}
        </span>
        <button
          onClick={onReset}
          className={`${base} border border-gray-200 text-gray-500 hover:bg-gray-50`}
        >
          View Original
        </button>
      </div>
    )
  }

  const dropdown = open && dropPos
    ? createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', top: dropPos.top, left: dropPos.left, width: DROPDOWN_W, zIndex: 99999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Select Language</p>
          </div>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => translate(lang.code)}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {lang.label}
            </button>
          ))}
        </div>,
        document.body
      )
    : null

  return (
    <>
      {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
      <button
        ref={btnRef}
        onClick={toggleOpen}
        disabled={loading}
        className={`${base} border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50`}
      >
        {loading ? (
          <>
            <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Translating…
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
            </svg>
            Translate
          </>
        )}
      </button>
      {dropdown}
    </>
  )
}
