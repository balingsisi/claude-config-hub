'use client'

import * as React from 'react'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Template } from '@/types'
import { TemplatePreviewModal } from '@/components/template-preview-modal'

interface FeaturedTemplatesProps {
  templates: Template[]
}

export function FeaturedTemplates({ templates }: FeaturedTemplatesProps) {
  const [previewTemplate, setPreviewTemplate] = React.useState<Template | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false)

  const handlePreview = React.useCallback((e: React.MouseEvent, template: Template) => {
    e.preventDefault()
    e.stopPropagation()
    setPreviewTemplate(template)
    setIsPreviewOpen(true)
  }, [])

  const featuredTemplates = templates.slice(0, 3)

  return (
    <>
      <div className="mx-auto grid max-w-[980px] gap-4 sm:grid-cols-2 md:grid-cols-3">
        {featuredTemplates.map((template) => (
          <Link key={template.id} href={`/templates/${template.slug}`}>
            <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {template.name}
                  </CardTitle>
                  {template.featured && (
                    <span className="flex-shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      精选
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2">
                    {template.techStack.framework && (
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {template.techStack.framework}
                      </span>
                    )}
                    {template.techStack.language && (
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                        {template.techStack.language}
                      </span>
                    )}
                  </div>
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>👁 {template.stats.views}</span>
                    <span>📋 {template.stats.copies}</span>
                    <span>⭐ {template.stats.stars}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={(e) => handlePreview(e, template)}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  快速预览
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </>
  )
}
