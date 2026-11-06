import { isAxiosError } from 'axios';
import { apiClient } from '@/shared/api/apiClient';
import { conConsumo } from '@/modules/licencias/lib/consumo';

// ============================================================
// TIPOS (reflejan CONTRATO-OPERACIONES.md, entrega A)
// ============================================================

export interface ResponsableOperacion {
  id: number;
  nombreCompleto: string;
}

export interface OperacionItem {
  id: number;
  numeroRegistro: string | null;
  personaFisica: string | null;
  /** Persona representada (razón social si es jurídica). */
  personaNombre: string | null;
  oficina: string | null;
  /** Fecha de registro. */
  fecha: string | null;
  creadoEn: string | null;
  fechaOperacion: string | null;
  tipoOperacion: string | null;
  tipoOperacionNombre: string | null;
  modalidadPago: string | null;
  modalidadPagoNombre: string | null;
  monto: number | null;
  moneda: string | null;
  monedaCodigo: string | null;
  monedaSimbolo: string | null;
  estado: string;
  responsable: ResponsableOperacion | null;
  /** Entrega B: envío a la UIF, calificación de inusualidad, monto en US$ y resultado del umbral (o `null` si no se calculó). */
  estadoEnvio?: EstadoEnvio;
  inusualidad?: EstadoInusualidad;
  montoUsd?: number | null;
  umbralEstado?: EstadoUmbral | null;
}

