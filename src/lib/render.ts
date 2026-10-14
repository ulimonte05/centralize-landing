// Render compartido (build en Astro y runtime en la island): produce el mismo HTML.
import type { Adjunto, Artefacto, Escena, Mensaje } from './scenes';

export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const ICON = {
  reloj: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  repeat: '<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z"/></svg>',
  all: '<svg viewBox="0 0 24 24"><path d="M13 5l7 7-7 7"/><path d="M5 5l7 7-7 7"/></svg>',
};
export const ICONS = ICON;

/* ---------- mensajes ---------- */
export function sceneMessages(scene: Escena, mode: 'hero' | 'panel') {
  if (mode === 'hero' && scene.variante_hero) return { mensajes: scene.variante_hero.mensajes, ramas: scene.variante_hero.ramas || {} };
  return { mensajes: scene.mensajes, ramas: scene.ramas || {} };
}

export function renderAdjunto(a: Adjunto) {
  return `<div class="doc"><i class="doc-ico ${a.clase}" aria-hidden="true">${a.clase.toUpperCase()}</i><div><b>${esc(a.nombre)}</b>${a.meta ? `<small>${esc(a.meta)}</small>` : ''}</div></div>`;
}

export function renderMessage(m: Mensaje, i: number, hora: string, mode: 'hero' | 'panel', state: 'pending' | 'show' = 'show') {
  const dir = m.de === 'asesor' ? 'out' : 'in';
  const parts: string[] = [];
  if (m.adjuntos?.length) parts.push(`<div class="adj">${m.adjuntos.map(renderAdjunto).join('')}</div>`);
  parts.push(`<p>${esc(m.texto)}</p>`);
  let art = m.artefacto;
  if (!art && mode === 'hero' && m.panel?.tipo === 'agenda') art = { ...m.panel, tipo: 'agenda-mini' };
  if (art) parts.push(renderArtifact(art));
  if (m.link) parts.push(`<span class="link">${esc(m.link)}</span>`);
  if (m.read) parts.push(`<div class="read">${esc(m.read)}</div>`);
  parts.push(`<time>${esc(m.hora || hora)}</time>`);
  if (m.respuestas_rapidas?.length) parts.push(`<div class="qr" role="group" aria-label="Respuestas rápidas">${m.respuestas_rapidas.map(r => `<button type="button" data-reply="${esc(r)}">${esc(r)}</button>`).join('')}</div>`);
  return `<div class="m ${dir} ${state}" data-i="${i}" data-de="${m.de}">${parts.join('')}</div>`;
}

export function renderMessages(list: Mensaje[], hora: string, mode: 'hero' | 'panel', state: 'pending' | 'show' = 'show', offset = 0) {
  return list.map((m, i) => renderMessage(m, i + offset, hora, mode, state)).join('');
}
export const SYS_ROW = '<div class="sys pending"><button type="button" class="pill" data-act="replay" hidden>Repetir</button><button type="button" class="pill on" data-act="next" hidden>Siguiente momento →</button></div>';

