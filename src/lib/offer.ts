import plans from '../data/plans.json';
import { priceLine } from './pricing';

// La oferta de entrada en un solo lugar. plans.json → "offer":
//  - "free_month": un mes gratis sin tarjeta (POST /billing/free-signup).
//  - "trial": prueba con tarjeta (Rebill/Stripe, POST /billing/checkout).
// Volver a la prueba con tarjeta es cambiar ese valor y redeployar.

export type OfferMode = 'free_month' | 'trial';

export interface OfferCopy {
  mode: OfferMode;
  /** Botón principal ("Probar 1 mes gratis"). */
  cta: string;
  /** Línea chica bajo los botones. */
  sub: string;
  /** Subtítulo del acceso en el menú. */
  menuSmall: string;
  /** Lo gratis, corto ("1 mes gratis"). */
  gratis: string;
  /** Cuánto dura lo gratis ("un mes", "7 días"). */
  plazo: string;
  /** Primer paso de "Cómo funciona". */
  paso1: { t: string; d: string };
  /** Tarjeta de confianza sobre el cobro. */
  cobro: { t: string; d: string };
  /** Frase de precio para FAQ (con país). */
  precio: (country: string) => string;
  /** Aclaración bajo los precios de la tarjeta del plan. */
  notaPrecio: string;
  /** FAQ: pregunta y respuesta sobre la prueba ({precio} se reemplaza). */
  faqPrueba: { q: string; a: string };
}

export function offerCopy(mode: OfferMode): OfferCopy {
  const ar = priceLine('AR');
  if (mode === 'free_month') {
    const meses = plans.freeMonthDays === 30 ? '1 mes' : `${plans.freeMonthDays} días`;
    return {
      mode,
      cta: `Probar ${meses} gratis`,
      sub: 'Sin tarjeta · No se cobra nada · Un mes gratis por persona',
      menuSmall: `${meses}, sin tarjeta`,
      gratis: `${meses} gratis`,
      plazo: plans.freeMonthDays === 30 ? 'un mes' : meses,
      paso1: { t: 'Te anotás en un minuto', d: 'Nombre, WhatsApp y email. Sin tarjeta: el mes gratis no se cobra.' },
      cobro: { t: 'Sin tarjeta.', d: 'El mes gratis no pide medio de pago y termina solo. Antes de que termine te avisamos por WhatsApp.' },
      precio: (country) => {
        const p = priceLine(country);
        return `${meses} gratis, sin tarjeta. Si después querés seguir: ${p.promo} al mes por ${p.promoMonths} meses y ${p.list} al mes`;
      },
      notaPrecio: 'Al terminar el mes gratis no se cobra nada automáticamente: si querés seguir, te suscribís. Precios finales.',
      faqPrueba: {
        q: '¿Cómo funciona el mes gratis? ¿Me van a cobrar?',
        a: 'No te cobramos nada: el mes gratis no pide tarjeta y termina solo. Unos días antes te avisamos por WhatsApp y, si querés seguir, te mandamos el link para suscribirte. {precio}',
      },
    };
  }
  return {
    mode,
    cta: `Probar ${ar.trialDays} días gratis`,
    sub: 'No se cobra hoy · Te avisamos antes de cobrar · Cancelás cuando quieras',
    menuSmall: `${ar.trialDays} días, no se cobra hoy`,
    gratis: `${ar.trialDays} días gratis`,
    plazo: `${ar.trialDays} días`,
    paso1: { t: 'Te suscribís a la prueba', d: `${ar.trialDays} días gratis. Cargás la tarjeta, pero hoy no se cobra nada.` },
    cobro: { t: 'Sin sorpresas con la tarjeta.', d: 'No se cobra hoy, te avisamos por WhatsApp antes de cobrar y cancelás cuando quieras.' },
    precio: (country) => {
      const p = priceLine(country);
      return `${p.trialDays} días gratis, después ${p.promo} al mes por ${p.promoMonths} meses y ${p.list} al mes`;
    },
    notaPrecio: `Los ${ar.promoMonths} meses de promo empiezan después de los ${ar.trialDays} días gratis. Precios finales.`,
    faqPrueba: {
      q: '¿Cómo funciona la prueba? ¿Cuándo me cobran?',
      a: 'Hoy no se cobra nada. Antes del primer cobro te avisamos por WhatsApp; si no te convence, cancelás antes y no pagás nada. {precio}',
    },
  };
}

export const OFFER: OfferCopy = offerCopy(plans.offer === 'trial' ? 'trial' : 'free_month');
