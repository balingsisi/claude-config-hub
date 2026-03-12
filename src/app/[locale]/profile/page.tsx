'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Mail, Github, Heart, Settings } from 'lucide-react'
import { Header } from '@/components/header-client'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  // 从 localStorage 获取收藏数量 - 必须在所有条件返回之前调用
  const favoritesCount = React.useMemo(() => {
    if (typeof window === 'undefined' || !session?.user?.id) return 0
    try {
      const saved = localStorage.getItem(`favorites_${session.user.id}`)
      return saved ? JSON.parse(saved).length : 0
    } catch {
      return 0
    }
  }, [session?.user?.id])

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main id="main-content" className="flex-1 container py-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 bg-muted rounded" />
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const user = session.user
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : (user.email?.[0]?.toUpperCase() || 'U')

  const handleSaveProfile = async () => {
    setIsLoading(true)
    // 模拟保存
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    toast.success('个人资料已更新')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main id="main-content" className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">个人资料</h1>
              <p className="mt-2 text-muted-foreground">
                管理您的个人信息和偏好设置
              </p>
            </div>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.image || undefined} alt={user.name || 'User'} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">显示名称</Label>
                  <Input
                    id="name"
                    defaultValue={user.name || ''}
                    placeholder="输入您的显示名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱地址</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user.email || ''}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    邮箱地址由 GitHub 提供，无法更改
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  账户信息
                </h3>
                <div className="grid gap-4 text-sm">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">账户类型</span>
                    <span className="font-medium">GitHub OAuth</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">账户 ID</span>
                    <span className="font-mono text-xs">{user.id}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Github className="h-4 w-4" />
                      GitHub 账号
                    </span>
                    <a
                      href={`https://github.com/${user.login}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline"
                    >
                      @{user.login}
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  收藏统计
                </h3>
                <div className="grid gap-4 text-sm">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">收藏的模板</span>
                    <Link href="/favorites" className="font-medium text-primary hover:underline">
                      {favoritesCount} 个
                    </Link>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end gap-4">
                <Link href="/">
                  <Button variant="outline">取消</Button>
                </Link>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? '保存中...' : '保存更改'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <Link href="/favorites">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">我的收藏</CardTitle>
                      <CardDescription>
                        查看您收藏的所有模板
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Link>
            </Card>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <Link href="https://github.com/settings/connections/applications{/client_id}" target="_blank" rel="noopener noreferrer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Github className="h-5 w-5 text-primary"/>
                    </div>
                    <div>
                      <CardTitle className="text-base">GitHub 授权设置</CardTitle>
                      <CardDescription>
                        管理 GitHub OAuth 授权
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
