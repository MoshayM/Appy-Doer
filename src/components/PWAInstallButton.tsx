'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallButton({ className = '' }: { className?: string }) {
  const [prompt, setPrompt]             = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled]       = useState(false)
  const [isIOS, setIsIOS]               = useState(false)
  const [showIOSSheet, setShowIOSSheet] = useState(false)

  useEffect(() => {
    /* Already running as installed PWA */
    if (window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as { standalone?: boolean }).standalone === true) {
      setInstalled(true)
      return
    }

    /* iOS Safari — beforeinstallprompt is not fired */
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
                !/crios|fxios|opios/i.test(navigator.userAgent) && // not Chrome/Firefox on iOS
                !('MSStream' in window)
    setIsIOS(ios)

    /* Chrome / Edge / Android Chrome / desktop Chromium */
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  if (installed) {
    return (
      <div className={`flex items-center gap-2 text-sm text-emerald-600 font-semibold ${className}`}>
        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-xs">✓</span>
        AppyDoer is installed
      </div>
    )
  }

  /* Chrome / Edge / Android — native install prompt */
  if (prompt) {
    return (
      <button
        onClick={async () => {
          await prompt.prompt()
          const { outcome } = await prompt.userChoice
          if (outcome === 'accepted') setInstalled(true)
          setPrompt(null)
        }}
        className={`inline-flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-200 ${className}`}
      >
        <Download size={16} />
        Install App — Free
      </button>
    )
  }

  /* iOS Safari — show share-sheet instructions */
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSSheet(true)}
          className={`inline-flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all ${className}`}
        >
          <Share size={16} />
          Add to Home Screen
        </button>

        {showIOSSheet && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
              <button
                onClick={() => setShowIOSSheet(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/icon-96.png" alt="" width={48} height={48} className="rounded-xl" />
                <div>
                  <div className="font-bold text-gray-900">AppyDoer</div>
                  <div className="text-xs text-gray-500">AI Workforce OS</div>
                </div>
              </div>

              <p className="text-sm font-semibold text-gray-900 mb-4">Install on your iPhone / iPad</p>

              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                  <span>
                    Tap the{' '}
                    <span className="inline-flex items-center gap-1 font-semibold bg-gray-100 px-2 py-0.5 rounded-md text-xs">
                      Share <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                    </span>
                    {' '}button in Safari&apos;s toolbar
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                  <span>Scroll down and tap <span className="font-semibold">&ldquo;Add to Home Screen&rdquo;</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                  <span>Tap <span className="font-semibold">Add</span> — AppyDoer launches like a native app</span>
                </li>
              </ol>

              <div className="mt-5 text-xs text-gray-400 text-center">
                Works offline · No App Store needed · Updates automatically
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  /* Fallback for unsupported browsers / already handled */
  return null
}
