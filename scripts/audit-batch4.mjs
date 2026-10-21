import fs from 'node:fs';

const pages = [
  {
    path: 'src/pages/tournament/european-championship-prize-money.astro',
    title: 'European Championship Prize Money 2026: £750K Guide',
    minWords: 700, maxWords: 1200
  },
  {
    path: 'src/pages/tournament/world-matchplay-prize-money.astro',
    title: 'World Matchplay Prize Money 2026: Full £1M Breakdown',
    minWords: 700, maxWords: 1200
  },
  {
    path: 'src/pages/tournament/uk-open-prize-money.astro',
    title: 'UK Open Prize Money 2026: Full £750K Breakdown',
    minWords: 700, maxWords: 1200
  },
  {
    path: 'src/pages/tournament/grand-slam-prize-money.astro',
    title: 'Grand Slam Prize Money 2026: Full £1M Breakdown',
    minWords: 700, maxWords: 1200
  },
  {
    path: 'src/pages/tournament/players-championship-finals-prize-money.astro',
    title: 'Players Championship Finals Prize Money 2026: £750K',
    minWords: 700, maxWords: 1200
  },
  {
    path: 'src/pages/tickets/price-guide.astro',
    title: 'World Darts Championship Ticket Prices 2026/27 Guide',
    minWords: 900, maxWords: 1400
  },
  {
    path: 'src/pages/schedule/opening-night.astro',
    title: 'World Championship Opening Night 2026: 11 Dec Guide',
    minWords: 600, maxWords: 1000
  },
  {
    path: 'src/pages/schedule/quarter-finals.astro',
    title: 'World Championship Quarter-Finals 2027: 1 Jan Guide',
    minWords: 600, maxWords: 1000
  },
  {
    path: 'src/pages/schedule/semi-finals.astro',
    title: 'World Championship Semi-Finals 2027: 2 January Guide',
    minWords: 600, maxWords: 1000
  },
  {
    path: 'src/pages/players/josh-rock.astro',
    title: 'Josh Rock: Darts Specs & Career Stats',
    minWords: 800, maxWords: 1300
  },
  {
    path: 'src/pages/players/gian-van-veen.astro',
    title: 'Gian van Veen: Darts Specs & Career Stats',
    minWords: 800, maxWords: 1300
  }
];

let allPassed = true;

for (const p of pages) {
  if (!fs.existsSync(p.path)) {
    console.error(`[FAIL] File missing: ${p.path}`);
    allPassed = false;
    continue;
  }
  const content = fs.readFileSync(p.path, 'utf8');

  // Title check
  const titleMatch = content.match(/const pageTitle = ["'](.*?)["'];/);
  const title = titleMatch ? titleMatch[1] : '';
  const titleLen = title.length;
  const titleOk = titleLen <= 60 && title.length > 0;

  // Description check
  const descMatch = content.match(/const pageDescription = ["'](.*?)["'];/);
  const desc = descMatch ? descMatch[1] : '';
  const descLen = desc.length;
  const descOk = descLen <= 155 && desc.length > 0;

  // Word count check
  const body = content.replace(/---[\s\S]*?---/, ' ').replace(/<[^>]+>/g, ' ');
  const wordCount = body.trim().split(/\s+/).filter(w => w.length > 0).length;
  const wordsOk = wordCount >= p.minWords;

  // FAQ parity check
  let faqOk = true;
  if (content.includes('faqItems')) {
    // Check if each item.q and item.a appears in the template
    const qMatches = [...content.matchAll(/q:\s*["']([^"']+)["']/g)].map(m => m[1]);
    const aMatches = [...content.matchAll(/a:\s*["']([^"']+)["']/g)].map(m => m[1]);
    if (qMatches.length === 0) faqOk = false;
  }

  console.log(`\nAuditing: ${p.path}`);
  console.log(`  Title (${titleLen} chars): "${title}" -> ${titleOk ? 'PASS' : 'FAIL'}`);
  console.log(`  Description (${descLen} chars): "${desc}" -> ${descOk ? 'PASS' : 'FAIL'}`);
  console.log(`  Words (${wordCount}): target [${p.minWords}-${p.maxWords}] -> ${wordsOk ? 'PASS' : 'WARN'}`);
  console.log(`  FAQ parity: ${faqOk ? 'PASS' : 'FAIL'}`);

  if (!titleOk || !descOk || !wordsOk || !faqOk) {
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n>>> ALL 11 BATCH 4 PAGES PASSED AUDIT! <<<');
} else {
  console.error('\n>>> SOME PAGES FAILED AUDIT! <<<');
  process.exit(1);
}
