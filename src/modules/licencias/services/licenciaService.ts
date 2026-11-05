import { apiClient } from '@/shared/api/apiClient';
import type { LicenciaResponse } from '../types/licencia.types';

export const licenciaService = {
  /** Estado de la licencia de la empresa del usuario. La empresa sale del token, nunca se envía desde aquí. */
  async obtener(refrescar = false): Promise<LicenciaResponse> {
    const { data } = await apiClient.get<LicenciaResponse>('/licencia', {
      params: refrescar ? { refrescar: 1 } : undefined,
    });
    return data;
  },
};
