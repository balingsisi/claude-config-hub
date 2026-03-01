import { z } from 'zod'
import { Template, TemplateCategory, TemplateDifficulty, TemplateStatus } from '@/types'

/**
 * Template validation schema
 */
export const TemplateSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().min(10, 'Description too short').max(500, 'Description too long'),
  content: z.string().min(100, 'Content too short'),
  tags: z.array(z.string()).min(1, 'At least one tag required').max(10, 'Too many tags'),
  category: z.nativeEnum(TemplateCategory),
  difficulty: z.nativeEnum(TemplateDifficulty),
  author: z.object({
    name: z.string().min(1, 'Author name required'),
    url: z.string().url().optional(),
  }),
  techStack: z.object({
    framework: z.string().optional(),
    frameworkVersion: z.string().optional(),
    language: z.string().min(1, 'Language required'),
    languageVersion: z.string().optional(),
    database: z.string().optional(),
    testing: z.array(z.string()).optional(),
  }),
  stats: z.object({
    views: z.number().int().min(0),
    copies: z.number().int().min(0),
    stars: z.number().int().min(0),
    forks: z.number().int().min(0),
  }),
  status: z.nativeEnum(TemplateStatus),
  featured: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type TemplateInput = z.infer<typeof TemplateSchema>

/**
 * Validate template data
 */
export function validateTemplate(data: unknown): {
  success: boolean
  data?: Template
  errors?: z.ZodError
} {
  const result = TemplateSchema.safeParse(data)

  if (result.success) {
    return {
      success: true,
      data: result.data as Template,
    }
  }

  return {
    success: false,
    errors: result.error,
  }
}

/**
 * Check template quality score
 */
export function calculateTemplateQuality(template: Partial<Template>): {
  score: number
  issues: string[]
  suggestions: string[]
} {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  // Check content length
  if (!template.content || template.content.length < 500) {
    issues.push('Content is too short (< 500 characters)')
    score -= 20
  } else if (template.content.length < 1500) {
    suggestions.push('Consider adding more details to the template')
    score -= 10
  }

  // Check tags
  if (!template.tags || template.tags.length < 3) {
    issues.push('Add more tags (minimum 3 recommended)')
    score -= 10
  }

  // Check description
  if (!template.description || template.description.length < 50) {
    issues.push('Description is too short')
    score -= 15
  }

  // Check tech stack completeness
  const techStack = template.techStack
  if (techStack) {
    if (!techStack.framework && !techStack.language) {
      issues.push('Specify at least framework or language')
      score -= 20
    }
    if (!techStack.testing || techStack.testing.length === 0) {
      suggestions.push('Add testing framework information')
      score -= 5
    }
  }

  // Check for examples
  if (!template.content?.includes('```')) {
    suggestions.push('Add code examples to help users understand')
    score -= 10
  }

  // Check for best practices section
  if (!template.content?.toLowerCase().includes('best practice')) {
    suggestions.push('Consider adding a best practices section')
    score -= 5
  }

  return {
    score: Math.max(0, score),
    issues,
    suggestions,
  }
}

/**
 * Slug validation
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug)
}

/**
 * Generate slug from name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Check template completeness
 */
export function checkTemplateCompleteness(template: Partial<Template>): {
  isComplete: boolean
  missing: string[]
} {
  const required: (keyof Template)[] = [
    'id',
    'name',
    'slug',
    'description',
    'content',
    'tags',
    'category',
    'difficulty',
    'author',
    'techStack',
  ]

  const missing = required.filter((field) => !template[field])

  return {
    isComplete: missing.length === 0,
    missing,
  }
}
