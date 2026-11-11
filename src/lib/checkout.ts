import type { Attribution } from './attribution';

export type CheckoutError = 'network' | 'unavailable' | 'bad_response' | 'email_required';
export type CheckoutResult = { ok: true } | { ok: false; error: CheckoutError };
export interface CheckoutDeps {
  fetch: typeof fetch;
  apiUrl: string;
  country: string;
  /** Email del pagador. En Argentina el cobro es con Mercado Pago, que lo exige. */
  email?: string;
  attribution: Attribution;
  navigate: (url: string) => void;
}

const CHECKOUT_TIMEOUT_MS = 15000;

function isHttpsUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  try { const p = new URL(v).protocol; return p === 'https:'; } catch { return false; }
}

/** Pide la URL de checkout a la API y navega a ella. Nunca lanza: devuelve el motivo del error. */
export async function startCheckout({ fetch: doFetch, apiUrl, country, email, attribution, navigate }: CheckoutDeps): Promise<CheckoutResult> {
  let res: Response;
  try {
    res = await doFetch(`${apiUrl.replace(/\/+$/, '')}/billing/checkout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(email ? { country, email, attribution } : { country, attribution }),
      signal: AbortSignal.timeout(CHECKOUT_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: 'network' };
  }
  if (res.status === 503) return { ok: false, error: 'unavailable' };
  // 422: falta el email; 400: el email no pasó la validación de la API.
  if (res.status === 422 || (res.status === 400 && email)) return { ok: false, error: 'email_required' };
  if (!res.ok) return { ok: false, error: 'bad_response' };
  let body: unknown;
  try { body = await res.json(); } catch { return { ok: false, error: 'bad_response' }; }
  const url = (body as { url?: unknown } | null)?.url;
  if (!isHttpsUrl(url)) return { ok: false, error: 'bad_response' };
  navigate(url);
  return { ok: true };
}
