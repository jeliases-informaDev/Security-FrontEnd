import { isAxiosError } from 'axios';
import { apiClient } from '@/shared/api/apiClient';

// ============================================================
// TIPOS (reflejan CONTRATO-OFICIAL.md; el front nunca suma fechas ni decide permisos)
// ============================================================

/** Tono de una etiqueta que manda el servidor. */
export type TonoOficial = 'verde' | 'ambar' | 'rojo' | 'lila' | 'gris';

export interface EtiquetaOficial {
  codigo: string;
  texto: string;
  tono: TonoOficial;
}

export type EstadoPlazo = 'EN_PLAZO' | 'POR_VENCER' | 'VENCIDO';

/** Plazo ya calculado por el servidor (días hábiles o corridos). */
export interface Plazo {
  regla: string;
  unidad: 'DIAS_HABILES' | 'DIAS';
  total: number;
  desde: string;
  vence: string;
  diasRestantes: number;
  /** 0 a 100, para la barra de avance. */
  avance: number;
  estado: EstadoPlazo;
  estadoEtiqueta: string;
  /** false mientras la tabla de feriados esté vacía: se avisa «Plazo estimado: no cuenta feriados». */
  cuentaFeriados: boolean;
}

export interface Adjunto {
  id: string;
  ambito: string;
  nombre: string;
  tipoContenido: string;
  tamanoBytes: number;
  subidoEn: string;
}

export interface UsuarioAccion {
  usuario: string;
  nombreCompleto: string;
}

/** Ya combina el rol y el estado: si es false, el botón va deshabilitado. */
export interface PermisosOficial {
  puedeDesignar: boolean;
  puedeCorregir: boolean;
  puedeComunicar: boolean;
  puedeCambiarDatos: boolean;
  puedeRemover: boolean;
  puedeRegistrarPendientes: boolean;
}

// ---- Catálogos ----

export interface OpcionOficial {
  codigo: string;
  nombre: string;
}

export interface OpcionCargo extends OpcionOficial {
  disponible: boolean;
}

export interface TipoEmpresaOficial extends OpcionOficial {
  quienDesigna: string;
  designantesPermitidos: string[];
}

export interface MotivoRemocionOficial extends OpcionOficial {
  ayuda: string;
  disponible: boolean;
}

export interface ReglaOficial {
  codigo: string;
  valor: number;
  unidad: string;
  articulo: string | null;
  descripcion: string;
}

export interface PuntoDeclaracion {
  letra: string;
  texto: string;
}

export interface ObligacionOficial {
  nombre: string;
  frecuencia: string;
}

export interface CatalogosOficial {
  tiposCargo: OpcionCargo[];
  dedicaciones: OpcionOficial[];
  tiposEmpresa: TipoEmpresaOficial[];
  nacionalidades: OpcionOficial[];
  nacionalidadInicial: string;
  tiposDocumento: OpcionOficial[];
  tipoDocumentoInicial: string;
  vinculos: OpcionOficial[];
  quienDesigna: OpcionOficial[];
  documentosDesignacion: OpcionOficial[];
  resultadosUif: OpcionOficial[];
  motivosRemocion: MotivoRemocionOficial[];
  ambitosAdjunto: OpcionOficial[];
  reglas: ReglaOficial[];
  declaracionRequisitos: PuntoDeclaracion[];
  /** Texto del punto «h» según el vínculo elegido (clave = código del vínculo). */
  declaracionRequisitosPuntoH: Record<string, string>;
  declaracionDesignante: { texto: string };
  obligaciones: ObligacionOficial[];
  adjuntos: { extensiones: string[]; tamanoMaximoBytes: number };
  feriados: { cargados: number; cuentaFeriados: boolean };
  pronto: {
    guiaRequisitos: boolean;
    designarAlterno: boolean;
    ausenciaTemporal: boolean;
    corporativo: boolean;
    pdfDeclaracionDesignante: boolean;
    avisos: boolean;
  };
}

// ---- Estado de la empresa ----