/* ---------- artefactos (tarjetas dentro del chat) ---------- */
export function renderArtifact(a: Artefacto): string {
  switch (a.tipo) {
    case 'tabla':
      return `<div class="art art-tabla">${a.titulo ? `<div class="art-title">${esc(a.titulo)}</div>` : ''}<ul>${(a.filas as string[][]).map(r => `<li>${r.map(c => `<span>${esc(c)}</span>`).join('')}</li>`).join('')}</ul>${a.link ? `<span class="more">${esc(a.link)}</span>` : ''}${a.boton ? `<button type="button" class="copy" data-copy="${esc((a.filas as string[][]).map(r => r.join(' · ')).join('\n'))}">${esc(a.boton)}</button>` : ''}</div>`;
    case 'rutina':
      return `<div class="art art-rutina"><span class="ico" aria-hidden="true">${a.icono === 'reloj' ? ICON.reloj : ICON.repeat}</span><div><b>${esc(a.cuando)}</b><span>${esc(a.que)}</span></div>${a.estado ? `<em>${esc(a.estado)}</em>` : ''}</div>`;
    case 'archivo':
      return renderAdjunto(a as unknown as Adjunto);
    case 'texto':
      return `<div class="art art-texto">${a.texto ? `<p>${esc(a.texto)}</p><button type="button" class="copy" data-copy="${esc(a.texto)}">Copiar</button>` : ''}${a.links ? `<ul class="links">${(a.links as string[]).map(l => `<li>tokko.com/ficha/${esc(l.toLowerCase().replace(/\s+/g, '-'))}</li>`).join('')}</ul>` : ''}</div>`;
    case 'chips':
      return `<div class="art art-chips">${(a.items as string[]).map(c => `<span>${esc(c)}</span>`).join('')}</div>`;
    case 'plan':
      return `<div class="art art-plan"><div class="art-title">${esc(a.titulo)}</div><ul>${(a.items as string[][]).map(([n, t]) => `<li><b>${esc(n)}</b><span>${esc(t)}</span></li>`).join('')}</ul></div>`;
    case 'registro':
      return `<div class="art art-registro"><ul>${(a.filas as string[][]).map(([n, t]) => `<li><i class="tick" aria-hidden="true"></i><b>${esc(n)}</b><span>${esc(t)}</span></li>`).join('')}</ul></div>`;
    case 'informe':
      return `<div class="art art-informe"><div class="cover"><div class="cif">${(a.cifras as string[][]).map(([n, t]) => `<div><b>${esc(n)}</b> <small>${esc(t)}</small></div>`).join('')}</div><div class="bars" aria-hidden="true">${(a.barras as number[]).map(h => `<i style="--h:${h / 5}"></i>`).join('')}</div></div>${renderAdjunto({ clase: 'pdf', nombre: a.nombre, meta: a.meta })}</div>`;
    case 'landing-mini':
      return `<div class="art art-landing"><div class="art-title">Vista previa · Aurora Palermo</div><div class="cover" aria-hidden="true"></div><ul><li><span>1 ambiente</span><b>USD 89.000</b></li><li><span>2 ambientes</span><b>USD 128.000</b></li><li><span>3 ambientes</span><b>USD 196.000</b></li></ul></div>`;
    case 'acm-mini':
      return `<div class="art art-acm"><div class="art-title">ACM · 3 amb · Caballito · 70 m²</div><div class="range">USD 152.000 — 164.000</div><div class="axis" aria-hidden="true"><span class="band"></span><span class="pt own" style="left:36%"></span><span class="pt" style="left:41%"></span><span class="pt own" style="left:45%"></span><span class="pt" style="left:52%"></span><span class="pt own" style="left:58%"></span><span class="pt" style="left:22%"></span><span class="pt" style="left:72%"></span><span class="me"></span></div><div class="lbl"><span>USD 1.900/m²</span><span>tu 3 amb · 2.250</span><span>2.600</span></div></div>`;
    case 'base-mini':
      return `<div class="art art-base"><b>128</b><small>de 1.940 contactos revisados</small><b>41</b><small>sin respuesta hace más de 30 días</small><b>17</b><small>piden cochera</small></div>`;
    case 'agenda-mini':
      return `<div class="art art-agenda"><div class="art-title">${esc(a.titulo)}</div><ul>${(a.filas as any[]).map(f => `<li class="${f.estado || ''}"><time>${esc(f.hora)}</time><div><b>${esc(f.texto)}</b><small>${esc(f.sub)}</small></div></li>`).join('')}</ul></div>`;
    default:
      return '';
  }
}

/* ---------- panel derecho (Un día) ---------- */
function acmSvg() {
  // eje USD/m² 1.900–2.600; banda 2.150–2.350; 6 propios, 9 externos, 2 fuera de rango
  const x = (v: number) => 20 + ((v - 1900) / 700) * 360;
  const own = [2180, 2225, 2260, 2300, 2330, 2210];
  const ext = [2160, 2195, 2240, 2275, 2310, 2345, 2170, 2290, 2250];
  const out = [1960, 2540];
  const ys = [34, 50, 42, 58, 38, 54, 46, 62, 36, 52, 44, 60, 40, 56, 48];
  let n = 0;
  const pts = [
    ...own.map((v, i) => `<circle class="pt own" style="--n:${n++}" cx="${x(v).toFixed(1)}" cy="${ys[i]}" r="5"/>`),
    ...ext.map((v, i) => `<circle class="pt ext" style="--n:${n++}" cx="${x(v).toFixed(1)}" cy="${ys[i + 6]}" r="5"/>`),
    ...out.map((v, i) => `<circle class="pt out" style="--n:${n++}" cx="${x(v).toFixed(1)}" cy="${i ? 44 : 50}" r="5"/><line class="strike" x1="${(x(v) - 7).toFixed(1)}" y1="${i ? 37 : 43}" x2="${(x(v) + 7).toFixed(1)}" y2="${i ? 51 : 57}"/>`),
  ].join('');
  return `<svg class="acm-eje" viewBox="0 0 400 110" role="img" aria-label="Eje de precios por metro cuadrado: 15 comparables dentro de la banda de 2.150 a 2.350 dólares, 2 descartados">
    <rect class="band" x="${x(2150).toFixed(1)}" y="22" width="${(x(2350) - x(2150)).toFixed(1)}" height="50" rx="8"/>
    <line x1="20" y1="80" x2="380" y2="80" stroke="#EEE8E2" stroke-width="2"/>
    <text x="20" y="98">1.900</text><text x="${x(2150) - 12}" y="98">2.150</text><text x="${x(2350) - 12}" y="98">2.350</text><text x="352" y="98">2.600</text>
    ${pts}
    <g class="me"><line x1="${x(2250)}" y1="18" x2="${x(2250)}" y2="80" stroke="#17161B" stroke-width="1.5" stroke-dasharray="3 3"/><rect x="${x(2250) - 56}" y="2" width="112" height="16" rx="8"/><text x="${x(2250)}" y="13" text-anchor="middle">tu 3 amb · USD 2.250/m²</text></g>
  </svg>`;
}

