// ============================================================
// ENUMS / TIPOS
// ============================================================

/** Las 6 situaciones que acepta el servidor (el nombre para mostrar sale de GET /api/denuncias/catalogo). */
export type CausaDenuncia =
  | "SOBORNO"
  | "CONFLICTO"
  | "ACOSO"
  | "FRAUDE"
  | "OPERACION_SOSPECHOSA"
  | "OTRAS";

/** Cómo se cierra una denuncia. */
export type ResultadoCierre =
  | "FUNDADA"
  | "INFUNDADA"
  | "ARCHIVADA";

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

  /** Obligatorio solo al pasar a CERRADO. */
  resultadoCierre?: ResultadoCierre | null;

  /** Obligatorio solo con ARCHIVADA (hasta 1000 caracteres). */
  motivoCierre?: string | null;
}

/** POST /api/denuncias/{id}/derivar-oficial (el cuerpo es opcional). */
export interface DerivarOficialRequest {
  /** Hasta 500 caracteres. */
  motivo?: string | null;
}


// ============================================================
// CATÁLOGO (GET /api/denuncias/catalogo)
// ============================================================

export interface OpcionCatalogoDenuncia {
  codigo: string;
  nombre: string;
}

export interface ResultadoCierreCatalogo extends OpcionCatalogoDenuncia {
  /** true: al elegir este resultado el motivo es obligatorio. */
  pideMotivo: boolean;
}

export interface CatalogoDenuncias {
  situaciones: OpcionCatalogoDenuncia[];
  estados: OpcionCatalogoDenuncia[];
  resultadosCierre: ResultadoCierreCatalogo[];
  plazoAtencionDias: number | null;
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
// CAMPOS DE GESTIÓN (listado y detalle de administración)
// ============================================================

/**
 * Los trae el servidor nuevo (Security-Backend #39). Todos son opcionales: el servidor desplegado antes de ese cambio no los
 * manda (llegan `undefined`) y la pantalla oculta lo que depende de ellos. `vencida` siempre llega (true/false) desde el
 * servidor nuevo: sirve para saber si los demás campos existen.
 */
export interface CamposGestionDenuncia {
  causaEtiqueta?: string | null;
  estadoEtiqueta?: string | null;

  /** AAAA-MM-DD. */
  fechaLimiteAtencion?: string | null;

  /** Negativo = vencida hace N días. null si ya está cerrada. */
  diasParaVencer?: number | null;
  vencida?: boolean;

  /** null mientras siga abierta. */
  atendidaATiempo?: boolean | null;

  resultadoCierre?: ResultadoCierre | null;
  resultadoCierreEtiqueta?: string | null;
  motivoCierre?: string | null;

  /**
   * RESERVADO. true/false solo para quien puede ver lo reservado (administrador y administrador de empresa);
   * para los demás (por ejemplo el supervisor) llega null y no se muestra nada de la derivación.
   */
  derivadaAlOficial?: boolean | null;
}

/** RESERVADO: solo llega en el detalle y solo a quien puede ver lo reservado. */
export interface DerivacionDenuncia {
  /** AAAA-MM-DDTHH:mm:ss */
  fechaDerivacion: string | null;
  derivadaPorUsuarioId: number | null;
  derivadaPor: string | null;
  motivo: string | null;
}


// ============================================================
// LISTADO
// ============================================================

export interface DenunciaResumen extends CamposGestionDenuncia {
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

export interface DenunciaDetalle extends CamposGestionDenuncia {
  id: number;

  /** RESERVADO: null (o ausente) si la cuenta no puede ver lo reservado o si la denuncia no está derivada. */
  derivacion?: DerivacionDenuncia | null;


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