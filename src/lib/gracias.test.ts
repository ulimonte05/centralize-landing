import { describe, it, expect } from 'vitest';
import { graciasView } from './gracias';

const base = { sessionId: 'pl_abc123', response: null, attempt: 1, maxAttempts: 20 };
const WA = 'https://wa.me/5491100000000?text=ALTA-K7M2QX';

describe('graciasView', () => {
  it('invalid id', () => {
    expect(graciasView({ ...base, sessionId: null })).toEqual({ kind: 'invalid' });
    expect(graciasView({ ...base, sessionId: '' })).toEqual({ kind: 'invalid' });
    expect(graciasView({ ...base, sessionId: 'a/../b' })).toEqual({ kind: 'invalid' });
    expect(graciasView({ ...base, sessionId: 'x'.repeat(256) })).toEqual({ kind: 'invalid' });
  });
  it('404', () => {
    expect(graciasView({ ...base, response: { httpStatus: 404 } })).toEqual({ kind: 'not_found' });
  });
  it('400 is not_found too', () => {
    expect(graciasView({ ...base, response: { httpStatus: 400 } })).toEqual({ kind: 'not_found' });
  });
  it('pending under max', () => {
    expect(graciasView({ ...base, attempt: 19, response: { httpStatus: 200, body: { status: 'pending' } } })).toEqual({ kind: 'pending', retryInMs: 3000 });
  });
  it('pending at max → gave_up', () => {
    expect(graciasView({ ...base, attempt: 20, response: { httpStatus: 200, body: { status: 'pending' } } })).toEqual({ kind: 'gave_up' });
  });
  it('network error → pending, then gave_up at max', () => {
    expect(graciasView({ ...base, response: null })).toEqual({ kind: 'pending', retryInMs: 3000 });
    expect(graciasView({ ...base, response: null, attempt: 20 })).toEqual({ kind: 'gave_up' });
  });
  it('5xx → pending', () => {
    expect(graciasView({ ...base, response: { httpStatus: 503 } })).toEqual({ kind: 'pending', retryInMs: 3000 });
  });
  it('ready with code', () => {
    expect(graciasView({ ...base, response: { httpStatus: 200, body: { status: 'ready', claim_code: 'ALTA-K7M2QX', wa_url: WA, nombre: 'Lucía' } } }))
      .toEqual({ kind: 'ready', nombre: 'Lucía', claimCode: 'ALTA-K7M2QX', waUrl: WA });
  });
  it('ready without claim_code (button only)', () => {
    expect(graciasView({ ...base, response: { httpStatus: 200, body: { status: 'ready', wa_url: WA } } }))
      .toEqual({ kind: 'ready', nombre: '', claimCode: null, waUrl: WA });
  });
  it('ready with a non-wa.me url is not trusted', () => {
    expect(graciasView({ ...base, response: { httpStatus: 200, body: { status: 'ready', wa_url: 'javascript:alert(1)' } } }))
      .toEqual({ kind: 'pending', retryInMs: 3000 });
  });
});
