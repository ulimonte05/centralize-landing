// Tarjeta de precio: país, plan y los tres estados (plan §5.4). Lee plans.json embebido en la página.
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const fmtARS = (n: number) => 'ARS ' + Math.round(n).toLocaleString('es-AR');
const fmtUSD = (n: number) => 'USD ' + (Number.isInteger(n) ? n.toString() : n.toFixed(2).replace('.', ','));

$$('[data-plan-card]').forEach(card => {
  const data = JSON.parse(($('script[type="application/json"]', card)!).textContent || '{}');
  const state = { plan: data.default.plan, pais: data.default.pais };
  const q = new URLSearchParams(location.search); if (q.get('plan') && data.planes.some((p: any) => p.id === q.get('plan'))) state.plan = q.get('plan'); if (q.get('pais') === 'uy') state.pais = 'uy';
  let touched = false;
  const paint = () => {
    const p = data.planes.find((x: any) => x.id === state.plan); const ar = state.pais === 'ar'; const iva = data.iva[state.pais];
    const neto = ar ? p.ar : p.uy; const total = neto * (1 + iva); const usdRef = Math.round(p.ar / data.tipo_cambio.ars_por_usd);
    $$('[data-pais]', card).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pais === state.pais)));
    $$('[data-plan]', card).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plan === state.plan)));
    ($('[data-f="nombre"]', card)!).textContent = p.nombre + (p.sub ? ` · ${p.sub}` : '');
    if (data.publicado) {
      ($('[data-f="neto"]', card)!).textContent = ar ? `${fmtARS(neto)} + IVA` : `${fmtUSD(neto)} + IVA 22 %`;
      ($('[data-f="ref"]', card)!).textContent = ar ? `≈ USD ${usdRef}` : '';
      ($('[data-f="total"]', card)!).textContent = `${ar ? fmtARS(total) : fmtUSD(Math.round(total * 100) / 100)} con IVA · ${p.por}`;
      const pesado = ar ? `${fmtARS(data.pesado_extra.ar)} (USD ${data.pesado_extra.uy})` : fmtUSD(data.pesado_extra.uy);
      $$('[data-f="bullet"]', card).forEach((li, i) => { li.textContent = (p.bullets[i] || '').replace('{pesado}', pesado); });
      ($('[data-f="nota_dia"]', card)!).textContent = p.nota_dia;
      ($('[data-f="nota_dia"]', card)!).dataset.go = p.id === 'asesor' ? 'asesor-pro' : '';
      const cond = $('[data-f="cond"]', card)!;
      cond.textContent = data.cobro ? (ar ? 'Sin permanencia · Lo das de baja con un mensaje · 10 días de devolución' : 'Sin permanencia · Lo das de baja con un mensaje · 5 días hábiles de devolución') : 'Sin permanencia · Lo das de baja con un mensaje';
      const btn = $<HTMLAnchorElement>('[data-f="btn"]', card)!; const inm = p.id === 'inmobiliaria';
      btn.textContent = inm ? 'Armar el alta del equipo' : (data.cobro ? 'Empezar' : 'Quiero activarlo');
      btn.href = `/empezar?plan=${p.id}&pais=${state.pais}`;
      const sub = $('[data-f="btn_sub"]', card)!; sub.hidden = !inm;
      const aviso = $('[data-f="aviso"]', card)!; aviso.hidden = data.cobro || inm;
    }
    if (touched && (location.pathname === '/' || location.pathname.startsWith('/v/'))) history.replaceState(null, '', `${location.pathname}?plan=${state.plan}&pais=${state.pais}${location.hash}`);
  };
  card.addEventListener('click', e => {
    const t = e.target as HTMLElement; const b = t.closest('[data-pais],[data-plan],[data-go]') as HTMLElement | null; if (!b) return;
    touched = true;
    if (b.dataset.pais) state.pais = b.dataset.pais; if (b.dataset.plan) state.plan = b.dataset.plan; if (b.dataset.go) state.plan = b.dataset.go; else if (b.hasAttribute('data-go') && !b.dataset.go) return;
    paint();
  });
  paint();
});