export interface PaginaOperaciones {
  content: OperacionItem[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  size: number;
}

export interface Indicadores {
  periodo: string;
  registrosDelPeriodo: number;
  pendientesDeEnvio: number;
  sinResponsable: number;
  total: number;
  /** Entrega B. */
  enviados?: number;
  inusualesEnAnalisis?: number;
  sospechosas?: number;
}

export interface FiltrosOperaciones {
  q?: string;
  /** Uno o varios (PENDIENTE, ENVIADO, INUSUAL): con varios cuenta cualquiera de ellos. */
  estado?: string | string[];
  desde?: string;
  hasta?: string;
  tipoOperacion?: string;
  modalidadPago?: string;
  moneda?: string;
  responsableId?: number;
  sinResponsable?: boolean;
  /** Entrega B. */
  oficina?: string;
  montoMinUsd?: number;
  montoMaxUsd?: number;
}

/** Opción de un catálogo que sirve el backend (el front manda el `codigo`). */
export interface OpcionCodigo {
  codigo: string;
  nombre: string;
  pideTexto: boolean;
  sector?: string;
  /** Tipos de operación (entrega B): `LOTE_TERRENO` o `UNIDAD_INMOBILIARIA`. */
  tipoBien?: string;
  /** Formatos de exportación (entrega B): `false` = «Pronto» (todavía no tiene estructura). */
  disponible?: boolean;
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

export interface ProvinciaOpcion {
  id: number;
  nombre: string;
}

export interface CatalogosOperacion {
  monedas: MonedaOpcion[];
  ocupaciones: CatalogoOpcion[];
  departamentos: DepartamentoOpcion[];
  paises: CatalogoOpcion[];
  tiposDocumentoOperacion: OpcionCodigo[];
  estadosCiviles: OpcionCodigo[];
  modalidadesPago: OpcionCodigo[];
  origenesFondos: OpcionCodigo[];
  tiposOperacion: OpcionCodigo[];
  tipoDocumentoInicial: string;
  /** Entrega B (el servicio las deja siempre presentes, vacías si el servidor aún no las manda). */
  sectores: OpcionCodigo[];
  senalesAlerta: OpcionCodigo[];
  fuentesSenal: OpcionCodigo[];
  formatosExportacion: OpcionCodigo[];
  /** Oficinas de la empresa (lista vacía = no configuró: la oficina sigue como texto libre). */
  oficinas: string[];
  tiposOperacionPorConfigurar: boolean;
}

/** Persona del detalle (los campos de jurídica o los opcionales pueden venir vacíos). */
export interface PersonaDetalle {
  tipoDocumento: string | null;
  tipoDocumentoNombre?: string | null;
  numeroDocumento: string | null;
  motivoSinDocumento: string | null;
  nombres: string | null;
  apellidos: string | null;
  fechaNacimiento: string | null;
  nacionalidad: string | null;
  telefono: string | null;
  ocupacion: string | null;
  estadoCivil: string | null;
  estadoCivilNombre?: string | null;
  domicilio: string | null;
  codigoPostal: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  tipoPersona: 'NATURAL' | 'JURIDICA';
  razonSocial: string | null;
  representanteLegal: string | null;
  representanteTipoDocumento: string | null;
  representanteTipoDocumentoNombre?: string | null;
  representanteNumeroDocumento: string | null;
  accionistasMayores25: string | null;
  domicilioFiscal: string | null;
}

export interface OperacionDetalleDatos {
  fechaOperacion: string;
  lugar: string | null;
  tipoOperacion: string | null;
  tipoOperacionNombre: string | null;
  modalidadPago: string | null;
  modalidadPagoNombre: string | null;
  modalidadPagoTexto: string | null;
  moneda: string | null;
  monedaCodigo: string | null;
  monedaSimbolo: string | null;
  monto: number;
  origenFondos: string | null;
  origenFondosNombre: string | null;
  origenFondosTexto: string | null;
  numeroComprobante: string | null;
  descripcion: string | null;
  cuenta1: string | null;
  cuenta2: string | null;
  cuenta3: string | null;
}

export interface BeneficiarioDetalle {
  nombre: string;
  tipoDocumento: string | null;
  tipoDocumentoNombre?: string | null;
  numeroDocumento: string | null;
  fechaNacimiento: string | null;
}

export interface CambioRegistro {
  campo: string;
  etiqueta: string;
  antes: string | null;
  despues: string | null;
}

export interface EventoHistorial {
  id: number | null;
  tipo: 'CREACION' | 'EDICION' | 'RESPONSABLE' | 'DESCARGA' | 'ANTERIOR' | 'ANALISIS' | 'UMBRAL' | 'ENVIO' | string;
  titulo: string;
  detalle: string | null;
  motivo: string | null;
  usuario: { usuario: string; nombreCompleto: string } | null;
  sistema: boolean;
  fecha: string;
  cambios: CambioRegistro[];
  codigoVerificacion: string | null;
}

export interface DetalleOperacion {
  id: number;
  numeroRegistro: string;
  estado: string;
  registro: {
    usuarioId: string;
    usuario: string;
    usuarioNombre: string | null;
    empresa: string;
    oficina: string;
    fechaRegistro: string;
    creadoEn: string | null;
  };
  personaFisica: PersonaDetalle;
  personaRepresentada: PersonaDetalle | null;
  operacion: OperacionDetalleDatos;
  beneficiarios: BeneficiarioDetalle[];
  responsable: ResponsableOperacion | null;
  conservarHasta: string;
  historialReciente: EventoHistorial[];
  /** Entrega B: umbral guardado con el registro (`null` en los anteriores), resumen del análisis y constancia de envío. */
  umbral?: VerificacionUmbral | null;
  inusualidad?: ResumenInusualidad | null;
  envio?: EnvioRegistro | null;
  estadoEnvio?: EstadoEnvio;
}

// ---- Lo que se envía al guardar (alta y edición) ----

export interface PersonaSolicitud {
  tipoPersona?: 'NATURAL' | 'JURIDICA';
  tipoDocumento: string;
  numeroDocumento: string;
  motivoSinDocumento: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  fechaNacimiento?: string | null;
  nacionalidad?: string | null;
  telefono?: string | null;
  ocupacion?: string | null;
  estadoCivil?: string | null;
  domicilio?: string | null;
  codigoPostal?: string | null;
  departamento?: string | null;
  provincia?: string | null;
  distrito?: string | null;
  razonSocial?: string | null;
  representanteLegal?: string | null;
  representanteTipoDocumento?: string | null;
  representanteNumeroDocumento?: string | null;
  accionistasMayores25?: string | null;
  domicilioFiscal?: string | null;
}

export interface SolicitudOperacion {
  registro: { oficina: string };
  personaFisica: PersonaSolicitud;
  personaRepresentada: PersonaSolicitud | null;
  operacion: {
    fechaOperacion: string;
    lugar: string | null;
    tipoOperacion: string;
    modalidadPago: string;
    modalidadPagoTexto: string | null;
    moneda: string;
    monto: number;
    origenFondos: string;
    origenFondosTexto: string | null;
    numeroComprobante: string | null;
    descripcion: string | null;
    cuenta1: string | null;
    cuenta2: string | null;
    cuenta3: string | null;
  };
  beneficiarios: { nombre: string; tipoDocumento: string; numeroDocumento: string; fechaNacimiento: string | null }[];
  /** Solo al editar. */
  motivo?: string;
}

export interface RegistroGuardado {
  id: number;
  numeroRegistro: string;
  fechaRegistro: string;
  creadoEn: string;
  estado: string;
  responsable: ResponsableOperacion | null;
  mensaje: string;
  /** Entrega B: verificación de umbral hecha al guardar. */
  umbral?: VerificacionUmbral | null;
}

export interface RegistroEditado {
  id: number;
  numeroRegistro: string;
  mensaje: string;
  cambios: CambioRegistro[];
}

export interface HistorialRegistro {
  id: number;
  numeroRegistro: string;
  fechaOperacion: string;
  conservarHasta: string;
  eventos: EventoHistorial[];
}

export type TipoHistorial = 'TODO' | 'EDICION' | 'RESPONSABLE' | 'DESCARGA' | 'ANALISIS';

export interface OpcionResponsable {
  id: number;
  nombreCompleto: string;
  actual: boolean;
}

export interface UsuarioEmpresa {
  id: number;
  usuario: string;
  nombreCompleto: string;
  empresa: string;
  activo: boolean;
}

/** El PDF que llegó del servidor: el mismo archivo se muestra y se descarga (cada pedido cobra tokens). */
export interface ArchivoPdf {
  archivo: Blob;
  paginas: number;
  codigoVerificacion: string | null;
  huella: string | null;
}

/** Filas por página de la lista: el diseño (RO 1) dice «Mostrando 1–8 de 10 registros», o sea 8 por página. */
export const TAMANO_PAGINA = 8;

// ============================================================
// SERVICIO
// ============================================================

/** Quita los filtros vacíos para no mandar parámetros sin valor. */
function limpiar(parametros: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(parametros).filter(([, valor]) => valor !== undefined && valor !== '' && valor !== false && !(Array.isArray(valor) && valor.length === 0)));
}

export const operacionesService = {
  async catalogos(): Promise<CatalogosOperacion> {
    const { data } = await apiClient.get<CatalogosOperacion>('/operaciones/catalogos');
    // Las claves de la entrega B se dejan siempre presentes (vacías si el servidor aún no las manda).
    return {
      ...data,
      sectores: data.sectores ?? [],
      senalesAlerta: data.senalesAlerta ?? [],
      fuentesSenal: data.fuentesSenal ?? [],
      formatosExportacion: data.formatosExportacion ?? [],
      oficinas: data.oficinas ?? [],
      tiposOperacionPorConfigurar: data.tiposOperacionPorConfigurar ?? false,
    };
  },

  async provincias(idDepartamento: number): Promise<ProvinciaOpcion[]> {
    const { data } = await apiClient.get<ProvinciaOpcion[]>('/operaciones/catalogos/provincias', { params: { idDepartamento } });
    return data;
  },

  async resumen(filtros: FiltrosOperaciones, page: number, size = TAMANO_PAGINA): Promise<PaginaOperaciones> {
    // `indexes: null`: un parámetro repetido viaja como «estado=A&estado=B» (sin corchetes), que es lo que lee el servidor.
    const { data } = await apiClient.get<PaginaOperaciones>('/operaciones/resumen', { params: { ...limpiar(filtros), page, size }, paramsSerializer: { indexes: null } });
    return data;
  },

  async indicadores(): Promise<Indicadores> {
    const { data } = await apiClient.get<Indicadores>('/operaciones/indicadores');
    return data;
  },

  async detalle(id: number): Promise<DetalleOperacion> {
    const { data } = await apiClient.get<DetalleOperacion>(`/operaciones/${id}`);
    return data;
  },

  async registrar(solicitud: SolicitudOperacion): Promise<RegistroGuardado> {
    // Registrar una operación descuenta tokens según la tarifa de Sulotec.
    return conConsumo(async () => {
      const { data } = await apiClient.post<RegistroGuardado>('/operaciones/insertar-operacion', solicitud);
      return data;
    });
  },

  async actualizar(id: number, solicitud: SolicitudOperacion): Promise<RegistroEditado> {
    const { data } = await apiClient.put<RegistroEditado>(`/operaciones/${id}`, solicitud);
    return data;
  },

  async historial(id: number, tipo: TipoHistorial): Promise<HistorialRegistro> {
    const { data } = await apiClient.get<HistorialRegistro>(`/operaciones/${id}/historial`, { params: { tipo } });
    return data;
  },

  async responsables(id: number): Promise<OpcionResponsable[]> {
    const { data } = await apiClient.get<OpcionResponsable[]>(`/operaciones/${id}/responsables`);
    return data;
  },

  async cambiarResponsable(id: number, usuarioId: number): Promise<{ id: number; responsable: ResponsableOperacion }> {
    const { data } = await apiClient.put<{ id: number; responsable: ResponsableOperacion }>(`/operaciones/${id}/responsable`, { usuarioId });
    return data;
  },

  async usuariosActivos(): Promise<UsuarioEmpresa[]> {
    const { data } = await apiClient.get<UsuarioEmpresa[]>('/operaciones/usuarios-por-empresa', { params: { soloActivos: true } });
    return data;
  },

  async pdf(id: number): Promise<ArchivoPdf> {
    // El PDF de una operación descuenta tokens según la tarifa de Sulotec.
    return conConsumo(async () => {
      const respuesta = await apiClient.get<Blob>(`/operaciones/${id}/exportar-pdf`, { responseType: 'blob', headers: { Accept: 'application/pdf' } });
      const cabecera = (nombre: string) => (respuesta.headers[nombre] as string | undefined) ?? null;
      return {
        archivo: respuesta.data,
        paginas: Number(cabecera('x-paginas')) || 1,
        codigoVerificacion: cabecera('x-codigo-verificacion'),
        huella: cabecera('x-huella-sha256'),
      };
    });
  },

  // ---- Entrega B (CONTRATO-OPERACIONES-B.md): ninguna de estas rutas cobra tokens ----

  async configuracion(): Promise<Configuracion> {
    const { data } = await apiClient.get<Configuracion>('/operaciones/configuracion');
    return { ...data, umbralesNorma: data.umbralesNorma ?? [], oficinas: data.oficinas ?? [] };
  },

  async guardarConfiguracion(solicitud: SolicitudConfiguracion): Promise<Configuracion> {
    const { data } = await apiClient.put<Configuracion>('/operaciones/configuracion', solicitud);
    return { ...data, umbralesNorma: data.umbralesNorma ?? [], oficinas: data.oficinas ?? [] };
  },

  async tiposCambio(anio: number): Promise<TiposCambio> {
    const { data } = await apiClient.get<TiposCambio>('/operaciones/tipos-cambio', { params: { anio } });
    return { ...data, monedas: data.monedas ?? [], valores: data.valores ?? [] };
  },

  async guardarTipoCambio(solicitud: SolicitudTipoCambio): Promise<ValorTipoCambio> {
    const { data } = await apiClient.put<ValorTipoCambio>('/operaciones/tipos-cambio', solicitud);
    return data;
  },

  /** No cobra, no guarda nada y nunca bloquea el registro: es solo informativa. */
  async verificarUmbral(solicitud: SolicitudUmbral): Promise<VerificacionUmbral> {
    const { data } = await apiClient.post<VerificacionUmbral>('/operaciones/verificar-umbral', solicitud);
    return data;
  },

  async inusualidad(id: number): Promise<Inusualidad> {
    const { data } = await apiClient.get<Inusualidad>(`/operaciones/${id}/inusualidad`);
    return { ...data, adjuntos: data.adjuntos ?? [] };
  },

  async guardarInusualidad(id: number, solicitud: SolicitudInusualidad): Promise<Inusualidad> {
    const { data } = await apiClient.put<Inusualidad>(`/operaciones/${id}/inusualidad`, solicitud);
    return { ...data, adjuntos: data.adjuntos ?? [] };
  },

  async subirAdjunto(id: number, archivo: File): Promise<AdjuntoAnalisis> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    const { data } = await apiClient.post<AdjuntoAnalisis>(`/operaciones/${id}/inusualidad/adjuntos`, formulario);
    return data;
  },

