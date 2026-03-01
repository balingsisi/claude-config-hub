'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Github } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleGitHubLogin = async () => {
    setIsLoading(true)
    try {
      await signIn('github', { callbackUrl: '/' })
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Github className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">欢迎来到 Claude Config Hub</CardTitle>
          <CardDescription>
            使用 GitHub 账号登录，收藏和管理你喜欢的 CLAUDE.md 模板
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGitHubLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <Github className="mr-2 h-5 w-5" />
            {isLoading ? '登录中...' : '使用 GitHub 登录'}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            登录即表示您同意我们的{' '}
            <Link href="/terms" className="underline hover:text-foreground">
              服务条款
            </Link>{' '}
            和{' '}
            <Link href="/privacy" className="underline hover:text-foreground">
              隐私政策
            </Link>
          </div>

          <div className="border-t pt-4 text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
