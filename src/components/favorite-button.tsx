'use client'

import * as React from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface FavoriteButtonProps {
  templateId: string
  templateName: string
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
}

export function FavoriteButton({
  templateId,
  templateName,
  variant = 'ghost',
  size = 'icon',
  showLabel = false,
}: FavoriteButtonProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isFavorited, setIsFavorited] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)

  // 加载收藏状态
  React.useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/favorites/${templateId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.favorited !== undefined) {
            setIsFavorited(data.favorited)
          }
        })
        .catch((err) => {
          console.error('Failed to fetch favorite status:', err)
        })
    }
  }, [session, templateId])

  const handleToggleFavorite = async () => {
    if (status === 'unauthenticated') {
      toast('请先登录', {
        description: '登录后可以收藏你喜欢的模板',
        action: {
          label: '去登录',
          onClick: () => router.push('/login'),
        },
      })
      return
    }

    if (!session?.user?.id || isLoading) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle favorite')
      }

      const data = await response.json()
      setIsFavorited(data.favorited)

      if (data.favorited) {
        toast.success('已添加到收藏', {
          description: templateName,
        })
      } else {
        toast.success('已取消收藏', {
          description: templateName,
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('操作失败', {
        description: '请稍后重试',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={isFavorited ? 'text-red-500 hover:text-red-600' : ''}
    >
      <Heart className={isFavorited ? 'fill-current' : ''} />
      {showLabel && (
        <span className="ml-2">
          {isFavorited ? '已收藏' : '收藏'}
        </span>
      )}
    </Button>
  )
}
