'use client'

import * as React from 'react'
import Link from 'next/link'
import { Heart, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header-client'
import { toast } from 'sonner'

interface Template {
  id: string
  template: {
    id: string
    slug: string
    name: string
    description: string
    techStack: any
  }
}

export default function FavoritesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = React.useState<Template[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchFavorites()
    }
  }, [status, router])

  const fetchFavorites = async () => {
    try {
      const response = await fetch('/api/favorites')
      if (!response.ok) throw new Error('Failed to fetch favorites')

      const data = await response.json()
      setFavorites(data)
    } catch (error) {
      console.error('Error fetching favorites:', error)
      toast.error('加载收藏失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFavorite = async (templateId: string) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      })

      if (!response.ok) throw new Error('Failed to remove favorite')

      const data = await response.json()
      if (!data.favorited) {
        // 移除成功，重新获取列表
        await fetchFavorites()
        toast.success('已取消收藏')
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
      toast.error('操作失败')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-12">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-muted rounded mb-8" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-muted rounded" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">我的收藏</h1>
              <p className="mt-2 text-muted-foreground">
                {favorites.length > 0
                  ? `你收藏了 ${favorites.length} 个模板`
                  : '还没有收藏任何模板'}
              </p>
            </div>
            <Link href="/templates">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                浏览模板
              </Button>
            </Link>
          </div>

          {/* Favorites Grid */}
          {favorites.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">还没有收藏</h3>
              <p className="text-muted-foreground mb-6">
                浏览模板库，点击心形图标收藏你喜欢的模板
              </p>
              <Button asChild>
                <Link href="/templates">浏览模板</Link>
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((item) => {
                const template = item.template
                const techStack = template.techStack || {}

                return (
                  <Card key={template.id} className="group hover:shadow-lg transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-primary transition-colors">
                            <Link href={`/templates/${template.slug}`}>
                              {template.name}
                            </Link>
                          </CardTitle>
                          <CardDescription className="mt-2 line-clamp-2">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {techStack.framework && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {techStack.framework}
                          </span>
                        )}
                        {techStack.language && (
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                            {techStack.language}
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button asChild className="flex-1">
                        <Link href={`/templates/${template.slug}`}>查看详情</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveFavorite(template.id)}
                      >
                        <Heart className="h-4 w-4 fill-current text-red-500" />
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
