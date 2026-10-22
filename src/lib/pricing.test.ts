import { describe, expect, it } from 'vitest';
import { currencyFor, formatPrice, priceLine, priceSummary } from './pricing';

describe('pricing', () => {
  it('AR → ARS 47.500 promo / 75.000 list', () => {
    expect(currencyFor('AR')).toBe('ARS');
    expect(priceLine('AR')).toEqual({ promo: 'ARS 47.500', list: 'ARS 75.000', promoMonths: 3, trialDays: 7 });
  });
  it('UY and US → USD 30 / 50', () => {
    for (const c of ['UY', 'US']) {
      expect(currencyFor(c)).toBe('USD');
      expect(priceLine(c)).toEqual({ promo: 'USD 30', list: 'USD 50', promoMonths: 3, trialDays: 7 });
    }
  });
  it('lowercase country works', () => {
    expect(currencyFor('ar')).toBe('ARS');
    expect(priceLine('uy').promo).toBe('USD 30');
  });
  it('priceSummary joins trial, promo and list', () => {
    expect(priceSummary('AR')).toBe('7 días gratis, después ARS 47.500 al mes por 3 meses y ARS 75.000 al mes');
    expect(priceSummary('UY')).toBe('7 días gratis, después USD 30 al mes por 3 meses y USD 50 al mes');
  });
  it('formatPrice uses dot thousands for ARS', () => {
    expect(formatPrice(47500, 'ARS')).toBe('ARS 47.500');
    expect(formatPrice(1234567, 'ARS')).toBe('ARS 1.234.567');
    expect(formatPrice(30, 'USD')).toBe('USD 30');
  });
});
