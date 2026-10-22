# centralize-landing

Sitio público de Centralize (`centralize.dev`). Rama `redesign-v3`: rediseño "La carta que ya trabaja" según `docs/specs/2026-10-13-landing-rediseno-plan.md` del workspace.

## Correr

```bash
npm install
npm run dev            # http://localhost:4321
npm run check          # astro check (tipos)
npm test               # vitest, solo src/lib
npm run build          # Astro 7 + adapter de Vercel (solo /api/empezar es on-demand)
```

Con `?auto` la home encadena las escenas en loop (modo stand).

## Dónde está cada cosa

- `src/data/scenes/*.json` — las 15 escenas de la demo (7 completas + 8 miniescenas), un JSON por pedido. Copy exacto del plan §6.
- `src/data/plans.json` — el plan único de Centralito: 7 días gratis, promo de 3 meses y precio de lista (ARS para AR, USD para el resto), más la garantía. Precios finales; no se publica regla de ajuste.
- `src/lib/pricing.ts` — `currencyFor`, `formatPrice`, `priceLine`, `priceSummary`; única fuente para mostrar precios (tests en `pricing.test.ts`).
- `src/data/contact.json` — WhatsApp de ventas, cal.com, email (sin confirmar), SLA de alta, nombre de Centralize Ventas, slots legales.
- `src/data/claims.json` — cifras publicables con fecha de corte.
- `src/lib/render.ts` — render compartido (build y runtime) de mensajes, artefactos y panel.
- `src/islands/chat-engine.ts` — motor de escenas (dos instancias: `hero` y `dia`).
- `src/components/HomeHero.astro`, `HomeBlocks.astro` — la home.
- `legacy/` — la landing anterior (un solo HTML), solo referencia.

## Reglas que el código respeta

- El número de Centralito nunca se renderiza en HTML público (solo el de ventas).
- Centralito nunca manda mensajes a clientes en ninguna escena.
- Cifras: solo las de `claims.json`, con fecha visible.
- Sin scrolljacking; reduced motion = estado final; toggle "Menos animación".
