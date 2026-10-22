import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { track } from './track';

describe('track', () => {
  const fbq = vi.fn();
  const va = vi.fn();
  beforeEach(() => { fbq.mockClear(); va.mockClear(); vi.stubGlobal('window', { fbq, va }); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('sends a standard event to fbq with eventID and to va', () => {
    track('InitiateCheckout', { currency: 'ARS' }, { eventId: 'evt-9' });
    expect(fbq).toHaveBeenCalledWith('track', 'InitiateCheckout', { currency: 'ARS' }, { eventID: 'evt-9' });
    expect(va).toHaveBeenCalledWith('event', { name: 'InitiateCheckout', data: { currency: 'ARS' } });
  });
  it('sends a standard event without eventId without options', () => {
    track('ViewContent', { content_name: 'precio' });
    expect(fbq).toHaveBeenCalledWith('track', 'ViewContent', { content_name: 'precio' });
  });
  it('does not send non-standard events to fbq but does to va', () => {
    track('cta_click', { cta: 'demo' });
    expect(fbq).not.toHaveBeenCalled();
    expect(va).toHaveBeenCalledWith('event', { name: 'cta_click', data: { cta: 'demo' } });
  });
  it('works when fbq and va are missing', () => {
    vi.stubGlobal('window', {});
    expect(() => track('ViewContent')).not.toThrow();
  });
});
