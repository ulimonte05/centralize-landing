// Genera public/og/centralito.png (1200×630) con sharp a partir de un SVG + el avatar.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const avatar = readFileSync('public/assets/centralito.jpg').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><clipPath id="c"><rect x="760" y="115" width="400" height="400" rx="96"/></clipPath></defs>
<rect width="1200" height="630" fill="#FFFFFF"/>
<circle cx="960" cy="315" r="330" fill="#FBDDA9" opacity=".7"/>
<g transform="rotate(-3 960 315)"><rect x="760" y="115" width="400" height="400" rx="96" fill="#F7C7A1"/><image href="data:image/jpeg;base64,${avatar}" x="760" y="115" width="400" height="400" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/></g>
<text x="80" y="140" font-family="Menlo, monospace" font-size="20" letter-spacing="3" fill="#0F7540">CENTRALITO · PARA INMOBILIARIAS</text>
<text x="80" y="250" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="76" fill="#17161B">Operá tu Tokko</text>
<text x="80" y="335" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="76" fill="#17161B">desde <tspan fill="#138A4B">WhatsApp</tspan>,</text>
<text x="80" y="420" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="76" fill="#17161B">sin abrirlo.</text>
<text x="80" y="500" font-family="Helvetica, Arial, sans-serif" font-size="28" fill="#6C6661">Tu colega de IA: le escribís, entra a tu Tokko y te cuenta qué hizo.</text>
<g transform="translate(80 560)"><circle cx="18" cy="18" r="18" fill="#17161B"/><path d="M31 18a13 13 0 1 1-3.8-9.2" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><circle cx="18" cy="18" r="4.5" fill="#DF1E02"/><text x="48" y="26" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="24" fill="#17161B">Centralize</text></g>
</svg>`;
await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile('public/og/centralito.png');
console.log('og ok');
