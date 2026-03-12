'use client'

import * as React from 'react'
import { Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { Template } from '@/types'

interface TemplatePreviewModalProps {
  template: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Markdown 渲染组件
function MarkdownPreview({ content }: { content: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none prose-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 代码块
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''

            if (!inline && language) {
              return (
                <div className="relative my-4">
                  <div className="flex items-center justify-between rounded-t-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                    <span className="font-mono">{language}</span>
                  </div>
                  <pre className="overflow-x-auto rounded-b-lg bg-muted p-3 text-sm">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              )
            }

            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
          // 标题
          h1: ({ children }) => (
            <h1 className="font-bold mt-6 mb-3 text-xl">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-bold mt-5 mb-2 text-lg">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-bold mt-4 mb-2 text-base">{children}</h3>
          ),
          // 段落
          p: ({ children }) => (
            <p className="mb-3 leading-6 text-sm">{children}</p>
          ),
          // 列表
          ul: ({ children }) => (
            <ul className="mb-3 ml-5 list-disc space-y-1 text-sm">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-5 list-decimal space-y-1 text-sm">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-6">{children}</li>
          ),
          // 链接
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // 引用
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-3 italic text-muted-foreground text-sm">
              {children}
            </blockquote>
          ),
          // 表格
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border bg-background">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left text-xs font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-xs">{children}</td>
          ),
          // 分隔线
          hr: () => <hr className="my-6 border-border" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
}: TemplatePreviewModalProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!template) return
    
    try {
      await navigator.clipboard.writeText(template.content)
      setCopied(true)
      toast.success('模板内容已复制到剪贴板', {
        description: '可以直接粘贴到项目中使用',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('复制失败，请重试')
    }
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{template.name}</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {template.description}
          </DialogDescription>
        </DialogHeader>
        
        {/* 技术栈标签 */}
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          {template.techStack.framework && (
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              {template.techStack.framework}
            </span>
          )}
          {template.techStack.language && (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
              {template.techStack.language}
            </span>
          )}
          {template.techStack.database && (
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
              {template.techStack.database}
            </span>
          )}
        </div>

        {/* Markdown 内容 */}
        <div className="flex-1 overflow-y-auto pr-2 py-4">
          <MarkdownPreview content={template.content} />
        </div>

        {/* 底部操作栏 */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={handleCopy} className="min-w-[100px]">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                已复制
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                复制内容
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
