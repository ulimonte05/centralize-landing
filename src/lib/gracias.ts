export type View =
  | { kind: 'invalid' }
  | { kind: 'pending'; retryInMs: number }
  | { kind: 'gave_up' }
  | { kind: 'ready'; nombre: string; claimCode: string | null; waUrl: string }
  | { kind: 'not_found' };

export interface GraciasInput {
  sessionId: string | null;
  response: { httpStatus: number; body?: unknown } | null; // null = error de red
  attempt: number;
  maxAttempts: number;
}

export const MAX_ATTEMPTS = 20; // ~60 s con reintentos cada 3 s
export const RETRY_MS = 3000;
const ID_RE = /^[A-Za-z0-9_]{1,255}$/;

function isWaUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  try { const u = new URL(v); return u.protocol === 'https:' && u.hostname === 'wa.me'; } catch { return false; }
}

/** Decide qué vista de /gracias mostrar. Pura: la isla hace el fetch y los reintentos. */
export function graciasView({ sessionId, response, attempt, maxAttempts }: GraciasInput): View {
  if (!sessionId || !ID_RE.test(sessionId)) return { kind: 'invalid' };
  const retry = (): View => (attempt < maxAttempts ? { kind: 'pending', retryInMs: RETRY_MS } : { kind: 'gave_up' });
  if (!response) return retry();
  const { httpStatus, body } = response;
  if (httpStatus === 404 || httpStatus === 400) return { kind: 'not_found' };
  if (httpStatus < 200 || httpStatus >= 300) return retry();
  const b = (body ?? {}) as { status?: unknown; claim_code?: unknown; wa_url?: unknown; nombre?: unknown };
  if (b.status === 'ready' && isWaUrl(b.wa_url)) {
    return {
      kind: 'ready',
      nombre: typeof b.nombre === 'string' ? b.nombre.trim() : '',
      claimCode: typeof b.claim_code === 'string' && b.claim_code ? b.claim_code : null,
      waUrl: b.wa_url,
    };
  }
  return retry();
}
