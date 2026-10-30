# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Asesores inmobiliarios individuales de Argentina y Uruguay que trabajan con Tokko Broker. Pasan el día en la calle (visitas, tasaciones, captaciones) y operan desde el celular, con WhatsApp abierto todo el día. No son técnicos. Un segundo público, secundario, son las inmobiliarias con equipo: van a `/inmobiliarias` (Centralize Ventas, agentes por canal).

## Product Purpose

Centralito es un asistente que opera el CRM del asesor desde WhatsApp: le escribe como a un colega y lo hace en Tokko. Tasa con comparables de la cartera y la Red Tokko y arma el PDF, edita fichas, carga leads, busca en la cartera, hace cambios en lote con OK previo y recuerda seguimientos. Éxito de la home: que el asesor se anote al mes gratis (`/contratar`).

## Positioning

No es un chat que redacta textos (ChatGPT): ejecuta en el CRM del asesor y devuelve el artefacto (PDF, ficha editada, lista de leads). Dice cuánto leyó ("cartera 84 de 84 · red 412 de 412"). Nunca les escribe a los clientes del asesor: deja el texto o el PDF listo y lo manda el asesor.

## Operating Context

Tokko Broker (fichas, cartera, Red Tokko, leads), WhatsApp del asesor, PDFs de tasación (ACM) y de propiedad con la marca del asesor, portales (Zonaprop, Argenprop, MercadoLibre). Uso en el celular, en la calle, de día.

## Capabilities and Constraints

- Integrado con Tokko; otros CRM se conectan a pedido.
- Oferta vigente en `src/data/plans.json` / `src/lib/offer.ts` (hoy: un mes gratis sin tarjeta; después promo 3 meses y precio de lista, ARS en AR y USD fuera). Los precios salen solo de `lib/pricing`.
- El número de Centralito solo aparece en `/cuenta`; el resto usa el WhatsApp de ventas/soporte.
- Sin scrolljacking; reduced motion = estado final; toggle "Menos animación".
- Astro 7 en Vercel; Meta Pixel opcional.

## Brand Commitments

- Nombre "Centralize" (empresa) y "Centralito" (producto). Marca: `public/assets/centralize-mark-*.png`.
- Voz rioplatense, concreta, de colega: "Le escribís como a un colega", "Qué entró anoche, con teléfono y estado".

## Evidence on Hand

- Cifras publicables solo de `src/data/claims.json`, siempre con fecha de corte visible (+15.000 pedidos de asesores desde marzo 2026, al 13-oct-2026).
- Escenas de demo en `src/data/scenes/*.json` (nombres y cifras de ejemplo, rotuladas como demostración).
- Logos de clientes: ocultos (`showClientLogos: false`) hasta tener permiso escrito de cada inmobiliaria.
- No hay testimonio real de un asesor todavía (`contact.json` → `cita: null`). No inventar citas, nombres de clientes ni métricas.

## Product Principles

1. Mostrar el trabajo hecho (el artefacto en el CRM), no prometerlo.
2. Honestidad de cifras: fecha de corte, cuánto leyó, nada inventado.
3. El asesor tiene el control: OK antes de cambios en lote, nunca escribe a sus clientes.
4. Pensado para el celular en la calle, no para el escritorio.
