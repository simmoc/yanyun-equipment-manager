import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/share/', '/api/'],
    },
    sitemap: 'https://yysls.simmoc.cn/sitemap.xml',
    host: 'https://yysls.simmoc.cn',
  };
}
