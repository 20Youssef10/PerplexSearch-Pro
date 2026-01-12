
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://perplexsearch.web.app';
// Output to 'dist' folder because this script runs after 'vite build'
const OUT_DIR = path.resolve(__dirname, '../dist');

const generateSEO = () => {
  // 1. Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) {
    console.warn(`Output directory ${OUT_DIR} does not exist. Creating it...`);
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  // 2. Generate Sitemap
  const today = new Date().toISOString().split('T')[0];
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${DOMAIN}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), sitemapContent);
  console.log('✅ sitemap.xml generated');

  // 3. Generate Robots.txt
  const robotsContent = `User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml`;

  fs.writeFileSync(path.join(OUT_DIR, 'robots.txt'), robotsContent);
  console.log('✅ robots.txt generated');
};

generateSEO();
