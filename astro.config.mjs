import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Sitio estático; el adapter de Vercel solo sirve para las rutas on-demand /api/empezar y /api/geo.
export default defineConfig({
  site: 'https://centralize.dev',
  output: 'static',
  adapter: vercel({ webAnalytics: { enabled: true } }),
  trailingSlash: 'never',
  build: { inlineStylesheets: 'auto', format: 'file' },
  devToolbar: { enabled: false },
  server: { host: true },
});
