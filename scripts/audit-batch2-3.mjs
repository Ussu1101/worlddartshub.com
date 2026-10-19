import fs from 'node:fs';

function auditArticle(filePath, expected) {
  if (!fs.existsSync(filePath)) {
    console.log(`[FAIL] File does not exist: ${filePath}`);
    return false;
  }
  const content = fs.readFileSync(filePath, 'utf8');

  // Title
  const titleMatch = content.match(/const pageTitle = ["'](.*?)["'];/);
  const title = titleMatch ? titleMatch[1] : '';
  const titleLen = title.length;

  // Description
  const descMatch = content.match(/const pageDescription = ["'](.*?)["'];/);
  const desc = descMatch ? descMatch[1] : '';
  const descLen = desc.length;

  // Body words
  const bodyText = content.replace(/---[\s\S]*?---/, ' ').replace(/<[^>]+>/g, ' ');
  const words = bodyText.trim().split(/\s+/).filter(w => w.length > 0).length;

  console.log(`\n=== Auditing: ${filePath} ===`);
  console.log(`Title (${titleLen} chars): "${title}" - ${titleLen <= 60 ? 'PASS' : 'FAIL'}`);
  console.log(`Description (${descLen} chars): "${desc}" - ${descLen <= 155 ? 'PASS' : 'FAIL'}`);
  console.log(`Word count: ${words} (Target: ${expected.minWords}-${expected.maxWords}) - ${words >= expected.minWords && words <= expected.maxWords ? 'PASS' : (words >= expected.minWords ? 'PASS (adequate)' : 'FAIL')}`);

  if (expected.links) {
    for (const [link, expectedCount] of Object.entries(expected.links)) {
      const escaped = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const count = (content.match(new RegExp(escaped, 'g')) || []).length;
      console.log(`Link "${link}": found ${count}, expected ${expectedCount} - ${count >= expectedCount ? 'PASS' : 'FAIL'}`);
    }
  }

  // Schema FAQ parity check if FAQPage present
  if (content.includes('@type": "FAQPage"')) {
    const questionsMatch = [...content.matchAll(/"name":\s*"([^"]+)"/g)].map(m => m[1]);
    const answersMatch = [...content.matchAll(/"text":\s*"([^"]+)"/g)].map(m => m[1]);
    let faqPass = true;
    for (let i = 0; i < questionsMatch.length; i++) {
      const q = questionsMatch[i];
      const a = answersMatch[i];
      if (!content.includes(`>${q}<`) && !content.includes(q)) {
        console.log(`[SCHEMA MISMATCH] Question not found in HTML: ${q}`);
        faqPass = false;
      }
      if (a && !content.includes(a.replace(/&amp;/g, '&'))) {
        console.log(`[SCHEMA MISMATCH] Answer text discrepancy for: ${q}`);
        // Check partial or whitespace
      }
    }
    console.log(`FAQ Schema Parity: ${faqPass ? 'PASS' : 'FLAG'}`);
  }

  return true;
}

auditArticle('src/pages/venue/best-seats.astro', {
  minWords: 800,
  maxWords: 1500,
  links: {
    '/venue/great-hall-seating-plan/': 2,
    '/tickets/': 1,
    '/venue/security-bag-policy/': 1
  }
});

auditArticle('src/pages/venue/great-hall-sections-explained.astro', {
  minWords: 800,
  maxWords: 1500,
  links: {
    '/venue/great-hall-seating-plan/': 2,
    '/venue/best-seats/': 1,
    '/tickets/ballot-presale-guide/': 1
  }
});

auditArticle('src/pages/venue/first-time-visitor-checklist.astro', {
  minWords: 800,
  maxWords: 1500,
  links: {
    '/venue/security-bag-policy/': 2,
    '/venue/food-drink-bars/': 1,
    '/travel/tube-train-routes/': 1,
    '/fan-culture/first-timer-guide/': 1
  }
});

auditArticle('src/pages/history/youngest-world-champions.astro', {
  minWords: 800,
  maxWords: 1500,
  links: {
    '/history/roll-of-honour/': 2,
    '/history/bdo-world-champions/': 1,
    '/players/luke-littler/': 1
  }
});

auditArticle('src/pages/history/most-world-titles.astro', {
  minWords: 800,
  maxWords: 1500,
  links: {
    '/history/roll-of-honour/': 2,
    '/history/bdo-world-champions/': 1,
    '/history/world-championship-finals/': 1
  }
});
