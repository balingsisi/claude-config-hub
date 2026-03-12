'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { UserNav } from '@/components/user-nav'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleSwitcher } from '@/components/locale-switcher'

export function Header() {
  const t = useTranslations('common')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">{t('siteName')}</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/templates" className="text-sm font-medium hover:text-primary">
            {t('nav.templates')}
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary">
            {t('nav.about')}
          </Link>
          <LocaleSwitcher />
          <ThemeToggle />
          <UserNav />
        </nav>
      </div>
    </header>
  )
}
