import { describe, expect, it } from 'vitest';
import { parseStoredUtm, readAttribution } from './attribution';

const base = { url: 'https://centralize.dev/contratar', cookie: '', now: 1700000000000, newId: () => 'evt-1' };

describe('readAttribution', () => {
  it('reads fbp and fbc from cookies', () => {
    const a = readAttribution({ ...base, cookie: 'a=1; _fbp=fb.1.111.222; _fbc=fb.1.333.abc; b=2' });
    expect(a.fbp).toBe('fb.1.111.222');
    expect(a.fbc).toBe('fb.1.333.abc');
  });
  it('builds fbc from fbclid when cookie missing', () => {
    const a = readAttribution({ ...base, url: 'https://centralize.dev/?fbclid=XYZ' });
    expect(a.fbc).toBe('fb.1.1700000000000.XYZ');
  });
  it('reads utm params from url', () => {
    const a = readAttribution({ ...base, url: 'https://centralize.dev/?utm_source=meta&utm_medium=cpc&utm_campaign=c1&utm_content=ad2&utm_term=t3' });
    expect(a).toMatchObject({ utm_source: 'meta', utm_medium: 'cpc', utm_campaign: 'c1', utm_content: 'ad2', utm_term: 't3' });
  });
  it('falls back to stored utms from sessionStorage', () => {
    const a = readAttribution({ ...base, storedUtm: { utm_source: 'meta', utm_campaign: 'c1' } });
    expect(a.utm_source).toBe('meta');
    expect(a.utm_campaign).toBe('c1');
  });
  it('works with empty cookie and no params', () => {
    expect(readAttribution(base)).toEqual({ event_id: 'evt-1', page_url: 'https://centralize.dev/contratar' });
  });
  it('event_id comes from newId', () => {
    expect(readAttribution({ ...base, newId: () => 'zzz' }).event_id).toBe('zzz');
  });
  it('truncates values to 500 chars', () => {
    const a = readAttribution({ ...base, url: 'https://centralize.dev/?utm_source=' + 'a'.repeat(900) });
    expect(a.utm_source).toHaveLength(500);
    expect(a.page_url.length).toBeLessThanOrEqual(500);
  });
});

describe('parseStoredUtm', () => {
  it('keeps only known utm keys with string values', () => {
    expect(parseStoredUtm({ utm_source: 'meta', utm_medium: 5, utm_term: { a: 1 }, other: 'x', utm_content: null })).toEqual({ utm_source: 'meta' });
  });
  it('returns empty for non-objects', () => {
    for (const v of [null, 'x', 3, ['utm_source'], undefined]) expect(parseStoredUtm(v)).toEqual({});
  });
});
