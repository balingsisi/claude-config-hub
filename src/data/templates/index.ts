import { Template, TemplateCategory, TemplateDifficulty, TemplateStatus } from '@/types'

// Import markdown content using raw-loader
import nextjsSaasContent from './nextjs-saas.md'
import reactComponentLibraryContent from './react-component-library.md'
import t3StackContent from './t3-stack.md'
import djangoRestApiContent from './django-rest-api.md'
import nodejsExpressApiContent from './nodejs-express-api.md'

export const templates: Template[] = [
  {
    id: 'nextjs-saas',
    name: 'Next.js SaaS Starter',
    slug: 'nextjs-saas',
    description: 'Production-ready SaaS application with authentication, database, and payment integration',
    content: nextjsSaasContent,
    tags: ['nextjs', 'react', 'typescript', 'supabase', 'stripe', 'saas'],
    category: TemplateCategory.FULLSTACK,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'Next.js',
      frameworkVersion: '15.0.0',
      language: 'TypeScript',
      languageVersion: '5.9.0',
      database: 'Supabase (PostgreSQL)',
      testing: ['Vitest', 'Playwright'],
    },
    stats: {
      views: 100,
      copies: 50,
      stars: 25,
      forks: 5,
    },
    status: TemplateStatus.PUBLISHED,
    featured: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'react-component-library',
    name: 'React Component Library',
    slug: 'react-component-library',
    description: 'Production-ready, accessible, and customizable React component library with Storybook',
    content: reactComponentLibraryContent,
    tags: ['react', 'typescript', 'storybook', 'vite', 'component-library', 'ui'],
    category: TemplateCategory.FRONTEND,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'React',
      frameworkVersion: '19.0.0',
      language: 'TypeScript',
      languageVersion: '5.9.0',
      testing: ['Vitest', 'React Testing Library', 'Storybook'],
    },
    stats: {
      views: 85,
      copies: 42,
      stars: 20,
      forks: 3,
    },
    status: TemplateStatus.PUBLISHED,
    featured: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 't3-stack',
    name: 'T3 Stack Application',
    slug: 't3-stack',
    description: 'Type-safe full-stack development with Next.js, tRPC, Prisma, and Tailwind',
    content: t3StackContent,
    tags: ['nextjs', 'trpc', 'prisma', 'tailwind', 'typescript', 'fullstack'],
    category: TemplateCategory.FULLSTACK,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'Next.js',
      frameworkVersion: '14.0.0',
      language: 'TypeScript',
      languageVersion: '5.9.0',
      database: 'PostgreSQL (Prisma)',
      testing: ['Vitest', 'Playwright'],
    },
    stats: {
      views: 75,
      copies: 38,
      stars: 18,
      forks: 4,
    },
    status: TemplateStatus.PUBLISHED,
    featured: true,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'django-rest-api',
    name: 'Django REST API',
    slug: 'django-rest-api',
    description: 'Production-ready REST API with Django REST Framework, JWT auth, and PostgreSQL',
    content: djangoRestApiContent,
    tags: ['django', 'python', 'rest', 'api', 'postgresql', 'drf', 'jwt'],
    category: TemplateCategory.BACKEND,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'Django',
      frameworkVersion: '5.0.0',
      language: 'Python',
      languageVersion: '3.11+',
      database: 'PostgreSQL',
      testing: ['pytest', 'pytest-django'],
    },
    stats: {
      views: 60,
      copies: 30,
      stars: 15,
      forks: 2,
    },
    status: TemplateStatus.PUBLISHED,
    featured: false,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'nodejs-express-api',
    name: 'Node.js Express API',
    slug: 'nodejs-express-api',
    description: 'Production-ready REST API with Express, TypeScript, Prisma, and JWT authentication',
    content: nodejsExpressApiContent,
    tags: ['nodejs', 'express', 'typescript', 'api', 'prisma', 'jwt', 'rest'],
    category: TemplateCategory.BACKEND,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'Express',
      frameworkVersion: '4.18+',
      language: 'TypeScript',
      languageVersion: '5.9+',
      database: 'PostgreSQL (Prisma)',
      testing: ['Vitest', 'supertest'],
    },
    stats: {
      views: 55,
      copies: 28,
      stars: 12,
      forks: 3,
    },
    status: TemplateStatus.PUBLISHED,
    featured: false,
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
]

export function getTemplateBySlug(slug: string): Template | undefined {
  return templates.find((t) => t.slug === slug)
}

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return templates.filter((t) => t.category === category)
}

export function getTemplatesByTag(tag: string): Template[] {
  return templates.filter((t) => t.tags.includes(tag))
}

export function getFeaturedTemplates(): Template[] {
  return templates.filter((t) => t.featured)
}

export function searchTemplates(query: string): Template[] {
  const lowerQuery = query.toLowerCase()
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  )
}
