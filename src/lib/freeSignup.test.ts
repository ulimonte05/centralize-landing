import { describe, it, expect, vi } from 'vitest';
import { buildWhatsapp, startFreeSignup } from './freeSignup';

const attribution = { event_id: 'evt-1', page_url: 'https://centralize.dev/contratar' };
const res = (status: number, body: unknown) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

function deps(over: Partial<Parameters<typeof startFreeSignup>[0]> = {}) {
  return {
    fetch: vi.fn(async () => res(200, { session_id: 'free_abc123' })) as any, apiUrl: 'https://api.test/',
    nombre: 'Laura', whatsapp: '5491155550101', email: 'laura@mail.com', pais: 'AR' as const, attribution, navigate: vi.fn(), ...over,
  };
}

describe('buildWhatsapp', () => {
  it('Argentina: código de área + número, con o sin 0, o ya internacional', () => {
    expect(buildWhatsapp('AR', '11 5555-0101')).toBe('5491155550101');
    expect(buildWhatsapp('AR', '011 5555 0101')).toBe('5491155550101');
    expect(buildWhatsapp('AR', '+54 9 11 5555-0101')).toBe('5491155550101');
    expect(buildWhatsapp('AR', '54 11 5555 0101')).toBe('5491155550101');
    expect(buildWhatsapp('AR', '299 611 5740')).toBe('5492996115740');
  });
  it('Argentina: rechaza el 15 y los números cortos', () => {
    expect(buildWhatsapp('AR', '11 15 5555 0101')).toBeNull();
    expect(buildWhatsapp('AR', '5555 0101')).toBeNull();
  });
  it('Uruguay: celular de 8 dígitos con o sin 0', () => {
    expect(buildWhatsapp('UY', '099 123 456')).toBe('59899123456');
    expect(buildWhatsapp('UY', '+598 99 123 456')).toBe('59899123456');
    expect(buildWhatsapp('UY', '2 123 4567')).toBeNull();
  });
  it('otro país: número completo', () => {
    expect(buildWhatsapp('OTRO', '+1 305 555 0101')).toBe('13055550101');
    expect(buildWhatsapp('OTRO', '0034 612 345 678')).toBe('34612345678');
    expect(buildWhatsapp('OTRO', '305 555 0101')).toBeNull();
    expect(buildWhatsapp('OTRO', '+1 555 0101')).toBeNull();
  });
});

describe('startFreeSignup', () => {
  it('manda los datos y lleva a /gracias con el session_id', async () => {
    const d = deps();
    expect(await startFreeSignup(d)).toEqual({ ok: true });
    const [url, init] = d.fetch.mock.calls[0];
    expect(url).toBe('https://api.test/billing/free-signup');
    expect(JSON.parse(init.body)).toEqual({ nombre: 'Laura', phone: '5491155550101', email: 'laura@mail.com', country: 'AR', attribution });
    expect(d.navigate).toHaveBeenCalledWith('/gracias?session_id=free_abc123');
  });
  it('otro país viaja como US', async () => {
    const d = deps({ pais: 'OTRO' });
    await startFreeSignup(d);
    expect(JSON.parse(d.fetch.mock.calls[0][1].body).country).toBe('US');
  });
  it('traduce los errores de la API', async () => {
    for (const [status, error] of [[409, 'already_used'], [400, 'invalid'], [429, 'rate_limited'], [404, 'unavailable'], [500, 'bad_response']] as const) {
      const d = deps({ fetch: vi.fn(async () => res(status, {})) as any });
      expect(await startFreeSignup(d)).toEqual({ ok: false, error });
      expect(d.navigate).not.toHaveBeenCalled();
    }
  });
  it('red caída o session_id raro → error, sin navegar', async () => {
    expect(await startFreeSignup(deps({ fetch: vi.fn(async () => { throw new Error('x'); }) as any }))).toEqual({ ok: false, error: 'network' });
    const d = deps({ fetch: vi.fn(async () => res(200, { session_id: 'pl_otro' })) as any });
    expect(await startFreeSignup(d)).toEqual({ ok: false, error: 'bad_response' });
    expect(d.navigate).not.toHaveBeenCalled();
  });
});
