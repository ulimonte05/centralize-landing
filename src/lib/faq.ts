import faq from '../data/faq.json';
import claims from '../data/claims.json';
import { guarantee, priceLine } from './pricing';
import { OFFER } from './offer';

export interface FaqItem { id: string; q: string; a: string; link?: { href: string; label: string; cta: string } }

/** Preguntas de la home con precio y garantía ya resueltos. Las usan la sección FAQ, el JSON-LD y /llms.txt. */
export function faqItems(): FaqItem[] {
  const ar = priceLine('AR');
  const usd = priceLine('UY');
  const precio = `Después: ${ar.promo} al mes por ${ar.promoMonths} meses y luego ${ar.list} (fuera de Argentina, ${usd.promo} y ${usd.list}).`;
  return faq
    .map(f => (f.id === 'prueba' ? { ...f, ...OFFER.faqPrueba } : f))
    .map(f => ({ id: f.id, q: f.q, a: f.a.replace('{precio}', precio).replace('{garantia}', guarantee).replace('{inmobiliarias}', `${claims.ventas.inmobiliarias} trabajan con Centralize, contadas ${claims.corte_visible}`), link: 'link' in f ? f.link : undefined }));
}
