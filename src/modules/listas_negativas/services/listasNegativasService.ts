import { apiClient } from '@/shared/api/apiClient';

export interface ManchaResponse {
  id: number;
  tipoListaCodigo: string | null;
  tipoListaNombre: string | null;
  grupoNombre: string | null;
  grupoColor: string | null;
  esPep: boolean;
  descripcion: string | null;
  link: string | null;
  fechaRegistro: string | null;
  fechaHasta: string | null;
  institucion: string | null;
  cargo: string | null;
  tipoPep: string | null;
  periodoDesde: string | null;
  periodoHasta: string | null;
}

export interface ResultadoBusquedaResponse {
  entidadId: number;
  tipoEntidad: 'NATURAL' | 'JURIDICA' | string;
  documento: string;
  tipoDocumento: string | null;
  nombreCompleto: string;
  nombres: string | null;
  apellidoPaterno: string | null;
  apellidoMaterno: string | null;
  pasaporte: string | null;
  alias: string | null;
  fechaNacimientoRegistro: string | null;
  pais: string | null;
  manchas: ManchaResponse[];
}

export interface HistorialConsultaResponse {
  id: number;
  fechaConsulta: string;
  resultado: ResultadoBusquedaResponse;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export type TipoDocumentoCodigo = 'DNI' | 'CE' | 'RUC' | 'PASAPORTE';

export interface BusquedaListasNegativasParams {
  documento?: string;
  tipoDocumento?: TipoDocumentoCodigo | '';
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
}

/** Una página de resultados de la búsqueda, con el total de toda la base. */
export interface PaginaResultados {
  items: ResultadoBusquedaResponse[];
  /** Coincidencias en total (no solo las de esta página). */
  total: number;
  totalPaginas: number;
  /** Página actual, desde 0. */
  pagina: number;
  tamano: number;
}

/** Personas por página en la búsqueda (el backend no pasa de 50). */
export const TAMANO_PAGINA_BUSQUEDA = 20;

export const listasNegativasService = {
  async buscar(
    params: BusquedaListasNegativasParams,
    pagina = 0,
    tamano = TAMANO_PAGINA_BUSQUEDA
  ): Promise<PaginaResultados> {
    const { data, headers } = await apiClient.get<ResultadoBusquedaResponse[]>('/listas-negativas/buscar', {
      params: { ...params, page: pagina, size: tamano },
    });
    // El backend manda el total en cabeceras (el cuerpo sigue siendo la lista). Si no llegan, la lista recibida es todo.
    const cabecera = (nombre: string, porDefecto: number) => {
      const valor = Number(headers?.[nombre]);
      return Number.isFinite(valor) ? valor : porDefecto;
    };
    return {
      items: data,
      total: cabecera('x-total-count', data.length),
      totalPaginas: cabecera('x-total-pages', 1),
      pagina: cabecera('x-page', pagina),
      tamano: cabecera('x-page-size', tamano),
    };
  },

  async obtenerHistorial(page: number, size = 10): Promise<PageResponse<HistorialConsultaResponse>> {
    const { data } = await apiClient.get<PageResponse<HistorialConsultaResponse>>(
      '/listas-negativas/historial',
      { params: { page, size, sort: 'fechaConsulta,desc' } }
    );
    return data;
  },

  async obtenerDetalle(entidadId: number): Promise<ResultadoBusquedaResponse> {
    const { data } = await apiClient.get<ResultadoBusquedaResponse>(`/listas-negativas/${entidadId}`);
    return data;
  },
};
