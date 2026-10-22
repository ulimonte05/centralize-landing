import type { APIRoute } from 'astro';
export const prerender = false;
// País del visitante según Vercel (header x-vercel-ip-country); sin header, Argentina.
export const GET: APIRoute = ({ request }) => {
  const raw = (request.headers.get('x-vercel-ip-country') || '').trim().toUpperCase();
  const country = /^[A-Z]{2}$/.test(raw) ? raw : 'AR';
  return new Response(JSON.stringify({ country }), { headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' } });
};
