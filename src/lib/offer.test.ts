import { describe, it, expect } from 'vitest';
import { offerCopy } from './offer';

describe('offerCopy', () => {
  it('mes gratis: sin tarjeta y sin prometer cobros', () => {
    const o = offerCopy('free_month');
    expect(o.cta).toBe('Probar 1 mes gratis');
    expect(o.plazo).toBe('un mes');
    expect(o.precio('AR')).toBe('1 mes gratis, sin tarjeta. Si después querés seguir: ARS 47.500 al mes por 3 meses y ARS 75.000 al mes');
    for (const s of [o.cta, o.sub, o.paso1.d, o.cobro.d, o.faqPrueba.a]) expect(s).not.toMatch(/no se cobra hoy|cargás la tarjeta/i);
  });
  it('prueba con tarjeta: los textos de siempre', () => {
    const o = offerCopy('trial');
    expect(o.cta).toBe('Probar 7 días gratis');
    expect(o.precio('UY')).toBe('7 días gratis, después USD 30 al mes por 3 meses y USD 50 al mes');
  });
});
