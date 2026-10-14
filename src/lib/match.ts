// Emparejar lo que escribe el visitante en el sandbox con una de las 15 escenas (sin IA: palabras clave).
export const CLAVES: Record<string, string[]> = {
  'resumen-del-dia': ['anoche', 'entró', 'entro', 'qué entró', 'que entro', 'leads nuevos', 'resumen', 'pendientes', '8:30', 'mi día', 'mi dia', 'todos los días', 'buen día'],
  'cargar-lead': ['cargá', 'carga', 'cargar', 'cargame', 'cargá en tokko', 'nuevo contacto', 'sol arias', 'dar de alta', 'alta un lead'],
  'quien-consulto': ['quién consultó', 'quien consulto', 'consultaron', 'consultó por', 'consulto por', 'consultas de'],
  'rutina-leads-sin-cargar': ['avisame', 'avísame', 'sin atender', 'sin cargar', 'cuatro veces', '4 veces', 'rutina', 'fijate si', 'leads sin'],
  'buscar-cartera': ['cartera', 'mi cartera', 'villa crespo', '2 amb', 'venta en', 'buscame en mi', 'mis propiedades', 'tengo algo'],
  'buscar-red': ['red tokko', 'en la red', 'la red', '3 opciones', 'tres opciones', 'caballito hasta', 'balcón', 'balcon', 'comparte'],
  'quien-busca-algo-asi': ['quién busca', 'quien busca', 'buscaba', 'algo así', 'algo asi', 'entró un', 'entro un', 'contactos míos', 'quién de mis'],
  'tasacion-acm': ['tasación', 'tasacion', 'acm', 'tasame', 'tasá', 'tasa', 'valuación', 'valuacion', 'cuánto vale', 'cuanto vale', 'comparables', 'precio de mercado'],
  'informe-propietario': ['informe', 'propietario', 'dueño', 'dueno', 'reporte', 'difusión', 'difusion'],
  'landing-emprendimiento': ['landing', 'emprendimiento', 'brochure', 'página', 'pagina', 'web', 'sitio', 'desarrollo'],
  'ficha-con-tu-marca': ['ficha en pdf', 'ficha con', 'mi marca', 'con mi logo', 'reenviar', 'ficha pdf', 'armame la ficha'],
  'cambios-en-lote': ['aviso legal', 'todas las fichas', 'en lote', 'disponible', 'acoyte', 'descripción', 'descripcion', 'cambiá', 'cambia', 'agregales', 'agregá', 'pasá a'],
  'segmentar-contactos': ['segment', 'lista de los', 'palermo', 'nunca tuvieron visita', 'sin visita', 'etiquet', 'excel', 'consultaron por 3'],
  'leer-fotos-planos': ['plano', 'foto', 'superficie', 'dormitorios', 'm2', 'm²', 'ambientes de este', 'sacame'],
  'planillas-al-dia': ['planilla', 'sheets', 'operaciones', 'al día', 'al dia', 'cerradas', 'mantenela', 'actualiz'],
};
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Devuelve el id de la escena que mejor encaja, o null si nada encaja. */
export function matchScene(texto: string): string | null {
  const t = norm(texto); let best: string | null = null; let score = 0;
  for (const [id, claves] of Object.entries(CLAVES)) {
    let s = 0; for (const k of claves) if (t.includes(norm(k))) s += k.length;
    if (s > score) { score = s; best = id; }
  }
  return score > 0 ? best : null;
}
