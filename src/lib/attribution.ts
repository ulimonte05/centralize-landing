// Atribución para el checkout: ids de Meta (cookies _fbp/_fbc), UTM y un event_id para deduplicar Pixel + CAPI.
// Las claves coinciden con el body de POST /billing/checkout (strings de hasta 500 caracteres).
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Attribution = {
  event_id: string;
  fbp?: string;
  fbc?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  page_url: string;
};
export type AttributionInput = {
  url: string;
  cookie: string;
  now: number;
  newId: () => string;
  /** UTM guardados en sessionStorage en la primera página; la URL actual manda sobre ellos. */
  storedUtm?: Partial<Record<UtmKey, string>>;
};

const MAX = 500;
const clip = (s: string) => s.slice(0, MAX);

function readCookie(cookie: string, name: string): string | undefined {
  for (const part of cookie.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      const v = part.slice(i + 1).trim();
      return v || undefined;
    }
  }
  return undefined;
}

export function readAttribution({ url, cookie, now, newId, storedUtm = {} }: AttributionInput): Attribution {
  let params = new URLSearchParams();
  try { params = new URL(url).searchParams; } catch { /* url inválida: sin params */ }
  const out: Attribution = { event_id: clip(newId()), page_url: clip(url) };
  const fbp = readCookie(cookie, '_fbp');
  if (fbp) out.fbp = clip(fbp);
  const fbclid = params.get('fbclid');
  const fbc = readCookie(cookie, '_fbc') ?? (fbclid ? `fb.1.${now}.${fbclid}` : undefined);
  if (fbc) out.fbc = clip(fbc);
  for (const k of UTM_KEYS) {
    const v = params.get(k) || storedUtm[k];
    if (v) out[k] = clip(v);
  }
  return out;
}

const UTM_STORE = 'centralize.utm';

/** Primera página de la sesión: guarda los UTM de la URL (no pisa los ya guardados). */
export function storeUtm(): void {
  try {
    if (sessionStorage.getItem(UTM_STORE)) return;
    const p = new URLSearchParams(location.search);
    const found: Partial<Record<UtmKey, string>> = {};
    for (const k of UTM_KEYS) { const v = p.get(k); if (v) found[k] = v; }
    if (Object.keys(found).length) sessionStorage.setItem(UTM_STORE, JSON.stringify(found));
  } catch { /* noop */ }
}

/** Deja solo claves UTM conocidas con valor string; ignora cualquier otra cosa guardada. */
export function parseStoredUtm(raw: unknown): Partial<Record<UtmKey, string>> {
  const out: Partial<Record<UtmKey, string>> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const k of UTM_KEYS) { const v = (raw as Record<string, unknown>)[k]; if (typeof v === 'string' && v) out[k] = v; }
  return out;
}

/** Lee la atribución del navegador actual (URL, cookies, sessionStorage). Solo en cliente. */
export function currentAttribution(): Attribution {
  let storedUtm: Partial<Record<UtmKey, string>> = {};
  try {
    const raw = JSON.parse(sessionStorage.getItem(UTM_STORE) || '{}');
    storedUtm = parseStoredUtm(raw);
  } catch { /* noop */ }
  return readAttribution({ url: location.href, cookie: document.cookie, now: Date.now(), newId: () => crypto.randomUUID(), storedUtm });
}
