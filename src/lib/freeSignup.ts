import type { Attribution } from './attribution';

// Mes gratis sin tarjeta: arma el WhatsApp en formato internacional, llama a
// POST /billing/free-signup y lleva a /gracias con el session_id.

export type Pais = 'AR' | 'UY' | 'OTRO';

/**
 * WhatsApp en dígitos internacionales (5491155550101), o null si no cierra.
 *  - AR: código de área + número = 10 dígitos, sin 0 ni 15 (11 5555 0101) → 549 + 10.
 *  - UY: celular de 8 dígitos (9X XXX XXX), con o sin el 0 → 598 + 8.
 *  - Otro: número completo con código de país (con + o 00), 10 a 15 dígitos.
 * Si ya viene con el código del país (+54 9 ..., 598 ...) se respeta.
 */
export function buildWhatsapp(pais: Pais, raw: string): string | null {
  const d = raw.replace(/\D/g, '');
  if (pais === 'AR') {
    if (/^549\d{10}$/.test(d)) return d;
    if (/^54\d{10}$/.test(d)) return `549${d.slice(2)}`;
    const local = d.replace(/^0/, '');
    return /^\d{10}$/.test(local) ? `549${local}` : null;
  }
  if (pais === 'UY') {
    if (/^5989\d{7}$/.test(d)) return d;
    const local = d.replace(/^0/, '');
    return /^9\d{7}$/.test(local) ? `598${local}` : null;
  }
  // Sin + / 00 no se puede saber si trae el código de país (305 555 0101 no lo trae).
  if (!/^\s*(\+|00)/.test(raw)) return null;
  const intl = d.replace(/^00/, '');
  return intl.length >= 10 && intl.length <= 15 ? intl : null;
}

/** País para la API (precios y moneda después del mes gratis): "otro" = resto del mundo. */
export const apiCountry = (pais: Pais): string => (pais === 'OTRO' ? 'US' : pais);

export type FreeSignupError = 'network' | 'already_used' | 'invalid' | 'rate_limited' | 'unavailable' | 'bad_response';
export type FreeSignupResult = { ok: true } | { ok: false; error: FreeSignupError };

export interface FreeSignupDeps {
  fetch: typeof fetch;
  apiUrl: string;
  nombre: string;
  whatsapp: string;
  email: string;
  pais: Pais;
  attribution: Attribution;
  navigate: (url: string) => void;
}

const TIMEOUT_MS = 15000;
const SESSION_RE = /^free_[A-Za-z0-9]{1,64}$/;

/** Nunca lanza: devuelve el motivo del error. */
export async function startFreeSignup(d: FreeSignupDeps): Promise<FreeSignupResult> {
  let res: Response;
  try {
    res = await d.fetch(`${d.apiUrl.replace(/\/+$/, '')}/billing/free-signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nombre: d.nombre, phone: d.whatsapp, email: d.email, country: apiCountry(d.pais), attribution: d.attribution }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: 'network' };
  }
  if (res.status === 409) return { ok: false, error: 'already_used' };
  if (res.status === 400) return { ok: false, error: 'invalid' };
  if (res.status === 429) return { ok: false, error: 'rate_limited' };
  if (res.status === 404 || res.status === 503) return { ok: false, error: 'unavailable' };
  if (!res.ok) return { ok: false, error: 'bad_response' };
  let body: unknown;
  try { body = await res.json(); } catch { return { ok: false, error: 'bad_response' }; }
  const sessionId = (body as { session_id?: unknown } | null)?.session_id;
  if (typeof sessionId !== 'string' || !SESSION_RE.test(sessionId)) return { ok: false, error: 'bad_response' };
  d.navigate(`/gracias?session_id=${encodeURIComponent(sessionId)}`);
  return { ok: true };
}
