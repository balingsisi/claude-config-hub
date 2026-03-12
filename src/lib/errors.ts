import { NextResponse } from 'next/server'

// API 错误处理工具
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(message, 400, code)
  }

  static unauthorized(message: string = '未授权访问') {
    return new ApiError(message, 401, 'UNAUTHORIZED')
  }

  static notFound(message: string = '资源不存在') {
    return new ApiError(message, 404, 'NOT_FOUND')
  }

  static internal(message: string = '服务器内部错误') {
    return new ApiError(message, 500, 'INTERNAL_ERROR')
  }
}

// 错误响应格式化
export function errorResponse(error: unknown): NextResponse {
  console.error('API Error:', error)

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: '未知错误' },
    { status: 500 }
  )
}

// 异步错误包装
export function asyncHandler<T>(
  fn: () => Promise<T>
): Promise<T> {
  return fn().catch((error) => {
    console.error('Async error:', error)
    throw error
  })
}
