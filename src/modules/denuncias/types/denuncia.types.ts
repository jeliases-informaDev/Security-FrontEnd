// ============================================================
// ENUMS / TIPOS
// ============================================================

export type CausaDenuncia =
  | "SOBORNO"
  | "CONFLICTO"
  | "ACOSO";

export type RelacionEmpresa =
  | "TRABAJADOR"
  | "CLIENTE"
  | "PROVEEDOR";

export type EstadoDenuncia =
  | "RECIBIDO"
  | "EN_PROCESO"
  | "CERRADO";

export type TipoPersonaInvolucrada =
  | "PERSONA_NATURAL"
  | "PERSONA_JURIDICA";

export type RolIncidente =
  | "TESTIGO"
  | "ENCARGADO";


// ============================================================
// REQUESTS
// ============================================================

export interface CrearInvolucradoRequest {
  tipoPersona: TipoPersonaInvolucrada;
  rolIncidente: RolIncidente;
  documento?: string | null;
  nombreRazonSocial: string;
  cargo: string;
}

export interface CrearDenunciaRequest {
  causa: CausaDenuncia;
  relacionEmpresa: RelacionEmpresa;
  descripcion: string;

  receptorUsuarioId?: number | null;
  receptorPropuesto?: string | null;

  involucrados: CrearInvolucradoRequest[];

  anonima: boolean;

  nombreDenunciante?: string | null;
  documentoDenunciante?: string | null;
  telefonoDenunciante?: string | null;
  correoDenunciante?: string | null;

  aceptaTerminos: boolean;
}

export interface ActualizarEstadoDenunciaRequest {
  estado: EstadoDenuncia;
  comentario?: string | null;
}


// ============================================================
// RESPUESTA DE CREACIÓN
// ============================================================

export interface CrearDenunciaResponse {
  id: number;

  codigoSeguimiento: string;

  /*
   * El PIN solamente es entregado por el backend
   * al momento de registrar la denuncia.
   */
  pin: string;

  estado: EstadoDenuncia;

  fechaCreacion: string;
}


// ============================================================
// CONSULTA DE SEGUIMIENTO
// ============================================================

export interface ConsultarDenunciaRequest {
  codigoSeguimiento: string;
  pin: string;
}

export interface SeguimientoDenunciaHistorial {
  estadoAnterior: EstadoDenuncia | null;
  estadoNuevo: EstadoDenuncia;
  comentario: string | null;
  fechaCreacion: string;
}

export interface ConsultarDenunciaResponse {
  codigoSeguimiento: string;

  causa: CausaDenuncia;
  relacionEmpresa: RelacionEmpresa;

  descripcion: string;

  estado: EstadoDenuncia;

  fechaCreacion: string;
  fechaActualizacion: string;
  fechaCierre: string | null;

  historial: SeguimientoDenunciaHistorial[];
}


// ============================================================
// RECEPTORES
// ============================================================

export interface ReceptorDenuncia {
  id: number;
  usuario: string;
  nombreCompleto: string;
  correo: string;
  cargo: string | null;
}


// ============================================================
// ARCHIVOS
// ============================================================

export interface DenunciaArchivo {
  id: number;
  nombreOriginal: string;
  tipoContenido: string | null;
  tamanoBytes: number | null;
  fechaCreacion: string;
}


// ============================================================
// RESPONSES RELACIONADOS
// ============================================================

export interface DenunciaInvolucrado {
  id: number;
  tipoPersona: TipoPersonaInvolucrada;
  rolIncidente: RolIncidente;
  documento: string | null;
  nombreRazonSocial: string;
  cargo: string;
  fechaCreacion: string;
}

export interface DenunciaHistorial {
  id: number;
  estadoAnterior: EstadoDenuncia | null;
  estadoNuevo: EstadoDenuncia;
  comentario: string | null;
  usuarioId: number | null;
  usuario: string | null;
  fechaCreacion: string;
}


// ============================================================
// LISTADO
// ============================================================

export interface DenunciaResumen {
  id: number;

  causa: CausaDenuncia;
  relacionEmpresa: RelacionEmpresa;

  descripcion: string;

  receptor: string | null;

  estado: EstadoDenuncia;

  anonima: boolean;

  fechaCreacion: string;
  fechaCierre: string | null;
}


// ============================================================
// DETALLE
// ============================================================

export interface DenunciaDetalle {
  id: number;

  causa: CausaDenuncia;
  relacionEmpresa: RelacionEmpresa;
  descripcion: string;

  receptorUsuarioId: number | null;
  receptor: string | null;
  receptorPropuesto: string | null;

  anonima: boolean;

  nombreDenunciante: string | null;
  documentoDenunciante: string | null;
  telefonoDenunciante: string | null;
  correoDenunciante: string | null;

  estado: EstadoDenuncia;

  involucrados: DenunciaInvolucrado[];
  archivos: DenunciaArchivo[];
  historial: DenunciaHistorial[];

  fechaCreacion: string;
  fechaActualizacion: string;
  fechaCierre: string | null;
}