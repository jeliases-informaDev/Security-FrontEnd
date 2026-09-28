import { apiClient } from '@/shared/api/apiClient';

export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface CatalogosScoring {
  ocupaciones: CatalogoItem[];
  departamentos: CatalogoItem[];
}

export interface FactorScoring {
  nombre: string;
  valor: string;
  puntaje: number;
  peso: number;
  puntajePonderado: number;
}

export interface ScoringResult {
  id: number;
  entidadId: number;
  nombreCompleto: string;
  documento: string;
  factores: FactorScoring[];
  puntajeTotal: number;
  categoria: string;
  fechaCreacion: string;
}

export interface EvaluarScoringParams {
  entidadId: number;
  idOcupacion: number;
  idDepartamento: number;
  volumenTransaccional: number;
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

  async evaluar(params: EvaluarScoringParams): Promise<ScoringResult> {
    const { data } = await apiClient.post<ScoringResult>('/scoring/evaluar', params);
    return data;
  },

  async obtenerHistorial(page: number, size = 10): Promise<PageResponse<ScoringResult>> {
    const { data } = await apiClient.get<PageResponse<ScoringResult>>('/scoring/historial', {
      params: { page, size, sort: 'fechaCreacion,desc' },
    });
    return data;
  },
};
