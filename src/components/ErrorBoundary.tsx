'use client'

import { Component, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError() {
    return { hasError: true, error: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    this.setState({ hasError: true, error })
    return false
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback error={this.state.error} reset={this} />
    }

    return this.props.children
  }
}

// 默认错误回退组件
function DefaultErrorFallback({ error, resetError }: { error: Error | null; resetError?: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="text-destructive text-4xl">⚠️</div>
        <h2 className="text-xl font-semibold">出错了</h2>
        <p className="text-muted-foreground">
          {error?.message || '发生了意外错误'}
        </p>
        <button
          onClick={() => {
            resetError?.()
            window.location.reload()
          }}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          重试
        </button>
      </div>
    </div>
  )
}