  async descargarAdjunto(id: number, adjuntoId: number): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/operaciones/${id}/inusualidad/adjuntos/${adjuntoId}`, { responseType: 'blob' });
    return data;
  },

  async calificar(id: number, decision: DecisionInusualidad): Promise<Inusualidad> {
    const { data } = await apiClient.post<Inusualidad>(`/operaciones/${id}/inusualidad/decision`, { decision });
    return { ...data, adjuntos: data.adjuntos ?? [] };
  },

  async ros(id: number): Promise<Ros> {
    const { data } = await apiClient.get<Ros>(`/operaciones/${id}/ros`);
    return { ...data, datosMinimos: data.datosMinimos ?? [] };
  },

  async guardarRos(id: number, solicitud: SolicitudRos): Promise<Ros> {
    const { data } = await apiClient.put<Ros>(`/operaciones/${id}/ros`, solicitud);
    return { ...data, datosMinimos: data.datosMinimos ?? [] };
  },

  async validarExportacion(periodo: string, formato: string): Promise<ValidacionExportacion> {
    const { data } = await apiClient.get<ValidacionExportacion>('/operaciones/exportaciones/validacion', { params: { periodo, formato } });
    return { ...data, chequeos: data.chequeos ?? [], observaciones: data.observaciones ?? [] };
  },

  async generarExportacion(periodo: string, formato: string): Promise<Exportacion> {
    const { data } = await apiClient.post<Exportacion>('/operaciones/exportaciones', { periodo, formato });
    return data;
  },

  async exportaciones(page: number, size = 10): Promise<PaginaExportaciones> {
    const { data } = await apiClient.get<PaginaExportaciones>('/operaciones/exportaciones', { params: { page, size } });
    return data;
  },

  async exportacion(id: number): Promise<Exportacion> {
    const { data } = await apiClient.get<Exportacion>(`/operaciones/exportaciones/${id}`);
    return data;
  },

  async archivoExportacion(id: number, tipo: 'xlsx' | 'csv'): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/operaciones/exportaciones/${id}/archivo`, { params: { tipo }, responseType: 'blob' });
    return data;
  },

  async registrarConstancia(id: number, constancia: { fechaEnvio: string; numeroAcuse: string; notas: string; archivo: File | null }): Promise<RespuestaConstancia> {
    const formulario = new FormData();
    formulario.append('fechaEnvio', constancia.fechaEnvio);
    formulario.append('numeroAcuse', constancia.numeroAcuse);
    if (constancia.notas.trim()) formulario.append('notas', constancia.notas.trim());
    if (constancia.archivo) formulario.append('archivo', constancia.archivo);
    const { data } = await apiClient.post<RespuestaConstancia>(`/operaciones/exportaciones/${id}/constancia`, formulario);
    return data;
  },

  async archivoConstancia(id: number): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(`/operaciones/exportaciones/${id}/constancia/archivo`, { responseType: 'blob' });
    return data;
  },
};

