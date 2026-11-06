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

export interface ResumenInicio {
  periodo: string;
  periodoEtiqueta: string;
  /** `puedeGestionar`: es administrador universal; `cargado`: la empresa tiene datos de demostración. */
  demo: { cargado: boolean; puedeGestionar: boolean };
  listas: ResumenListas | null;
  operaciones: ResumenOperaciones | null;
  oficial: ResumenOficial | null;
  denuncias: ResumenDenuncias | null;
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
