import { apiClient } from '@/shared/api/apiClient';

// ============================================================
// TIPOS (el contrato de GET /api/inicio/resumen; el backend lo anota en docs/INICIO.md)
// ============================================================
// El servidor manda null en lo que no puede calcular: el front lo muestra como «sin dato» y nunca se rompe.
// Un bloque entero (listas, operaciones, oficial o denuncias) llega null si la cuenta no puede verlo: esa tarjeta no se muestra.

/** Reparto, en porcentaje, de las consultas del periodo según la peor coincidencia que tuvo cada una. */
export interface ResultadoConsultas {
  criticaPct: number | null;
  altaPct: number | null;
  mediaPct: number | null;
  sinCoincidenciaPct: number | null;
}

export interface FuenteCoincidencias {
  fuente: string;
  coincidencias: number;
}

/** Coincidencias críticas que el analista aún no decidió; `masAntiguaDias` es la antigüedad de la más vieja (0 si es de hoy). */
export interface CriticasSinDecidir {
  cantidad: number | null;
  masAntiguaDias: number | null;
}

export interface ResumenListas {
  consultas: number | null;
  /** Contra el periodo anterior; null si el anterior no tuvo consultas. */
  consultasVariacionPct: number | null;
  /** Las series traen 14 números, uno por día, del más antiguo a hoy. */
  consultasSerie: number[] | null;
  conCoincidenciaPct: number | null;
  conCoincidenciaSerie: number[] | null;
  pepDetectados: number | null;
  pepSerie: number[] | null;
  homonimosDescartados: number | null;
  homonimosSerie: number[] | null;
  resultado: ResultadoConsultas | null;
  /** Las fuentes con más coincidencias, de mayor a menor. */
  porFuente: FuenteCoincidencias[] | null;
  criticasSinDecidir: CriticasSinDecidir | null;
}

/** El estado más urgente que aplica al registro (en este orden). */
export type EstadoRegistroInicio = 'SIN_RESPONSABLE' | 'INUSUAL' | 'ENVIADO' | 'REGISTRADO';

export interface UltimoRegistro {
  id: number;
  /** El servidor puede mandarlo null si el registro aún no tiene código. */
  codigo: string | null;
  persona: string | null;
  tipo: string | null;
  monto: number | null;
  moneda: string | null;
  estado: EstadoRegistroInicio | string;
}

export interface ResumenOperaciones {
  registros: number | null;
  montoTotalUsd: number | null;
  inusuales: number | null;
  sobreUmbral: number | null;
  mismoDiaPct: number | null;
  /** Meta sugerida de registros guardados el mismo día (hoy fija en 95). */
  metaMismoDiaPct: number | null;
  ultimos: UltimoRegistro[] | null;
}

/** `PENDIENTE_COMUNICAR`: designado, pero falta comunicarlo a la UIF (nunca se muestra como «al día»). */
export type EstadoOficialInicio = 'SIN_OFICIAL' | 'EN_EVALUACION' | 'PENDIENTE_COMUNICAR' | 'VIGENTE' | 'VACANTE';

export interface ResumenOficial {
  estado: EstadoOficialInicio | string;
  nombre: string | null;
  cargo: string | null;
  /** Sin pendientes vencidos con la UIF. */
  alDia: boolean | null;
  comunicadoUif: { fecha: string | null; enPlazo: boolean | null } | null;
  declaraciones: { vigentes: number | null; total: number | null } | null;
  /** El contrato solo fija el caso «no designado» (null); si hay alterno puede venir con su nombre. */
  alterno: { nombre?: string | null; nombreCompleto?: string | null } | string | null;
}

export interface SituacionDenuncias {
  situacion: string;
  cantidad: number;
}

export interface ResumenDenuncias {
  periodoEtiqueta: string | null;
  vencidas: number | null;
  recibidas: number | null;
  porAtender: number | null;
  sinAbrir: number | null;
  plazosATiempoPct: number | null;
  porSituacion: SituacionDenuncias[] | null;
  cierres: { fundadaPct: number | null; infundadaPct: number | null; archivadaPct: number | null } | null;
  tiempoPromedioCierreDias: number | null;
  /** Solo la cantidad: el detalle de lo derivado al oficial es reservado y el servidor nunca lo manda aquí. */
  derivadasAlOficial: number | null;
}

// ------------------------------------------------------------
// Cabina de mando (bloque `cabina`)
// ------------------------------------------------------------
// Todo es opcional: el backend desplegado hoy puede no mandar `cabina`, y cada sub-bloque llega null si el módulo no está o la cuenta no lo ve.
// El front nunca asume que existe: sin dato, el instrumento lo dice («Sin dato») y no rompe nada.

/** Cortes reales de la metodología de scoring (los manda el servidor; el front no inventa zonas). */
export interface EscalaScoring {
  min?: number | null;
  max?: number | null;
  corteMedio?: number | null;
  corteAlto?: number | null;
}

/** Un factor del radar «Perfil de riesgo»: promedio del periodo y del periodo anterior (null si no hay). */
export interface FactorRadar {
  /** Código estable del factor en la metodología (por ejemplo «OCUPACION»); el nombre es `factor`. */
  codigo?: string | null;
  factor?: string | null;
  valor?: number | null;
  anterior?: number | null;
}

