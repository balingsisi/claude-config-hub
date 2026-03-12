'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Download, Star, Eye, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getTemplateBySlug } from '@/data/templates'
import { templates } from '@/data/templates'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import { toast } from 'sonner'
import { UserNav } from '@/components/user-nav'
import { FavoriteButton } from '@/components/favorite-button'
import { TemplateRating } from '@/components/template-rating'
import { TemplateComments } from '@/components/template-comments'
import { TemplateJsonLd } from '@/components/template-json-ld'

// Markdown 渲染组件 - 使用 react-markdown + 语法高亮
interface MarkdownContentProps {
  content: string
}

function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 代码块
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''

            if (!inline && language) {
              return (
                <div className="relative my-6">
                  <div className="flex items-center justify-between rounded-t-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                    <span className="font-mono">{language}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(String(children))}
                      className="rounded hover:bg-muted-foreground/20 px-2 py-1 text-xs"
                    >
                      复制
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-b-lg bg-muted p-4">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            }

            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
          // 标题
          h1: ({ children }) => (
            <h1 className="font-bold mt-8 mb-4 text-3xl">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-bold mt-6 mb-3 text-2xl">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-bold mt-4 mb-2 text-xl">{children}</h3>
          ),
          // 段落
          p: ({ children }) => (
            <p className="mb-4 leading-7">{children}</p>
          ),
          // 列表
          ul: ({ children }) => (
            <ul className="mb-4 ml-6 list-disc space-y-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-6 list-decimal space-y-2">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-7">{children}</li>
          ),
          // 链接
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // 引用
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          // 表格
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border bg-background">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm">{children}</td>
          ),
          // 分隔线
          hr: () => <hr className="my-8 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default function TemplateDetailPage({ params }: { params: { slug: string } }) {
  const template = getTemplateBySlug(params.slug)
  const [relatedTemplates] = React.useState(templates.slice(0, 3))

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">模板未找到</h1>
          <p className="mt-2 text-muted-foreground">请检查 URL 或返回模板列表</p>
          <Link href="/templates">
            <Button className="mt-4">返回模板列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(template.content)
      toast.success('模板内容已复制到剪贴板', {
        description: '可以直接粘贴到项目中使用',
      })
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('复制失败，请重试')
    }
  }

  const handleDownload = () => {
    try {
      const blob = new Blob([template.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `CLAUDE-${template.slug}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('模板下载成功', {
        description: `已保存为 CLAUDE-${template.slug}.md`,
      })
    } catch (err) {
      console.error('Failed to download:', err)
      toast.error('下载失败，请重试')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* JSON-LD Structured Data */}
      <TemplateJsonLd
        name={template.name}
        description={template.description}
        slug={template.slug}
        author={template.author}
        techStack={template.techStack}
        stats={template.stats}
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/templates" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>返回模板库</span>
          </Link>
          <UserNav />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold tracking-tight">{template.name}</h1>
                <p className="mt-4 text-lg text-muted-foreground">{template.description}</p>
              </div>
              {template.featured && (
                <span className="flex-shrink-0 ml-4 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  精选模板
                </span>
              )}
            </div>

            {/* Meta Info */}
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{template.stats.views} 次浏览</span>
              </div>
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                <span>{template.stats.copies} 次复制</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span>{template.stats.stars} 评分</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>更新于 {new Date(template.updatedAt).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>

            {/* Tech Stack Tags */}
            <div className="mt-6 flex flex-wrap gap-2">
              {template.techStack.framework && (
                <span className="inline-flex items-center rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {template.techStack.framework} {template.techStack.frameworkVersion}
                </span>
              )}
              {template.techStack.language && (
                <span className="inline-flex items-center rounded-md bg-muted px-3 py-1 text-sm font-medium">
                  {template.techStack.language} {template.techStack.languageVersion}
                </span>
              )}
              {template.techStack.database && (
                <span className="inline-flex items-center rounded-md bg-muted px-3 py-1 text-sm font-medium">
                  {template.techStack.database}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={handleCopyAll} className="flex-1 sm:flex-none">
                <Copy className="mr-2 h-4 w-4" />
                复制全部
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1 sm:flex-none">
                <Download className="mr-2 h-4 w-4" />
                下载
              </Button>
              <FavoriteButton
                templateId={template.id}
                templateName={template.name}
                variant="outline"
                showLabel={true}
              />
            </div>

            {/* Rating */}
            <div className="mt-6">
              <TemplateRating
                templateId={template.id}
                initialRating={template.stats.stars}
                initialCount={template.stats.copies}
              />
            </div>
          </div>

          {/* Content */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>模板内容</CardTitle>
              </CardHeader>
              <CardContent>
                <MarkdownContent content={template.content} />
              </CardContent>
            </Card>
          </div>

          {/* Comments */}
          <div className="mt-8">
            <TemplateComments templateId={template.id} />
          </div>

          {/* Related Templates */}
          {relatedTemplates.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">相关模板</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedTemplates.map((t) => (
                  <Link key={t.id} href={`/templates/${t.slug}`}>
                    <Card className="group hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {t.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{t.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {t.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs text-muted-foreground">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Made with ❤️ by Claude Config Hub</p>
        </div>
      </footer>
    </div>
  )
}
