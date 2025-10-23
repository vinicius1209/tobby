import type { Metadata } from 'next'
import { Noto_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import './globals.css'

const notoSans = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans",
  display: "swap",
});

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get locale from cookie (via i18n.ts config)
  const locale = await getLocale()

  // Get messages for the current locale
  const messages = await getMessages()

  return (
    <html lang={locale} className={notoSans.variable} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
