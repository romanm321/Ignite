import type { Metadata, Viewport } from 'next'
import 'leaflet/dist/leaflet.css'
import './globals.css'
import { tdSansBody, tdSansHeadline } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'TD Reimagined — The next-generation TD Bank app',
  description:
    'A modernized TD Bank mobile experience: global money, smart card controls, high-yield vaults, Tedi conversational banking, and a branch booking tool with live wait times.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'TD', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#033d1e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${tdSansHeadline.variable} ${tdSansBody.variable} bg-background`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
