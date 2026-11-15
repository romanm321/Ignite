import type { Metadata, Viewport } from 'next'
import { Inter, Inter_Tight } from 'next/font/google'
import 'leaflet/dist/leaflet.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-inter-tight' })

export const metadata: Metadata = {
  title: 'TD Bank',
  description:
    'A modernized TD Bank mobile experience: global money, smart card controls, high-yield vaults, Tedi conversational banking, and a branch booking tool with live wait times.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'TD', statusBarStyle: 'default' },
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
  themeColor: '#141414',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} bg-background`}>
      <body className="antialiased select-none">
        {children}
      </body>
    </html>
  )
}
