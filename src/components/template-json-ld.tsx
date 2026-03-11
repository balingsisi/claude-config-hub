interface TemplateJsonLdProps {
  name: string
  description: string
  slug: string
  author: {
    name: string
    url?: string
  }
  techStack: {
    framework?: string
    language?: string
  }
  stats: {
    views: number
    copies: number
    stars: number
  }
}

export function TemplateJsonLd({
  name,
  description,
  slug,
  author,
  techStack,
  stats,
}: TemplateJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: name,
    description: description,
    url: `https://claudeconfig.com/templates/${slug}`,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: author.name,
      url: author.url,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: stats.stars,
      ratingCount: stats.copies,
      bestRating: 5,
      worstRating: 1,
    },
    browserRequirements: `Requires ${techStack.framework || 'Modern Web Browser'}. Written in ${techStack.language || 'Multiple Languages'}.`,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
