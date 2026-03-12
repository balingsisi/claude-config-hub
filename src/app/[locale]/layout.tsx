import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { SessionProvider } from '@/components/providers/session-provider'
import { Toaster } from '@/components/providers/toaster'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '@/i18n/config'
import { SkipToContent } from '@/components/skip-to-content'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://claudeconfig.com'),
  title: {
    default: 'Claude Config Hub - CLAUDE.md 模板库',
    template: '%s | Claude Config Hub',
  },
  description:
    '发现、浏览和使用高质量的 CLAUDE.md 模板，让 Claude Code 更好地理解你的项目。包含 Next.js、React、Vue、Django、FastAPI 等框架的项目配置模板。',
  keywords: [
    'Claude Code',
    'CLAUDE.md',
    'AI 配置',
    '开发工具',
    '模板库',
    'Next.js',
    'React',
    'TypeScript',
    '项目配置',
    'AI 助手',
  ],
  authors: [{ name: 'Claude Config Hub', url: 'https://claudeconfig.com' }],
  creator: 'Claude Config Hub',
  publisher: 'Claude Config Hub',
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://claudeconfig.com',
    title: 'Claude Config Hub - CLAUDE.md 模板库',
    description: '发现、浏览和使用高质量的 CLAUDE.md 模板，让 Claude Code 更好地理解你的项目',
    siteName: 'Claude Config Hub',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Claude Config Hub - CLAUDE.md 模板库',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude Config Hub - CLAUDE.md 模板库',
    description: '发现、浏览和使用高质量的 CLAUDE.md 模板',
    images: ['/og-image.png'],
    creator: '@claudeconfig',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://claudeconfig.com',
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

// Organization JSON-LD for the entire site
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Claude Config Hub',
  description: 'CLAUDE.md 配置模板社区平台，帮助开发者快速配置 Claude Code',
  url: 'https://claudeconfig.com',
  logo: 'https://claudeconfig.com/logo.png',
  sameAs: [
    'https://github.com/claudeconfig',
    'https://twitter.com/claudeconfig',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['Chinese', 'English'],
  },
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const { locale } = params

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Providing all messages to the client
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SkipToContent />
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
              <Toaster />
            </ThemeProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
