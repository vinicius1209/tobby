"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Github, Twitter, Mail } from "lucide-react"
import { TobbyLogo } from "@/components/tobby-logo"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const t = useTranslations('footer')
  const tBrand = useTranslations('brand')
  const tNav = useTranslations('navigation')

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TobbyLogo size={32} variant="happy" animated={true} />
              <span className="text-lg font-bold">{tBrand('name')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {tBrand('description')}
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('product')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  {tNav('dashboard')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
                  {tNav('analytics')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/premium" className="text-muted-foreground hover:text-foreground transition-colors">
                  {tNav('premium')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('support')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('documentation')}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('helpCenter')}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('privacyPolicy')}
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t('termsOfService')}
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">{t('connect')}</h3>
            <div className="flex gap-4">
              <a
                href="https://github.com/vinicius1209/tobby"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a
                href="mailto:support@tobby.app"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span className="sr-only">Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              © {currentYear} {tBrand('name')}. {t('allRightsReserved')}
            </p>
            <p className="text-xs">
              {t('builtWith')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
