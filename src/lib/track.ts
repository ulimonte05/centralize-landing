// Eventos: Pixel de Meta (solo eventos estándar) + Vercel Web Analytics. Con eventId, Meta deduplica contra CAPI.
const STANDARD = new Set(['PageView', 'ViewContent', 'Lead', 'Contact', 'InitiateCheckout', 'AddPaymentInfo', 'StartTrial', 'Subscribe', 'Purchase', 'CompleteRegistration']);

export function track(name: string, params: Record<string, string> = {}, opts: { eventId?: string } = {}): void {
  const w = window as any;
  try {
    if (typeof w.fbq === 'function' && STANDARD.has(name)) {
      if (opts.eventId) w.fbq('track', name, params, { eventID: opts.eventId });
      else w.fbq('track', name, params);
    }
  } catch { /* noop */ }
  try { w.va?.('event', { name, data: params }); } catch { /* noop */ }
}
