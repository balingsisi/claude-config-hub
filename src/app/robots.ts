import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://claudeconfig.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/login', '/profile', '/favorites'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
