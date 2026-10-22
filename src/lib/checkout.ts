import type { Attribution } from './attribution';

export type CheckoutError = 'network' | 'unavailable' | 'bad_response';
export type CheckoutResult = { ok: true } | { ok: false; error: CheckoutError };
export interface CheckoutDeps {
  fetch: typeof fetch;
  apiUrl: string;
  country: string;
  attribution: Attribution;
  navigate: (url: string) => void;
}

const CHECKOUT_TIMEOUT_MS = 15000;

function isHttpsUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  try { const p = new URL(v).protocol; return p === 'https:'; } catch { return false; }
}

/** Pide la URL de checkout a la API y navega a ella. Nunca lanza: devuelve el motivo del error. */
export async function startCheckout({ fetch: doFetch, apiUrl, country, attribution, navigate }: CheckoutDeps): Promise<CheckoutResult> {
  let res: Response;
  try {
    res = await doFetch(`${apiUrl.replace(/\/+$/, '')}/billing/checkout`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ country, attribution }),
      signal: AbortSignal.timeout(CHECKOUT_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: 'network' };
  }
  if (res.status === 503) return { ok: false, error: 'unavailable' };
  if (!res.ok) return { ok: false, error: 'bad_response' };
  let body: unknown;
  try { body = await res.json(); } catch { return { ok: false, error: 'bad_response' }; }
  const url = (body as { url?: unknown } | null)?.url;
  if (!isHttpsUrl(url)) return { ok: false, error: 'bad_response' };
  navigate(url);
  return { ok: true };
}
