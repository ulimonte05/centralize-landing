import plans from '../data/plans.json';

export type Currency = 'ARS' | 'USD';

export interface PriceLine {
  promo: string;
  list: string;
  promoMonths: number;
  trialDays: number;
}

/** ARS solo para Argentina; el resto del mundo (Uruguay incluido) paga en USD. */
export function currencyFor(country: string): Currency {
  return country.trim().toUpperCase() === 'AR' ? 'ARS' : 'USD';
}

/** ARS: "ARS 47.500" (miles con punto). USD: "USD 30". La moneda siempre explícita. */
export function formatPrice(amount: number, currency: Currency): string {
  if (currency === 'USD') return `USD ${amount}`;
  return `ARS ${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function priceLine(country: string): PriceLine {
  const currency = currencyFor(country);
  const { promo, list } = plans.prices[currency];
  return {
    promo: formatPrice(promo, currency),
    list: formatPrice(list, currency),
    promoMonths: plans.promoMonths,
    trialDays: plans.trialDays,
  };
}

/** Frase única de precio para hero, FAQ y tarjeta. */
export function priceSummary(country: string): string {
  const { promo, list, promoMonths, trialDays } = priceLine(country);
  return `${trialDays} días gratis, después ${promo} al mes por ${promoMonths} meses y ${list} al mes`;
}

export const guarantee: string = plans.guarantee;
