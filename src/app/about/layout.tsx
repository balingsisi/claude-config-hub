import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '关于 Claude Config Hub',
  description: '了解 Claude Config Hub - 一个专注于 CLAUDE.md 配置模板的社区平台。帮助开发者快速配置 Claude Code，让 AI 更好地理解你的项目。',
  keywords: [
    'Claude Config Hub',
    '关于我们',
    'CLAUDE.md',
    'Claude Code',
    'AI 配置平台',
    '开发者工具',
  ],
  openGraph: {
    title: '关于 Claude Config Hub',
    description: '了解 Claude Config Hub - 帮助开发者快速配置 Claude Code 的社区平台',
    type: 'website',
    url: 'https://claudeconfig.com/about',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Claude Config Hub',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '关于 Claude Config Hub',
    description: '帮助开发者快速配置 Claude Code 的社区平台',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://claudeconfig.com/about',
  },
}

// JSON-LD for about page
const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: '关于 Claude Config Hub',
  description: '一个专注于 CLAUDE.md 配置模板的社区平台',
  url: 'https://claudeconfig.com/about',
  mainEntity: {
    '@type': 'Organization',
    name: 'Claude Config Hub',
    url: 'https://claudeconfig.com',
    description: '帮助开发者快速配置 Claude Code，让 AI 更好地理解你的项目',
    sameAs: [
      'https://github.com/claudeconfig',
    ],
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      {children}
    </>
  )
}
