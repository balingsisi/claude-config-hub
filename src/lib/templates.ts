import type { Template } from '@/types'

/**
 * Calculate match score between project and template
 */
export function calculateMatchScore(
  project: {
    framework?: string
    language?: string
    database?: string
    tags?: string[]
  },
  template: Template
): {
  score: number
  maxScore: number
  matchPercentage: number
  details: {
    framework: number
    language: number
    database: number
    tags: number
  }
} {
  let score = 0
  let maxScore = 0

  // Framework match (40 points)
  maxScore += 40
  if (project.framework && template.techStack.framework) {
    if (project.framework.toLowerCase().includes(template.techStack.framework.toLowerCase())) {
      score += 40
    } else if (
      template.techStack.framework.toLowerCase().includes(project.framework.toLowerCase())
    ) {
      score += 30
    }
  }

  // Language match (30 points)
  maxScore += 30
  if (project.language && template.techStack.language) {
    if (project.language.toLowerCase() === template.techStack.language.toLowerCase()) {
      score += 30
    }
  }

  // Database match (20 points)
  maxScore += 20
  if (project.database && template.techStack.database) {
    if (
      project.database.toLowerCase().includes(template.techStack.database.toLowerCase()) ||
      template.techStack.database.toLowerCase().includes(project.database.toLowerCase())
    ) {
      score += 20
    }
  }

  // Tags match (10 points)
  maxScore += 10
  if (project.tags && project.tags.length > 0) {
    const matchingTags = template.tags.filter((tag) =>
      project.tags?.some((pt) => pt.toLowerCase() === tag.toLowerCase())
    )
    score += Math.min(matchingTags.length * 2, 10)
  }

  return {
    score,
    maxScore,
    matchPercentage: Math.round((score / maxScore) * 100),
    details: {
      framework: Math.round((score / maxScore) * 40),
      language: Math.round((score / maxScore) * 30),
      database: Math.round((score / maxScore) * 20),
      tags: Math.round((score / maxScore) * 10),
    },
  }
}

/**
 * Sort templates by relevance
 */
export function sortByRelevance(
  templates: Template[],
  project: {
    framework?: string
    language?: string
    database?: string
    tags?: string[]
  }
): Template[] {
  return templates
    .map((template) => ({
      template,
      score: calculateMatchScore(project, template),
    }))
    .sort((a, b) => b.score.score - a.score.score)
    .map((item) => item.template)
}

/**
 * Get template recommendations
 */
export function getRecommendations(
  project: {
    framework?: string
    language?: string
    database?: string
    tags?: string[]
  },
  templates: Template[],
  limit: number = 5
): {
  template: Template
  score: number
  matchPercentage: number
}[] {
  const scored = templates
    .map((template) => {
      const result = calculateMatchScore(project, template)
      return {
        template,
        score: result.score,
        matchPercentage: result.matchPercentage,
      }
    })
    .filter((item) => item.matchPercentage > 30) // Minimum 30% match
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored
}
