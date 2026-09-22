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
};
