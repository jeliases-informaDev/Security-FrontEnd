import { apiClient } from '@/shared/api/apiClient';
import { conConsumo } from '@/modules/licencias/lib/consumo';

/*
  Contrato con el backend de Listas Negativas (rutas bajo /listas-negativas/consultas).
  El front no escribe pesos, nombres de lista, umbrales ni validaciones de documento: todo llega del catálogo y de cada consulta.
*/

// ---------- Catálogo (antes de buscar) ----------

export interface TipoConsultaCatalogo {
  codigo: string;
  nombre: string;
  /** Tipos de documento que valen para este «¿A quién consultas?». */
  tiposDocumento: string[];
}

export interface TipoDocumentoCatalogo {
  codigo: string;
  nombre: string;
  /** Expresión regular del formato válido. */
  patron: string;
  ayuda: string;
}

export type EstadoFila = 'COINCIDENCIA' | 'SIN_COINCIDENCIAS' | 'PRONTO';

export interface FilaCatalogo {
  codigo: string;
  nombre: string;
  subtitulo: string | null;
  orden: number;
  fuente: string;
  fuenteNombre: string;
  grupoPeso: string;
  peso: number;
  /** false = «Pronto» (apagada, con su motivo). */
  disponible: boolean;
  motivo: string | null;
  /** Fecha (AAAA-MM-DD) de la última carga de esa lista; null = no mostrar nada. */
  actualizada: string | null;
}

export interface FuenteCatalogo {
  codigo: string;
  nombre: string;
  estado: 'CONSULTABLE' | 'PRONTO';
}

export interface CatalogoListas {
  tiposConsulta: TipoConsultaCatalogo[];
  tipoConsultaInicial: string;
  tiposDocumento: TipoDocumentoCatalogo[];
  tipoDocumentoInicial: string;
  leyenda: string | null;
  filas: FilaCatalogo[];
  fuentes: FuenteCatalogo[];
  listasConsultables: number;
  fechaBase: string | null;
}

// ---------- Consulta (resultado) ----------

export interface UsuarioConsulta {
  usuario: string;
  nombre: string;
}

export interface CriterioConsulta {
  tipoDocumento: string | null;
  documento: string | null;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  texto: string;
}

export interface PersonaConsultada {
  entidadId: number;
  nombre: string;
  tipoDocumento: string | null;
  documento: string | null;
  tipoPersona: string | null;
  pais: string | null;
  esPep: boolean;
}

export interface PorQueCoincide {
  tipo: 'EXACTA_DOCUMENTO' | 'POR_NOMBRE' | 'SIN_RESULTADOS' | string;
  titulo: string;
  detalle: string | null;
  advertencia: string | null;
}

export interface ItemRegistro {
  id: number;
  lista: string;
  esPep: boolean;
  descripcion: string | null;
  link: string | null;
  dominio: string | null;
  fechaRegistro: string | null;
  fechaHasta: string | null;
  institucion: string | null;
  cargo: string | null;
  tipoPep: string | null;
  periodoDesde: string | null;
  periodoHasta: string | null;
  sinPeriodo: boolean;
}

export interface FilaResultado {
  codigo: string;
  nombre: string;
  subtitulo: string | null;
  orden: number;
  fuente: string;
  fuenteNombre: string;
  grupoPeso: string;
  peso: number;
  estado: EstadoFila;
  motivo: string | null;
  registros: number;
  tipoConteo: 'REGISTROS' | 'NOTICIAS' | string;
  etiquetaConteo: string;
  actualizada: string | null;
  otraLista: boolean;
  avisos: string[];
  items: ItemRegistro[];
}

export interface FuenteResultado {
  codigo: string;
  nombre: string;
  estado: EstadoFila;
}

export interface AvisoResultado {
  tono: string;
  titulo: string;
  fuentes: string[];
  suma: string | null;
  texto: string | null;
}

export type Clasificacion = 'SIN_COINCIDENCIAS' | 'MEDIA' | 'CRITICA';

export interface ResultadoConsulta {
  porcentaje: number;
  clasificacion: Clasificacion | string;
  clasificacionNombre: string;
  listasConsultadas: number;
  listasConCoincidencia: number;
  registrosEnListas: number;
  noticiasEnMedios: number;
  esPep: boolean;
  fechaBase: string | null;
  leyenda: string | null;
  filas: FilaResultado[];
  fuentes: FuenteResultado[];
  aviso: AvisoResultado;
}

export interface DecisionConsulta {
  accion: 'HOMONIMO' | 'DESHACER_HOMONIMO' | string;
  comentario: string | null;
  usuario: UsuarioConsulta;
  fecha: string;
}

export interface AccionesConsulta {
  verRegistros: boolean;
  marcarHomonimo: boolean;
  deshacerHomonimo: boolean;
  reportePdf: boolean;
  continuarScoring: boolean;
  programarBusqueda: string;
  consultaMasiva: string;
}

export interface DatosScoring {
  consultaId: number;
  entidadId: number | null;
  clienteNuevo: boolean;
  tipoDocumento: string | null;
  documento: string | null;
  nombre: string | null;
  tipoPersona: string | null;
}

export interface ConsultaResponse {
  id: number;
  fecha: string;
  tipoConsulta: string;
  tipoConsultaNombre: string;
  usuario: UsuarioConsulta;
  criterio: CriterioConsulta;
  busquedaId: number | null;
  consultado: PersonaConsultada | null;
  porQueCoincide: PorQueCoincide;
  resultado: ResultadoConsulta;
  estado: 'VIGENTE' | 'DESCARTADA_HOMONIMO' | string;
  estadoNombre: string;
  homonimo: { comentario: string | null; usuario: UsuarioConsulta; fecha: string } | null;
  decisiones: DecisionConsulta[];
  acciones: AccionesConsulta;
  scoring: DatosScoring;
  pieNoticias: string | null;
}

