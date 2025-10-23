"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { ArrowRight, BarChart3, Receipt, Shield } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function HomePage() {
  const t = useTranslations('home')

  return (
    <div className="flex min-h-screen flex-col">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="bg-gradient-to-br from-slate-50 to-slate-100 py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col items-center text-center space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold text-balance">{t('hero.title')}</h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-pretty">
                {t('hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg">
                  <Link href="/signup">
                    {t('hero.getStarted')} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">{t('hero.signIn')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-12">{t('features.title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t('features.receipt.title')}</h3>
                <p className="text-muted-foreground text-pretty">
                  {t('features.receipt.description')}
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t('features.analytics.title')}</h3>
                <p className="text-muted-foreground text-pretty">
                  {t('features.analytics.description')}
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{t('features.security.title')}</h3>
                <p className="text-muted-foreground text-pretty">
                  {t('features.security.description')}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
