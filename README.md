# centralize-landing

Sitio público de Centralize (`centralize.dev`). Rama `redesign-v3`: rediseño "La carta que ya trabaja" según `docs/specs/2026-10-13-landing-rediseno-plan.md` del workspace.

## Correr

```bash
npm install
npm run dev            # http://localhost:4321
npm run check          # astro check (tipos)
npm test               # vitest, solo src/lib (*.test.ts)
npm run build          # Astro 7 + adapter de Vercel (solo /api/empezar y /api/geo son on-demand)
```

Con `?auto` la home encadena las escenas en loop (modo stand).

## Variables de entorno

Solo públicas (no hay secretos en la landing):

- `PUBLIC_META_PIXEL_ID` — id del Pixel de Meta. Sin esta variable no se renderiza el Pixel ni se hacen requests a Meta.
- `PUBLIC_BILLING_API_URL` — API de billing (default `https://api.centralize.dev`); la usan `/contratar` y `/gracias`.
- `PUBLIC_NOINDEX=1` — `noindex` en todo el sitio, para deploys de muestra (`vercel.app`).

## Páginas (`src/pages`)

- `index` — home (hero con la demo de Centralito, bloques, precio, FAQ).
- `inmobiliarias` — Centralize Ventas / agentes por canal.
- `contratar` — alta de la prueba de 7 días; abre el checkout.
- `gracias` — post-pago: busca el código de alta y arma el botón de WhatsApp (con soporte en todas las vistas).
- `cuenta` — botón de baja y de arrepentimiento: lleva al WhatsApp de Centralito con "Mi cuenta" para recibir el link personal de gestión.
- `contacto`, `sandbox`, `privacidad`, `terminos` (con placeholders `{{RAZON_SOCIAL}}`, `{{CUIT}}`, `{{DOMICILIO}}` marcados TODO), `404`.
- `api/` — endpoints on-demand (`empezar`, `geo`).

## Dónde está cada cosa

- `src/data/scenes/*.json` — las 15 escenas de la demo (7 completas + 8 miniescenas), un JSON por pedido. Copy exacto del plan §6.
- `src/data/plans.json` — el plan único de Centralito: 7 días gratis, promo de 3 meses y precio de lista (ARS para AR, USD para el resto), más la garantía. Precios finales; no se publica regla de ajuste.
- `src/data/contact.json` — WhatsApp de ventas/soporte, WhatsApp de Centralito (solo para `/cuenta`), cal.com, email (sin confirmar), SLA de alta, slots legales.
- `src/data/claims.json` — cifras publicables con fecha de corte.
- `src/lib/` — lógica pura con tests (`*.test.ts`): `pricing` (única fuente para mostrar precios), `checkout`, `gracias` (qué vista mostrar), `attribution`, `track` (Pixel y eventos), `render` (mensajes, artefactos y panel, build y runtime), `scenes`, `match`, `pedidos`.
- `src/islands/` — JS de cliente: `chat-engine` (dos instancias: `hero` y `dia`), `checkout`, `gracias`, `site`.
- `src/components/` — `HomeHero`, `HomeBlocks`, `Footer` (links de baja y arrepentimiento a `/cuenta`), `WaLink`, `PlanCard`, `MetaPixel`, etc.
- `legacy/` — la landing anterior (un solo HTML), solo referencia.

## Reglas que el código respeta

- El número de Centralito solo aparece en `/cuenta` (link `wa.me` con "Mi cuenta"); en el resto del sitio se usa el de ventas/soporte.
- Centralito nunca manda mensajes a clientes en ninguna escena.
- Cifras: solo las de `claims.json`, con fecha visible.
- Sin scrolljacking; reduced motion = estado final; toggle "Menos animación".
