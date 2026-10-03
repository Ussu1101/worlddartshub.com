import fs from 'node:fs';
import path from 'node:path';

const distDir = 'dist';
const htmlFiles = [];

function walk(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (item.endsWith('.html')) {
      htmlFiles.push(full);
    }
  }
}
walk(distDir);

// Build set of valid internal route paths
const validRoutes = new Set();
for (const file of htmlFiles) {
  let rel = path.relative(distDir, file).replace(/\\/g, '/');
  if (rel === 'index.html') {
    validRoutes.add('/');
  } else if (rel.endsWith('/index.html')) {
    validRoutes.add('/' + rel.slice(0, -10));
  } else {
    validRoutes.add('/' + rel);
  }
}

console.log('Total valid routes:', validRoutes.size);

// Scan for links
const brokenLinks = [];
const linkRegex = /href=["'](\/[^"'#?]*)/g;

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    let target = match[1];
    if (target.endsWith('.xml') || target.endsWith('.txt') || target.endsWith('.ico') || target.endsWith('.svg') || target.endsWith('.jpg') || target.endsWith('.png') || target.endsWith('.css') || target.endsWith('.js')) {
      // static asset
      const assetPath = path.join(distDir, target);
      if (!fs.existsSync(assetPath)) {
        brokenLinks.push({ source: file, target, type: 'asset' });
      }
      continue;
    }
    // normalize route
    if (!target.endsWith('/') && !target.endsWith('.html')) {
      target += '/';
    }
    if (!validRoutes.has(target)) {
      brokenLinks.push({ source: file, target, type: 'route' });
    }
  }
}

console.log('Total broken internal links found:', brokenLinks.length);
if (brokenLinks.length > 0) {
  console.log(JSON.stringify(brokenLinks, null, 2));
} else {
  console.log('SUCCESS: 0 broken internal links!');
}