/** Errores por campo (`campos` del 400 OPERACIONES_DATOS_INVALIDOS): clave del contrato → mensaje. */
export function camposDeError(error: unknown): Record<string, string> | null {
  if (!isAxiosError(error)) return null;
  const campos = (error.response?.data as { campos?: Record<string, string> } | undefined)?.campos;
  return campos && Object.keys(campos).length > 0 ? campos : null;
}

/** 404 OPERACIONES_NO_ENCONTRADA (no existe o es de otra empresa). */
export function esNoEncontrada(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

/** `code` del error que manda el servidor (por ejemplo `OPERACIONES_ANALISIS_CERRADO`), o `null`. */
export function codigoDeError(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const code = (error.response?.data as { code?: unknown } | undefined)?.code;
  return typeof code === 'string' ? code : null;
}

/** El servidor dice que un administrador es quien puede hacer esto (403 OPERACIONES_SOLO_ADMINISTRADOR). */
export const esSoloAdministrador = (error: unknown): boolean => codigoDeError(error) === 'OPERACIONES_SOLO_ADMINISTRADOR';

/** Estado de inusualidad del detalle: llega como texto (o como objeto con `estado`); lo desconocido cuenta como «sin análisis». */
export function estadoInusualidadDe(valor: unknown): EstadoInusualidad {
  const estado = typeof valor === 'string' ? valor : (valor as { estado?: unknown } | null | undefined)?.estado;
  return estado === 'EN_ANALISIS' || estado === 'DESCARTADA' || estado === 'SOSPECHOSA' ? estado : 'SIN_ANALISIS';
}

// ============================================================
// ENTREGA B: TIPOS (reflejan CONTRATO-OPERACIONES-B.md)
// ============================================================

export type EstadoEnvio = 'PENDIENTE' | 'ENVIADO';
export type EstadoInusualidad = 'SIN_ANALISIS' | 'EN_ANALISIS' | 'DESCARTADA' | 'SOSPECHOSA';
export type EstadoUmbral = 'SIN_MONTO' | 'SIN_CONFIGURAR' | 'SIN_TIPO_DE_BIEN' | 'SIN_TIPO_DE_CAMBIO' | 'SI_SE_REGISTRA' | 'NO_ALCANZA_UMBRAL';

/** Constancia de envío a la UIF que lleva un registro (`null` mientras esté pendiente). */
export interface EnvioRegistro {
  exportacionId: number;
  fechaEnvio: string;
  /** El servidor puede no traerlo (constancias sin acuse). */
  numeroAcuse: string | null;
}

/** Resumen del análisis de inusualidad que trae el detalle del registro (`null` mientras no haya análisis). */
export interface ResumenInusualidad {
  estado: EstadoInusualidad;
  senalNombre: string | null;
  fechaDeteccion: string | null;
  calificadaEn: string | null;
  venceEn: string | null;
  numeroRos: string | null;
}

/** Verificación de umbral (RO 2, 3, 4, 5): el servidor decide el estado y escribe el mensaje. Los campos que no aplican llegan `null`. */
export interface VerificacionUmbral {
  estado: EstadoUmbral;
  mensaje: string;
  sector: string | null;
  sectorNombre: string | null;
  tipoBien: string | null;
  tipoBienNombre: string | null;
  umbralUsd: number | null;
  umbralNormaUsd: number | null;
  umbralInterno: boolean | null;
  montoUsd: number | null;
  /** `usd` = soles por 1 dólar; `moneda` = soles por 1 unidad de la moneda (solo euros). */
  tipoCambio: { mes: string; usd: number; moneda: number | null } | null;
  tipoCambioNota: string | null;
}

export interface SolicitudUmbral {
  tipoOperacion: string | null;
  moneda: string | null;
  monto: number | null;
  fechaOperacion: string | null;
}

export interface UmbralNorma {
  tipoBien: string;
  nombre: string;
  umbralUsd: number;
}

export interface UmbralInterno {
  montoUsd: number;
  motivo: string;
}

/** RO 16 · Sector, umbrales y oficinas de la empresa. */
export interface Configuracion {
  empresa: string;
  sector: string | null;
  sectorNombre: string | null;
  porConfigurar: boolean;
  unRoPorActividad: boolean;
  umbralesNorma: UmbralNorma[];
  notaUmbral: string | null;
  umbralInterno: UmbralInterno | null;
  oficinas: string[];
  actualizadoEn: string | null;
  actualizadoPor: string | null;
  puedeEditar: boolean;
}

export interface SolicitudConfiguracion {
  sector: string | null;
  unRoPorActividad: boolean;
  umbralInterno: UmbralInterno | null;
  oficinas: string[];
}

export interface ValorTipoCambio {
  moneda: string;
  mes: string;
  valor: number;
  ambito: 'EMPRESA' | 'SULOTEC' | string;
  fuente: string | null;
  cargadoPor: string | null;
  cargadoEn: string | null;
}

export interface TiposCambio {
  anio: number;
  monedas: string[];
  puedeEditar: boolean;
  valores: ValorTipoCambio[];
}

export interface SolicitudTipoCambio {
  moneda: string;
  mes: string;
  valor: number;
  fuente: string | null;
}

export interface AdjuntoAnalisis {
  id: number;
  nombre: string;
  tipo: string;
  tamano: number;
  subidoEn: string;
  subidoPor: string | null;
}

export type DecisionInusualidad = 'NO_SOSPECHOSA' | 'SOSPECHOSA';

/** RO 12 · Análisis de inusualidad de un registro. Sin análisis: `estado: SIN_ANALISIS` y lo demás vacío. */
export interface Inusualidad {
  id: number;
  numeroRegistro: string;
  estado: EstadoInusualidad;
  senal: string | null;
  senalNombre: string | null;
  senalTexto: string | null;
  fuente: string | null;
  fuenteNombre: string | null;
  fechaDeteccion: string | null;
  descripcionSenal: string | null;
  descripcionOperacion: string | null;
  analisis: string | null;
  decision: string | null;
  calificadaEn: string | null;
  calificadaPor: string | null;
  venceEn: string | null;
  adjuntos: AdjuntoAnalisis[];
  datosOperacion: {
    fechaOperacion: string;
    tipoOperacion: string;
    monto: number;
    moneda: string;
    modalidadPago: string;
    origenFondos: string;
    numeroComprobante: string | null;
    participantes: number;
  };
  actualizadoEn: string | null;
  actualizadoPor: string | null;
  puedeCalificar: boolean;
}

export interface SolicitudInusualidad {
  senal: string;
  senalTexto: string | null;
  fuente: string;
  fechaDeteccion: string;
  descripcionSenal: string | null;
  descripcionOperacion: string | null;
  analisis: string | null;
}

export type EstadoPlazo = 'EN_PLAZO' | 'VENCIDO' | 'CERRADO';

/** RO 13 · Preparar el ROS (solo registros calificados como sospechosos). */
export interface Ros {
  id: number;
  numeroRegistro: string;
  calificadaEn: string;
  calificadaPor: string | null;
  venceEn: string;
  restanteSegundos: number;
  estadoPlazo: EstadoPlazo;
  datosMinimos: { codigo: string; nombre: string; completo: boolean }[];
  datosListos: boolean;
  numeroRos: string | null;
  enviadoEn: string | null;
  registradoEn: string | null;
  registradoPor: string | null;
  enviadoFueraDePlazo: boolean | null;
  puedeRegistrar: boolean;
}

export interface SolicitudRos {
  numeroRos: string;
  enviadoEn: string;
}

/** RO 14 · Lo que se revisa antes de generar el archivo (sobre los registros pendientes del periodo). */
export interface ValidacionExportacion {
  periodo: string;
  formato: string;
  formatoNombre: string;
  formatoDisponible: boolean;
  registros: number;
  pendientes: number;
  enviados: number;
  chequeos: { codigo: string; texto: string; ok: boolean }[];
  observaciones: { idRegistro: number; numeroRegistro: string; texto: string }[];
  puedeGenerar: boolean;
}

export interface ConstanciaEnvio {
  fechaEnvio: string;
  numeroAcuse: string;
  notas: string | null;
  archivo: string | null;
  registradoEn: string;
  registradoPor: string | null;
}

/** RO 15 · Archivo generado. El archivo es la foto de lo que se generó: si luego se edita un registro, no cambia. */
export interface Exportacion {
  id: number;
  periodo: string;
  formato: string;
  formatoNombre: string;
  registros: number;
  generadoEn: string;
  generadoPor: string | null;
  archivoXlsx: string;
  archivoCsv: string;
  estado: 'GENERADO' | 'ENVIADO';
  constancia: ConstanciaEnvio | null;
  puedeRegistrarConstancia: boolean;
}

export interface PaginaExportaciones {
  content: Exportacion[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
  size: number;
}

export interface RespuestaConstancia {
  id: number;
  enviados: number;
  constancia: ConstanciaEnvio;
}
