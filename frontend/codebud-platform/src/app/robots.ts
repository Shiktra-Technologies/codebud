import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/exec', '/exec/login', '/api/'],
    },
    sitemap: 'https://  codebud.in/sitemap.xml',
  }
}
