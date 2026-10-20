// Islands chicas de todas las páginas: nav (móvil + superficie), toggle "Menos animación", WhatsApp, eventos cta_click.
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const track = (name: string, data: Record<string, string>) => { try { (window as any).va?.('event', { name, data }); } catch { /* noop */ } };

/* ---- atribución ?ref= ---- */
try { const ref = new URLSearchParams(location.search).get('ref'); if (ref) sessionStorage.setItem('centralize.ref', ref); } catch { /* noop */ }

/* ---- eventos cta_click ---- */
document.addEventListener('click', e => {
  const a = (e.target as HTMLElement).closest('[data-cta]') as HTMLElement | null; if (!a) return;
  track('cta_click', { cta: a.dataset.cta || '', section: a.dataset.section || '' });
});

/* ---- toggle Menos animación ---- */
const html = document.documentElement;
const pintarToggle = () => { const on = html.classList.contains('motion-reduced'); $$('[data-motion-toggle]').forEach(b => { b.setAttribute('aria-pressed', String(on)); const t = $('.t', b); if (t) t.textContent = on ? 'Más animación' : 'Menos animación'; }); };
document.addEventListener('click', e => {
  const b = (e.target as HTMLElement).closest('[data-motion-toggle]'); if (!b) return;
  const on = !html.classList.contains('motion-reduced'); html.classList.toggle('motion-reduced', on);
  try { localStorage.setItem('motion', on ? 'reduced' : 'full'); } catch { /* noop */ }
  pintarToggle(); track('motion_toggle', { cta: on ? 'reduced' : 'full', section: 'nav' });
});
pintarToggle();

/* ---- nav: línea al scrollear + menú móvil + superficie oscura ---- */
const nav = $('[data-nav]');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8); onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const btn = $('[data-menu-btn]', nav), sheet = $('[data-menu]', nav);
  if (btn && sheet) {
    const main = $('main'), foot = $('footer');
    const open = (o: boolean) => {
      btn.setAttribute('aria-expanded', String(o)); sheet.hidden = !o; document.body.style.overflow = o ? 'hidden' : '';
      [main, foot].forEach(el => { if (el) (el as any).inert = o; });
      if (o) ($('a,button', sheet) as HTMLElement | null)?.focus(); else btn.focus();
    };
    btn.addEventListener('click', () => open(btn.getAttribute('aria-expanded') !== 'true'));
    sheet.addEventListener('keydown', e => {
      if (e.key === 'Escape') open(false);
      if (e.key === 'Tab') { const f = $$('a,button', sheet).filter(x => !x.hasAttribute('hidden')); const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
    sheet.addEventListener('click', e => { if ((e.target as HTMLElement).closest('a')) open(false); });
    matchMedia('(min-width: 1024px)').addEventListener('change', ev => { if (ev.matches) open(false); });
  }
  // la nav se oscurece mientras Ventas domina el viewport y el pill pasa a Agendar demo
  const ventas = $('#ventas'); const pill = $<HTMLAnchorElement>('[data-nav-pill]', nav);
  if (ventas && ventas.tagName === 'SECTION' && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      const dark = entries[0].intersectionRatio >= 0.5;
      nav.toggleAttribute('data-surface', dark); if (dark) nav.setAttribute('data-surface', 'dark');
      if (pill) { if (dark) { pill.textContent = 'Agendar demo'; pill.href = pill.dataset.demo || pill.href; pill.dataset.cta = 'demo'; } else { pill.textContent = 'Empezar'; pill.href = '/empezar'; pill.dataset.cta = 'empezar'; } }
    }, { threshold: [0.5] });
    io.observe(ventas);
  }
}

