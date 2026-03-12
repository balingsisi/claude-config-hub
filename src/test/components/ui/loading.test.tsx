import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Loading, PageLoading, InlineLoading } from '@/components/ui/loading'

describe('Loading', () => {
  describe('spinner variant', () => {
    it('should render spinner by default', () => {
      const { container } = render(<Loading />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('animate-spin')
    })

    it('should render spinner when variant="spinner"', () => {
      const { container } = render(<Loading variant="spinner" />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should apply size classes correctly', () => {
      const { container, rerender } = render(<Loading size="sm" />)
      let svg = container.querySelector('svg')
      expect(svg).toHaveClass('h-4', 'w-4')

      rerender(<Loading size="md" />)
      svg = container.querySelector('svg')
      expect(svg).toHaveClass('h-8', 'w-8')

      rerender(<Loading size="lg" />)
      svg = container.querySelector('svg')
      expect(svg).toHaveClass('h-12', 'w-12')
    })

    it('should apply custom className', () => {
      const { container } = render(<Loading className="custom-class" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('custom-class')
    })

    it('should have correct SVG structure', () => {
      const { container } = render(<Loading />)
      const svg = container.querySelector('svg')
      const circle = container.querySelector('circle')
      const path = container.querySelector('path')

      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
      expect(circle).toHaveClass('opacity-25')
      expect(path).toHaveClass('opacity-75')
    })

    it('should have text-primary class', () => {
      const { container } = render(<Loading />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('text-primary')
    })
  })

  describe('dots variant', () => {
    it('should render dots when variant="dots"', () => {
      const { container } = render(<Loading variant="dots" />)
      const dots = container.querySelectorAll('span')
      expect(dots).toHaveLength(3)
    })

    it('should apply dot size classes correctly', () => {
      const { container, rerender } = render(<Loading variant="dots" size="sm" />)
      let dots = container.querySelectorAll('span')
      dots.forEach(dot => {
        expect(dot).toHaveClass('h-1.5', 'w-1.5')
      })

      rerender(<Loading variant="dots" size="md" />)
      dots = container.querySelectorAll('span')
      dots.forEach(dot => {
        expect(dot).toHaveClass('h-2', 'w-2')
      })

      rerender(<Loading variant="dots" size="lg" />)
      dots = container.querySelectorAll('span')
      dots.forEach(dot => {
        expect(dot).toHaveClass('h-3', 'w-3')
      })
    })

    it('should have bounce animation on dots', () => {
      const { container } = render(<Loading variant="dots" />)
      const dots = container.querySelectorAll('span')
      dots.forEach(dot => {
        expect(dot).toHaveClass('animate-bounce')
      })
    })

    it('should have staggered animation delays', () => {
      const { container } = render(<Loading variant="dots" />)
      const dots = container.querySelectorAll('span')
      
      expect(dots[0]).toHaveStyle({ animationDelay: '0s' })
      expect(dots[1]).toHaveStyle({ animationDelay: '0.15s' })
      expect(dots[2]).toHaveStyle({ animationDelay: '0.3s' })
    })

    it('should have rounded-full and bg-primary classes', () => {
      const { container } = render(<Loading variant="dots" />)
      const dots = container.querySelectorAll('span')
      dots.forEach(dot => {
        expect(dot).toHaveClass('rounded-full', 'bg-primary')
      })
    })

    it('should apply custom className to dots container', () => {
      const { container } = render(<Loading variant="dots" className="custom-dots" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-dots')
    })

    it('should have flex layout with gap', () => {
      const { container } = render(<Loading variant="dots" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex', 'items-center', 'gap-1')
    })
  })
})

describe('PageLoading', () => {
  it('should render Loading component', () => {
    const { container } = render(<PageLoading />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should use large size', () => {
    const { container } = render(<PageLoading />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('h-12', 'w-12')
  })

  it('should have minimum height container', () => {
    const { container } = render(<PageLoading />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('min-h-[400px]')
  })

  it('should center content', () => {
    const { container } = render(<PageLoading />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center')
  })
})

describe('InlineLoading', () => {
  it('should render Loading component with default text', () => {
    render(<InlineLoading />)
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('should render custom text', () => {
    render(<InlineLoading text="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('should use small size spinner', () => {
    const { container } = render(<InlineLoading />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveClass('h-4', 'w-4')
  })

  it('should have muted text color', () => {
    const { container } = render(<InlineLoading />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('text-muted-foreground')
  })

  it('should have flex layout with gap', () => {
    const { container } = render(<InlineLoading />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('flex', 'items-center', 'gap-2')
  })

  it('should render spinner and text together', () => {
    const { container } = render(<InlineLoading text="Please wait" />)
    const svg = container.querySelector('svg')
    const text = screen.getByText('Please wait')
    
    expect(svg).toBeInTheDocument()
    expect(text).toBeInTheDocument()
  })

  it('should handle empty text prop', () => {
    render(<InlineLoading text="" />)
    const wrapper = document.querySelector('.text-muted-foreground')
    expect(wrapper).toBeInTheDocument()
  })
})