function baseSvg() {
  const COLS = 36, TOTAL = 485, HITS = 32, STEP = 10, R = 3;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hits = new Set<number>(); while (hits.size < HITS) hits.add(Math.floor(rnd() * TOTAL));
  let all = '', hit = '';
  const dot = (cx: number, cy: number) => `M${cx - R} ${cy}a${R} ${R} 0 1 0 ${R * 2} 0a${R} ${R} 0 1 0 -${R * 2} 0`;
  let j = 0;
  for (let i = 0; i < TOTAL; i++) {
    const cx = (i % COLS) * STEP + 6, cy = Math.floor(i / COLS) * STEP + 6;
    if (hits.has(i)) { hit += dot(250 + (j % 8) * 12, 24 + Math.floor(j / 8) * 12); j++; }
    else all += dot(cx, cy);
  }
  return `<svg class="base-dots" viewBox="0 0 366 150" role="img" aria-label="Tu base: 1.940 contactos revisados, 128 agrupados como palermo-3amb">
    <path class="all" d="${all}"/><path class="hits" d="${hit}"/>
    <g class="cluster"><rect x="240" y="12" width="110" height="60" rx="8"/><text x="240" y="90">palermo-3amb · 128</text></g>
  </svg>`;
}

function landingSvg() {
  return `<svg class="lp-svg" viewBox="0 0 420 330" role="img" aria-label="Vista previa de la landing Aurora Palermo: unidades con precio, amenities y financiación">
    <rect width="420" height="330" fill="#fff"/>
    <text x="20" y="26" class="disp" font-size="12" letter-spacing="2" fill="#17161B">AURORA</text><text x="330" y="26" font-size="10" fill="#6C6661">Unidades · Amenities · Contacto</text>
    <rect x="230" y="44" width="170" height="110" rx="12" fill="url(#g)"/>
    <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#F7C7A1"/><stop offset="1" stop-color="#F2A68C"/></linearGradient></defs>
    <text x="20" y="72" class="disp" font-size="22" fill="#17161B">Aurora Palermo</text>
    <text x="20" y="92" font-size="11" fill="#6C6661">1, 2 y 3 ambientes con balcón terraza</text>
    <rect x="20" y="106" width="118" height="26" rx="13" fill="#0F7540"/><text x="79" y="123" text-anchor="middle" font-size="11" font-weight="600" fill="#fff">Consultar por WhatsApp</text>
    <text x="20" y="182" font-size="9" letter-spacing="1.5" fill="#6C6661">UNIDADES</text>
    <line x1="20" y1="192" x2="250" y2="192" stroke="#EEE8E2"/><text x="20" y="210" font-size="12" fill="#17161B">1 ambiente · 38 m²</text><text x="250" y="210" text-anchor="end" font-size="12" font-weight="600" fill="#17161B">USD 89.000</text>
    <line x1="20" y1="222" x2="250" y2="222" stroke="#EEE8E2"/><text x="20" y="240" font-size="12" fill="#17161B">2 ambientes · 56 m²</text><text x="250" y="240" text-anchor="end" font-size="12" font-weight="600" fill="#17161B">USD 128.000</text>
    <line x1="20" y1="252" x2="250" y2="252" stroke="#EEE8E2"/><text x="20" y="270" font-size="12" fill="#17161B">3 ambientes · 84 m²</text><text x="250" y="270" text-anchor="end" font-size="12" font-weight="600" fill="#17161B">USD 196.000</text>
    <text x="280" y="182" font-size="9" letter-spacing="1.5" fill="#6C6661">AMENITIES</text>
    <rect x="280" y="194" width="52" height="20" rx="10" fill="#FBF8F5" stroke="#EEE8E2"/><text x="306" y="208" text-anchor="middle" font-size="9" fill="#17161B">Piscina</text>
    <rect x="338" y="194" width="42" height="20" rx="10" fill="#FBF8F5" stroke="#EEE8E2"/><text x="359" y="208" text-anchor="middle" font-size="9" fill="#17161B">SUM</text>
    <rect x="280" y="220" width="46" height="20" rx="10" fill="#FBF8F5" stroke="#EEE8E2"/><text x="303" y="234" text-anchor="middle" font-size="9" fill="#17161B">Gym</text>
    <rect x="332" y="220" width="60" height="20" rx="10" fill="#FBF8F5" stroke="#EEE8E2"/><text x="362" y="234" text-anchor="middle" font-size="9" fill="#17161B">Cocheras</text>
    <text x="280" y="268" font-size="9" letter-spacing="1.5" fill="#6C6661">FINANCIACIÓN</text><text x="280" y="286" font-size="12" font-weight="600" fill="#0F7540">36 cuotas</text>
    <rect x="0" y="306" width="420" height="24" fill="#FBF8F5"/><text x="20" y="322" font-size="9" fill="#6C6661">vista previa · aurora-palermo</text>
  </svg>`;
}

