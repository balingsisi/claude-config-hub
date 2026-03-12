'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface TemplateRatingProps {
  templateId: string
  initialRating?: number
  initialCount?: number
}

export function TemplateRating({
  templateId,
  initialRating = 0,
  initialCount = 0,
}: TemplateRatingProps) {
  const { data: session } = useSession()
  const [userRating, setUserRating] = React.useState(0)
  const [rating, setRating] = React.useState(initialRating)
  const [count, setCount] = React.useState(initialCount)

  // 加载用户评分
  React.useEffect(() => {
    if (session?.user?.id) {
      const saved = localStorage.getItem(`ratings_${templateId}`)
      if (saved) {
        try {
          const ratings = JSON.parse(saved)
          if (ratings[session.user.id]) {
            setUserRating(ratings[session.user.id])
          }
        } catch (e) {
          console.error('Failed to parse ratings:', e)
        }
      }
    }
  }, [session, templateId])

  const handleRating = async (value: number) => {
    if (!session?.user) {
      toast('请先登录', {
        description: '登录后可以给模板评分',
        action: {
          label: '去登录',
          onClick: () => window.location.href = '/login',
        },
      })
      return
    }

    // 保存评分
    const saved = localStorage.getItem(`ratings_${templateId}`)
    let ratings: Record<string, number> = {}

    if (saved) {
      try {
        ratings = JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse ratings:', e)
      }
    }

    const oldRating = ratings[session.user.id] || 0
    ratings[session.user.id] = value

    localStorage.setItem(`ratings_${templateId}`, JSON.stringify(ratings))

    // 更新显示
    setRating(rating - oldRating + value)
    setCount(oldRating === 0 ? count + 1 : count)
    setUserRating(value)

    toast.success('评分成功', {
      description: `你给了 ${value} 星`,
    })
  }

  return (
    <div className="flex items-center gap-4" role="group" aria-label="模板评分">
      <div className="flex items-center" role="radiogroup" aria-label={`当前评分: ${rating.toFixed(1)} 分, ${count} 人评分`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            disabled={!session}
            className="group"
            type="button"
            aria-label={`${star} 星`}
            aria-checked={userRating === star}
            role="radio"
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= (userRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-muted-foreground group-hover:text-yellow-400/50'
              } ${!session && 'cursor-not-allowed opacity-50'}`}
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <div className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{rating.toFixed(1)}</span>
        <span className="mx-1">·</span>
        {count} 人评分
        {userRating > 0 && (
          <>
            <span className="mx-1">·</span>
            <span className="text-primary">你的评分: {userRating}</span>
          </>
        )}
      </div>
    </div>
  )
}
