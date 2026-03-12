import { afterEach, vi, expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock IntersectionObserver
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IntersectionObserverMock = class IntersectionObserver {
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  disconnect() {}
  observe(_element: Element) {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
  unobserve(_element: Element) {}
} as unknown as typeof IntersectionObserver

global.IntersectionObserver = IntersectionObserverMock

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