export function renderPanel(p: Artefacto | null, extra: { pila?: Artefacto[] } = {}): string {
  if (!p) return `<div class="panel-head"><b>Lo que dejó el día</b></div><div class="panel-body"><div class="panel-empty">Cada pedido deja algo: un PDF, una planilla, una etiqueta en Tokko, un recordatorio.</div></div>`;
  switch (p.tipo) {
    case 'agenda':
      return `<div class="panel-head"><b>${esc(p.titulo)}</b><span>agenda</span></div><div class="panel-body"><ul class="pa-list">${(p.filas as any[]).map(f => `<li class="${f.estado || ''}"><time>${esc(f.hora)}</time><i aria-hidden="true"></i><div><b>${esc(f.texto)}</b><small>${esc(f.sub)}</small></div><span class="tag">${esc(f.tag)}</span></li>`).join('')}${p.nueva ? `<li class="nueva"><time>${esc(p.nueva.hora)}</time><i aria-hidden="true"></i><div><b>${esc(p.nueva.texto)}</b><small>${esc(p.nueva.sub)}</small></div><span class="tag">${esc(p.nueva.tag)}</span></li>` : ''}</ul>${p.rutinas ? `<div class="pa-rutinas">${(p.rutinas as string[][]).map(([a, b]) => `<span><b>${esc(a)}</b>${esc(b)}</span>`).join('')}</div>` : ''}</div>`;
    case 'acm':
      return `<div class="panel-head"><b>ACM · 3 amb · Caballito · 70 m²</b><span class="big tabular">USD 152.000 — 164.000</span></div><div class="panel-body">${acmSvg()}<div class="acm-legend"><span><i class="own"></i>tu cartera (6)</span><span><i class="ext"></i>Red Tokko y portales (9)</span><span>2 descartados</span></div><div class="pdf-sheet" aria-hidden="true"><span class="pdf-tag">PDF</span><b>Informe de tasación</b><small>3 ambientes · Caballito · 70 m²</small><span class="pdf-range">USD 152.000 — 164.000</span><i></i><i class="short"></i><i></i></div></div>`;
    case 'base':
      return `<div class="panel-head"><b>Tu base</b><span class="big tabular">1.940 de 1.940</span></div><div class="panel-body">${baseSvg()}<div class="base-stats"><div><b>128</b><small>consultaron por 3 amb en Palermo sin visita</small></div><div><b>41</b><small>sin respuesta hace más de 30 días</small></div><div><b>17</b><small>piden cochera</small></div></div><div class="base-note">1 punto = 4 contactos · contactos: 1.940 de 1.940 revisados</div><div class="xls-sheet" aria-hidden="true"><table><thead><tr><th>Nombre</th><th>Teléfono</th><th>Presupuesto</th><th>Etiqueta</th></tr></thead><tbody><tr><td>Carla M.</td><td>11 5555 0210</td><td>USD 150.000</td><td class="tagc">palermo-3amb</td></tr><tr><td>Diego F.</td><td>11 5555 0233</td><td>USD 170.000</td><td class="tagc">palermo-3amb</td></tr><tr><td>Ana R.</td><td>11 5555 0251</td><td>USD 160.000</td><td class="tagc">palermo-3amb</td></tr><tr><td>…</td><td>125 filas más</td><td></td><td></td></tr></tbody></table></div></div>`;
    case 'landing':
      return `<div class="panel-head"><span class="dots-3" aria-hidden="true"><i></i><i></i><i></i></span><span class="url">vista previa · aurora-palermo</span></div><div class="panel-body browser-body"><div class="lp-skel" aria-hidden="true"><i style="width:30%;height:14px"></i><i style="width:60%;height:28px"></i><i style="width:45%;height:12px"></i><i style="height:90px;border-radius:12px"></i><i style="width:80%;height:12px"></i><i style="width:70%;height:12px"></i></div>${landingSvg()}</div>`;
    case 'pila':
      return `<div class="panel-head"><b>Lo que dejó el día</b><span>${(extra.pila || []).length} ${(extra.pila || []).length === 1 ? "pedido" : "pedidos"}</span></div><div class="panel-body"><ul class="pila-list">${(extra.pila || []).map(renderPilaItem).join('')}</ul>${!(extra.pila || []).length ? '<div class="panel-empty">Tocá un pedido de la lista y acá queda lo que dejó.</div>' : ''}</div>`;
    default:
      return '';
  }
}

