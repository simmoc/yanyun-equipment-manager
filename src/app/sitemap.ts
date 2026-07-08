import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: 'https://yysls.simmoc.cn', lastModified: new Date() }];
}
