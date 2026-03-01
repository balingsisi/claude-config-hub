import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/providers/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Claude Config Hub - CLAUDE.md 模板库',
  description:
    '发现、浏览和使用高质量的 CLAUDE.md 模板，让 Claude Code 更好地理解你的项目',
  keywords: ['Claude Code', 'CLAUDE.md', 'AI 配置', '开发工具', '模板库'],
  authors: [{ name: 'Claude Config Hub' }],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://claudeconfig.com',
    title: 'Claude Config Hub - CLAUDE.md 模板库',
    description: '发现、浏览和使用高质量的 CLAUDE.md 模板',
    siteName: 'Claude Config Hub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude Config Hub - CLAUDE.md 模板库',
    description: '发现、浏览和使用高质量的 CLAUDE.md 模板',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