/* ---- móvil: barra fija de acciones cuando el botón del hero sale de la vista; puntos del riel ---- */
const bar = $('[data-m-bar]'), sent = $('[data-bar-sentinel]');
if (bar && sent && 'IntersectionObserver' in window) {
  new IntersectionObserver(es => { const e = es[0]; bar.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top < 0); }, { threshold: 0 }).observe(sent);
} else if (bar) {
  const onS = () => bar.classList.toggle('on', scrollY > 160); onS(); addEventListener('scroll', onS, { passive: true });
}
// listas largas plegadas en móvil (en escritorio quedan abiertas, sin resumen)
if (matchMedia('(max-width: 767px)').matches) $$('details.m-fold').forEach(d => { (d as HTMLDetailsElement).open = false; });
const railM = $('[data-rail-m]'), dots = $$('.rail-dots span');
if (railM && dots.length) {
  const cards = $$('.rail-card', railM); const upd = () => { const k = Math.round(railM.scrollLeft / (railM.scrollWidth - railM.clientWidth) * (dots.length - 1)) || 0; dots.forEach((d, i) => d.classList.toggle('on', i === k)); };
  railM.addEventListener('scroll', upd, { passive: true }); upd(); void cards;
}

/* ---- WhatsApp: en desktop, popover con QR y número ---- */
const fine = matchMedia('(pointer: fine) and (min-width: 1024px)').matches;
document.addEventListener('click', e => {
  const a = (e.target as HTMLElement).closest('a[data-wa]') as HTMLAnchorElement | null; if (!a) return;
  track('whatsapp_click', { cta: a.dataset.section || '', section: fine ? 'popover' : 'direct' });
  if (!fine) return;
  e.preventDefault();
  let dlg = $<HTMLDialogElement>('#wa-dialog');
  if (!dlg) {
    dlg = document.createElement('dialog'); dlg.id = 'wa-dialog'; dlg.className = 'wa-dialog';
    dlg.innerHTML = `<form method="dialog"><button class="wa-close" aria-label="Cerrar">×</button></form><h3>Escaneá y nos escribís desde el celular</h3><div class="wa-qr"></div><p class="wa-num"><span data-num></span> <button type="button" class="pill" data-copy-num>Copiar número</button></p><a class="btn btn-outline btn-sm" target="_blank" rel="noopener" data-open>Abrir en WhatsApp Web</a>`;
    document.body.append(dlg);
    dlg.addEventListener('click', ev => { if (ev.target === dlg) dlg!.close(); });
    dlg.addEventListener('click', ev => { const b = (ev.target as HTMLElement).closest('[data-copy-num]'); if (b) { navigator.clipboard?.writeText(dlg!.dataset.e164 || ''); b.textContent = 'Copiado'; } });
  }
  const url = a.href; dlg.dataset.e164 = '+' + (a.dataset.e164 || '');
  ($('[data-num]', dlg)!).textContent = a.dataset.visible || ''; ($<HTMLAnchorElement>('[data-open]', dlg)!).href = url.replace('https://wa.me/', 'https://web.whatsapp.com/send?phone=').replace('?text=', '&text=');
  ($('.wa-qr', dlg)!).innerHTML = qrSvg(url);
  dlg.showModal();
});

