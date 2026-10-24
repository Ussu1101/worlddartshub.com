// scripts/audit-duplicates.mjs
import fs from 'node:fs';
import path from 'node:path';

const distDir = 'dist';

const sitemapContent = fs.readFileSync(path.join(distDir, 'sitemap-0.xml'), 'utf8');
const sitemapUrls = Array.from(sitemapContent.matchAll(/<loc>https:\/\/worlddartshub\.com([^<]*)<\/loc>/g))
  .map(m => m[1] || '/');

function getHtmlPathForRoute(route) {
  let rel = route.startsWith('/') ? route.slice(1) : route;
  if (!rel || rel === '') return path.join(distDir, 'index.html');
  if (rel.endsWith('/')) rel = rel.slice(0, -1);
  const directHtml = path.join(distDir, `${rel}.html`);
  if (fs.existsSync(directHtml)) return directHtml;
  return path.join(distDir, rel, 'index.html');
}

function extractBodyWords(html) {
  let bodyContent = html;
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    bodyContent = mainMatch[1];
  } else {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) bodyContent = bodyMatch[1];
  }

  bodyContent = bodyContent.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  bodyContent = bodyContent.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  bodyContent = bodyContent.replace(/<svg[\s\S]*?<\/svg>/gi, ' ');
  bodyContent = bodyContent.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ');

  const text = bodyContent.replace(/<[^>]+>/g, ' ');

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

function getNGrams(words, n = 3) {
  const ngrams = new Set();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

const pages = [];
for (const url of sitemapUrls) {
  const filePath = getHtmlPathForRoute(url);
  if (!fs.existsSync(filePath)) continue;
  const html = fs.readFileSync(filePath, 'utf8');
  const words = extractBodyWords(html);
  const ngrams = getNGrams(words, 3);
  pages.push({ url, wordCount: words.length, words, ngrams });
}

const matches = [];
for (let i = 0; i < pages.length; i++) {
  for (let j = i + 1; j < pages.length; j++) {
    const p1 = pages[i];
    const p2 = pages[j];
    if (p1.wordCount < 100 || p2.wordCount < 100) continue;

    let sharedNGramsCount = 0;
    for (const ng of p1.ngrams) {
      if (p2.ngrams.has(ng)) sharedNGramsCount++;
    }
    if (sharedNGramsCount === 0) continue;

    const p1Pct = Math.round((sharedNGramsCount / Math.max(1, p1.ngrams.size)) * 100);
    const p2Pct = Math.round((sharedNGramsCount / Math.max(1, p2.ngrams.size)) * 100);
    const maxPct = Math.max(p1Pct, p2Pct);

    if (maxPct >= 30) {
      matches.push({
        p1: p1.url,
        p2: p2.url,
        sharedNgrams: sharedNGramsCount,
        p1Pct,
        p2Pct,
        maxPct
      });
    }
  }
}

matches.sort((a, b) => b.maxPct - a.maxPct);

console.log(`\n======================================================`);
console.log(`TOTAL PAIRS SHARING >= 30%: ${matches.length}`);
console.log(`PAIRS SHARING >= 40%: ${matches.filter(m => m.maxPct >= 40).length}`);
console.log(`PAIRS SHARING >= 50%: ${matches.filter(m => m.maxPct >= 50).length}`);
console.log(`======================================================`);

function printCategory(title, filterFn, limit = 10) {
  console.log(`\n--- ${title} ---`);
  const catMatches = matches.filter(filterFn);
  console.log(`Found ${catMatches.length} matching pairs.`);
  catMatches.slice(0, limit).forEach(m => {
    console.log(`  ${m.p1} <-> ${m.p2}: ${m.maxPct}% (shared: ${m.sharedNgrams} 3-grams)`);
  });
}

printCategory('TOP OVERALL MATCHES', () => true, 10);
printCategory('WATCH CLUSTER MATCHES', m => m.p1.startsWith('/watch/') && m.p2.startsWith('/watch/'), 10);
printCategory('PLAYER CLUSTER MATCHES', m => m.p1.startsWith('/players/') || m.p2.startsWith('/players/'), 10);
printCategory('TOURNAMENT CLUSTER MATCHES', m => m.p1.startsWith('/tournament/') || m.p2.startsWith('/tournament/'), 10);
