import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/header-client'
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
      <main className="flex-1">
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
          <div className="mx-auto grid max-w-[980px] gap-4 sm:grid-cols-2 md:grid-cols-3">
            {featuredTemplates.map((template) => (
              <Link key={template.id} href={`/templates/${template.slug}`}>
                <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {template.name}
                      </CardTitle>
                      {template.featured && (
                        <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          精选
                        </span>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Tech Stack */}
                      <div className="flex flex-wrap gap-2">
                        {template.techStack.framework && (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                            {template.techStack.framework}
                          </span>
                        )}
                        {template.techStack.language && (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                            {template.techStack.language}
                          </span>
                        )}
                      </div>
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>👁 {template.stats.views}</span>
                        <span>📋 {template.stats.copies}</span>
                        <span>⭐ {template.stats.stars}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

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
