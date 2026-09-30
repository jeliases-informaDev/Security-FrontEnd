// ============================================================
// ENUMS / TIPOS DEL BACKEND
// ============================================================

export type TipoEmpresa =
  | "GRAN_EMPRESA"
  | "MEDIANA_EMPRESA"
  | "PEQUENA_EMPRESA"
  | "MICROEMPRESA";

export type FactorRiesgo =
  | "EVENTOS_EXTERNOS"
  | "PERSONAS"
  | "TECNOLOGIA"
  | "PROCESOS";

export type NivelProbabilidad =
  | "MUY_ALTA"
  | "ALTA"
  | "MEDIA"
  | "BAJA"
  | "MUY_BAJA";

export type NivelImpacto =
  | "INSIGNIFICANTE"
  | "MENOR"
  | "MODERADO"
  | "MAYOR"
  | "CATASTROFICO";

export type NivelRiesgo =
  | "MINIMO"
  | "LEVE"
  | "MODERADO"
  | "ALTO"
  | "MUY_ALTO";

export type NivelSupervision =
  | "DIRECTIVO_AUTOMATICO"
  | "ANALISTA_COORDINADOR"
  | "OPERATIVO";

export type TipoControl =
  | "PREVENTIVO"
  | "DETECTIVO";

export type OperatividadControl =
  | "AUTOMATICO"
  | "SEMI_AUTOMATICO"
  | "MANUAL";

export type PeriodicidadControl =
  | "PERMANENTE"
  | "PERIODICO"
  | "EVENTUAL";

export type RespuestaControl =
  | "SI"
  | "NO";

export type EstadoAnalisis =
  | "EDITANDO"
  | "ABIERTO"
  | "CERRADO";


// ============================================================
// CATÁLOGOS
// ============================================================

export interface CatalogoMatriz {
  id: number;
  nombre: string;
  activo?: boolean;
}

export interface CrearCatalogoMatrizRequest {
  nombre: string;
}


// ============================================================
// HEATMAP
// ============================================================

export interface HeatmapProbabilidad {
  codigo: NivelProbabilidad;
  nivel: number;
  descripcion: string;
}

export interface HeatmapImpacto {
  codigo: NivelImpacto;
  nivel: number;
}

export interface HeatmapCelda {
  probabilidad: NivelProbabilidad;
  impacto: NivelImpacto;
  riesgo: NivelRiesgo;
}

export interface HeatmapMatrizResponse {
  probabilidades: HeatmapProbabilidad[];
  impactos: HeatmapImpacto[];
  celdas: HeatmapCelda[];
}

export interface HeatmapResultadoRiesgo {
  probabilidad: NivelProbabilidad;
  impacto: NivelImpacto;
  riesgo: NivelRiesgo;
}

export interface HeatmapSeleccion {
  inherente?: HeatmapResultadoRiesgo | null;
  residual?: HeatmapResultadoRiesgo | null;
}


// ============================================================
// CÁLCULO DE RIESGO INHERENTE
// ============================================================

export interface CalcularRiesgoInherenteRequest {
  probabilidad: NivelProbabilidad;
  impactoEstimado: number;
}

export interface CalcularRiesgoInherenteResponse {
  probabilidad: NivelProbabilidad;
  impacto: NivelImpacto;
  riesgoInherente: NivelRiesgo;
}


// ============================================================
// CÁLCULO DE RIESGO RESIDUAL
// ============================================================

export interface CalcularRiesgoResidualRequest {
  tipoEmpresa: TipoEmpresa;

  probabilidadInherente:
    NivelProbabilidad;

  impactoEstimado: number;

  supervision:
    NivelSupervision;

  tipoControl:
    TipoControl;

  operatividad:
    OperatividadControl;

  periodicidad:
    PeriodicidadControl;

  frecuenciaOportuna:
    RespuestaControl;

  seguimientoAdecuado:
    RespuestaControl;
}

export interface CalcularRiesgoResidualResponse {
  mitigacion: number;

  probabilidadResidual:
    NivelProbabilidad;

  impactoResidual:
    NivelImpacto;

  riesgoResidual:
    NivelRiesgo;
}


// ============================================================
// GUARDAR / REGISTRAR / ACTUALIZAR
// ============================================================