export type EstadoEmpresaOficial = 'SIN_OFICIAL' | 'PENDIENTE_COMUNICAR' | 'EN_EVALUACION' | 'VIGENTE' | 'VACANTE';
export type EstadoDesignacion = 'PENDIENTE_COMUNICAR' | 'EN_EVALUACION' | 'VIGENTE' | 'REMOVIDA';

export interface ResumenDesignacion {
  id: string;
  estado: EstadoDesignacion;
  estadoEtiqueta: string;
  nombreCompleto: string;
  iniciales: string;
  tipoCargo: string;
  tipoCargoNombre: string;
  dedicacion: string;
  dedicacionNombre: string;
  documento: string;
  fechaDesignacion: string;
  guardadaEn: string;
  designaNombre: string;
  nombreOrgano: string;
  resultadoUif: string | null;
  fechaNotificacion: string | null;
}

export interface ObservacionUif {
  motivo: string;
  fechaNotificacion: string;
}

export interface ComunicacionPendiente {
  fecha: string;
  numeroSolicitud: string | null;
  nota: string | null;
  constancia: Adjunto | null;
  registradaEn: string;
  registradaPor: UsuarioAccion;
}

export interface Pendiente {
  id: string;
  tipo: 'CAMBIO_DATOS' | 'REMOCION';
  designacionId: string;
  titulo: string;
  detalle: string | null;
  plazo: Plazo | null;
  comunicado: boolean;
  comunicacion: ComunicacionPendiente | null;
  creadoEn: string;
  creadoPor: UsuarioAccion;
}

export interface Vacancia {
  designacionRemovidaId: string;
  nombreCompleto: string;
  motivo: string;
  motivoNombre: string;
  fechaDecision: string;
  registradaEn: string;
  aprobadaPor: string | null;
  plazoDesignar: Plazo;
  pendienteRemocionId: string | null;
  plazoComunicarRemocion: Plazo | null;
  remocionComunicada: boolean;
  hayAlternoComunicado: boolean;
}

export interface EstadoOficial {
  empresa: { uuid: string; nombre: string };
  estado: EstadoEmpresaOficial;
  estadoEtiqueta: string;
  tipoEmpresa: string | null;
  titular: ResumenDesignacion | null;
  plazoComunicacion: Plazo | null;
  observacionUif: ObservacionUif | null;
  vacancia: Vacancia | null;
  pendientes: Pendiente[];
  permisos: PermisosOficial;
}

// ---- Ficha ----

export interface PersonaFicha {
  nombres: string;
  apellidos: string;
  nacionalidad: string;
  nacionalidadNombre: string;
  tipoDocumento: string;
  tipoDocumentoNombre: string;
  numeroDocumento: string;
  documento: string;
  fechaNacimiento: string;
  domicilio: string;
  telefono: string | null;
  correo: string;
}

export interface CargoFicha {
  cargo: string;
  fechaIngreso: string;
  vinculo: string;
  vinculoNombre: string;
  direccionOficina: string;
}

export interface DesignacionFicha {
  designa: string;
  designaNombre: string;
  nombreOrgano: string;
  documentoTipo: string;
  documentoTipoNombre: string;
  documentoFecha: string;
  documentoTexto: string;
  fechaDesignacion: string;
  esOficialOtraEmpresa: boolean;
  /** uuid de la designación que esta reemplaza (o null). */
  reemplazaAId: string | null;
  adjunto: Adjunto | null;
  hojaVida: Adjunto | null;
  documentoVinculo: Adjunto | null;
}

export interface DeclaracionFicha {
  completa: boolean;
  puntosAceptados?: number;
  puntosTotal?: number;
  firmaNombre: string | null;
  fechaFirma: string | null;
  adjunto: Adjunto | null;
  vigente: boolean;
}

