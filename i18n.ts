import { getRequestConfig } from 'next-intl/server'
import { cookies, headers as getHeaders } from 'next/headers'

// Can be imported from a shared config
export const locales = ['en', 'pt-br'] as const
export type Locale = (typeof locales)[number]

async function getLocaleFromCookie(): Promise<Locale | null> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('NEXT_LOCALE')
  if (localeCookie && locales.includes(localeCookie.value as Locale)) {
    return localeCookie.value as Locale
  }
  return null
}

async function getLocaleFromBrowser(): Promise<Locale> {
  const headersList = await getHeaders()
  const acceptLanguage = headersList.get('accept-language')

  if (acceptLanguage) {
    // Parse Accept-Language header
    // Example: "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim().toLowerCase())

    // Check if browser prefers Portuguese
    if (languages.some(lang => lang.startsWith('pt'))) {
      return 'pt-br'
    }

    // Check if browser prefers English
    if (languages.some(lang => lang.startsWith('en'))) {
      return 'en'
    }
  }

  // Default to Portuguese (Brazilian market)
  return 'pt-br'
}

export default getRequestConfig(async () => {
  // Priority order:
  // 1. User's saved preference (cookie)
  // 2. Browser language detection
  // 3. Default to pt-br

  let locale = await getLocaleFromCookie()

  if (!locale) {
    locale = await getLocaleFromBrowser()
  }

  // Ensure that a valid locale is used
  if (!locales.includes(locale as Locale)) {
    locale = 'pt-br'
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  }
})
