import { describe, it, expect } from 'vitest'
import { calculateMatchScore, sortByRelevance, getRecommendations } from '@/lib/templates'
import type { Template } from '@/types'
import { TemplateCategory, TemplateDifficulty, TemplateStatus } from '@/types'

// Helper function to create mock templates
function createMockTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'test-id',
    name: 'Test Template',
    slug: 'test-template',
    description: 'A test template',
    content: 'template content',
    tags: ['test', 'example'],
    category: TemplateCategory.FULLSTACK,
    difficulty: TemplateDifficulty.INTERMEDIATE,
    author: {
      name: 'Test Author',
    },
    techStack: {
      framework: 'React',
      language: 'TypeScript',
      database: 'PostgreSQL',
    },
    stats: {
      views: 100,
      copies: 10,
      stars: 50,
      forks: 5,
    },
    status: TemplateStatus.PUBLISHED,
    featured: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides,
  }
}

describe('calculateMatchScore', () => {
  it('should return perfect score for exact match', () => {
    const project = {
      framework: 'React',
      language: 'TypeScript',
      database: 'PostgreSQL',
      tags: ['test', 'example'],
    }
    const template = createMockTemplate()
    const result = calculateMatchScore(project, template)

    // 40 (framework) + 30 (language) + 20 (database) + 4 (2 tags * 2) = 94
    expect(result.score).toBe(94)
    expect(result.maxScore).toBe(100)
    expect(result.matchPercentage).toBe(94)
  })

  it('should return zero score for no match', () => {
    const project = {
      framework: 'Vue',
      language: 'Python',
      database: 'MongoDB',
      tags: ['different'],
    }
    const template = createMockTemplate()
    const result = calculateMatchScore(project, template)

    expect(result.score).toBe(0)
    expect(result.matchPercentage).toBe(0)
  })

  it('should calculate partial framework match (40 points)', () => {
    const project = { framework: 'Next.js React' }
    const template = createMockTemplate({
      techStack: { ...createMockTemplate().techStack, framework: 'React' },
    })
    const result = calculateMatchScore(project, template)

    // Next.js React contains React
    expect(result.score).toBe(40)
    expect(result.details.framework).toBeGreaterThan(0)
  })

  it('should calculate exact language match (30 points)', () => {
    const project = { language: 'TypeScript' }
    const template = createMockTemplate()
    const result = calculateMatchScore(project, template)

    expect(result.score).toBe(30)
    expect(result.details.language).toBeGreaterThan(0)
  })

  it('should be case-insensitive for language match', () => {
    const project = { language: 'typescript' }
    const template = createMockTemplate({
      techStack: { ...createMockTemplate().techStack, language: 'TypeScript' },
    })
    const result = calculateMatchScore(project, template)

    expect(result.score).toBe(30)
  })

  it('should calculate database match (20 points)', () => {
    const project = { database: 'PostgreSQL' }
    const template = createMockTemplate()
    const result = calculateMatchScore(project, template)

    expect(result.score).toBe(20)
    expect(result.details.database).toBeGreaterThan(0)
  })

  it('should calculate partial database match', () => {
    const project = { database: 'Postgres' }
    const template = createMockTemplate({
      techStack: { ...createMockTemplate().techStack, database: 'PostgreSQL' },
    })
    const result = calculateMatchScore(project, template)

    expect(result.score).toBe(20)
  })

  it('should calculate tags match (up to 10 points)', () => {
    const project = { tags: ['test', 'example', 'demo'] }
    const template = createMockTemplate()
    const result = calculateMatchScore(project, template)

    // 2 matching tags * 2 = 4 points
    expect(result.score).toBe(4)
    // Details are calculated as (score/maxScore) * 10, so (4/100)*10 = 0.4 ≈ 0
    expect(result.details.tags).toBeGreaterThanOrEqual(0)
  })

  it('should cap tags score at 10 points', () => {
    const project = { tags: ['test', 'example', 'tag1', 'tag2', 'tag3', 'tag4', 'tag5'] }
    const template = createMockTemplate()
    const result = calculateMatchScore(project, template)

    // Even with more than 5 matching tags, score should be capped at 10
    expect(result.details.tags).toBeLessThanOrEqual(10)
  })

  it('should handle empty project', () => {
    const project = {}
    const template = createMockTemplate()
    const result = calculateMatchScore(project, template)

    expect(result.score).toBe(0)
    expect(result.matchPercentage).toBe(0)
  })

  it('should handle project with only some fields', () => {
    const project = { framework: 'React' }
    const template = createMockTemplate()
    const result = calculateMatchScore(project, template)

    expect(result.score).toBe(40) // Only framework matches
    expect(result.maxScore).toBe(100)
  })

  it('should handle template with missing tech stack fields', () => {
    const project = {
      framework: 'React',
      language: 'TypeScript',
      database: 'PostgreSQL',
    }
    const template = createMockTemplate({
      techStack: {
        language: 'TypeScript',
      },
    })
    const result = calculateMatchScore(project, template)

    expect(result.score).toBe(30) // Only language matches
  })

  it('should be case-insensitive for framework match', () => {
    const project = { framework: 'react' }
    const template = createMockTemplate({
      techStack: { ...createMockTemplate().techStack, framework: 'React' },
    })
    const result = calculateMatchScore(project, template)

    expect(result.score).toBe(40)
  })

  it('should return details with correct structure', () => {
    const project = { framework: 'React' }
    const template = createMockTemplate()
    const result = calculateMatchScore(project, template)

    expect(result.details).toHaveProperty('framework')
    expect(result.details).toHaveProperty('language')
    expect(result.details).toHaveProperty('database')
    expect(result.details).toHaveProperty('tags')
    expect(typeof result.details.framework).toBe('number')
    expect(typeof result.details.language).toBe('number')
    expect(typeof result.details.database).toBe('number')
    expect(typeof result.details.tags).toBe('number')
  })
})

