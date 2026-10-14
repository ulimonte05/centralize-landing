// Tarjeta de precio: país, plan y los tres estados (plan §5.4). Lee plans.json embebido en la tarjeta.
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const setT = (el: Element | null, t: string) => { if (el) el.textContent = t; };
const fmtARS = (n: number) => 'ARS ' + Math.round(n).toLocaleString('es-AR');
const fmtUSD = (n: number) => 'USD ' + (Number.isInteger(n) ? n.toString() : n.toFixed(2).replace('.', ','));

$$('[data-plan-card]').forEach(card => {
  const dataEl = $('script[type="application/json"]', card); if (!dataEl) return;
  const data = JSON.parse(dataEl.textContent || '{}');
  const state = { plan: data.default.plan as string, pais: data.default.pais as string };
  const q = new URLSearchParams(location.search);
  if (q.get('plan') && data.planes.some((p: any) => p.id === q.get('plan'))) state.plan = q.get('plan')!;
  if (q.get('pais') === 'uy') state.pais = 'uy';
  let touched = false;

  const paint = () => {
    const p = data.planes.find((x: any) => x.id === state.plan); const ar = state.pais === 'ar'; const iva = data.iva[state.pais];
    const neto = ar ? p.ar : p.uy; const total = neto * (1 + iva); const usdRef = Math.round(p.ar / data.tipo_cambio.ars_por_usd);
    $$('[data-pais]', card).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pais === state.pais)));
    $$('[data-plan]', card).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plan === state.plan)));
    setT($('[data-f="nombre"]', card), p.nombre + (p.sub ? ` · ${p.sub}` : ''));
    if (data.publicado) {
      setT($('[data-f="neto"]', card), ar ? `${fmtARS(neto)} + IVA` : `${fmtUSD(neto)} + IVA 22 %`);
      setT($('[data-f="ref"]', card), ar ? `≈ USD ${usdRef}` : '');
      setT($('[data-f="total"]', card), `${ar ? fmtARS(total) : fmtUSD(Math.round(total * 100) / 100)} con IVA · ${p.por}`);
      const pesado = ar ? `${fmtARS(data.pesado_extra.ar)} (USD ${data.pesado_extra.uy})` : fmtUSD(data.pesado_extra.uy);
      $$('[data-f="bullet"]', card).forEach((li, i) => { li.textContent = (p.bullets[i] || '').replace('{pesado}', pesado); });
      const nd = $('[data-f="nota_dia"]', card); if (nd) { nd.textContent = p.nota_dia; nd.dataset.go = p.id === 'asesor' ? 'asesor-pro' : ''; }
      setT($('[data-f="cond"]', card), data.cobro ? (ar ? 'Sin permanencia · Lo das de baja con un mensaje · 10 días de devolución' : 'Sin permanencia · Lo das de baja con un mensaje · 5 días hábiles de devolución') : 'Sin permanencia · Lo das de baja con un mensaje');
      const btn = $<HTMLAnchorElement>('[data-f="btn"]', card); const inm = p.id === 'inmobiliaria';
      if (btn) { btn.textContent = inm ? 'Armar el alta del equipo' : (data.cobro ? 'Empezar' : 'Quiero activarlo'); btn.href = `/empezar?plan=${p.id}&pais=${state.pais}`; }
      const sub = $('[data-f="btn_sub"]', card); if (sub) sub.hidden = !inm;
      const aviso = $('[data-f="aviso"]', card); if (aviso) aviso.hidden = data.cobro || inm;
    }
    if (touched && (location.pathname === '/' || location.pathname.startsWith('/v/'))) history.replaceState(null, '', `${location.pathname}?plan=${state.plan}&pais=${state.pais}${location.hash}`);
  };
  card.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('[data-pais],[data-plan],[data-go]') as HTMLElement | null; if (!b) return;
    if (b.hasAttribute('data-go') && !b.dataset.go) return;
    touched = true;
    if (b.dataset.pais) state.pais = b.dataset.pais;
    if (b.dataset.plan) state.plan = b.dataset.plan;
    if (b.dataset.go) state.plan = b.dataset.go;
    paint();
  });
  paint();
});

export {};
