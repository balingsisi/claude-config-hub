'use client'

import { useEffect } from 'react'

export function SkipToContent() {
  useEffect(() => {
    // Add id to main element if it doesn't have one
    const main = document.querySelector('main')
    if (main && !main.id) {
      main.id = 'main-content'
    }
  }, [])

  return (
    <a
      href="#main-content"
      className={`
        fixed top-4 left-4 z-50
        bg-primary text-primary-foreground
        px-4 py-2 rounded-md
        opacity-0 focus:opacity-100
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        transition-opacity
      `}
    >
      跳转到主要内容
    </a>
  )
}
