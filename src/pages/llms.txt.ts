import type { APIRoute } from 'astro';
import claims from '@/data/claims.json';
import contact from '@/data/contact.json';
import { priceLine } from '@/lib/pricing';
import { OFFER } from '@/lib/offer';
import { faqItems } from '@/lib/faq';
import { ORDEN_PLAN } from '@/lib/pedidos';
import { SCENES } from '@/lib/scenes';

// Resumen del sitio para asistentes de IA (formato llms.txt). Sale de los mismos datos que la web: precios, cifras y FAQ.
export const GET: APIRoute = () => {
  const ar = priceLine('AR');
  const usd = priceLine('UY');
  const ventas = contact.productos.ventas.nombre;
  const pedidos = ORDEN_PLAN.map(id => `- "${SCENES[id].mensajes.find(m => m.de === 'asesor')?.texto}" (antes: ${SCENES[id].antes}; con Centralito: ${SCENES[id].despues})`).join('\n');
  const faq = faqItems().map(f => `### ${f.q}\n${f.a}`).join('\n\n');
  const body = `# Centralize

> Centralize hace agentes de inteligencia artificial para inmobiliarias de Argentina y Uruguay. Centralito es el asistente de IA que cada asesor inmobiliario usa desde WhatsApp para operar su CRM (Tokko Broker). ${ventas} son los agentes de IA que responden, recontactan y califican a los clientes de la inmobiliaria por WhatsApp, Instagram y Facebook.

Cifras (${claims.corte_visible}): ${claims.centralito.pedidos}. ${claims.ventas.inmobiliarias}. ${claims.ventas.leads}.

## Centralito: asistente de IA para asesores inmobiliarios

- Qué es: un asistente que trabaja en el CRM del asesor (Tokko Broker) y se usa por WhatsApp, escribiéndole como a un colega.
- Qué hace: tasaciones (ACM) con comparables de la cartera, la Red Tokko y portales, con el PDF listo; edita fichas; arma fichas en PDF con la marca del asesor; carga leads; busca en la cartera y en la Red Tokko; cambios en lote con OK previo; segmenta contactos; lee planos y fotos; mantiene planillas; recordatorios y rutinas.
- Qué no hace: nunca les escribe a los clientes del asesor ni manda mensajes masivos; deja el texto o el PDF listo y lo manda el asesor.
- CRM: integrado con Tokko Broker. Otros CRM se conectan a pedido.
- Precio: ${OFFER.gratis}${OFFER.mode === 'free_month' ? ', sin tarjeta' : ''}. Después ${ar.promo} por mes durante ${ar.promoMonths} meses y luego ${ar.list} por mes en Argentina; fuera de Argentina ${usd.promo} y luego ${usd.list} por mes. Sin permanencia.
- Probarlo: https://centralize.dev/contratar

Ejemplos de pedidos, como los escribe un asesor (nombres y cifras de ejemplo):
${pedidos}

## ${ventas}: agentes de IA para inmobiliarias con equipo

- WhatsApp: campañas con templates aprobados por Meta, seguimiento, calificación de leads (HOT / WARM / COLD) y carga al CRM.
- Instagram y Facebook: responde mensajes directos y comentarios.
- CRM: Tokko Broker, KiteProp y Xintel.
- Incluye Centralito para cada asesor del equipo, y automatizaciones a medida.
- Demo: ${contact.calcom.url}

## Preguntas frecuentes

${faq}

## Páginas

- [Centralito, asistente de IA para asesores inmobiliarios](https://centralize.dev/): qué hace, precio y preguntas frecuentes.
- [${ventas}, agentes de IA para inmobiliarias con equipo](https://centralize.dev/inmobiliarias): canales, panel y automatizaciones a medida.
- [Probar Centralito](https://centralize.dev/contratar): alta de la prueba.
- [Contacto](https://centralize.dev/contacto): WhatsApp de ventas ${contact.whatsapp_ventas.visible}.
`;
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
