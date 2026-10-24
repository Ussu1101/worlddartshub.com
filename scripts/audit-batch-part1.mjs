// scripts/audit-batch-part1.mjs
import fs from 'node:fs';

const pages = [
  {
    file: 'src/pages/tournament/grand-slam.astro',
    url: '/tournament/grand-slam/',
    minWords: 900,
    maxWords: 1500,
    expectedFaqs: 6
  },
  {
    file: 'src/pages/tournament/grand-slam-how-to-watch.astro',
    url: '/tournament/grand-slam-how-to-watch/',
    minWords: 700,
    maxWords: 1200,
    expectedFaqs: 4
  }
];

let allPassed = true;

for (const p of pages) {
  console.log(`\nAuditing: ${p.file}`);
  const content = fs.readFileSync(p.file, 'utf-8');

  // Title
  const titleMatch = content.match(/pageTitle\s*=\s*["']([^"']+)["']/);
  if (!titleMatch) {
    console.error(`  FAIL: pageTitle not found`);
    allPassed = false;
  } else {
    const title = titleMatch[1];
    const len = title.length;
    if (len >= 30 && len <= 60) {
      console.log(`  Title (${len} chars): "${title}" -> PASS`);
    } else {
      console.error(`  FAIL: Title length ${len} not in [30, 60]: "${title}"`);
      allPassed = false;
    }
  }

  // Description
  const descMatch = content.match(/pageDescription\s*=\s*["']([^"']+)["']/);
  if (!descMatch) {
    console.error(`  FAIL: pageDescription not found`);
    allPassed = false;
  } else {
    const desc = descMatch[1];
    const len = desc.length;
    if (len >= 120 && len <= 155) {
      console.log(`  Description (${len} chars): "${desc}" -> PASS`);
    } else {
      console.error(`  FAIL: Description length ${len} not in [120, 155]: "${desc}"`);
      allPassed = false;
    }
  }

  // Word count (strip frontmatter and style)
  const bodyOnly = content
    .replace(/^---[\s\S]*?---/, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]+\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = bodyOnly.split(' ').filter(Boolean).length;
  if (words >= p.minWords && words <= p.maxWords) {
    console.log(`  Words (${words}): target [${p.minWords}-${p.maxWords}] -> PASS`);
  } else {
    console.error(`  FAIL: Words (${words}) outside [${p.minWords}-${p.maxWords}]`);
    allPassed = false;
  }

  // Check H1 count (must be exactly 1)
  const h1Matches = content.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
  if (h1Matches.length === 1) {
    console.log(`  H1 count: 1 -> PASS`);
  } else {
    console.error(`  FAIL: H1 count is ${h1Matches.length}, expected 1`);
    allPassed = false;
  }

  // Check FAQ count
  const faqItemMatches = content.match(/q:\s*["'][^"']+["']/g) || [];
  if (faqItemMatches.length === p.expectedFaqs) {
    console.log(`  FAQ count: ${faqItemMatches.length} -> PASS`);
  } else {
    console.error(`  FAIL: FAQ count is ${faqItemMatches.length}, expected ${p.expectedFaqs}`);
    allPassed = false;
  }
}

if (!allPassed) {
  console.error('\n>>> SOME CHECKS FAILED! <<<');
  process.exit(1);
} else {
  console.log('\n>>> ALL PART 1 PAGES PASSED AUDIT! <<<');
}