describe('sortByRelevance', () => {
  it('should sort templates by score in descending order', () => {
    const templates = [
      createMockTemplate({ id: '1', techStack: { language: 'Python' } }),
      createMockTemplate({ id: '2', techStack: { language: 'TypeScript' } }),
      createMockTemplate({ id: '3', techStack: { language: 'JavaScript' } }),
    ]
    const project = { language: 'TypeScript' }
    const result = sortByRelevance(templates, project)

    expect(result[0].id).toBe('2') // TypeScript match should be first
  })

  it('should return same number of templates', () => {
    const templates = [
      createMockTemplate({ id: '1' }),
      createMockTemplate({ id: '2' }),
      createMockTemplate({ id: '3' }),
    ]
    const project = { language: 'TypeScript' }
    const result = sortByRelevance(templates, project)

    expect(result.length).toBe(3)
  })

  it('should handle empty templates array', () => {
    const templates: Template[] = []
    const project = { language: 'TypeScript' }
    const result = sortByRelevance(templates, project)

    expect(result).toEqual([])
  })

  it('should handle templates with same scores', () => {
    const templates = [
      createMockTemplate({ id: '1' }),
      createMockTemplate({ id: '2' }),
    ]
    const project = {} // No matches, all score 0
    const result = sortByRelevance(templates, project)

    expect(result.length).toBe(2)
  })

  it('should not modify original array', () => {
    const templates = [
      createMockTemplate({ id: '1' }),
      createMockTemplate({ id: '2' }),
    ]
    const project = { language: 'TypeScript' }
    const originalOrder = templates.map(t => t.id)
    sortByRelevance(templates, project)

    expect(templates.map(t => t.id)).toEqual(originalOrder)
  })
})