export interface ComunicacionFicha {
  fechaComunicacion: string;
  numeroSolicitud: string;
  resultado: string;
  resultadoNombre: string;
  fechaNotificacion: string | null;
  motivoNoProcedente: string | null;
  constancia: Adjunto | null;
  registradaEn: string;
  /** Los códigos nunca vuelven del servidor: solo si hay guardados, cuándo y si el servidor puede cifrarlos. */
  codigos: { reservados: boolean; registradosEn: string | null; cifradoDisponible: boolean };
}

export interface RemocionFicha {
  id: string;
  motivo: string;
  motivoNombre: string;
  razones: string;
  aprobadaPor: string | null;
  fechaDecision: string;
  acta: Adjunto | null;
  registradaEn: string;
  registradaPor: UsuarioAccion;
}

export interface FichaOficial {
  id: string;
  estado: EstadoDesignacion;
  estadoEtiqueta: string;
  empresa: { uuid: string; nombre: string };
  tipoEmpresa: string;
  tipoEmpresaNombre: string;
  tipoCargo: string;
  tipoCargoNombre: string;
  dedicacion: string;
  dedicacionNombre: string;
  nombreCompleto: string;
  iniciales: string;
  etiquetas: EtiquetaOficial[];
  persona: PersonaFicha;
  cargo: CargoFicha;
  designacion: DesignacionFicha;
  declaraciones: { requisitos: DeclaracionFicha; designante: DeclaracionFicha };
  comunicacion: ComunicacionFicha | null;
  plazoComunicacion: Plazo | null;
  /** Si la UIF respondió «No procedente» y falta corregir y volver a comunicar (igual que en `/estado`). */
  observacionUif: ObservacionUif | null;
  enElCargoDesde: string | null;
  revisionSugerida: string | null;
  requisitosCargo: string[];
  remocion: RemocionFicha | null;
  pendientes: Pendiente[];
  alterno: unknown;
  guardadaEn: string;
  guardadaPor: UsuarioAccion;
  permisos: PermisosOficial;
}

// ---- Declaraciones ----

export interface DatosVistaPrevia {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  numeroDocumento: string;
  tipoCargo: string;
  vinculo: string;
  /** AAAA-MM-DD. Sin fecha = hoy (lo decide el servidor). */
  fecha?: string;
}

export interface HojaDeclaracion {
  titulo: string;
  encabezado: string;
  puntos: PuntoDeclaracion[];
  lugarFecha: string;
  firmaNombre: string;
  firmaDocumento: string;
}

export interface HojaRequisitosGuardada extends HojaDeclaracion {
  firmada: boolean;
  fechaFirma: string | null;
  adjunto: Adjunto | null;
  vigente: boolean;
}

export interface DeclaracionDesignante {
  titulo: string;
  organo: string;
  designaNombre: string;
  documento: string;
  texto: string;
  aceptada: boolean;
  firmaNombre: string | null;
  fechaFirma: string | null;
  adjunto: Adjunto | null;
  vigente: boolean;
}

// ---- Lo que se envía al guardar ----

export interface SolicitudDesignacion {
  tipoEmpresa: string;
  tipoCargo: string;
  dedicacion: string;
  persona: {
    nombres: string;
    apellidos: string;
    nacionalidad: string;
    tipoDocumento: string;
    numeroDocumento: string;
    fechaNacimiento: string;
    domicilio: string;
    telefono: string | null;
    correo: string;
  };
  cargo: { cargo: string; fechaIngreso: string; vinculo: string; direccionOficina: string };
  designacion: {
    designa: string;
    nombreOrgano: string;
    documentoTipo: string;
    documentoFecha: string;
    fechaDesignacion: string;
    adjuntoId: string;
    hojaVidaAdjuntoId: string | null;
    documentoVinculoAdjuntoId: string | null;
    esOficialOtraEmpresa: boolean;
    reemplazaOficialAnterior: boolean;
  };
  declaraciones: {
    requisitos: { puntos: string[]; firmaNombre: string | null; fechaFirma: string | null; adjuntoId: string | null };
    designante: { aceptada: boolean; firmaNombre: string | null; fechaFirma: string | null; adjuntoId: string | null };
  };
  /** Solo al corregir una designación (PUT). */
  motivo?: string;
}

