'use client'

import * as React from 'react'
import { Star, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Comment {
  id: string
  userId: string
  userName: string
  userImage?: string
  content: string
  createdAt: string
}

interface TemplateCommentsProps {
  templateId: string
}

export function TemplateComments({ templateId }: TemplateCommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = React.useState<Comment[]>([])
  const [newComment, setNewComment] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // 加载评论
  React.useEffect(() => {
    const saved = localStorage.getItem(`comments_${templateId}`)
    if (saved) {
      try {
        setComments(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse comments:', e)
      }
    }
  }, [templateId])

  const handleSubmitComment = async () => {
    if (!session?.user) {
      toast('请先登录', {
        description: '登录后可以发表评论',
        action: {
          label: '去登录',
          onClick: () => window.location.href = '/login',
        },
      })
      return
    }

    if (!newComment.trim()) {
      toast.error('请输入评论内容')
      return
    }

    setIsSubmitting(true)

    const comment: Comment = {
      id: Date.now().toString(),
      userId: session.user.id,
      userName: session.user.name || '用户',
      userImage: session.user.image || undefined,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    }

    const updatedComments = [comment, ...comments]
    setComments(updatedComments)
    localStorage.setItem(`comments_${templateId}`, JSON.stringify(updatedComments))
    setNewComment('')
    setIsSubmitting(false)

    toast.success('评论已发布')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          评论 ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 评论输入 */}
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={session ? '写下你的评论...' : '登录后才能发表评论'}
            disabled={!session || isSubmitting}
            className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!session || !newComment.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? '发布中...' : '发布评论'}
            </Button>
          </div>
        </div>

        {/* 评论列表 */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              还没有评论，快来发表第一条吧！
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 border-b pb-4 last:border-0">
                <Avatar className="h-8 w-8">
                  {comment.userImage ? (
                    <AvatarImage src={comment.userImage} alt={comment.userName} />
                  ) : (
                    <AvatarFallback>
                      {comment.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.userName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
