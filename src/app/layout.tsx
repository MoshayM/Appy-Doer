import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', preload: true })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6366f1' },
    { media: '(prefers-color-scheme: dark)',  color: '#4f46e5' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://appy-doer.vercel.app'),
  title: {
    default:  'AppyDoer — AI Workforce Operating System',
    template: '%s | AppyDoer',
  },
  description:
    'Discover opportunities, acquire clients, deliver actual work, and build recurring income — with your AI-powered virtual team.',
  keywords: ['freelance', 'AI', 'income', 'opportunities', 'clients', 'portfolio', 'India'],
  authors: [{ name: 'AppyDoer' }],
  creator: 'AppyDoer',
  manifest: '/manifest.json',
  icons: {
    icon:             [
      { url: '/icons/icon.svg',     type: 'image/svg+xml' },   // modern browsers — crisp at all sizes
      { url: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple:            '/apple-touch-icon.png',
    shortcut:         '/icons/icon.svg',
  },
  appleWebApp: {
    capable:         true,
    title:           'AppyDoer',
    statusBarStyle:  'black-translucent',
  },
  openGraph: {
    type:        'website',
    locale:      'en_IN',
    url:         '/',
    title:       'AppyDoer — AI Workforce Operating System',
    description: 'Your AI-powered virtual team for freelance income, client acquisition, and work delivery.',
    siteName:    'AppyDoer',
    images:      [{ url: '/og-image.png', width: 1200, height: 630, alt: 'AppyDoer' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'AppyDoer',
    description: 'AI Workforce OS — discover, acquire, deliver, earn.',
    images:      ['/og-image.png'],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Cross-browser compatibility */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="AppyDoer" />
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen`}>{children}</body>
    </html>
  )
}