export interface SolicitudComunicacion {
  fechaComunicacion: string;
  numeroSolicitud: string;
  resultado: string;
  fechaNotificacion: string | null;
  motivoNoProcedente: string | null;
  /** Se escriben una vez y no vuelven nunca; vacíos = se conservan los que había. */
  codigoEmpresa: string | null;
  codigoOficial: string | null;
  constanciaAdjuntoId: string | null;
}

export interface SolicitudComunicacionPendiente {
  fecha: string;
  numeroSolicitud: string | null;
  nota: string | null;
  constanciaAdjuntoId: string | null;
}

export interface SolicitudCambioDatos {
  telefono: string | null;
  correo: string | null;
  domicilio: string | null;
  cargo: string | null;
  direccionOficina: string | null;
  fechaCambio: string | null;
  motivo: string;
}

export interface CambioCampo {
  campo: string;
  etiqueta: string;
  antes: string | null;
  despues: string | null;
}

export interface RespuestaCambioDatos {
  cambios: CambioCampo[];
  pendiente: Pendiente;
  ficha: FichaOficial;
}

export interface SolicitudRemocion {
  motivo: string;
  razones: string;
  aprobadaPor: string | null;
  fechaDecision: string;
  actaAdjuntoId: string | null;
}

export interface PlazosRemocion {
  comunicarRemocion: Plazo;
  vacancia: Plazo;
  alternoMaximoMeses: number;
}

export interface RespuestaRemocion {
  designacionId: string;
  estadoEmpresa: string;
  remocion: RemocionFicha;
  pendiente: Pendiente;
  plazos: { comunicarRemocion: Plazo; vacancia: Plazo };
}

// ---- Historial ----

export interface EventoHistorial {
  id: string;
  tipo: string;
  titulo: string;
  etiqueta: EtiquetaOficial | null;
  detalle: string | null;
  motivo: string | null;
  cambios: CambioCampo[];
  usuario: UsuarioAccion;
  fechaHora: string;
}

export interface HistorialOficial {
  designacionId: string;
  nombreCompleto: string;
  eventos: EventoHistorial[];
  pendientesUif: Pendiente[];
  vigencia: { estado: string; estadoEtiqueta: string; enElCargoDesde: string | null; revisionSugerida: string | null };
}

/** Ámbitos de adjunto del contrato: el servidor rechaza un archivo subido para un ámbito distinto del campo que lo usa. */
export const AMBITO_ADJUNTO = {
  ACTA_DESIGNACION: 'ACTA_DESIGNACION',
  DJ_REQUISITOS_FIRMADA: 'DJ_REQUISITOS_FIRMADA',
  DJ_DESIGNANTE_FIRMADA: 'DJ_DESIGNANTE_FIRMADA',
  CONSTANCIA_UIF: 'CONSTANCIA_UIF',
  ACTA_REMOCION: 'ACTA_REMOCION',
  CONSTANCIA_COMUNICACION: 'CONSTANCIA_COMUNICACION',
} as const;

/** Archivo descargado del servidor (adjunto o PDF). */
export interface ArchivoDescargado {
  archivo: Blob;
  nombre: string;
}

// ============================================================
// SERVICIO
// ============================================================

const BASE = '/oficial-cumplimiento';

/** Nombre de archivo de un Content-Disposition (`attachment; filename="x.pdf"`); respaldo si no viene. */
function nombreDeCabecera(cabecera: string | undefined, respaldo: string): string {
  const m = cabecera ? /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cabecera) : null;
  if (!m) return respaldo;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

async function descargar(ruta: string, respaldo: string, metodo: 'get' | 'post' = 'get', cuerpo?: unknown): Promise<ArchivoDescargado> {
  const config = { responseType: 'blob' as const, headers: { Accept: 'application/pdf, application/octet-stream, */*' } };
  const respuesta = metodo === 'post' ? await apiClient.post<Blob>(ruta, cuerpo, config) : await apiClient.get<Blob>(ruta, config);
  return { archivo: respuesta.data, nombre: nombreDeCabecera(respuesta.headers['content-disposition'] as string | undefined, respaldo) };
}

