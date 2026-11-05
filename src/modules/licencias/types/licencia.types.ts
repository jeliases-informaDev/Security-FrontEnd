// Tipos de la respuesta de GET /api/licencia. Las claves van en snake_case tal cual las envía el servidor.

export type EstadoLicencia = 'ACTIVA' | 'SOLO_LECTURA' | 'SUSPENDIDA' | 'CANCELADA' | 'SIN_LICENCIA';

export type NivelTokens = 'normal' | 'aviso' | 'tolerancia' | 'bloqueado';

export interface TokensLicencia {
  bolsa: number;
  extra: number;
  capacidad: number;
  usados: number;
  disponibles: number;
  porcentaje: number;
  nivel: NivelTokens;
  tolerancia: number;
  tolerancia_max: number;
}

export interface Licencia {
  estado: EstadoLicencia;
  plan: string | null;
  usuarios_max: number | null;
  usuarios_activos: number | null;
  puede_crear_usuarios: boolean | null;
  /** AAAA-MM-DD */
  vencimiento: string | null;
  dias_para_vencer: number | null;
  /** AAAA-MM */
  periodo: string | null;
  tokens: TokensLicencia | null;
  mensaje: string;
  enlace: string;
}

/** Una acción que descuenta tokens, con el costo que fija Sulotec. */
export interface TarifaToken {
  tipo: string;
  nombre: string;
  /** Tokens que descuenta cada vez (0 = sin costo). */
  tokens: number;
  /** true si, al agotarse la bolsa, esta acción se bloquea. */
  bloquea: boolean;
}

export interface LicenciaResponse {
  /** true si quien consulta es el administrador de Sulotec (nunca se bloquea). */
  exento: boolean;
  /** Nombre de la empresa del usuario. */
  empresa: string | null;
  /** null = licencias apagadas o sin información: el front no muestra nada. */
  licencia: Licencia | null;
  /** Costo de cada acción. Puede faltar o venir vacía: el front no muestra la sección. */
  tarifas?: TarifaToken[] | null;
}

/** Datos que viajan en el evento 'licencia:saldo-insuficiente'. */
export interface DetalleSaldoInsuficiente {
  mensaje: string;
  enlace: string;
}
