import { Template, TemplateCategory, TemplateDifficulty, TemplateStatus } from '@/types'

// Import markdown content using raw-loader
import nextjsSaasContent from './nextjs-saas.md'
import reactComponentLibraryContent from './react-component-library.md'
import t3StackContent from './t3-stack.md'
import djangoRestApiContent from './django-rest-api.md'
import nodejsExpressApiContent from './nodejs-express-api.md'
import vue3ViteContent from './vue-3-vite.md'
import pythonFastApiContent from './python-fastapi.md'
import rustWebContent from './rust-web.md'
import flutterMobileContent from './flutter-mobile.md'
import monorepoTurborepoContent from './monorepo-turborepo.md'

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
  {
    id: 'vue-3-vite',
    name: 'Vue 3 + Vite Application',
    slug: 'vue-3-vite',
    description: 'Modern Vue 3 application with Composition API, Pinia state management, and Vue Router',
    content: vue3ViteContent,
    tags: ['vue', 'vite', 'pinia', 'vue-router', 'typescript', 'frontend'],
    category: TemplateCategory.FRONTEND,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'Vue',
      frameworkVersion: '3.4+',
      language: 'TypeScript',
      languageVersion: '5.3+',
      testing: ['Vitest', 'Vue Test Utils', 'Playwright'],
    },
    stats: {
      views: 45,
      copies: 22,
      stars: 10,
      forks: 2,
    },
    status: TemplateStatus.PUBLISHED,
    featured: false,
    createdAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-03-11T00:00:00.000Z',
  },
  {
    id: 'python-fastapi',
    name: 'Python FastAPI Service',
    slug: 'python-fastapi',
    description: 'High-performance async API with FastAPI, SQLAlchemy, Pydantic validation, and automatic docs',
    content: pythonFastApiContent,
    tags: ['python', 'fastapi', 'sqlalchemy', 'pydantic', 'api', 'async'],
    category: TemplateCategory.BACKEND,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'FastAPI',
      frameworkVersion: '0.109+',
      language: 'Python',
      languageVersion: '3.11+',
      database: 'PostgreSQL (SQLAlchemy)',
      testing: ['pytest', 'pytest-asyncio'],
    },
    stats: {
      views: 50,
      copies: 25,
      stars: 12,
      forks: 3,
    },
    status: TemplateStatus.PUBLISHED,
    featured: true,
    createdAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-03-11T00:00:00.000Z',
  },
  {
    id: 'rust-web',
    name: 'Rust Web Service',
    slug: 'rust-web',
    description: 'High-performance type-safe web service with Actix-web, Diesel ORM, and PostgreSQL',
    content: rustWebContent,
    tags: ['rust', 'actix-web', 'diesel', 'postgresql', 'api', 'performance'],
    category: TemplateCategory.BACKEND,
    difficulty: TemplateDifficulty.ADVANCED,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'Actix-web',
      frameworkVersion: '4.4+',
      language: 'Rust',
      languageVersion: '1.75+',
      database: 'PostgreSQL (Diesel)',
      testing: ['cargo test', 'cargo-nextest'],
    },
    stats: {
      views: 35,
      copies: 15,
      stars: 8,
      forks: 1,
    },
    status: TemplateStatus.PUBLISHED,
    featured: false,
    createdAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-03-11T00:00:00.000Z',
  },
  {
    id: 'flutter-mobile',
    name: 'Flutter Mobile App',
    slug: 'flutter-mobile',
    description: 'Cross-platform mobile app with Flutter, Riverpod state management, and go_router navigation',
    content: flutterMobileContent,
    tags: ['flutter', 'dart', 'riverpod', 'mobile', 'ios', 'android'],
    category: TemplateCategory.MOBILE,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'Flutter',
      frameworkVersion: '3.16+',
      language: 'Dart',
      languageVersion: '3.2+',
      testing: ['flutter_test', 'integration_test'],
    },
    stats: {
      views: 40,
      copies: 20,
      stars: 9,
      forks: 2,
    },
    status: TemplateStatus.PUBLISHED,
    featured: false,
    createdAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-03-11T00:00:00.000Z',
  },
  {
    id: 'monorepo-turborepo',
    name: 'Turborepo Monorepo',
    slug: 'monorepo-turborepo',
    description: 'Scalable monorepo with Turborepo, shared packages, and optimized build pipeline',
    content: monorepoTurborepoContent,
    tags: ['turborepo', 'pnpm', 'monorepo', 'typescript', 'build'],
    category: TemplateCategory.OTHER,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    techStack: {
      framework: 'Turborepo',
      frameworkVersion: '1.11+',
      language: 'TypeScript',
      languageVersion: '5.3+',
      testing: ['Vitest', 'Jest'],
    },
    stats: {
      views: 30,
      copies: 12,
      stars: 6,
      forks: 1,
    },
    status: TemplateStatus.PUBLISHED,
    featured: false,
    createdAt: '2026-03-11T00:00:00.000Z',
    updatedAt: '2026-03-11T00:00:00.000Z',
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
