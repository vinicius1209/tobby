import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'Tobby - Your Financial Companion',
    template: '%s | Tobby',
  },
  description: 'Track your expenses effortlessly with Tobby, your friendly financial companion. Automatically process receipts from Telegram and gain insights into your spending.',
  keywords: ['expense tracker', 'finance', 'budget', 'telegram bot', 'receipt scanner'],
  authors: [{ name: 'Tobby Team' }],
  openGraph: {
    title: 'Tobby - Your Financial Companion',
    description: 'Track your expenses effortlessly with your friendly financial companion',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
