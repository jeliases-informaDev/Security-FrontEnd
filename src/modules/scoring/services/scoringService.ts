import { apiClient } from '@/shared/api/apiClient';

// Contrato con el backend: rutas bajo /api/scoring (metodología versión 2 del 29 de octubre de 2026).

export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';
export type TipoPersona = 'NATURAL' | 'JURIDICA';

/** Opción de un desplegable. `puntaje: null` = la metodología no le da puntaje (elegirla bloquea el cálculo). */
export interface OpcionCatalogo {
  id: number;
  nombre: string;
  puntaje: number | null;
}

export interface MedioPagoCatalogo extends OpcionCatalogo {
  pideOrigenFondos: boolean;
}

export interface PaisCatalogo {
  id: number;
  nombre: string;
  grupo: number;
  altoRiesgoGafi: boolean;
}

export interface CatalogosScoring {
  metodologia: { version: number; fecha: string };
  ocupaciones: OpcionCatalogo[];
  productos: OpcionCatalogo[];
  canales: OpcionCatalogo[];
  mediosPago: MedioPagoCatalogo[];
  departamentos: OpcionCatalogo[];
  paises: PaisCatalogo[];
  sustentoDisponible: boolean;
}

export interface EstadoLista {
  revisado: boolean;
  coincidencias: number | null;
}

export interface ReglaCliente {
  codigo: string;
  titulo: string;
  detalle: string;
}

export interface ClienteScoring {
  encontrado: boolean;
  entidadId: number | null;
  tipoPersona: TipoPersona;
  tipoDocumento: string;
  documento: string;
  nombre: string;
  consulta: {
    fecha: string | null;
    pep: EstadoLista;
    vinculados: EstadoLista;
    sanciones: EstadoLista;
    noticias: EstadoLista;
  };
  condicion: { puntaje: number; etiqueta: string } | null;
  reglas: ReglaCliente[];
}

/** Datos de un cliente que no está en la base de listas (se escriben a mano). */
export interface ClienteNuevo {
  tipoPersona: TipoPersona;
  tipoDocumento: string;
  documento: string;
  nombre: string;
}

export interface DatosEvaluacion {
  entidadId: number | null;
  cliente: ClienteNuevo | null;
  ocupacionId: number | null;
  montoOperacion: number | null;
  productoId: number | null;
  canalId: number | null;
  medioPagoId: number | null;
  departamentoResidenciaId: number | null;
  departamentoOperacionId: number | null;
  paisFondosId: number | null;
  sustentoId: string | null;
}

export interface Bloqueo {
  campo: string;
  mensaje: string;
}

export interface VistaPrevia {
  grupos: { clientes: number | null; productos: number | null; zona: number | null };
  puntaje: number | null;
  formula: string | null;
  montoNota: string | null;
  bloqueos: Bloqueo[];
}

export interface FactorResultado {
  codigo: string;
  nombre: string;
  dato: string;
  puntaje: number;
  peso: number;
  aporte: number;
  automatico: boolean;
}

export interface GrupoResultado {
  codigo: string;
  nombre: string;
  peso: number;
  promedio: number;
  factores: FactorResultado[];
}

export interface ReglaActivada {
  codigo: string;
  titulo: string;
  detalle: string;
}

export interface DecisionAnalista {
  accion: 'ENVIAR_A_APROBACION' | 'RECHAZAR';
  comentario: string | null;
  por: string;
  fecha: string;
}

export interface ResultadoScoring {
  id: number;
  version: number;
  fecha: string;
  cliente: { nombre: string; tipoDocumento: string; documento: string; tipoPersona: TipoPersona; ocupacion: string; departamento: string };
  puntaje: number;
  nivel: NivelRiesgo;
  nivelPorPromedio: NivelRiesgo;
  fijadoPorRegla: boolean;
  avisoRegla: { titulo: string; detalle: string } | null;
  grupos: GrupoResultado[];
  reglas: ReglaActivada[];
  queHacer: {
    debidaDiligencia: string;
    decide: string;
    revisionMeses: number;
    proximaRevision: string;
    reunir: string[];
  };
  decision: DecisionAnalista | null;
}

/** Fila del historial. Las de la versión 1 traen `categoria` (la de entonces) y no `nivel`. */
export interface FilaHistorial {
  id: number;
  version?: number;
  nombreCompleto: string;
  documento: string;
  puntajeTotal: number;
  categoria?: string | null;
  nivel?: NivelRiesgo | null;
  decision?: DecisionAnalista | string | null;
  fechaCreacion: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export const scoringService = {
  async obtenerCatalogos(): Promise<CatalogosScoring> {
    const { data } = await apiClient.get<CatalogosScoring>('/scoring/catalogos');
    return data;
  },

  /** Busca al cliente por documento y consulta las listas. No consume tokens. */
  async buscarCliente(documento: string): Promise<ClienteScoring> {
    const { data } = await apiClient.get<ClienteScoring>('/scoring/cliente', { params: { documento } });
    return data;
  },

  /** Cálculo provisional: no guarda ni consume tokens y acepta datos a medias. */
  async vistaPrevia(datos: DatosEvaluacion, signal?: AbortSignal): Promise<VistaPrevia> {
    const { data } = await apiClient.post<VistaPrevia>('/scoring/vista-previa', datos, { signal });
    return data;
  },

  /** Guarda la evaluación y consume el token `scoring`. */
  async evaluar(datos: DatosEvaluacion): Promise<ResultadoScoring> {
    const { data } = await apiClient.post<ResultadoScoring>('/scoring/evaluar', datos);
    return data;
  },

  async obtener(id: number): Promise<ResultadoScoring> {
    const { data } = await apiClient.get<ResultadoScoring>(`/scoring/${id}`);
    return data;
  },

  async decidir(id: number, accion: DecisionAnalista['accion'], comentario: string): Promise<ResultadoScoring> {
    const { data } = await apiClient.post<ResultadoScoring>(`/scoring/${id}/decision`, { accion, comentario });
    return data;
  },

  async descargarPdf(id: number): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/scoring/${id}/pdf`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    });
    return data;
  },

  async subirSustento(archivo: File): Promise<string> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    const { data } = await apiClient.post<{ id: string }>('/scoring/sustentos', formulario);
    return data.id;
  },

  async obtenerHistorial(page: number, size = 10): Promise<PageResponse<FilaHistorial>> {
    const { data } = await apiClient.get<PageResponse<FilaHistorial>>('/scoring/historial', {
      params: { page, size, sort: 'fechaCreacion,desc' },
    });
    return data;
  },
};
