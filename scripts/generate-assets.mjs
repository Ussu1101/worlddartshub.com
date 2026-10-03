import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// 1. Ensure directory
fs.mkdirSync('public/images', { recursive: true });

// 2. Favicon SVG
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="30" fill="#0f172a" stroke="#eab308" stroke-width="2"/>
  <circle cx="32" cy="32" r="22" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
  <circle cx="32" cy="32" r="14" fill="#0f172a" stroke="#22c55e" stroke-width="2"/>
  <circle cx="32" cy="32" r="7" fill="#ef4444" stroke="#eab308" stroke-width="1.5"/>
  <circle cx="32" cy="32" r="3" fill="#eab308"/>
</svg>`;

fs.writeFileSync('public/favicon.svg', faviconSvg, 'utf-8');
console.log('Created public/favicon.svg');

// 3. Favicon ICO (generate from SVG via sharp PNG buffer)
await sharp(Buffer.from(faviconSvg))
  .resize(32, 32)
  .png()
  .toFile('public/favicon.ico');
console.log('Created public/favicon.ico');

// 4. Default Open Graph Card (1200 x 630)
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Border Accent -->
  <rect x="20" y="20" width="1160" height="590" rx="16" fill="none" stroke="#334155" stroke-width="2"/>
  <rect x="20" y="20" width="1160" height="6" fill="url(#gold)"/>

  <!-- Target Graphic Background Glow -->
  <circle cx="980" cy="315" r="220" fill="#1e293b" opacity="0.6"/>
  <circle cx="980" cy="315" r="180" fill="none" stroke="#334155" stroke-width="12"/>
  <circle cx="980" cy="315" r="130" fill="none" stroke="#ef4444" stroke-width="16"/>
  <circle cx="980" cy="315" r="80" fill="none" stroke="#22c55e" stroke-width="16"/>
  <circle cx="980" cy="315" r="30" fill="#ef4444"/>
  <circle cx="980" cy="315" r="12" fill="#fbbf24"/>

  <!-- Brand Label -->
  <rect x="80" y="100" width="220" height="38" rx="19" fill="#1e293b" stroke="#eab308" stroke-width="1.5"/>
  <text x="190" y="125" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="#fbbf24" text-anchor="middle" letter-spacing="1.5">INDEPENDENT FAN GUIDE</text>

  <!-- Main Title -->
  <text x="80" y="220" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="54" font-weight="800" fill="#ffffff" letter-spacing="-1">
    PDC WORLD DARTS
  </text>
  <text x="80" y="280" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="54" font-weight="800" fill="#fbbf24" letter-spacing="-1">
    CHAMPIONSHIP 2026/27
  </text>

  <!-- Subtitle -->
  <text x="80" y="350" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="400" fill="#94a3b8">
    Alexandra Palace, London • 11 Dec 2026 – 3 Jan 2027
  </text>

  <!-- Key Badges -->
  <g transform="translate(80, 410)">
    <rect x="0" y="0" width="210" height="48" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="105" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0" text-anchor="middle">£5,000,000 Fund</text>

    <rect x="230" y="0" width="210" height="48" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="335" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0" text-anchor="middle">Worldwide TV &amp; Streams</text>

    <rect x="460" y="0" width="210" height="48" rx="8" fill="#1e293b" stroke="#334155"/>
    <text x="565" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0" text-anchor="middle">Ally Pally Guide</text>
  </g>

  <!-- Footer Domain -->
  <text x="80" y="530" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="700" fill="#64748b">
    worlddartsguide.com
  </text>
</svg>`;

await sharp(Buffer.from(ogSvg))
  .jpeg({ quality: 90 })
  .toFile('public/images/og-default-darts.jpg');
console.log('Created public/images/og-default-darts.jpg (1200x630 JPEG)');
