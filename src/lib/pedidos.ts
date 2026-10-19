// Los 15 pedidos agrupados por familia, con su etiqueta corta (la que se ve en chips, rail móvil y sandbox).
export const CORTO: Record<string, string> = {
  'resumen-del-dia': 'Qué entró anoche', 'cargar-lead': 'Cargá un lead', 'quien-consulto': '¿Quién consultó por Thames 400?', 'rutina-leads-sin-cargar': 'Avisame si hay leads sin atender',
  'buscar-cartera': 'Buscá en tu cartera', 'buscar-red': '3 opciones en la Red Tokko', 'quien-busca-algo-asi': '¿Quién busca algo así?',
  'tasacion-acm': 'Una tasación', 'informe-propietario': 'Informe al propietario', 'landing-emprendimiento': 'Landing de un proyecto', 'ficha-con-tu-marca': 'Ficha PDF con tu marca',
  'cambios-en-lote': 'Aviso legal en 23 fichas', 'segmentar-contactos': 'Los de Palermo sin visita', 'leer-fotos-planos': 'Mandale un plano', 'planillas-al-dia': 'Planillas al día',
};
export const FAMILIAS = [
  { nombre: 'Leads', ids: ['resumen-del-dia', 'cargar-lead', 'quien-consulto', 'rutina-leads-sin-cargar'] },
  { nombre: 'Buscar', ids: ['buscar-cartera', 'buscar-red', 'quien-busca-algo-asi'] },
  { nombre: 'Tasar y armar', ids: ['tasacion-acm', 'informe-propietario', 'landing-emprendimiento', 'ficha-con-tu-marca'] },
  { nombre: 'Fichas y base', ids: ['cambios-en-lote', 'segmentar-contactos', 'leer-fotos-planos', 'planillas-al-dia'] },
];
export const ORDEN = FAMILIAS.flatMap(f => f.ids);
