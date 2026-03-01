/**
 * Template categories
 */
export enum TemplateCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  ML = 'ml',
  DEVOPS = 'devops',
  OTHER = 'other',
}

/**
 * Template difficulty levels
 */
export enum TemplateDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

/**
 * Template status
 */
export enum TemplateStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  DEPRECATED = 'deprecated',
}

/**
 * Template interface
 */
export interface Template {
  id: string
  name: string
  slug: string
  description: string
  content: string

  // Classification
  tags: string[]
  category: TemplateCategory
  difficulty: TemplateDifficulty

  // Metadata
  author: {
    name: string
    url?: string
  }

  // Tech stack
  techStack: {
    framework?: string
    frameworkVersion?: string
    language: string
    languageVersion?: string
    database?: string
    testing?: string[]
  }

  // Statistics
  stats: {
    views: number
    copies: number
    stars: number
    forks: number
  }

  // Status
  status: TemplateStatus
  featured: boolean

  // Timestamps
  createdAt: string
  updatedAt: string
}

/**
 * User interface (for Phase 2)
 */
export interface User {
  id: string
  githubId: string
  name: string
  email: string
  avatar?: string

  // Preferences
  favorites: string[]
  settings: {
    theme: 'light' | 'dark' | 'system'
    emailNotifications: boolean
  }

  // Timestamps
  createdAt: string
  lastLoginAt: string
}

/**
 * Comment interface (for Phase 2)
 */
export interface Comment {
  id: string
  templateId: string
  userId: string
  content: string
  parentId?: string

  // Statistics
  likes: number

  // Timestamps
  createdAt: string
  updatedAt: string
}
