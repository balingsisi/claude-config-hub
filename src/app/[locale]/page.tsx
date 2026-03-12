import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header-client'
import { FeaturedTemplates } from '@/components/featured-templates'
import { getFeaturedTemplates } from '@/data/templates'
import type { Metadata } from 'next'

// SEO Metadata
export const metadata: Metadata = {
  title: 'CLAUDE.md 模板库 - 发现高质量的项目配置模板',
  description: '浏览和复制精选的 CLAUDE.md 模板，让 Claude Code 更好地理解你的项目。涵盖 Next.js、React、Django、Node.js 等主流技术栈。',
  keywords: ['CLAUDE.md', 'Claude Code', '项目配置', 'Next.js', 'React', '模板库'],
  openGraph: {
    title: 'CLAUDE.md 模板库',
    description: '发现、浏览和使用高质量的 CLAUDE.md 模板',
    type: 'website',
  },
}

// JSON-LD 结构化数据
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Claude Config Hub',
  description: '发现、浏览和使用高质量的 CLAUDE.md 模板，让 Claude Code 更好地理解你的项目',
  url: 'https://claudeconfig.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://claudeconfig.com/templates?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function HomePage() {
  const featuredTemplates = getFeaturedTemplates().slice(0, 3)

  return (
    <div className="flex min-h-screen flex-col">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      
      <Header />

      {/* Hero Section */}
      <main id="main-content" className="flex-1">
        <section className="container space-y-6 py-24 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              CLAUDE.md 模板库
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground sm:text-xl">
              发现、浏览和使用高质量的 CLAUDE.md 模板，让 Claude Code 更好地理解你的项目
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/templates">浏览全部模板</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">了解更多</Link>
              </Button>
            </div>
          </div>

          {/* Featured Templates */}
          <FeaturedTemplates templates={featuredTemplates} />

          {/* Browse All Button */}
          <div className="mx-auto max-w-[980px] text-center">
            <Button size="lg" variant="outline" asChild>
              <Link href="/templates">
                查看全部 {getFeaturedTemplates().length + 2} 个模板 →
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with{' '}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              Next.js 14
            </a>
            . The source code is available on{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}
