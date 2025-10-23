"use client"

import { useLocale } from 'next-intl'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Languages } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Locale = 'en' | 'pt-br'

const languages = {
  'en': { name: 'English', flag: '🇺🇸' },
  'pt-br': { name: 'Português', flag: '🇧🇷' }
} as const

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function onSelectChange(newLocale: Locale) {
    startTransition(() => {
      // Save locale preference to cookie (same name as in i18n.ts)
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}` // 1 year

      // Reload to apply new locale
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          <Languages className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{languages[locale].flag} {languages[locale].name}</span>
          <span className="sm:hidden">{languages[locale].flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.entries(languages).map(([key, { name, flag }]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onSelectChange(key as Locale)}
            className={locale === key ? 'bg-accent' : ''}
          >
            <span className="mr-2">{flag}</span>
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