export function renderPilaItem(a: Artefacto) {
  if (a.tipo === 'archivo') return `<li><i class="doc-ico ${a.clase}" aria-hidden="true">${String(a.clase).toUpperCase()}</i><div><b>${esc(a.nombre)}</b><small>${esc(a.meta)}</small></div><span class="unidad">${esc(a.unidad)}</span></li>`;
  return `<li><span class="ico" aria-hidden="true">${ICON.check}</span><div><b>${esc(a.titulo)}</b><small>${esc(a.sub)}</small></div><span class="unidad">${esc(a.unidad)}</span></li>`;
}

/* ---------- cáscara del chat ---------- */
export function renderChatShell(opts: { instance: string; mode: 'hero' | 'panel'; etiqueta: string; inner: string; sceneId: string; classes?: string; panel?: string }) {
  return `<div class="chat ${opts.classes || ''}" data-chat="${opts.instance}" data-mode="${opts.mode}" data-scene="${opts.sceneId}"${opts.panel ? ` data-panel-for="${opts.panel}"` : ''}>
  <div class="chat-head">
    <img src="/assets/centralito.jpg" width="36" height="36" alt="Centralito">
    <div class="who"><b>Centralito</b><small>en línea</small><span class="tag">${esc(opts.etiqueta)}</span></div>
    <div class="chat-ctl"><button type="button" data-act="pause" aria-pressed="false"><span class="i" aria-hidden="true">${ICON.pause}</span><span class="t">Pausar</span></button><button type="button" data-act="all"><span aria-hidden="true">${ICON.all}</span><span class="t">Ver todo</span></button></div>
  </div>
  <div class="chat-body"><div class="notif" aria-hidden="true"><img src="/assets/centralito.jpg" width="28" height="28" alt=""><div><b>Centralito</b><span>Buen día, Caro. Hoy: 3 leads de anoche…</span></div></div><div class="msgs" role="log" aria-label="Conversación de ejemplo con Centralito">${opts.inner}</div></div>
  <div class="composer" aria-hidden="true"><span class="c-plus"></span><div class="c-field"><span class="c-txt"></span><i class="c-caret"></i><em>Mensaje</em></div><span class="c-mic"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></span><span class="c-send"><svg viewBox="0 0 24 24"><path d="M5 12h13M12 6l6 6-6 6"/></svg></span></div>
  <div class="sr-only" aria-live="polite" data-announce></div>
</div>`;
}

/** Estado final de una escena, para el HTML inicial (SEO, sin JS, reduced motion). */
export function renderSceneFinal(scene: Escena, mode: 'hero' | 'panel') {
  const { mensajes } = sceneMessages(scene, mode);
  return renderMessages(mensajes, scene.hora, mode, 'show');
}
