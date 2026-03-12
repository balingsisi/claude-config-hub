import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '登录 - Claude Config Hub',
  description: '使用 GitHub 账号登录 Claude Config Hub，收藏和管理你喜欢的 CLAUDE.md 模板。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
