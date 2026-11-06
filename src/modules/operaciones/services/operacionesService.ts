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
}

export interface FiltrosOperaciones {
  q?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
  tipoOperacion?: string;
  modalidadPago?: string;
  moneda?: string;
  responsableId?: number;
  sinResponsable?: boolean;
}

/** Opción de un catálogo que sirve el backend (el front manda el `codigo`). */
export interface OpcionCodigo {
  codigo: string;
  nombre: string;
  pideTexto: boolean;
  sector?: string;
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
  tipo: 'CREACION' | 'EDICION' | 'RESPONSABLE' | 'DESCARGA' | 'ANTERIOR' | string;
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

export const TAMANO_PAGINA = 10;

// ============================================================
// SERVICIO
// ============================================================

/** Quita los filtros vacíos para no mandar parámetros sin valor. */
function limpiar(parametros: object): Record<string, unknown> {
  return Object.fromEntries(Object.entries(parametros).filter(([, valor]) => valor !== undefined && valor !== '' && valor !== false));
}

export const operacionesService = {
  async catalogos(): Promise<CatalogosOperacion> {
    const { data } = await apiClient.get<CatalogosOperacion>('/operaciones/catalogos');
    return data;
  },

  async provincias(idDepartamento: number): Promise<ProvinciaOpcion[]> {
    const { data } = await apiClient.get<ProvinciaOpcion[]>('/operaciones/catalogos/provincias', { params: { idDepartamento } });
    return data;
  },

  async resumen(filtros: FiltrosOperaciones, page: number, size = TAMANO_PAGINA): Promise<PaginaOperaciones> {
    const { data } = await apiClient.get<PaginaOperaciones>('/operaciones/resumen', { params: { ...limpiar(filtros), page, size } });
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