/* QR mínimo (versión 1-10, nivel L, modo byte) para el popover: evita una dependencia. */
function qrSvg(text: string): string {
  try { const m = qrMatrix(text); const n = m.length, s = 4; let d = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += `M${x * s} ${y * s}h${s}v${s}h-${s}z`; return `<svg viewBox="0 0 ${n * s} ${n * s}" width="180" height="180" role="img" aria-label="Código QR del link de WhatsApp"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#17161B"/></svg>`; } catch { return ''; }
}
function qrMatrix(text: string): number[][] {
  const bytes = new TextEncoder().encode(text);
  const CAP = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271]; const EC = [0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18]; const BLK = [0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4];
  let v = 1; while (v <= 10 && CAP[v] < bytes.length) v++; if (v > 10) throw new Error('largo');
  const n = v * 4 + 17, total = Math.floor(((16 * v + 128) * v + 64) / 8) - (v > 1 ? 7 : 0) + [0, 0, 0, 0, 0, 0, 0, -1, -1, -1, -1][v];
  const tot = TOTALS[v]; const ecLen = EC[v], blocks = BLK[v]; const dataLen = tot - ecLen * blocks;
  const bits: number[] = []; const push = (val: number, len: number) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(4, 4); push(bytes.length, 8); bytes.forEach(b => push(b, 8)); push(0, Math.min(4, dataLen * 8 - bits.length)); while (bits.length % 8) bits.push(0);
  const data: number[] = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2)); for (let p = 0; data.length < dataLen; p++) data.push(p % 2 ? 0x11 : 0xec);
  // bloques
  const short = Math.floor(dataLen / blocks), extra = dataLen % blocks; const dBlocks: number[][] = [], eBlocks: number[][] = []; let off = 0;
  for (let b = 0; b < blocks; b++) { const len = short + (b >= blocks - extra ? 1 : 0); const blk = data.slice(off, off + len); off += len; dBlocks.push(blk); eBlocks.push(rs(blk, ecLen)); }
  const out: number[] = []; for (let i = 0; i < short + 1; i++) dBlocks.forEach(b => { if (i < b.length) out.push(b[i]); }); for (let i = 0; i < ecLen; i++) eBlocks.forEach(b => out.push(b[i]));
  void total;
  // matriz
  const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0)), f: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const set = (x: number, y: number, val: number) => { m[y][x] = val; f[y][x] = true; };
  const finder = (x: number, y: number) => { for (let dy = -1; dy <= 7; dy++) for (let dx = -1; dx <= 7; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue; const on = (dx >= 0 && dx <= 6 && (dy === 0 || dy === 6)) || (dy >= 0 && dy <= 6 && (dx === 0 || dx === 6)) || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4); set(xx, yy, on ? 1 : 0); } };
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  for (let i = 8; i < n - 8; i++) { set(i, 6, i % 2 ? 0 : 1); set(6, i, i % 2 ? 0 : 1); }
  const ap = ALIGN[v]; ap.forEach(ax => ap.forEach(ay => { if (f[ay][ax]) return; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1 ? 1 : 0); }));
  for (let i = 0; i < 9; i++) { if (i < 8) { set(8, i < 6 ? i : i + 1, 0); set(i < 6 ? i : i + 1, 8, 0); } set(8, n - 1 - i < n - 8 ? n - 1 - i : n - 1 - i, 0); set(n - 1 - i, 8, 0); }
  set(8, n - 8, 1);
  if (v >= 7) for (let i = 0; i < 18; i++) { const b = (VINFO[v] >> i) & 1; set(Math.floor(i / 3), n - 11 + (i % 3), b); set(n - 11 + (i % 3), Math.floor(i / 3), b); }
  // datos en zigzag con máscara 0
  let bi = 0; const allBits = out.flatMap(b => [7, 6, 5, 4, 3, 2, 1, 0].map(i => (b >> i) & 1));
  for (let x = n - 1; x > 0; x -= 2) { if (x === 6) x--; for (let k = 0; k < n; k++) { const y = ((x + 1) / 2) % 2 === 0 ? k : n - 1 - k; for (const dx of [0, -1]) { const xx = x + dx; if (f[y][xx]) continue; let bit = allBits[bi++] ?? 0; if ((xx + y) % 2 === 0) bit ^= 1; m[y][xx] = bit; } } }
  // formato (nivel L, máscara 0) = 0b111011111000100
  const fmt = 0x77c4; for (let i = 0; i < 15; i++) { const b = (fmt >> i) & 1; const y1 = i < 6 ? i : i < 8 ? i + 1 : n - 15 + i; m[y1][8] = b; const x2 = i < 8 ? n - 1 - i : i < 9 ? 15 - i : 14 - i; m[8][x2] = b; }
  m[n - 8][8] = 1;
  return m;
}
const TOTALS = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
const ALIGN: number[][] = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
const VINFO = [0, 0, 0, 0, 0, 0, 0, 0x07c94, 0x085bc, 0x09a99, 0x0a4d3];
function rs(data: number[], ec: number): number[] {
  const exp = new Array(512).fill(0), log = new Array(256).fill(0); let x = 1; for (let i = 0; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  let gen = [1]; for (let i = 0; i < ec; i++) { const ng = new Array(gen.length + 1).fill(0); for (let j = 0; j < gen.length; j++) { ng[j] ^= gen[j]; ng[j + 1] ^= gen[j] ? exp[(log[gen[j]] + i) % 255] : 0; } gen = ng; }
  const res = new Array(ec).fill(0); const msg = [...data, ...res];
  for (let i = 0; i < data.length; i++) { const c = msg[i]; if (!c) continue; for (let j = 1; j < gen.length; j++) msg[i + j] ^= exp[(log[gen[j]] + log[c]) % 255]; }
  return msg.slice(data.length);
}

export {};
