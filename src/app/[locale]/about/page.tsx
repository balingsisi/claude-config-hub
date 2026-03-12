import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Github, BookOpen, MessageSquare, Star } from 'lucide-react'
import { Header } from '@/components/header-client'

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Main Content */}
      <main id="main-content" className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">关于 Claude Config Hub</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              帮助开发者快速配置 Claude Code，让 AI 更好地理解你的项目
            </p>
          </div>

          {/* What is Claude Config Hub */}
          <section>
            <h2 className="text-3xl font-bold mb-4">什么是 Claude Config Hub?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Claude Config Hub 是一个专注于 CLAUDE.md 配置模板的社区平台。CLAUDE.md 是 Claude Code 的项目记忆文件，
              它告诉 AI 如何理解你的项目结构、代码规范、架构决策等关键信息。
            </p>
            <p className="text-muted-foreground leading-relaxed">
              我们的使命是让每个开发者都能轻松找到适合自己项目的 CLAUDE.md 模板，无需从零开始编写配置。
            </p>
          </section>

          {/* Why Use CLAUDE.md */}
          <section>
            <h2 className="text-3xl font-bold mb-4">为什么需要 CLAUDE.md？</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>🚀 提升效率</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    告诉 Claude Code 你的项目规范、架构决策和最佳实践，让它像有经验的工程师一样理解代码。
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>💡 智能辅助</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    AI 可以根据你的配置提供更准确的代码建议、更好的重构方案和更智能的问题诊断。
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>👥 团队协作</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    统一的团队规范让所有成员使用相同的 AI 配置，保持代码风格和架构决策的一致性。
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-3xl font-bold mb-4">核心功能</h2>
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <BookOpen className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">丰富的模板库</h3>
                  <p className="text-sm text-muted-foreground">
                    涵盖 Next.js、React、Django、Node.js 等主流技术栈，50+ 高质量模板
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <Star className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">质量评分</h3>
                  <p className="text-sm text-muted-foreground">
                    每个模板都经过质量评分，帮助你找到最合适的配置
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 border rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">社区驱动</h3>
                  <p className="text-sm text-muted-foreground">
                    开源社区贡献模板，评分、评论、持续改进
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h2 className="text-3xl font-bold mb-4">如何使用？</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">浏览模板库</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    按框架、语言、类别筛选，或搜索关键词找到适合的模板
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">查看详情</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    阅读完整的模板内容，了解规则、约束和最佳实践
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">一键复制</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    复制内容到你的项目根目录，即可开始使用 Claude Code 的智能功能
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contributing */}
          <section>
            <h2 className="text-3xl font-bold mb-4">贡献模板</h2>
            <p className="text-muted-foreground mb-6">
              我们欢迎社区贡献！如果你有自己编写的 CLAUDE.md 配置，欢迎分享给其他开发者。
            </p>
            <div className="flex gap-4">
              <Button asChild variant="outline">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </a>
              </Button>
              <Button asChild>
                <Link href="/templates">浏览模板</Link>
              </Button>
            </div>
          </section>

          {/* Future Plans */}
          <section>
            <h2 className="text-3xl font-bold mb-4">未来计划</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>🤖 智能推荐</CardTitle>
                  <CardDescription>Phase 2</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    AI 分析你的项目，自动推荐最合适的 CLAUDE.md 模板
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>📊 配置评估</CardTitle>
                  <CardDescription>Phase 2</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    评估现有 CLAUDE.md 的质量，提供改进建议和自动优化
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>👥 团队协作</CardTitle>
                  <CardDescription>Phase 3</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    团队共享配置，版本管理，一键同步更新到所有成员
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>🏢 企业功能</CardTitle>
                  <CardDescription>Phase 3</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    SSO 登录、审计日志、权限管理、自定义域名
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2026 Claude Config Hub. Made with ❤️</p>
        </div>
      </footer>
    </div>
  )
}