export const oficialService = {
  async catalogos(): Promise<CatalogosOficial> {
    const { data } = await apiClient.get<CatalogosOficial>(`${BASE}/catalogos`);
    return data;
  },

  async estado(): Promise<EstadoOficial> {
    const { data } = await apiClient.get<EstadoOficial>(`${BASE}/estado`);
    return data;
  },

  /** Plazo en vivo (se recalcula al cambiar la fecha). `desde` en AAAA-MM-DD. */
  async plazo(regla: string, desde: string): Promise<Plazo> {
    const { data } = await apiClient.get<Plazo>(`${BASE}/plazos`, { params: { regla, desde } });
    return data;
  },

  async plazosRemocion(fechaDecision: string): Promise<PlazosRemocion> {
    const { data } = await apiClient.get<PlazosRemocion>(`${BASE}/plazos/remocion`, { params: { fechaDecision } });
    return data;
  },

  // ---- Adjuntos ----

  async subirAdjunto(ambito: string, archivo: File): Promise<Adjunto> {
    const formulario = new FormData();
    formulario.append('ambito', ambito);
    formulario.append('archivo', archivo);
    const { data } = await apiClient.post<Adjunto>(`${BASE}/adjuntos`, formulario);
    return data;
  },

  async borrarAdjunto(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/adjuntos/${encodeURIComponent(id)}`);
  },

  descargarAdjunto(adjunto: Pick<Adjunto, 'id' | 'nombre'>): Promise<ArchivoDescargado> {
    return descargar(`${BASE}/adjuntos/${encodeURIComponent(adjunto.id)}`, adjunto.nombre);
  },

  // ---- Declaraciones ----

  /** La vista previa (y su PDF) es parte del asistente: solo administradores; otro rol recibe 403 `OC_SIN_PERMISO`. */
  async vistaPrevia(datos: DatosVistaPrevia): Promise<HojaDeclaracion> {
    const { data } = await apiClient.post<HojaDeclaracion>(`${BASE}/declaraciones/vista-previa`, datos);
    return data;
  },

  vistaPreviaPdf(datos: DatosVistaPrevia): Promise<ArchivoDescargado> {
    return descargar(`${BASE}/declaraciones/vista-previa/pdf`, 'declaracion-jurada-requisitos.pdf', 'post', datos);
  },

  async declaracionRequisitos(id: string): Promise<HojaRequisitosGuardada> {
    const { data } = await apiClient.get<HojaRequisitosGuardada>(`${BASE}/designaciones/${encodeURIComponent(id)}/declaraciones/requisitos`);
    return data;
  },

  declaracionRequisitosPdf(id: string): Promise<ArchivoDescargado> {
    return descargar(`${BASE}/designaciones/${encodeURIComponent(id)}/declaraciones/requisitos/pdf`, 'declaracion-jurada-requisitos.pdf');
  },

  async declaracionDesignante(id: string): Promise<DeclaracionDesignante> {
    const { data } = await apiClient.get<DeclaracionDesignante>(`${BASE}/designaciones/${encodeURIComponent(id)}/declaraciones/designante`);
    return data;
  },

  // ---- Designación ----

  async designar(solicitud: SolicitudDesignacion): Promise<FichaOficial> {
    const { data } = await apiClient.post<FichaOficial>(`${BASE}/designaciones`, solicitud);
    return data;
  },

  async corregir(id: string, solicitud: SolicitudDesignacion): Promise<FichaOficial> {
    const { data } = await apiClient.put<FichaOficial>(`${BASE}/designaciones/${encodeURIComponent(id)}`, solicitud);
    return data;
  },

  async designaciones(): Promise<ResumenDesignacion[]> {
    const { data } = await apiClient.get<ResumenDesignacion[]>(`${BASE}/designaciones`);
    return data;
  },

  async ficha(id: string): Promise<FichaOficial> {
    const { data } = await apiClient.get<FichaOficial>(`${BASE}/designaciones/${encodeURIComponent(id)}`);
    return data;
  },

  // ---- Comunicación a la UIF ----

  async comunicar(id: string, solicitud: SolicitudComunicacion): Promise<FichaOficial> {
    const { data } = await apiClient.post<FichaOficial>(`${BASE}/designaciones/${encodeURIComponent(id)}/comunicacion`, solicitud);
    return data;
  },

  async pendientes(todos = false): Promise<Pendiente[]> {
    const { data } = await apiClient.get<Pendiente[]>(`${BASE}/pendientes`, { params: { todos } });
    return data;
  },

  async registrarComunicacionPendiente(id: string, solicitud: SolicitudComunicacionPendiente): Promise<Pendiente> {
    const { data } = await apiClient.post<Pendiente>(`${BASE}/pendientes/${encodeURIComponent(id)}/comunicacion`, solicitud);
    return data;
  },

  // ---- Cambio de datos, remoción e historial ----

  async cambiarDatos(id: string, solicitud: SolicitudCambioDatos): Promise<RespuestaCambioDatos> {
    const { data } = await apiClient.patch<RespuestaCambioDatos>(`${BASE}/designaciones/${encodeURIComponent(id)}/datos`, solicitud);
    return data;
  },

  async remover(id: string, solicitud: SolicitudRemocion): Promise<RespuestaRemocion> {
    const { data } = await apiClient.post<RespuestaRemocion>(`${BASE}/designaciones/${encodeURIComponent(id)}/remocion`, solicitud);
    return data;
  },

  async historial(id: string): Promise<HistorialOficial> {
    const { data } = await apiClient.get<HistorialOficial>(`${BASE}/designaciones/${encodeURIComponent(id)}/historial`);
    return data;
  },
};

// ============================================================
// ERRORES (el servidor nunca repite documento, correo, teléfono ni códigos en sus mensajes)
// ============================================================

interface CuerpoErrorOficial {
  message?: string;
  code?: string;
  campos?: Record<string, string>;
}

function cuerpo(error: unknown): CuerpoErrorOficial | undefined {
  return isAxiosError(error) ? (error.response?.data as CuerpoErrorOficial | undefined) : undefined;
}

/** Errores por campo (`campos` del 400 OC_DATOS_INVALIDOS): clave del contrato → mensaje. */
export function camposDeError(error: unknown): Record<string, string> | null {
  const campos = cuerpo(error)?.campos;
  return campos && typeof campos === 'object' && Object.keys(campos).length > 0 ? campos : null;
}

/** Código de error del módulo (`OC_…`) o de licencias (`LICENCIA_…`), si el servidor lo mandó. */
export function codigoDeError(error: unknown): string | null {
  const code = cuerpo(error)?.code;
  return typeof code === 'string' ? code : null;
}

export function estadoHttp(error: unknown): number | null {
  return isAxiosError(error) ? error.response?.status ?? null : null;
}

/** 404: no existe o es de otra empresa. */
export const esNoEncontrado = (error: unknown): boolean => estadoHttp(error) === 404;

/** 403 del módulo: el rol no puede hacer esa acción. */
export const esSinPermiso = (error: unknown): boolean => codigoDeError(error) === 'OC_SIN_PERMISO';

/** 409: ya hay un titular pendiente, en evaluación o vigente. */
export const esTitularActivo = (error: unknown): boolean => codigoDeError(error) === 'OC_TITULAR_ACTIVO';

/** 409: el servidor no tiene clave para cifrar los códigos secretos. */
export const esCifradoNoConfigurado = (error: unknown): boolean => codigoDeError(error) === 'OC_CIFRADO_NO_CONFIGURADO';

/** Sin conexión con el servidor (no hubo respuesta). */
export const sinRespuesta = (error: unknown): boolean => isAxiosError(error) && !error.response;
