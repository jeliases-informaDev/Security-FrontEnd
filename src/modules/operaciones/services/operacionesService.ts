import { apiClient } from '@/shared/api/apiClient';

// ============================================================
// TIPOS (reflejan los DTO del backend: modules/operaciones/dto)
// ============================================================

export interface UsuarioOperacion {
  id: string;
  usuario: string;
  empresa: string;
}

export interface ResponsableOperacion {
  id: number;
  nombreCompleto: string;
}

export interface OperacionItem {
  id: number;
  numeroRegistro: string | null;
  personaFisica: string | null;
  personaNombre: string | null;
  oficina: string | null;
  fecha: string | null;
  responsable?: ResponsableOperacion | null;
}

/** Respuesta de cambiar a qué usuario pertenece un registro. */
export interface CambioResponsable {
  id: number;
  usuarioId: number;
  nombreCompleto: string;
}

export interface PaginaOperaciones {
  content: OperacionItem[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export interface Persona {
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  nacionalidad?: string | null;
  telefono?: string | null;
  ocupacion?: string | null;
  domicilio?: string | null;
  codigoPostal?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
}

export interface DatosOperacion {
  fechaOperacion: string;
  lugar?: string | null;
  modalidadPago: string;
  /** Con el formato "PEN — Soles". */
  moneda: string;
  monto: number;
  tipoOperacion: string;
  cuenta1?: string | null;
  cuenta2?: string | null;
  cuenta3?: string | null;
}

export interface Beneficiario {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
}

export interface RegistroOperacion {
  usuarioId: string;
  usuario: string;
  empresa: string;
  oficina: string;
  fechaRegistro: string;
}

export interface RegistrarOperacionRequest {
  registro: RegistroOperacion;
  personaFisica: Persona;
  personaRepresentada: Persona | null;
  operacion: DatosOperacion;
  beneficiarios: Beneficiario[];
  numeroRegistro: string;
}

export interface ActualizarOperacionRequest {
  registro: { oficina: string; fechaRegistro: string };
  personaFisica: Persona;
  personaRepresentada: Persona | null;
  operacion: DatosOperacion;
  beneficiarios: Beneficiario[];
}

export interface DetalleOperacion {
  id: number;
  numeroRegistro: string;
  registro: RegistroOperacion;
  personaFisica: Persona;
  personaRepresentada: Persona | null;
  operacion: DatosOperacion;
  beneficiarios: Beneficiario[];
}

export interface RegistrarOperacionResponse {
  id: number;
  numeroRegistro: string;
  mensaje: string;
}

export interface UsuarioEmpresa {
  id: number;
  usuario: string;
  nombreCompleto: string;
  empresa: string;
  activo: boolean;
}

export interface CatalogoOpcion {
  id: number;
  nombre: string;
}

export interface MonedaOpcion {
  id: number;
  codigo: string;
  nombre: string;
  simbolo?: string | null;
}

export interface DepartamentoOpcion {
  id: number;
  nombre: string;
  idPais: number;
}

export interface CatalogosOperacion {
  monedas: MonedaOpcion[];
  ocupaciones: CatalogoOpcion[];
  tiposDocumento: CatalogoOpcion[];
  departamentos: DepartamentoOpcion[];
  paises: CatalogoOpcion[];
}

export interface ProvinciaOpcion {
  id: number;
  nombre: string;
}

// ============================================================
// SERVICIO
// ============================================================

export const operacionesService = {
  async obtenerUsuario(usuario: string): Promise<UsuarioOperacion> {
    const { data } = await apiClient.get<UsuarioOperacion>('/operaciones/obtener-usuario', { params: { usuario } });
    return data;
  },

  async listar(empresa: string, page: number, size = 10): Promise<PaginaOperaciones> {
    const { data } = await apiClient.get<PaginaOperaciones>('/operaciones/resumen', { params: { empresa, page, size } });
    return data;
  },

  async obtenerCatalogos(): Promise<CatalogosOperacion> {
    const { data } = await apiClient.get<CatalogosOperacion>('/operaciones/catalogos');
    return data;
  },

  async obtenerProvincias(idDepartamento: number): Promise<ProvinciaOpcion[]> {
    const { data } = await apiClient.get<ProvinciaOpcion[]>('/operaciones/catalogos/provincias', { params: { idDepartamento } });
    return data;
  },

  async obtenerDetalle(id: number): Promise<DetalleOperacion> {
    const { data } = await apiClient.get<DetalleOperacion>(`/operaciones/${id}`);
    return data;
  },

  async registrar(solicitud: RegistrarOperacionRequest): Promise<RegistrarOperacionResponse> {
    const { data } = await apiClient.post<RegistrarOperacionResponse>('/operaciones/insertar-operacion', solicitud);
    return data;
  },

  async actualizar(id: number, solicitud: ActualizarOperacionRequest): Promise<RegistrarOperacionResponse> {
    const { data } = await apiClient.put<RegistrarOperacionResponse>(`/operaciones/${id}`, solicitud);
    return data;
  },

  async usuariosPorEmpresa(empresa: string): Promise<UsuarioEmpresa[]> {
    const { data } = await apiClient.get<UsuarioEmpresa[]>('/operaciones/usuarios-por-empresa', { params: { empresa } });
    return data;
  },

  async cambiarResponsable(id: number, usuarioId: number): Promise<CambioResponsable> {
    const { data } = await apiClient.patch<CambioResponsable>(`/operaciones/${id}/usuario`, { usuarioId });
    return data;
  },

  async descargarPdf(id: number): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/operaciones/${id}/exportar-pdf`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    });
    return data;
  },
};

/** Mensaje legible de un error de la API (los controladores devuelven "message" o "mensaje"). */
export function mensajeDeErrorOperaciones(error: unknown, porDefecto: string): string {
  const respuesta = (error as { response?: { data?: { message?: string; mensaje?: string } } })?.response?.data;
  return respuesta?.message || respuesta?.mensaje || porDefecto;
}
