'use client'

import { Toaster as SonnerToaster } from 'sonner'

interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  expand?: boolean
  richColors?: boolean
}

export function Toaster({
  position = 'bottom-right',
  expand = false,
  richColors = true,
}: ToasterProps) {
  return (
    <SonnerToaster
      position={position}
      expand={expand}
      richColors={richColors}
      closeButton
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: 'toast',
          title: 'toast-title',
          description: 'toast-description',
          actionButton: 'toast-action-button',
          cancelButton: 'toast-cancel-button',
          closeButton: 'toast-close-button',
        },
      }}
    />
  )
}
