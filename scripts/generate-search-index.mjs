import fs from 'node:fs';
import path from 'node:path';

const distDir = 'dist';
const entries = [];

function walk(dir, base = '') {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const rel = path.join(base, item).replace(/\\/g, '/');
    if (fs.statSync(full).isDirectory()) {
      // Exclude foreign language sections from English search index
      if (item === 'de' || item === 'nl') continue;
      walk(full, rel);
    } else if (item === 'index.html') {
      const url = base === '' ? '/' : `/${base}/`;
      const html = fs.readFileSync(full, 'utf-8');
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      if (titleMatch && descMatch) {
        entries.push({
          url,
          title: titleMatch[1].trim(),
          description: descMatch[1].trim()
        });
      }
    }
  }
}

if (fs.existsSync(distDir)) {
  walk(distDir);
  entries.sort((a, b) => a.url.localeCompare(b.url));
  fs.writeFileSync('public/search-index.json', JSON.stringify(entries, null, 2) + '\n', 'utf-8');
  console.log(`Generated public/search-index.json with ${entries.length} English entries.`);
} else {
  console.error('dist/ does not exist. Run npm run build first.');
}
