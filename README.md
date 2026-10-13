# centralize-landing

Sitio público de Centralize (`centralize.dev`). Rama `redesign-v3`: rediseño "La carta que ya trabaja" según `docs/specs/2026-10-13-landing-rediseno-plan.md` del workspace.

## Correr

```bash
npm install
npm run dev            # http://localhost:4321  → home = variante A (carta)
npm run dev:un-dia     # http://localhost:4322  → home = variante B (un día)   [proxy sobre 4321]
npm run dev:catalogo   # http://localhost:4323  → home = variante C (catálogo) [proxy sobre 4321]
npm run build          # Astro 7 + adapter de Vercel (solo /api/empezar es on-demand)
```

Las tres variantes también viven como rutas en cualquier servidor: `/v/carta`, `/v/un-dia`, `/v/catalogo` (noindex). La home (`/`) renderiza la variante de `PUBLIC_VARIANT` (por defecto `carta`). Con `?auto` la home encadena las escenas en loop (modo stand).

## Dónde está cada cosa

- `src/data/scenes/*.json` — las 15 escenas de la demo (7 completas + 8 miniescenas), un JSON por pedido. Copy exacto del plan §6.
- `src/data/plans.json` — precios PROPUESTOS (plan §9), `publicado` / `cobro` controlan los tres estados de la tarjeta.
- `src/data/contact.json` — WhatsApp de ventas, cal.com, email (sin confirmar), SLA de alta, nombre de Centralize Ventas, slots legales.
- `src/data/claims.json` — cifras publicables con fecha de corte.
- `src/lib/render.ts` — render compartido (build y runtime) de mensajes, artefactos y panel.
- `src/islands/chat-engine.ts` — motor de escenas (dos instancias: `hero` y `dia`).
- `src/components/Home.astro` — arma la home según la variante.
- `legacy/` — la landing anterior (un solo HTML), solo referencia.

## Reglas que el código respeta

- El número de Centralito nunca se renderiza en HTML público (solo el de ventas).
- Centralito nunca manda mensajes a clientes en ninguna escena.
- Cifras: solo las de `claims.json`, con fecha visible.
- Sin scrolljacking; reduced motion = estado final; toggle "Menos animación".
