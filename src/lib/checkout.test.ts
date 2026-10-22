import { describe, it, expect, vi } from 'vitest';
import { startCheckout } from './checkout';

const attribution = { event_id: 'evt-1', page_url: 'https://centralize.dev/contratar' };
const res = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

function deps(over: Partial<Parameters<typeof startCheckout>[0]> = {}) {
  return { fetch: vi.fn(async () => res(200, { url: 'https://checkout.example.com/x' })) as any, apiUrl: 'https://api.test', country: 'AR', attribution, navigate: vi.fn(), ...over };
}

describe('startCheckout', () => {
  it('posts country and attribution and navigates to url', async () => {
    const d = deps();
    expect(await startCheckout(d)).toEqual({ ok: true });
    expect(d.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = d.fetch.mock.calls[0];
    expect(url).toBe('https://api.test/billing/checkout');
    expect(init.method).toBe('POST');
    expect(init.headers['content-type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual({ country: 'AR', attribution });
    expect(d.navigate).toHaveBeenCalledWith('https://checkout.example.com/x');
  });
  it('tolerates a trailing slash in apiUrl', async () => {
    const d = deps({ apiUrl: 'https://api.test/' });
    await startCheckout(d);
    expect(d.fetch.mock.calls[0][0]).toBe('https://api.test/billing/checkout');
  });
  it('503 → unavailable, no navigate', async () => {
    const d = deps({ fetch: vi.fn(async () => res(503, { error: 'x' })) as any });
    expect(await startCheckout(d)).toEqual({ ok: false, error: 'unavailable' });
    expect(d.navigate).not.toHaveBeenCalled();
  });
  it('fetch throws → network', async () => {
    const d = deps({ fetch: vi.fn(async () => { throw new TypeError('failed'); }) as any });
    expect(await startCheckout(d)).toEqual({ ok: false, error: 'network' });
    expect(d.navigate).not.toHaveBeenCalled();
  });
  it('missing url → bad_response', async () => {
    const d = deps({ fetch: vi.fn(async () => res(200, {})) as any });
    expect(await startCheckout(d)).toEqual({ ok: false, error: 'bad_response' });
    expect(d.navigate).not.toHaveBeenCalled();
  });
  it('invalid json body → bad_response', async () => {
    const d = deps({ fetch: vi.fn(async () => ({ ok: true, status: 200, json: async () => { throw new Error('bad'); } })) as any });
    expect(await startCheckout(d)).toEqual({ ok: false, error: 'bad_response' });
  });
  it('other non-2xx → bad_response', async () => {
    const d = deps({ fetch: vi.fn(async () => res(500, {})) as any });
    expect(await startCheckout(d)).toEqual({ ok: false, error: 'bad_response' });
  });
  it('rejects non-http url', async () => {
    for (const u of ['javascript:alert(1)', 'data:text/html,x', 'ftp://x.y', 'not a url', 42]) {
      const d = deps({ fetch: vi.fn(async () => res(200, { url: u })) as any });
      expect(await startCheckout(d)).toEqual({ ok: false, error: 'bad_response' });
      expect(d.navigate).not.toHaveBeenCalled();
    }
  });
});
