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

console.log(`Total HTML files found in dist: ${htmlFiles.length}`);

const titles = new Map();
const descriptions = new Map();
const canonErrors = [];
const h1Errors = [];
const forbiddenHits = [];
const jsonLdErrors = [];
let totalLinks = 0;

const forbiddenTerms = ['localhost', '127.0.0.1', 'TODO', 'FIXME', 'file:///', 'dummy', 'lorem ipsum'];

for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const rel = path.relative(distDir, file).replace(/\\/g, '/');

  // 1. Forbidden terms check
  for (const term of forbiddenTerms) {
    if (content.toLowerCase().includes(term.toLowerCase())) {
      forbiddenHits.push({ file: rel, term });
    }
  }

  // 2. Title check
  const titleMatch = content.match(/<title>([^<]+)<\/title>/);
  if (!titleMatch) {
    canonErrors.push({ file: rel, issue: 'Missing <title>' });
  } else {
    const title = titleMatch[1].trim();
    if (titles.has(title)) {
      titles.get(title).push(rel);
    } else {
      titles.set(title, [rel]);
    }
  }

  // 3. Description check
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (!descMatch) {
    canonErrors.push({ file: rel, issue: 'Missing meta description' });
  } else {
    const desc = descMatch[1].trim();
    if (descriptions.has(desc)) {
      descriptions.get(desc).push(rel);
    } else {
      descriptions.set(desc, [rel]);
    }
  }

  // 4. Canonical check
  const canonMatch = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonMatch) {
    if (rel !== '404.html') {
      canonErrors.push({ file: rel, issue: 'Missing canonical' });
    }
  } else {
    const canon = canonMatch[1];
    let expectedPath = rel === 'index.html' ? '/' : '/' + rel.replace(/\/index\.html$/, '/');
    const expectedCanon = `https://worlddartshub.com${expectedPath}`;
    if (canon !== expectedCanon) {
      canonErrors.push({ file: rel, issue: `Canonical mismatch: got ${canon}, expected ${expectedCanon}` });
    }
  }

  // 5. H1 check
  const h1Matches = content.match(/<h1[\s>]/g) || [];
  if (h1Matches.length !== 1) {
    h1Errors.push({ file: rel, count: h1Matches.length });
  }

  // 6. JSON-LD validation
  const scriptRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let sMatch;
  while ((sMatch = scriptRegex.exec(content)) !== null) {
    try {
      JSON.parse(sMatch[1]);
    } catch (e) {
      jsonLdErrors.push({ file: rel, error: e.message });
    }
  }
}

// Sitemap check
const sitemapExists = fs.existsSync(path.join(distDir, 'sitemap-index.xml')) && fs.existsSync(path.join(distDir, 'sitemap-0.xml'));
let sitemapCount = 0;
if (sitemapExists) {
  const sm0 = fs.readFileSync(path.join(distDir, 'sitemap-0.xml'), 'utf-8');
  const locs = sm0.match(/<loc>/g) || [];
  sitemapCount = locs.length;
}

// Robots check
const robotsExists = fs.existsSync(path.join(distDir, 'robots.txt'));
let robotsContent = '';
if (robotsExists) {
  robotsContent = fs.readFileSync(path.join(distDir, 'robots.txt'), 'utf-8');
}

// Duplicate titles / descriptions
const duplicateTitles = Array.from(titles.entries()).filter(([k, v]) => v.length > 1);
const duplicateDescriptions = Array.from(descriptions.entries()).filter(([k, v]) => v.length > 1);

console.log('--- AUDIT RESULTS ---');
console.log(`Duplicate Titles: ${duplicateTitles.length}`);
console.log(`Duplicate Descriptions: ${duplicateDescriptions.length}`);
console.log(`Canonical Errors: ${canonErrors.length}`);
console.log(`H1 Errors (pages without exactly 1 H1): ${h1Errors.length}`);
console.log(`JSON-LD Parse Errors: ${jsonLdErrors.length}`);
console.log(`Forbidden Term Hits: ${forbiddenHits.length}`);
console.log(`Sitemap Index & Submap Exists: ${sitemapExists} (URLs in sitemap-0.xml: ${sitemapCount})`);
console.log(`Robots.txt Exists: ${robotsExists}`);
console.log(`Robots.txt Content:\n${robotsContent.trim()}`);

if (duplicateTitles.length > 0) console.log('Duplicate titles:', duplicateTitles);
if (duplicateDescriptions.length > 0) console.log('Duplicate descriptions:', duplicateDescriptions);
if (canonErrors.length > 0) console.log('Canonical errors:', canonErrors);
if (h1Errors.length > 0) console.log('H1 errors:', h1Errors);
if (jsonLdErrors.length > 0) console.log('JSON-LD errors:', jsonLdErrors);
if (forbiddenHits.length > 0) console.log('Forbidden hits:', forbiddenHits);
