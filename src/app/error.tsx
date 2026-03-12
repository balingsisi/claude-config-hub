'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">出错了</h1>
          <p className="text-muted-foreground">
            {error.message || '发生了意外错误，请稍后重试'}
          </p>
        </div>

        {error.digest && (
          <p className="text-xs text-muted-foreground">
            错误代码: {error.digest}
          </p>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            返回首页
          </Button>
          <Button onClick={reset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            重试
          </Button>
        </div>
      </div>
    </div>
  )
}
