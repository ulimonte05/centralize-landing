// Genera public/og/centralito.png (1200×630) con la identidad de centralize.dev (oscuro, señal naranja, logo original).
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const avatar = readFileSync('public/assets/centralito.jpg').toString('base64');
const mark = readFileSync('public/assets/centralize-mark-white.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
<defs><clipPath id="c"><rect x="780" y="135" width="360" height="360" rx="80"/></clipPath>
<radialGradient id="g" cx="0.5" cy="0" r="0.8"><stop offset="0" stop-color="#DF1E02" stop-opacity=".45"/><stop offset="1" stop-color="#0A0908" stop-opacity="0"/></radialGradient></defs>
<rect width="1200" height="630" fill="#0A0908"/>
<rect width="1200" height="630" fill="url(#g)"/>
<g transform="rotate(-3 960 315)"><rect x="780" y="135" width="360" height="360" rx="80" fill="#1C1814" stroke="#3A2E22" stroke-width="2"/><image href="data:image/jpeg;base64,${avatar}" x="780" y="135" width="360" height="360" clip-path="url(#c)" preserveAspectRatio="xMidYMid slice"/></g>
<g transform="translate(80 72)"><image href="data:image/png;base64,${mark}" x="0" y="0" width="44" height="44"/><text x="58" y="31" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="26" fill="#FFFFFF">Centralize</text></g>
<text x="80" y="200" font-family="Menlo, monospace" font-size="18" letter-spacing="3" fill="#FF5800">CENTRALITO · PARA INMOBILIARIAS</text>
<text x="80" y="290" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="78" letter-spacing="-3" fill="#FFFFFF">Operá tu Tokko</text>
<text x="80" y="372" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="78" letter-spacing="-3" fill="#FFFFFF">desde <tspan fill="#FF5800" font-style="italic">WhatsApp</tspan>,</text>
<text x="80" y="454" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="78" letter-spacing="-3" fill="#FFFFFF">sin abrirlo.</text>
<text x="80" y="530" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#B5AEA7">Tu colega de IA: le escribís, entra a tu Tokko y te cuenta qué hizo.</text>
</svg>`;
await sharp(Buffer.from(svg)).png({ quality: 90 }).toFile('public/og/centralito.png');
console.log('og ok');