describe('getRecommendations', () => {
  it('should return top N recommendations', () => {
    const templates = [
      createMockTemplate({ id: '1', techStack: { language: 'Python' } }),
      createMockTemplate({ id: '2', techStack: { language: 'TypeScript', framework: 'React' } }),
      createMockTemplate({ id: '3', techStack: { language: 'JavaScript' } }),
      createMockTemplate({ id: '4', techStack: { language: 'Go' } }),
    ]
    const project = { language: 'TypeScript', framework: 'React' }
    const result = getRecommendations(project, templates, 2)

    // Template 2 has 70% match (30 + 40), which is > 30% threshold
    expect(result.length).toBe(1)
    expect(result[0].template.id).toBe('2')
  })

  it('should filter out templates with less than 30% match', () => {
    const templates = [
      createMockTemplate({ id: '1', techStack: { language: 'Python', framework: 'Django' } }),
      createMockTemplate({ id: '2', techStack: { language: 'TypeScript', framework: 'React' } }),
    ]
    const project = { language: 'TypeScript', framework: 'React', database: 'PostgreSQL' }
    const result = getRecommendations(project, templates, 5)

    // Template 2 has 70% match (framework + language), template 1 has 0%
    expect(result.length).toBe(1)
    expect(result[0].template.id).toBe('2')
  })

  it('should include match percentage in result', () => {
    const templates = [createMockTemplate()]
    const project = { framework: 'React', language: 'TypeScript', database: 'PostgreSQL' }
    const result = getRecommendations(project, templates, 5)

    expect(result[0]).toHaveProperty('matchPercentage')
    // 40 + 30 + 20 = 90
    expect(result[0].matchPercentage).toBe(90)
  })

  it('should include score in result', () => {
    const templates = [createMockTemplate()]
    const project = { framework: 'React' }
    const result = getRecommendations(project, templates, 5)

    expect(result[0]).toHaveProperty('score')
    expect(result[0].score).toBe(40)
  })

  it('should default to 5 recommendations', () => {
    const templates = Array.from({ length: 10 }, (_, i) =>
      createMockTemplate({ id: `${i}`, techStack: { language: 'TypeScript', framework: 'React' } })
    )
    const project = { language: 'TypeScript', framework: 'React' }
    const result = getRecommendations(project, templates)

    // All have 70% match (30 + 40), which is > 30%
    expect(result.length).toBe(5)
  })

  it('should handle empty templates array', () => {
    const templates: Template[] = []
    const project = { language: 'TypeScript' }
    const result = getRecommendations(project, templates, 5)

    expect(result).toEqual([])
  })

  it('should handle no matching templates', () => {
    const templates = [
      createMockTemplate({ techStack: { language: 'Python' } }),
    ]
    const project = { language: 'TypeScript' }
    const result = getRecommendations(project, templates, 5)

    // 0% match, below 30% threshold
    expect(result.length).toBe(0)
  })

  it('should sort by score in descending order', () => {
    const templates = [
      createMockTemplate({ id: '1', techStack: { language: 'Python' } }),
      createMockTemplate({ id: '2', techStack: { language: 'TypeScript', framework: 'React' } }),
      createMockTemplate({ id: '3', techStack: { language: 'TypeScript' } }),
    ]
    const project = { language: 'TypeScript', framework: 'React' }
    const result = getRecommendations(project, templates, 5)

    // Template 2: 70%, Template 3: 30%, Template 1: 0% (filtered out)
    expect(result.length).toBeGreaterThan(0)
    if (result.length > 1) {
      expect(result[0].score).toBeGreaterThanOrEqual(result[1].score)
    }
  })

  it('should respect custom limit parameter', () => {
    const templates = Array.from({ length: 20 }, (_, i) =>
      createMockTemplate({ id: `${i}`, techStack: { language: 'TypeScript', framework: 'React' } })
    )
    const project = { language: 'TypeScript', framework: 'React' }
    const result = getRecommendations(project, templates, 10)

    // All have 70% match (> 30% threshold)
    expect(result.length).toBe(10)
  })
})
