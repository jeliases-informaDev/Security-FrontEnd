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

export const listasNegativasService = {
  async buscar(params: BusquedaListasNegativasParams): Promise<ResultadoBusquedaResponse[]> {
    const { data } = await apiClient.get<ResultadoBusquedaResponse[]>('/listas-negativas/buscar', {
      params,
    });
    return data;
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
