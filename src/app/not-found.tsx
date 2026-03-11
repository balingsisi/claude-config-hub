import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
        <h2 className="mt-4 text-2xl font-semibold">页面未找到</h2>
        <p className="mt-2 text-muted-foreground">
          抱歉，您访问的页面不存在或已被移除
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              返回首页
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/templates">
              <Search className="mr-2 h-4 w-4" />
              浏览模板
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
