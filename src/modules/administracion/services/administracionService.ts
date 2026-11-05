import { apiClient } from '@/shared/api/apiClient';

// ============================================================
// TIPOS (reflejan los DTO del backend: modules/empresas y modules/usuarios)
// ============================================================

export interface Empresa {
  id: number;
  /** Identificador público y estable de la empresa */
  uuid: string | null;
  /** Sigla única: va delante del usuario interno de cada cuenta (hcyo.jperez) */
  sigla: string | null;
  nombre: string;
  ruc: string | null;
  activa: boolean;
  /** Cuentas que tienen esta empresa */
  cuentas: number;
}

/** Cómo se invitó a la persona: por correo, con una clave temporal o no se pudo. */
export type TipoInvitacion = 'correo' | 'clave_temporal' | 'ninguna';

/** Lo que Sulotec hizo con la cuenta (solo en empresas que manejan sus cuentas con Sulotec). */
export interface CuentaSulotec {
  estado: string | null;
  invitacion: TipoInvitacion | null;
  mensaje: string | null;
  claveTemporal: string | null;
}

export interface Cuenta {
  id: number;
  usuario: string;
  correo: string;
  nombreCompleto: string;
  cargo: string | null;
  empresa: string | null;
  rolCodigo: string | null;
  rolNombre: string | null;
  activo: boolean;
  /** Solo viene al crear la cuenta, en empresas con cuentas Sulotec. */
  cuentaSulotec?: CuentaSulotec | null;
}

export interface CuentaMasiva {
  nombres: string;
  apePat: string;
  apeMat?: string;
  correo: string;
  cargo?: string;
  rolCodigo: string;
}

export interface FilaCargaMasiva {
  fila: number;
  correo: string;
  nombreCompleto: string;
  estado: 'ok' | 'creada' | 'error';
  mensaje: string | null;
  usuario: string | null;
  invitacionEnviada: boolean;
  claveTemporal: string | null;
}

export interface CargaMasivaRespuesta {
  empresa: string;
  sigla: string;
  soloValidar: boolean;
  total: number;
  listas: number;
  creadas: number;
  conError: number;
  invitacionesPorCorreo: boolean;
  filas: FilaCargaMasiva[];
}

export interface InvitacionRespuesta {
  enviada: boolean;
  mensaje: string;
}

export interface Rol {
  codigo: string;
  nombre: string;
}

export interface NuevaCuenta {
  usuario: string;
  /** Opcional (y se ignora) cuando la empresa maneja sus cuentas con Sulotec. */
  clave?: string;
  correo: string;
  nombres?: string;
  apePat?: string;
  apeMat?: string;
  cargo?: string;
  empresa: string;
  rolCodigo: string;
}

// ============================================================
// LLAMADAS (sin "this": se pasan como funciones sueltas a los hooks)
// ============================================================

export const administracionService = {
  async listarEmpresas(): Promise<Empresa[]> {
    const { data } = await apiClient.get<Empresa[]>('/empresas');
    return data;
  },

  /** El uuid es opcional y solo lo acepta el administrador de Sulotec: sirve para igualarlo al de la empresa en la cuenta Sulotec. */
  async crearEmpresa(nombre: string, ruc: string | null, sigla: string | null = null, uuid: string | null = null): Promise<Empresa> {
    const { data } = await apiClient.post<Empresa>('/empresas', { nombre, ruc, sigla, ...(uuid ? { uuid } : {}) });
    return data;
  },

  /** Alta por lotes; con soloValidar solo revisa. Se crea todo o nada. */
  async cargaMasiva(solicitud: { empresa: string; soloValidar: boolean; cuentas: CuentaMasiva[] }): Promise<CargaMasivaRespuesta> {
    const { data } = await apiClient.post<CargaMasivaRespuesta>('/usuarios/carga-masiva', solicitud);
    return data;
  },

  /** Manda (o vuelve a mandar) el correo con el enlace para crear la contraseña. */
  async invitar(id: number): Promise<InvitacionRespuesta> {
    const { data } = await apiClient.post<InvitacionRespuesta>(`/usuarios/${id}/invitar`);
    return data;
  },

  /** Vuelve a invitar a una cuenta Sulotec. 409 CUENTA_SULOTEC_APAGADA si la empresa no está en ese modo. */
  async reinvitarSulotec(id: number): Promise<CuentaSulotec | null> {
    const { data } = await apiClient.post<{ cuentaSulotec: CuentaSulotec | null }>(`/usuarios/${id}/invitacion`);
    return data.cuentaSulotec ?? null;
  },

  /** Si no se manda uuid, el de la empresa no cambia. */
  async actualizarEmpresa(id: number, cambios: { ruc: string | null; uuid?: string }): Promise<Empresa> {
    const { data } = await apiClient.put<Empresa>(`/empresas/${id}`, cambios);
    return data;
  },

  async cambiarEstadoEmpresa(id: number, activa: boolean): Promise<Empresa> {
    const { data } = await apiClient.patch<Empresa>(`/empresas/${id}/estado`, null, { params: { activa } });
    return data;
  },

  async listarCuentas(): Promise<Cuenta[]> {
    const { data } = await apiClient.get<Cuenta[]>('/usuarios');
    return data;
  },

  async listarRoles(): Promise<Rol[]> {
    const { data } = await apiClient.get<Rol[]>('/usuarios/roles');
    return data;
  },

  async crearCuenta(solicitud: NuevaCuenta): Promise<Cuenta> {
    const { data } = await apiClient.post<Cuenta>('/usuarios', solicitud);
    return data;
  },

  async cambiarEmpresaDeCuenta(id: number, empresa: string): Promise<Cuenta> {
    const { data } = await apiClient.put<Cuenta>(`/usuarios/${id}/empresa`, { empresa });
    return data;
  },

  async cambiarRolDeCuenta(id: number, rolCodigo: string): Promise<Cuenta> {
    const { data } = await apiClient.put<Cuenta>(`/usuarios/${id}/rol`, { rolCodigo });
    return data;
  },

  async cambiarEstadoCuenta(id: number, activo: boolean): Promise<Cuenta> {
    const { data } = await apiClient.patch<Cuenta>(`/usuarios/${id}/estado`, null, { params: { activo } });
    return data;
  },
};

/** Mensaje legible de un error de la API (el backend devuelve { message }). */
export function mensajeDeError(error: unknown, porDefecto: string): string {
  const respuesta = (error as { response?: { data?: { message?: string; mensaje?: string } } })?.response?.data;
  return respuesta?.message || respuesta?.mensaje || porDefecto;
}
