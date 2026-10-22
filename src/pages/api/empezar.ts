import type { APIRoute } from 'astro';
export const prerender = false;
// Fase 1 (plan §8.2): guarda el lead y avisa a ops; sin cobro hasta que haya entidad y pasarela.
// EMPEZAR_WEBHOOK_URL: endpoint que recibe el JSON del lead (p. ej. POST /notify-main del bridge de NanoClaw, con X-API-Key en EMPEZAR_WEBHOOK_KEY).
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const get = (k: string) => String(form.get(k) || '').trim();
  const lead = { nombre: get('nombre'), inmobiliaria: get('inmobiliaria'), whatsapp: `+${get('prefijo')}${get('whatsapp').replace(/\D/g, '')}`, email: get('email'), equipo: get('equipo'), tokko_usuario: get('tokko_usuario'), plan: get('plan'), pais: get('pais'), pedido: get('pedido'), pedido_id: get('pedido_id'), origen: get('origen'), ts: new Date().toISOString() };
  if (!lead.nombre || !lead.inmobiliaria || !lead.email || lead.whatsapp.length < 8) return new Response('Faltan datos', { status: 400 });
  const token = crypto.randomUUID().slice(0, 8);
  const url = import.meta.env.EMPEZAR_WEBHOOK_URL;
  if (url) {
    try {
      await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': import.meta.env.EMPEZAR_WEBHOOK_KEY || '' }, body: JSON.stringify({ tipo: 'alta_centralito', token, ...lead }) });
    } catch (e) { console.error('empezar: aviso a ops falló', e); }
  } else {
    console.log('[empezar] lead (sin webhook configurado):', JSON.stringify({ token, ...lead }));
  }
  return redirect('/contacto?enviado=1', 303);
};
