import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', preload: true })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',         // iOS notch / Dynamic Island safe area
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#06b6d4' },
    { media: '(prefers-color-scheme: dark)',  color: '#0e7490' },
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
  keywords: ['freelance', 'AI', 'income', 'opportunities', 'clients', 'portfolio', 'India', 'PWA'],
  authors: [{ name: 'AppyDoer' }],
  creator: 'AppyDoer',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon.svg',     type: 'image/svg+xml'        },  // Chrome, Firefox, Safari — crisp at any size
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
      { url: '/favicon-32.png',      sizes: '32x32',   type: 'image/png' },  // classic browsers
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },  // iOS home screen
      { url: '/icons/icon-152.png',   sizes: '152x152', type: 'image/png' },
    ],
    shortcut: '/icons/icon.svg',
  },
  appleWebApp: {
    capable:         true,
    title:           'AppyDoer',
    statusBarStyle:  'black-translucent',  // Shows content under iOS status bar
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
        {/* Cross-browser / cross-platform compatibility */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* Android Chrome home screen */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="AppyDoer" />
        {/* Windows Tiles (Edge / IE) */}
        <meta name="msapplication-TileColor" content="#06b6d4" />
        <meta name="msapplication-TileImage" content="/icons/icon-144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        {/* Safari pinned tab */}
        <link rel="mask-icon" href="/icons/icon.svg" color="#06b6d4" />
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* iOS status bar appears correct when app is added to home screen */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen min-h-dvh`}>{children}</body>
    </html>
  )
}
