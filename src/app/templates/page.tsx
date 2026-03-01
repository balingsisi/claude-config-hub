'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, Filter, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { templates } from '@/data/templates'
import type { Template, TemplateCategory, TemplateDifficulty } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Header } from '@/components/header-client'

// 骨架屏组件
function TemplateCardSkeleton() {
  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2">
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        </div>
      </CardFooter>
    </Card>
  )
}

// 模板卡片组件
interface TemplateCardProps {
  template: Template
}

function TemplateCard({ template }: TemplateCardProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template.content)
      setCopied(true)
      toast.success(`已复制: ${template.name}`, {
        description: '模板内容已复制到剪贴板',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('复制失败，请重试')
    }
  }

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {template.name}
            </CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
          {template.featured && (
            <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              精选
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 技术栈 */}
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
            {template.techStack.database && (
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                {template.techStack.database}
              </span>
            )}
          </div>

          {/* 标签 */}
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                #{tag}
              </span>
            ))}
            {template.tags.length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{template.tags.length - 5}
              </span>
            )}
          </div>

          {/* 难度 */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>难度:</span>
            <span
              className={cn(
                'font-medium',
                template.difficulty === 'beginner' && 'text-green-600',
                template.difficulty === 'intermediate' && 'text-yellow-600',
                template.difficulty === 'advanced' && 'text-red-600'
              )}
            >
              {template.difficulty === 'beginner' && '初级'}
              {template.difficulty === 'intermediate' && '中级'}
              {template.difficulty === 'advanced' && '高级'}
            </span>
          </div>

          {/* 统计 */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>👁 {template.stats.views}</span>
            <span>📋 {template.stats.copies}</span>
            <span>⭐ {template.stats.stars}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-2 w-full">
          <Link href={`/templates/${template.slug}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              查看详情
            </Button>
          </Link>
          <Button
            variant="default"
            size="sm"
            onClick={handleCopy}
            className={cn(
              'flex-1',
              copied && 'bg-green-600 hover:bg-green-700'
            )}
          >
            {copied ? '✓ 已复制' : '复制'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

// 筛选栏组件
interface FilterBarProps {
  categories: string[]
  frameworks: string[]
  languages: string[]
  selectedCategory: string | null
  selectedFramework: string | null
  selectedLanguage: string | null
  onCategoryChange: (category: string | null) => void
  onFrameworkChange: (framework: string | null) => void
  onLanguageChange: (language: string | null) => void
}

function FilterBar({
  categories,
  frameworks,
  languages,
  selectedCategory,
  selectedFramework,
  selectedLanguage,
  onCategoryChange,
  onFrameworkChange,
  onLanguageChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/50 rounded-lg">
      {/* 类别筛选 */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={selectedCategory || ''}
          onChange={(e) => onCategoryChange(e.target.value || null)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">所有类别</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 框架筛选 */}
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        <select
          value={selectedFramework || ''}
          onChange={(e) => onFrameworkChange(e.target.value || null)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">所有框架</option>
          {frameworks.map((fw) => (
            <option key={fw} value={fw}>
              {fw}
            </option>
          ))}
        </select>
      </div>

      {/* 语言筛选 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">语言:</span>
        <select
          value={selectedLanguage || ''}
          onChange={(e) => onLanguageChange(e.target.value || null)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value="">所有语言</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// 主页面组件
export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [selectedFramework, setSelectedFramework] = React.useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = React.useState<string | null>(null)
  const [sortBy, setSortBy] = React.useState<'popular' | 'recent' | 'rating'>('popular')
  const [isLoading, setIsLoading] = React.useState(false)

  // 提取唯一值
  const categories = React.useMemo(
    () => Array.from(new Set(templates.map((t) => t.category))),
    [templates]
  )
  const frameworks = React.useMemo(
    () => Array.from(new Set(templates.map((t) => t.techStack.framework).filter(Boolean))),
    [templates]
  )
  const languages = React.useMemo(
    () => Array.from(new Set(templates.map((t) => t.techStack.language).filter(Boolean))),
    [templates]
  )

  // 筛选和排序逻辑
  const filteredTemplates = React.useMemo(() => {
    let filtered = [...templates]

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // 类别过滤
    if (selectedCategory) {
      filtered = filtered.filter((t) => t.category === selectedCategory)
    }

    // 框架过滤
    if (selectedFramework) {
      filtered = filtered.filter((t) => t.techStack.framework === selectedFramework)
    }

    // 语言过滤
    if (selectedLanguage) {
      filtered = filtered.filter((t) => t.techStack.language === selectedLanguage)
    }

    // 排序
    filtered.sort((a, b) => {
      if (sortBy === 'popular') {
        return b.stats.views - a.stats.views
      } else if (sortBy === 'rating') {
        return b.stats.stars - a.stats.stars
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [searchQuery, selectedCategory, selectedFramework, selectedLanguage, sortBy, templates])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Main Content */}
      <main className="flex-1 container py-8">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            CLAUDE.md 模板库
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            浏览和复制高质量的 CLAUDE.md 模板，让 Claude Code 更好地理解你的项目
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          categories={categories}
          frameworks={frameworks}
          languages={languages}
          selectedCategory={selectedCategory}
          selectedFramework={selectedFramework}
          selectedLanguage={selectedLanguage}
          onCategoryChange={setSelectedCategory}
          onFrameworkChange={setSelectedFramework}
          onLanguageChange={setSelectedLanguage}
        />

        {/* Sort */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            找到 <span className="font-medium text-foreground">{filteredTemplates.length}</span> 个模板
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent' | 'rating')}
            className="rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="popular">最热门</option>
            <option value="recent">最新</option>
            <option value="rating">评分最高</option>
          </select>
        </div>

        {/* Template Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TemplateCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              没有找到匹配的模板
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory(null)
                setSelectedFramework(null)
                setSelectedLanguage(null)
              }}
            >
              清除筛选
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            {templates.length} 个模板 • {templates.reduce((sum, t) => sum + t.stats.copies, 0)} 次复制
          </p>
          <p className="text-sm text-muted-foreground">
            Made with ❤️ by Claude Config Hub
          </p>
        </div>
      </footer>
    </div>
  )
}
