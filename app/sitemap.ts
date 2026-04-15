import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // The base URL of your deployed application
  const baseUrl = 'https://djmc35.pages.dev';

  // List all the public routes you want Google to index
  const routes = [
    '',
    '/about',
    '/announcements',
    '/contact',
    '/directory',
    '/resources',
    '/privacy-policy',
    '/terms-of-service',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    // Set priority higher for the home page
    priority: route === '' ? 1 : 0.8,
    // Adjust change frequency based on how often the page updates
    changeFrequency: route === '/announcements' ? 'daily' : 'weekly',
  }));
}
