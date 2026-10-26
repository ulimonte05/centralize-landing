// /contratar en modo mes gratis: formulario (nombre, WhatsApp, email) → POST /billing/free-signup → /gracias.
import { buildWhatsapp, startFreeSignup, type FreeSignupError, type Pais } from '@/lib/freeSignup';
import { currentAttribution } from '@/lib/attribution';
import { track } from '@/lib/track';
import contact from '@/data/contact.json';

const form = document.querySelector<HTMLFormElement>('[data-free-form]');
const btn = form?.querySelector<HTMLButtonElement>('[data-submit]');
const errorEl = form?.querySelector<HTMLElement>('[data-error]');
const paisEl = form?.querySelector<HTMLSelectElement>('#f-pais');
const telEl = form?.querySelector<HTMLInputElement>('#f-tel');
const helpEl = form?.querySelector<HTMLElement>('[data-tel-help]');

const AYUDA: Record<Pais, { placeholder: string; help: string }> = {
  AR: { placeholder: '11 5555 0101', help: 'Código de área y número, sin 0 ni 15. Es el número desde el que vas a usar Centralito.' },
  UY: { placeholder: '099 123 456', help: 'Tu celular. Es el número desde el que vas a usar Centralito.' },
  OTRO: { placeholder: '+1 305 555 0101', help: 'El número completo, empezando con + y el código de país.' },
};

// Soporte = WhatsApp de ventas (el de Centralito es el bot).
const soporte = `https://wa.me/${contact.whatsapp_ventas.e164}?text=${encodeURIComponent('Hola, quiero anotarme al mes gratis de Centralito')}`;
const MENSAJES: Record<FreeSignupError | 'tel' | 'email' | 'nombre', string> = {
  nombre: 'Escribí tu nombre.',
  tel: 'Revisá el número de WhatsApp.',
  email: 'Revisá el email.',
  already_used: 'Ese WhatsApp o email ya usó su mes gratis. Si querés seguir con Centralito, escribinos.',
  invalid: 'Revisá los datos: algo no está bien escrito.',
  rate_limited: 'Hubo demasiados intentos desde tu conexión. Probá de nuevo en un rato.',
  unavailable: 'El alta no está disponible en este momento. Escribinos por WhatsApp y te activamos.',
  network: 'No pudimos conectarnos. Revisá tu conexión y probá de nuevo.',
  bad_response: 'Algo falló de nuestro lado. Probá de nuevo o escribinos por WhatsApp.',
};
const CON_SOPORTE = new Set(['already_used', 'unavailable', 'bad_response']);

if (form && btn && errorEl && paisEl && telEl && helpEl) {
  const IDLE = btn.textContent || 'Empezar mi mes gratis';
  let busy = false;
  let paisElegido = false;

  const pintarPais = () => {
    const a = AYUDA[paisEl.value as Pais] ?? AYUDA.AR;
    telEl.placeholder = a.placeholder;
    helpEl.textContent = a.help;
  };
  paisEl.addEventListener('change', () => { paisElegido = true; pintarPais(); });

  // País sugerido por la geo (si la persona no eligió antes).
  fetch('/api/geo', { signal: AbortSignal.timeout(1500) }).then(r => r.json()).then((g: { country?: unknown }) => {
    if (paisElegido || typeof g.country !== 'string') return;
    const c = g.country.toUpperCase();
    paisEl.value = c === 'AR' || c === 'UY' ? c : 'OTRO';
    pintarPais();
  }).catch(() => { /* sin geo: queda Argentina */ });

  const campos: Partial<Record<keyof typeof MENSAJES, HTMLInputElement | null>> = {
    nombre: form.querySelector('#f-nombre'), tel: telEl, email: form.querySelector('#f-email'),
  };
  const mostrarError = (key: keyof typeof MENSAJES) => {
    for (const el of Object.values(campos)) el?.removeAttribute('aria-invalid');
    const campo = campos[key];
    if (campo) { campo.setAttribute('aria-invalid', 'true'); campo.focus(); }
    errorEl.textContent = MENSAJES[key];
    if (CON_SOPORTE.has(key)) {
      const a = document.createElement('a');
      a.className = 'link'; a.href = soporte; a.target = '_blank'; a.rel = 'noopener'; a.textContent = ' Escribir por WhatsApp';
      errorEl.append(a);
    }
    errorEl.hidden = false;
  };

  const setBusy = (on: boolean) => {
    busy = on; btn.disabled = on; btn.textContent = on ? 'Anotándote…' : IDLE;
    if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return; // doble envío: un solo request
    errorEl.hidden = true;
    const data = new FormData(form);
    const nombre = String(data.get('nombre') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const pais = (String(data.get('pais') ?? 'AR')) as Pais;
    const whatsapp = buildWhatsapp(pais, String(data.get('whatsapp') ?? ''));
    if (!nombre) return mostrarError('nombre');
    if (!whatsapp) return mostrarError('tel');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrarError('email');

    setBusy(true);
    const attribution = currentAttribution();
    const r = await startFreeSignup({
      fetch: (...a) => fetch(...a), apiUrl: form.dataset.api || 'https://api.centralize.dev',
      nombre, whatsapp, email, pais, attribution,
      navigate: url => { track('Lead', { content_name: 'mes_gratis' }, { eventId: attribution.event_id }); location.assign(url); },
    });
    if (!r.ok) { setBusy(false); mostrarError(r.error); }
  });

  // volver con "atrás" desde /gracias: la página viene del bfcache con el botón deshabilitado
  addEventListener('pageshow', e => { if ((e as PageTransitionEvent).persisted) setBusy(false); });
}
