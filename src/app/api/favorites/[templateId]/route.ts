import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/database'

// GET /api/favorites/[templateId] - 检查是否已收藏
export async function GET(
  _request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ favorited: false })
    }

    const favorite = await db.favorite.isFavorited(session.user.id, params.templateId)
    const count = await db.favorite.count(params.templateId)

    return NextResponse.json({
      favorited: !!favorite,
      count,
    })
  } catch (error) {
    console.error('Error checking favorite status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
