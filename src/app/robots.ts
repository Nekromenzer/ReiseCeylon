import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /* The studio is Sanity's application, not part of the site. */
      disallow: ['/studio']
    },
    sitemap: 'https://reiseceylon.com/sitemap.xml'
  };
}
