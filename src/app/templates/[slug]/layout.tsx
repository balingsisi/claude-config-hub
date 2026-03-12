import type { Metadata } from 'next'
import { getTemplateBySlug, templates } from '@/data/templates'

// Generate static params for all templates
export async function generateStaticParams() {
  return templates.map((template) => ({
    slug: template.slug,
  }))
}

// Generate dynamic metadata for each template
export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const template = getTemplateBySlug(params.slug)

  if (!template) {
    return {
      title: '模板未找到',
    }
  }

  const techStackInfo = [
    template.techStack.framework,
    template.techStack.language,
  ]
    .filter(Boolean)
    .join(' + ')

  return {
    title: `${template.name} - CLAUDE.md 模板`,
    description: `${template.description} - ${techStackInfo} 项目的 CLAUDE.md 配置模板，包含最佳实践和项目规范。`,
    keywords: [
      template.name,
      'CLAUDE.md',
      template.techStack.framework,
      template.techStack.language,
      ...template.tags,
    ].filter(Boolean) as string[],
    openGraph: {
      title: `${template.name} - CLAUDE.md 模板`,
      description: template.description,
      type: 'article',
      url: `https://claudeconfig.com/templates/${template.slug}`,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: template.name,
        },
      ],
      authors: template.author?.name ? [template.author.name] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${template.name} - CLAUDE.md 模板`,
      description: template.description,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `https://claudeconfig.com/templates/${template.slug}`,
    },
  }
}

// JSON-LD generator for template detail pages
function generateTemplateJsonLd(template: ReturnType<typeof getTemplateBySlug>) {
  if (!template) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: template.name,
    description: template.description,
    url: `https://claudeconfig.com/templates/${template.slug}`,
    datePublished: template.createdAt,
    dateModified: template.updatedAt,
    author: {
      '@type': 'Person',
      name: template.author?.name || 'Claude Config Hub',
      url: template.author?.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Claude Config Hub',
      url: 'https://claudeconfig.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://claudeconfig.com/templates/${template.slug}`,
    },
    about: {
      '@type': 'SoftwareSourceCode',
      name: template.techStack.framework || 'CLAUDE.md',
      programmingLanguage: template.techStack.language,
    },
    keywords: template.tags.join(', '),
    aggregateRating: template.stats.stars > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: template.stats.stars,
      ratingCount: template.stats.copies,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  }
}

export default function TemplateSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const template = getTemplateBySlug(params.slug)
  const jsonLd = generateTemplateJsonLd(template)

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
