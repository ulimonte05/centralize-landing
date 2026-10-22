// /gracias: consulta GET /billing/checkout/:sessionId hasta que haya código (máx. ~60 s) y pinta la vista.
import { graciasView, MAX_ATTEMPTS, type View } from '@/lib/gracias';

const root = document.querySelector<HTMLElement>('[data-gracias]');

if (root) {
  const api = (root.dataset.api || 'https://api.centralize.dev').replace(/\/+$/, '');
  const q = new URLSearchParams(location.search);
  const sessionId = q.get('session_id');
  const views = Array.from(root.querySelectorAll<HTMLElement>('[data-view]'));
  const el = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;

  const show = (kind: View['kind']) => {
    for (const v of views) v.hidden = v.dataset.view !== kind;
  };

  const paint = (view: View) => {
    show(view.kind);
    if (view.kind !== 'ready') return;
    el('[data-nombre]').textContent = view.nombre ? `¡Listo, ${view.nombre}!` : '¡Listo!';
    el<HTMLAnchorElement>('[data-wa-btn]').href = view.waUrl;
    const box = el('[data-code-box]');
    box.hidden = !view.claimCode;
    if (view.claimCode) el('[data-code]').textContent = view.claimCode;
  };

  let copyTimer: ReturnType<typeof setTimeout> | undefined;
  el<HTMLButtonElement>('[data-copy]').addEventListener('click', e => {
    const b = e.currentTarget as HTMLButtonElement;
    const original = b.dataset.label ?? (b.dataset.label = b.textContent || 'Copiar código');
    const done = (text: string) => {
      b.textContent = text;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { b.textContent = original; }, 2500);
    };
    const code = el('[data-code]').textContent || '';
    if (!navigator.clipboard?.writeText) { done('Copialo a mano'); return; }
    navigator.clipboard.writeText(code).then(() => done('Copiado')).catch(() => done('Copialo a mano'));
  });

  const demo = root.dataset.demo === '1' ? q.get('demo') : null;
  if (demo === 'ready') {
    paint({ kind: 'ready', nombre: 'Lucía', claimCode: 'ALTA-K7M2QX', waUrl: 'https://wa.me/5491100000000?text=ALTA-K7M2QX' });
  } else if (demo === 'pending') {
    show('pending');
  } else if (demo === 'gave_up') {
    show('gave_up');
  } else {
    let token = 0; // un reintento manual cancela el ciclo anterior
    const run = async () => {
      const mine = ++token;
      show('pending');
      for (let attempt = 1; ; attempt++) {
        let response: { httpStatus: number; body?: unknown } | null = null;
        if (sessionId && /^[A-Za-z0-9_]{1,255}$/.test(sessionId)) {
          try {
            const r = await fetch(`${api}/billing/checkout/${encodeURIComponent(sessionId)}`, { signal: AbortSignal.timeout(10000) });
            let body: unknown; try { body = await r.json(); } catch { body = undefined; }
            response = { httpStatus: r.status, body };
          } catch { response = null; }
        }
        if (mine !== token) return;
        const view = graciasView({ sessionId, response, attempt, maxAttempts: MAX_ATTEMPTS });
        if (view.kind !== 'pending') { paint(view); return; }
        await new Promise(r => setTimeout(r, view.retryInMs));
        if (mine !== token) return;
      }
    };
    root.querySelector('[data-retry]')?.addEventListener('click', run);
    run();
  }
}
