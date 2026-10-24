// scripts/check-reachability.mjs
import fs from 'node:fs';
import path from 'node:path';

const distDir = 'dist';

// Read sitemap to get all canonical URLs
const sitemapContent = fs.readFileSync(path.join(distDir, 'sitemap-0.xml'), 'utf8');
const sitemapUrls = Array.from(sitemapContent.matchAll(/<loc>https:\/\/worlddartshub\.com([^<]*)<\/loc>/g))
  .map(m => m[1] || '/');

console.log(`Total URLs in sitemap: ${sitemapUrls.length}`);

// Map route URL to dist HTML path
function getHtmlPathForRoute(route) {
  let rel = route.startsWith('/') ? route.slice(1) : route;
  if (!rel || rel === '') return path.join(distDir, 'index.html');
  if (rel.endsWith('/')) rel = rel.slice(0, -1);
  const directHtml = path.join(distDir, `${rel}.html`);
  if (fs.existsSync(directHtml)) return directHtml;
  return path.join(distDir, rel, 'index.html');
}

// Breadth-first crawl starting from '/'
const visited = new Set();
const queue = ['/'];
visited.add('/');

// Matches both href="/..." and href="https://worlddartshub.com/..."
const linkRegex = /href=["'](?:https:\/\/worlddartshub\.com)?(\/[^"'#?]*)/g;

while (queue.length > 0) {
  const currentRoute = queue.shift();
  const filePath = getHtmlPathForRoute(currentRoute);

  if (!fs.existsSync(filePath)) {
    continue;
  }

  const html = fs.readFileSync(filePath, 'utf8');
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    let target = match[1];
    if (
      target.endsWith('.xml') || target.endsWith('.txt') ||
      target.endsWith('.ico') || target.endsWith('.svg') ||
      target.endsWith('.jpg') || target.endsWith('.png') ||
      target.endsWith('.css') || target.endsWith('.js')
    ) {
      continue;
    }

    if (!target.endsWith('/') && !target.endsWith('.html')) {
      target += '/';
    }

    if (!visited.has(target)) {
      const targetFile = getHtmlPathForRoute(target);
      if (fs.existsSync(targetFile)) {
        visited.add(target);
        queue.push(target);
      }
    }
  }
}

console.log(`Reachable internal routes from homepage (/): ${visited.size}`);

// Identify orphans
const unreachableFromSitemap = sitemapUrls.filter(u => !visited.has(u));
console.log(`\nUnreachable sitemap URLs (${unreachableFromSitemap.length}):`);
unreachableFromSitemap.forEach(u => console.log('  -', u));
