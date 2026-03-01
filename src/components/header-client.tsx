'use client'

import Link from 'next/link'
import { UserNav } from '@/components/user-nav'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">Claude Config Hub</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/templates" className="text-sm font-medium hover:text-primary">
            模板库
          </Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary">
            关于
          </Link>
          <UserNav />
        </nav>
      </div>
    </header>
  )
}