export interface GuardarMatrizRiesgoRequest {
  id?: number;

  tipoEmpresa?: TipoEmpresa;

  titulo?: string;

  areaId?: number;

  procesoId?: number;

  detalleRiesgo?: string;

  factor?: FactorRiesgo;

  probabilidad?: NivelProbabilidad;

  impactoEstimado?: number;

  controlDescripcion?: string;

  controlDocumento?: string;

  controlAreaId?: number;

  periodicidad?: PeriodicidadControl;

  operatividad?: OperatividadControl;

  tipoControl?: TipoControl;

  supervision?: NivelSupervision;

  frecuenciaOportuna?: RespuestaControl;

  seguimientoAdecuado?: RespuestaControl;

  planAccion?: string;

  areaResponsableId?: number;

  fechaInicio?: string;

  fechaCierre?: string;
}


// ============================================================
// RESPUESTA GUARDAR / REGISTRAR / ACTUALIZAR
// ============================================================

export interface MatrizRiesgoRegistroResponse {
  id: number;

  estado:
    EstadoAnalisis;

  impactoInherente?:
    NivelImpacto | null;

  riesgoInherente?:
    NivelRiesgo | null;

  mitigacion?:
    number | null;

  probabilidadResidual?:
    NivelProbabilidad | null;

  impactoResidual?:
    NivelImpacto | null;

  riesgoResidual?:
    NivelRiesgo | null;

  fechaActualizacion?:
    string | null;
}


// ============================================================
// LISTADO / DASHBOARD
// ============================================================

export interface MatrizRiesgoResumen {
  /*
   * Se utiliza internamente para:
   * - Ver análisis
   * - Ver matriz
   * - Descargar PDF
   * - Continuar borrador
   *
   * No es necesario mostrarlo en la tabla.
   */
  id: number;

  titulo:
    string | null;

  area:
    string | null;

  proceso:
    string | null;

  /*
   * Riesgo inherente
   */
  probabilidad:
    NivelProbabilidad | null;

  impactoInherente:
    NivelImpacto | null;

  riesgoInherente:
    NivelRiesgo | null;

  /*
   * Riesgo residual
   */
  probabilidadResidual:
    NivelProbabilidad | null;

  impactoResidual:
    NivelImpacto | null;

  riesgoResidual:
    NivelRiesgo | null;

  estado:
    EstadoAnalisis;

  fechaCreacion:
    string;

  fechaCierre:
    string | null;
}


// ============================================================
// DETALLE
// ============================================================

export interface MatrizRiesgoDetalle {
  id: number;

  tipoEmpresa?:
    TipoEmpresa | null;

  titulo?:
    string | null;

  areaId?:
    number | null;

  area?:
    string | null;

  procesoId?:
    number | null;

  proceso?:
    string | null;

  detalleRiesgo?:
    string | null;

  factor?:
    FactorRiesgo | null;

  probabilidad?:
    NivelProbabilidad | null;

  impactoEstimado?:
    number | null;

  impactoInherente?:
    NivelImpacto | null;

  riesgoInherente?:
    NivelRiesgo | null;

  controlDescripcion?:
    string | null;

  controlDocumento?:
    string | null;

  controlAreaId?:
    number | null;

  controlArea?:
    string | null;

  periodicidad?:
    PeriodicidadControl | null;

  operatividad?:
    OperatividadControl | null;

  tipoControl?:
    TipoControl | null;

  supervision?:
    NivelSupervision | null;

  /*
   * El backend devuelve boolean
   * en el endpoint de detalle.
   */
  frecuenciaOportuna?:
    boolean | null;

  seguimientoAdecuado?:
    boolean | null;

  mitigacion?:
    number | null;

  probabilidadResidual?:
    NivelProbabilidad | null;

  impactoResidual?:
    NivelImpacto | null;

  riesgoResidual?:
    NivelRiesgo | null;

  planAccion?:
    string | null;

  areaResponsableId?:
    number | null;

  areaResponsable?:
    string | null;

  fechaInicio?:
    string | null;

  fechaCierre?:
    string | null;

  estado:
    EstadoAnalisis;

  fechaCreacion?:
    string | null;

  fechaActualizacion?:
    string | null;
}