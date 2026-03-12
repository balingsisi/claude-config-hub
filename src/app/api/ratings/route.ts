import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

// GET /api/ratings?templateId=xxx - 获取模板的平均评分
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
    }

    const [ratings, average] = await Promise.all([
      db.rating.findByTemplate(templateId),
      db.rating.getAverage(templateId),
    ])

    return NextResponse.json({
      ratings,
      average: average._avg.score || 0,
      count: average._count.score || 0,
    })
  } catch (error) {
    console.error('Error fetching ratings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ratings - 提交或更新评分
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateId, score } = body

    if (!templateId || typeof score !== 'number' || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'Invalid templateId or score (must be 1-5)' },
        { status: 400 }
      )
    }

    await db.rating.upsert(session.user.id, templateId, score)

    const average = await db.rating.getAverage(templateId)

    return NextResponse.json({
      success: true,
      average: average._avg.score || 0,
      count: average._count.score || 0,
    })
  } catch (error) {
    console.error('Error submitting rating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
