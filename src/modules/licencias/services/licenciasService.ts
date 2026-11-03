import { apiClient } from '@/shared/api/apiClient';
import type {
  BolsaEmpresaResponse,
  MovimientoCredito,
  PaginaMovimientos,
  AvisoLicencia,
  TarifaCredito,
  RecargarCreditosRequest,
  ConfigurarLicenciaRequest,
} from '../types/licencia.types';

export const licenciasService = {
  /**
   * Consulta el estado de la bolsa de la empresa del usuario autenticado.
   * Accesible para cualquier rol autenticado.
   */
  async obtenerMiBolsa(): Promise<BolsaEmpresaResponse> {
    const { data } = await apiClient.get<BolsaEmpresaResponse>('/licencias/mi-bolsa');
    return data;
  },

  /**
   * Consulta la bolsa de una empresa específica.
   * Roles: ADMINISTRADOR_EMPRESA / ADMINISTRADOR.
   */
  async obtenerBolsaEmpresa(empresaId: number): Promise<BolsaEmpresaResponse> {
    const { data } = await apiClient.get<BolsaEmpresaResponse>(`/licencias/empresas/${empresaId}`);
    return data;
  },

  /**
   * Historial paginado de consumos y recargas de la empresa.
   */
  async listarMovimientos(page = 0, size = 15): Promise<PaginaMovimientos> {
    const { data } = await apiClient.get<PaginaMovimientos | MovimientoCredito[]>('/licencias/movimientos', {
      params: { page, size },
    });

    // Si el backend devuelve un arreglo plano en vez de un Page Spring
    if (Array.isArray(data)) {
      const inicio = page * size;
      const fin = inicio + size;
      const rebanada = data.slice(inicio, fin);
      return {
        content: rebanada,
        totalElements: data.length,
        totalPages: Math.max(1, Math.ceil(data.length / size)),
        number: page,
        size,
        first: page === 0,
        last: fin >= data.length,
      };
    }

    return data;
  },

  /**
   * Lista los avisos internos de la empresa (80%, exceso, vencimiento).
   * Rol: ADMINISTRADOR_EMPRESA.
   */
  async listarAvisos(): Promise<AvisoLicencia[]> {
    const { data } = await apiClient.get<AvisoLicencia[]>('/licencias/avisos');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Marca una notificación/aviso como leída.
   * Rol: ADMINISTRADOR_EMPRESA.
   */
  async marcarAvisoLeido(id: number): Promise<void> {
    await apiClient.patch(`/licencias/avisos/${id}/leido`);
  },

  /**
   * Lista las tarifas vigentes por cada acción de crédito.
   */
  async listarTarifas(): Promise<TarifaCredito[]> {
    const { data } = await apiClient.get<TarifaCredito[]>('/licencias/tarifas');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Modifica la tarifa de una acción.
   * Rol: ADMINISTRADOR (Sulotec).
   */
  async actualizarTarifa(accion: string, costo: number): Promise<void> {
    await apiClient.put('/licencias/tarifas', { accion, costo });
  },

  /**
   * Suma créditos a la bolsa de una empresa.
   * Rol: ADMINISTRADOR (Sulotec).
   */
  async recargarCreditos(solicitud: RecargarCreditosRequest): Promise<void> {
    await apiClient.post('/licencias/recargar', solicitud);
  },

  /**
   * Configura o sincroniza la licencia de una empresa.
   * Rol: ADMINISTRADOR (Sulotec).
   */
  async configurarLicencia(solicitud: ConfigurarLicenciaRequest): Promise<void> {
    await apiClient.post('/licencias/configurar', solicitud);
  },
};
