import { apiClient } from '@/shared/api/apiClient';

export interface ManchaResponse {
  id: number;
  tipoListaCodigo: string | null;
  tipoListaNombre: string | null;
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

export interface BusquedaListasNegativasParams {
  documento?: string;
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
