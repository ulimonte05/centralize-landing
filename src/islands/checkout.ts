// /contratar: país (geo + selector), botón "Empezar mi prueba" → POST /billing/checkout → redirige al pago.
import { priceLine, currencyFor } from '@/lib/pricing';
import plans from '@/data/plans.json';
import { startCheckout } from '@/lib/checkout';
import { currentAttribution } from '@/lib/attribution';
import { track } from '@/lib/track';

const root = document.querySelector<HTMLElement>('[data-contratar]');
const btn = document.querySelector<HTMLButtonElement>('[data-start]');
const priceEl = document.querySelector<HTMLElement>('[data-price]');
const labelEl = document.querySelector<HTMLElement>('[data-country-label]');
const toggle = document.querySelector<HTMLButtonElement>('[data-country-toggle]');
const errorEl = document.querySelector<HTMLElement>('[data-error]');

if (root && btn && priceEl && labelEl && toggle && errorEl) {
  const IDLE = btn.textContent || 'Empezar mi prueba';
  let country = 'AR';
  let chosen = false; // si el visitante eligió a mano, la geo no pisa su elección
  let busy = false;

  const paint = () => {
    const p = priceLine(country);
    priceEl.textContent = `Después ${p.promo} al mes por ${p.promoMonths} meses, y ${p.list} al mes.`;
    labelEl.textContent = country === 'AR' ? 'Precios para Argentina.' : 'Precios para el resto del mundo, en dólares.';
    toggle.textContent = country === 'AR' ? '¿No estás en Argentina?' : 'Estoy en Argentina';
  };
  toggle.addEventListener('click', () => { chosen = true; geoReady(); country = country === 'AR' ? 'US' : 'AR'; paint(); });

  // El botón espera a la geo (máx. ~1,5 s) para no cobrar en la moneda equivocada; si vence, queda AR por defecto.
  const GEO_TIMEOUT_MS = 1500;
  let geoDone = false;
  const geoReady = () => { if (geoDone) return; geoDone = true; if (!busy) btn.disabled = false; };
  btn.disabled = true;
  const geoTimer = setTimeout(geoReady, GEO_TIMEOUT_MS);
  fetch('/api/geo', { signal: AbortSignal.timeout(GEO_TIMEOUT_MS) }).then(r => r.json()).then((g: { country?: unknown }) => {
    if (geoDone || chosen || typeof g.country !== 'string' || !/^[A-Za-z]{2}$/.test(g.country)) return;
    country = g.country.toUpperCase(); paint();
  }).catch(() => { /* sin geo: queda Argentina */ }).finally(() => { clearTimeout(geoTimer); geoReady(); });

  const setBusy = (on: boolean) => {
    busy = on; btn.disabled = on || !geoDone; btn.textContent = on ? 'Abriendo el pago…' : IDLE;
    if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy');
  };

  btn.addEventListener('click', async () => {
    if (busy) return; // doble clic: un solo request
    setBusy(true); errorEl.hidden = true;
    const attribution = currentAttribution();
    const currency = currencyFor(country);
    track('InitiateCheckout', { value: String(plans.prices[currency].promo), currency }, { eventId: attribution.event_id });
    const r = await startCheckout({
      fetch: (...a) => fetch(...a), apiUrl: root.dataset.api || 'https://api.centralize.dev', country, attribution,
      navigate: url => { location.assign(url); },
    });
    if (!r.ok) { setBusy(false); errorEl.hidden = false; }
  });

  // volver con "atrás" desde el pago: la página viene del bfcache con el botón deshabilitado
  addEventListener('pageshow', e => { if ((e as PageTransitionEvent).persisted) setBusy(false); });
}