// ---------- Búsqueda con candidatos ----------

export interface Candidato {
  entidadId: number;
  nombre: string;
  tipoDocumento: string | null;
  documento: string | null;
  tipoPersona: string | null;
  pais: string | null;
  alias: string | null;
  esPep: boolean;
  apariciones: number;
  listas: string[];
  /** Si ya se abrió como consulta dentro de esta búsqueda. */
  consultaId: number | null;
}

export interface BusquedaCandidatos {
  id: number;
  fecha: string;
  tipoConsulta: string;
  modo: string;
  criterio: CriterioConsulta;
  candidatos: Candidato[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface CuerpoConsulta {
  tipoConsulta: string;
  tipoDocumento: string;
  documento: string | null;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
}

export type RespuestaConsultar =
  | { resultado: 'CONSULTA'; consulta: ConsultaResponse; busqueda: null }
  | { resultado: 'CANDIDATOS'; consulta: null; busqueda: BusquedaCandidatos };

// ---------- Historial, resumen e inicio ----------

export type FiltroHistorial = 'TODAS' | 'CON_COINCIDENCIAS' | 'SIN_COINCIDENCIAS' | 'CRITICAS';

export interface FilaHistorial {
  id: number;
  fecha: string;
  consultado: string;
  tipoDocumento: string | null;
  documento: string | null;
  tipoConsulta: string;
  tipoConsultaNombre: string;
  clasificacion: Clasificacion | string;
  clasificacionNombre: string;
  porcentaje: number;
  listasConCoincidencia: string[];
  usuario: string;
  estado: string;
  homonimo: boolean;
}

export interface PaginaHistorial {
  content: FilaHistorial[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ResumenMes {
  periodo: string;
  consultas: number;
  conCoincidencias: number;
  porcentajeConCoincidencias: number | null;
  criticas: number;
  criticasSinDecidir: number;
  sinCoincidencias: number;
  porcentajeSinCoincidencias: number | null;
}

export interface InicioListas {
  ultimas: FilaHistorial[];
  rueda: { porcentaje: number | null; consultaId: number | null; clasificacion: string | null };
}

/** Consultas por página del historial. */
export const TAMANO_PAGINA_HISTORIAL = 10;
/** Personas por página en la lista de candidatos. */
export const TAMANO_PAGINA_CANDIDATOS = 20;

const BASE = '/listas-negativas/consultas';

export const listasNegativasService = {
  async catalogo(): Promise<CatalogoListas> {
    const { data } = await apiClient.get<CatalogoListas>(`${BASE}/catalogo`);
    return data;
  },

  /** Realizar búsqueda: descuenta `busqueda_listas`, así que después se refresca la licencia. */
  async consultar(cuerpo: CuerpoConsulta): Promise<RespuestaConsultar> {
    return conConsumo(async () => {
      const { data } = await apiClient.post<RespuestaConsultar>(BASE, cuerpo);
      return data;
    });
  },

  async candidatos(busquedaId: number, pagina: number, tamano = TAMANO_PAGINA_CANDIDATOS): Promise<BusquedaCandidatos> {
    const { data } = await apiClient.get<BusquedaCandidatos>(`${BASE}/busquedas/${busquedaId}/candidatos`, { params: { page: pagina, size: tamano } });
    return data;
  },

  /** Abre la consulta de un candidato (no consume). */
  async elegir(busquedaId: number, entidadId: number): Promise<ConsultaResponse> {
    const { data } = await apiClient.post<ConsultaResponse>(`${BASE}/busquedas/${busquedaId}/elegir`, { entidadId });
    return data;
  },

  async obtener(id: number): Promise<ConsultaResponse> {
    const { data } = await apiClient.get<ConsultaResponse>(`${BASE}/${id}`);
    return data;
  },

  async marcarHomonimo(id: number, comentario: string): Promise<ConsultaResponse> {
    const { data } = await apiClient.post<ConsultaResponse>(`${BASE}/${id}/homonimo`, { comentario });
    return data;
  },

  async deshacerHomonimo(id: number, comentario: string): Promise<ConsultaResponse> {
    const { data } = await apiClient.post<ConsultaResponse>(`${BASE}/${id}/homonimo/deshacer`, comentario.trim() ? { comentario: comentario.trim() } : {});
    return data;
  },

  /** El PDF de la consulta descuenta `lista_pdf`. */
  async descargarPdf(id: number): Promise<Blob> {
    return conConsumo(async () => {
      const { data } = await apiClient.get<Blob>(`${BASE}/${id}/pdf`, { responseType: 'blob', headers: { Accept: 'application/pdf' } });
      return data;
    });
  },

  async historial(filtro: FiltroHistorial, q: string, pagina: number, tamano = TAMANO_PAGINA_HISTORIAL): Promise<PaginaHistorial> {
    const { data } = await apiClient.get<PaginaHistorial>(BASE, { params: { filtro, q: q.trim() || undefined, page: pagina, size: tamano } });
    return data;
  },

  async resumen(): Promise<ResumenMes> {
    const { data } = await apiClient.get<ResumenMes>(`${BASE}/resumen`);
    return data;
  },

  async inicio(): Promise<InicioListas> {
    const { data } = await apiClient.get<InicioListas>(`${BASE}/inicio`);
    return data;
  },
};
