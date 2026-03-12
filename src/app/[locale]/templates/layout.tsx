import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '模板库 - 浏览所有 CLAUDE.md 模板',
  description: '浏览和搜索高质量的 CLAUDE.md 配置模板，涵盖 Next.js、React、Vue、Django、FastAPI 等主流技术栈。按框架、语言、类别筛选，快速找到适合你项目的模板。',
  keywords: [
    'CLAUDE.md 模板',
    'Claude Code 配置',
    'Next.js 模板',
    'React 模板',
    'TypeScript 配置',
    '项目配置模板',
    'AI 助手配置',
  ],
  openGraph: {
    title: 'CLAUDE.md 模板库 - 浏览所有模板',
    description: '浏览和搜索高质量的 CLAUDE.md 配置模板，涵盖主流技术栈',
    type: 'website',
    url: 'https://claudeconfig.com/templates',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Claude Config Hub 模板库',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CLAUDE.md 模板库',
    description: '浏览和搜索高质量的 CLAUDE.md 配置模板',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://claudeconfig.com/templates',
  },
}

// JSON-LD for templates collection page
const templatesJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'CLAUDE.md 模板库',
  description: '高质量的 CLAUDE.md 配置模板集合，让 Claude Code 更好地理解你的项目',
  url: 'https://claudeconfig.com/templates',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Next.js SaaS Starter',
        url: 'https://claudeconfig.com/templates/nextjs-saas',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'React Component Library',
        url: 'https://claudeconfig.com/templates/react-component-library',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'T3 Stack',
        url: 'https://claudeconfig.com/templates/t3-stack',
      },
    ],
  },
  provider: {
    '@type': 'Organization',
    name: 'Claude Config Hub',
    url: 'https://claudeconfig.com',
  },
}

export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(templatesJsonLd) }}
      />
      {children}
    </>
  )
}
