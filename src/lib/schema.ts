import plans from '../data/plans.json';
import contact from '../data/contact.json';
import type { FaqItem } from './faq';

// JSON-LD compartido. Los ids (#org, #web) permiten que cada página referencie la misma organización.
export const SITE = 'https://centralize.dev';
const AREA = [{ '@type': 'Country', name: 'Argentina' }, { '@type': 'Country', name: 'Uruguay' }];

export const ORG = {
  '@type': 'Organization',
  '@id': `${SITE}/#org`,
  name: 'Centralize',
  url: `${SITE}/`,
  logo: `${SITE}/assets/centralize-mark-black.png`,
  description: 'Centralize hace agentes de inteligencia artificial para inmobiliarias de Argentina y Uruguay: Centralito, el asistente de IA que cada asesor usa desde WhatsApp para operar su CRM, y Centralize Ventas, agentes de IA que atienden a los clientes de la inmobiliaria por WhatsApp, Instagram y Facebook.',
  areaServed: AREA,
  knowsAbout: ['inteligencia artificial para inmobiliarias', 'CRM inmobiliario', 'Tokko Broker', 'WhatsApp Business', 'tasaciones inmobiliarias'],
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: `+${contact.whatsapp_ventas.e164}`, availableLanguage: 'es' },
  sameAs: [contact.redes.linkedin, contact.redes.instagram],
};

export const WEBSITE = { '@type': 'WebSite', '@id': `${SITE}/#web`, name: 'Centralize', alternateName: 'Centralito', url: `${SITE}/`, inLanguage: 'es-AR', publisher: { '@id': `${SITE}/#org` } };

/** Centralito como aplicación: el mes gratis y los dos precios de lanzamiento (ARS en Argentina, USD fuera). */
export function centralitoApp(description: string) {
  const offer = (price: number, currency: string, name: string, area?: string) => ({
    '@type': 'Offer', name, price, priceCurrency: currency, url: `${SITE}/contratar`,
    ...(area ? { eligibleRegion: { '@type': 'Country', name: area } } : {}),
  });
  return {
    '@type': 'SoftwareApplication',
    '@id': `${SITE}/#centralito`,
    name: 'Centralito',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Asistente de IA para asesores inmobiliarios',
    operatingSystem: 'WhatsApp',
    inLanguage: 'es',
    url: `${SITE}/`,
    description,
    publisher: { '@id': `${SITE}/#org` },
    areaServed: AREA,
    offers: [
      offer(0, 'ARS', 'Prueba gratis'),
      offer(plans.prices.ARS.promo, 'ARS', `Precio de lanzamiento por mes (${plans.promoMonths} meses)`, 'Argentina'),
      offer(plans.prices.USD.promo, 'USD', `Precio de lanzamiento por mes (${plans.promoMonths} meses), fuera de Argentina`),
    ],
  };
}

export function faqPage(items: FaqItem[]) {
  return { '@type': 'FAQPage', mainEntity: items.map(i => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })) };
}

export const graph = (...nodes: object[]) => JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
