import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '个人资料 - Claude Config Hub',
  description: '管理您的 Claude Config Hub 个人信息和偏好设置。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
