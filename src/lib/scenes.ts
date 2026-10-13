// Carga de escenas (un JSON por pedido; ids = datos/capabilities.json)
import resumen from '@/data/scenes/resumen-del-dia.json';
import buscarRed from '@/data/scenes/buscar-red.json';
import tasacion from '@/data/scenes/tasacion-acm.json';
import segmentar from '@/data/scenes/segmentar-contactos.json';
import landing from '@/data/scenes/landing-emprendimiento.json';
import lote from '@/data/scenes/cambios-en-lote.json';
import informe from '@/data/scenes/informe-propietario.json';
import cargarLead from '@/data/scenes/mini/cargar-lead.json';
import quienConsulto from '@/data/scenes/mini/quien-consulto.json';
import buscarCartera from '@/data/scenes/mini/buscar-cartera.json';
import fichaMarca from '@/data/scenes/mini/ficha-con-tu-marca.json';
import planos from '@/data/scenes/mini/leer-fotos-planos.json';
import quienBusca from '@/data/scenes/mini/quien-busca-algo-asi.json';
import planillas from '@/data/scenes/mini/planillas-al-dia.json';
import rutinaLeads from '@/data/scenes/mini/rutina-leads-sin-cargar.json';

export interface Adjunto { clase: 'pdf' | 'xls' | 'img' | 'sheets'; nombre: string; meta?: string }
export interface Artefacto { tipo: string; [k: string]: any }
export interface Mensaje {
  de: 'asesor' | 'centralito';
  texto: string;
  hora?: string;
  type_ms?: number;
  typing_ms?: number;
  hold_ms?: number;
  read?: string;
  link?: string;
  artefacto?: Artefacto;
  adjuntos?: Adjunto[];
  panel?: Artefacto;
  panel_accion?: string;
  respuestas_rapidas?: string[];
  rama_stand?: string;
  anuncio?: string;
  notificacion?: boolean;
}
export interface Escena {
  id: string;
  hora: string;
  titulo: string;
  chip: string;
  parada?: string;
  aura?: string;
  mini?: boolean;
  mensajes: Mensaje[];
  ramas?: Record<string, Mensaje[]>;
  variante_hero?: { mensajes: Mensaje[]; ramas?: Record<string, Mensaje[]> };
  sugerencia?: string;
  pila?: Artefacto;
  antes: string;
  despues: string;
  wa_text: string;
  etiqueta: string;
}

export const SCENES: Record<string, Escena> = Object.fromEntries(
  ([resumen, buscarRed, tasacion, segmentar, landing, lote, informe, cargarLead, quienConsulto, buscarCartera, fichaMarca, planos, quienBusca, planillas, rutinaLeads] as Escena[]).map(s => [s.id, s])
);
export const ALL_IDS = Object.keys(SCENES);
export const TOTAL = ALL_IDS.length; // 15
/** Los seis pedidos de la carta del hero, en orden de lectura */
export const CARTA_IDS = ['resumen-del-dia', 'tasacion-acm', 'segmentar-contactos', 'buscar-red', 'cambios-en-lote', 'informe-propietario'];
/** Las cuatro paradas de Un día */
export const DIA_IDS = ['resumen-del-dia', 'tasacion-acm', 'segmentar-contactos', 'landing-emprendimiento'];
/** Los ocho chips de "Otros pedidos" (ranking real, sin cifras) */
export const MINI_IDS = ['cargar-lead', 'quien-consulto', 'buscar-cartera', 'ficha-con-tu-marca', 'leer-fotos-planos', 'quien-busca-algo-asi', 'planillas-al-dia', 'rutina-leads-sin-cargar'];
/** Orden del modo stand (?auto) */
export const AUTO_IDS = [...DIA_IDS, 'buscar-red', 'cambios-en-lote', 'informe-propietario'];
export const getScene = (id: string) => SCENES[id];