export interface CabinaScoring {
  evaluaciones?: number | null;
  porNivel?: { bajo?: number | null; medio?: number | null; alto?: number | null } | null;
  puntajePromedio?: number | null;
  puntajePromedioAnterior?: number | null;
  escala?: EscalaScoring | null;
  radar?: FactorRadar[] | null;
}

/** Un número por día, del más antiguo (`desde`) a hoy. Los días sin datos vienen en 0. */
export interface CabinaTendencia {
  dias?: number | null;
  /** AAAA-MM-DD del primer día. */
  desde?: string | null;
  consultas?: number[] | null;
  coincidencias?: number[] | null;
  registros?: number[] | null;
  evaluaciones?: number[] | null;
  denuncias?: number[] | null;
}

/** Las cifras de un departamento con algo que mostrar (no confundir con el dibujo del departamento, en `lib/peruDepartamentos.ts`). `codigo` es el INEI de 2 dígitos (01 a 25) o null si el nombre no calzó («Extranjero»). */
export interface DepartamentoCifras {
  codigo?: string | null;
  nombre?: string | null;
  registros?: number | null;
  montoUsd?: number | null;
  evaluaciones?: number | null;
  /** Evaluaciones que salieron en nivel ALTO. */
  altos?: number | null;
}

export interface CabinaMapa {
  /** Solo los que tienen algo: el front completa los 25 con 0. */
  departamentos?: DepartamentoCifras[] | null;
}

/**
 * Tipos de plazo que manda hoy el servidor. `DECLARACION` es la revisión sugerida de la declaración jurada (no un plazo legal) y
 * `REGISTRO_MENSUAL` vence el último día del mes en curso (fecha supuesta). El tipo puede traer valores nuevos: se tolera cualquier texto.
 */
export type TipoPlazoCabina = 'COMUNICACION_UIF' | 'VACANCIA_OFICIAL' | 'DENUNCIA' | 'REGISTRO_MENSUAL' | 'DECLARACION';

/** Un vencimiento próximo. `dias` negativo = ya venció. `enlace` es la ruta del front donde se resuelve. */
export interface PlazoCabina {
  tipo?: TipoPlazoCabina | string | null;
  titulo?: string | null;
  /** AAAA-MM-DD */
  vence?: string | null;
  dias?: number | null;
  enlace?: string | null;
}

export interface CabinaLicencia {
  plan?: string | null;
  tokens?: { usados?: number | null; total?: number | null } | null;
  usuarios?: { usados?: number | null; cupo?: number | null } | null;
  /** AAAA-MM-DD */
  vence?: string | null;
  diasRestantes?: number | null;
}

export interface CabinaInicio {
  scoring?: CabinaScoring | null;
  tendencia?: CabinaTendencia | null;
  mapa?: CabinaMapa | null;
  plazos?: PlazoCabina[] | null;
  licencia?: CabinaLicencia | null;
}

export interface ResumenInicio {
  periodo: string;
  periodoEtiqueta: string;
  /** `puedeGestionar`: es administrador universal; `cargado`: la empresa tiene datos de demostración. */
  demo: { cargado: boolean; puedeGestionar: boolean };
  listas: ResumenListas | null;
  operaciones: ResumenOperaciones | null;
  oficial: ResumenOficial | null;
  denuncias: ResumenDenuncias | null;
  /** Instrumentos de la «Cabina de mando». Puede faltar (backend anterior) o ser null (la cuenta no ve ningún módulo): la banda no se dibuja. */
  cabina?: CabinaInicio | null;
}

/** Cuántos datos se crearon o se quitaron, por tipo (consultas, registros, denuncias…). */
export type ConteoDemo = Record<string, number>;

export interface RespuestaCargarDemo {
  cargado: boolean;
  /** true si ya estaban cargados: no se duplicó nada. */
  yaEstaba: boolean;
  creados?: ConteoDemo | null;
}

export interface RespuestaQuitarDemo {
  cargado: boolean;
  eliminados?: ConteoDemo | null;
}

// ============================================================
// LLAMADAS (sin "this": se pasan como funciones sueltas a los hooks)
// ============================================================

export const inicioService = {
  /** Resumen del tablero de Inicio. Sin `periodo` (AAAA-MM) el servidor usa el mes en curso (hora de Lima). */
  async resumen(periodo?: string): Promise<ResumenInicio> {
    const { data } = await apiClient.get<ResumenInicio>('/inicio/resumen', { params: periodo ? { periodo } : undefined });
    return data;
  },

  /** Solo administrador universal. Es idempotente: si ya estaban cargados contesta `yaEstaba: true` y no duplica. */
  async cargarDemo(): Promise<RespuestaCargarDemo> {
    const { data } = await apiClient.post<RespuestaCargarDemo>('/inicio/demo');
    return data;
  },

  /** Solo administrador universal. Quita únicamente lo que creó la demostración, nunca datos reales. */
  async quitarDemo(): Promise<RespuestaQuitarDemo> {
    const { data } = await apiClient.delete<RespuestaQuitarDemo>('/inicio/demo');
    return data;
  },
};

/** El servidor contesta 403 con este código cuando la cuenta no es administrador universal. */
export function esDemoSinPermiso(error: unknown): boolean {
  return (error as { response?: { data?: { code?: unknown } } })?.response?.data?.code === 'DEMO_SIN_PERMISO';
}
