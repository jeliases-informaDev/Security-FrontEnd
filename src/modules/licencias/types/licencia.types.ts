export type EstadoLicencia = 'VIGENTE' | 'SOLO_LECTURA' | 'SUSPENDIDA';

export interface BolsaEmpresaResponse {
  empresaId: number;
  empresaNombre: string;
  creditosTotales: number;
  creditosConsumidos: number;
  creditosDisponibles: number;
  porcentajeConsumo: number;
  toleranciaPorcentaje: number;
  toleranciaCreditos?: number;
  exceso?: number;
  enExceso: boolean;
  cupoUsuarios: number;
  usuariosActivos: number;
  fechaVencimiento: string;
  diasParaVencer: number;
  estado: EstadoLicencia;
  avisosPendientes?: number;
}

export type TipoMovimiento = 'CONSUMO' | 'RECARGA' | 'AJUSTE';

export interface MovimientoCredito {
  id: number;
  fecha: string;
  accion?: string | null;
  descripcion?: string | null;
  referencia?: string | null;
  cantidad?: number;
  creditos?: number;
  tipo?: TipoMovimiento;
  usuario?: string | null;
  exceso: boolean;
  consumidosDespues?: number | null;
  saldoPosterior?: number | null;
}

export interface PaginaMovimientos {
  content: MovimientoCredito[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

export interface AvisoLicencia {
  id: number;
  tipo?: string;
  titulo?: string;
  mensaje: string;
  fechaCreacion?: string;
  leido: boolean;
}

export interface TarifaCredito {
  id?: number;
  accion: string;
  costo: number;
  descripcion?: string;
  modulo?: string;
}

export interface RecargarCreditosRequest {
  empresaId: number;
  creditos: number;
  motivo?: string;
}

export interface ConfigurarLicenciaRequest {
  empresaId: number;
  creditosTotales: number;
  cupoUsuarios: number;
  toleranciaPorcentaje: number;
  fechaVencimiento: string;
}

/** Diccionario de nombres legibles para las acciones de crédito de los 5 módulos */
export const ACCIONES_CREDITO_INFO: Record<string, { modulo: string; nombre: string; costoPorDefecto: number }> = {
  LISTA_BUSQUEDA: {
    modulo: 'Listas Negativas',
    nombre: 'Búsqueda en Listas (Página 1)',
    costoPorDefecto: 1,
  },
  SCORING_EVALUAR: {
    modulo: 'Scoring de Riesgo',
    nombre: 'Evaluación de Scoring',
    costoPorDefecto: 2,
  },
  MATRIZ_REGISTRAR: {
    modulo: 'Matrices de Riesgo',
    nombre: 'Registro de Análisis de Matriz',
    costoPorDefecto: 3,
  },
  MATRIZ_PDF: {
    modulo: 'Matrices de Riesgo',
    nombre: 'Exportación de Matriz a PDF',
    costoPorDefecto: 1,
  },
  DENUNCIA_CREAR: {
    modulo: 'Canal de Denuncias',
    nombre: 'Registro de Denuncia',
    costoPorDefecto: 2,
  },
  DENUNCIA_DOCUMENTOS: {
    modulo: 'Canal de Denuncias',
    nombre: 'Carga de Documentos en Denuncia',
    costoPorDefecto: 1,
  },
  OPERACION_REGISTRAR: {
    modulo: 'Registro de Operaciones',
    nombre: 'Inserción de Operación',
    costoPorDefecto: 2,
  },
  OPERACION_PDF: {
    modulo: 'Registro de Operaciones',
    nombre: 'Exportación de Operación a PDF',
    costoPorDefecto: 1,
  },
};
