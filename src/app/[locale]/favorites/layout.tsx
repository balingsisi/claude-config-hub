import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '我的收藏 - Claude Config Hub',
  description: '查看和管理您收藏的 CLAUDE.md 模板。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
