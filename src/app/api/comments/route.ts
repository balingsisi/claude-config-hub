import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

// GET /api/comments?templateId=xxx - 获取模板的评论列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
    }

    const comments = await db.comment.findByTemplate(templateId)
    const count = await db.comment.count(templateId)

    return NextResponse.json({ comments, count })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/comments - 提交评论
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, content } = body

    if (!templateId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'templateId and content are required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment must be less than 1000 characters' },
        { status: 400 }
      )
    }

    const comment = await db.comment.create(session.user.id, templateId, content.trim())

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error submitting comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
