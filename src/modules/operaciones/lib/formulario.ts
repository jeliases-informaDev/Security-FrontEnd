// Formulario de Registro de Operaciones (RO 2, RO 3 y RO 6): forma de los datos, validación, armado de lo que se envía
// y comparación para «Cambios detectados». Las opciones de los desplegables llegan del backend (`/catalogos`).

import { z } from 'zod';
import type { CatalogosOperacion, DetalleOperacion, OpcionCodigo, PersonaDetalle, PersonaSolicitud, SolicitudOperacion } from '../services/operacionesService';
import { decimalesDe, fechaCorta, montoANumero, montoTexto } from './formato';

const texto = z.string();

const PERSONA = z.object({
  tipoDocumento: texto,
  numeroDocumento: texto,
  motivoSinDocumento: texto,
  fechaNacimiento: texto,
  nombres: texto,
  apellidos: texto,
  nacionalidad: texto,
  telefono: texto,
  ocupacion: texto,
  estadoCivil: texto,
  domicilio: texto,
  codigoPostal: texto,
  departamento: texto,
  provincia: texto,
  distrito: texto,
  razonSocial: texto,
  representanteLegal: texto,
  representanteTipoDocumento: texto,
  representanteNumeroDocumento: texto,
  accionistasMayores25: texto,
  domicilioFiscal: texto,
});

const FORMA = z.object({
  registro: z.object({ oficina: texto }),
  personaFisica: PERSONA,
  conRepresentada: z.boolean(),
  personaRepresentada: PERSONA,
  operacion: z.object({
    fechaOperacion: texto,
    lugar: texto,
    tipoOperacion: texto,
    modalidadPago: texto,
    modalidadPagoTexto: texto,
    moneda: texto,
    monto: texto,
    origenFondos: texto,
    origenFondosTexto: texto,
    numeroComprobante: texto,
    cuenta1: texto,
    cuenta2: texto,
    cuenta3: texto,
    descripcion: texto,
  }),
  beneficiarios: z.array(z.object({ nombre: texto, tipoDocumento: texto, numeroDocumento: texto, fechaNacimiento: texto })),
  motivo: texto,
});

export type FormValues = z.infer<typeof FORMA>;
export type PersonaForm = z.infer<typeof PERSONA>;
export type BeneficiarioForm = FormValues['beneficiarios'][number];

const PERSONA_VACIA: PersonaForm = {
  tipoDocumento: '', numeroDocumento: '', motivoSinDocumento: '', fechaNacimiento: '', nombres: '', apellidos: '', nacionalidad: '', telefono: '',
  ocupacion: '', estadoCivil: '', domicilio: '', codigoPostal: '', departamento: '', provincia: '', distrito: '', razonSocial: '',
  representanteLegal: '', representanteTipoDocumento: '', representanteNumeroDocumento: '', accionistasMayores25: '', domicilioFiscal: '',
};

export const beneficiarioVacio = (cat: CatalogosOperacion): BeneficiarioForm => ({ nombre: '', tipoDocumento: cat.tipoDocumentoInicial, numeroDocumento: '', fechaNacimiento: '' });

/** Valores de un formulario nuevo. Nacionalidad empieza en el país del catálogo que corresponde al «Peruana» del diseño. */
export function valoresIniciales(cat: CatalogosOperacion, fechaOperacion: string): FormValues {
  return {
    // Con una sola oficina configurada (RO 16) no hay nada que elegir: ya viene puesta.
    registro: { oficina: cat.oficinas.length === 1 ? cat.oficinas[0] : '' },
    personaFisica: { ...PERSONA_VACIA, tipoDocumento: cat.tipoDocumentoInicial, nacionalidad: cat.paises.find((p) => p.nombre === 'Perú')?.nombre ?? '' },
    conRepresentada: false,
    personaRepresentada: { ...PERSONA_VACIA, tipoDocumento: cat.tipoDocumentoInicial },
    operacion: { fechaOperacion, lugar: '', tipoOperacion: '', modalidadPago: '', modalidadPagoTexto: '', moneda: '', monto: '', origenFondos: '', origenFondosTexto: '', numeroComprobante: '', cuenta1: '', cuenta2: '', cuenta3: '', descripcion: '' },
    beneficiarios: [beneficiarioVacio(cat)],
    motivo: '',
  };
}

const t = (valor: string | null | undefined) => valor ?? '';

function personaDesdeDetalle(p: PersonaDetalle | null): PersonaForm {
  if (!p) return { ...PERSONA_VACIA };
  return {
    tipoDocumento: t(p.tipoDocumento), numeroDocumento: t(p.numeroDocumento), motivoSinDocumento: t(p.motivoSinDocumento), fechaNacimiento: t(p.fechaNacimiento),
    nombres: t(p.nombres), apellidos: t(p.apellidos), nacionalidad: t(p.nacionalidad), telefono: t(p.telefono), ocupacion: t(p.ocupacion),
    estadoCivil: t(p.estadoCivil), domicilio: t(p.domicilio), codigoPostal: t(p.codigoPostal), departamento: t(p.departamento), provincia: t(p.provincia),
    distrito: t(p.distrito), razonSocial: t(p.razonSocial), representanteLegal: t(p.representanteLegal), representanteTipoDocumento: t(p.representanteTipoDocumento),
    representanteNumeroDocumento: t(p.representanteNumeroDocumento), accionistasMayores25: t(p.accionistasMayores25), domicilioFiscal: t(p.domicilioFiscal),
  };
}

/** Nombres legibles de valores que no están en el catálogo (registros anteriores): ruta del campo → texto para mostrar. */
export type Legados = Record<string, string>;

/** Precarga el formulario de edición con los campos de VALOR del detalle (el código, o el texto viejo tal cual). */
export function valoresDesdeDetalle(d: DetalleOperacion): { valores: FormValues; legados: Legados } {
  const o = d.operacion;
  const legados: Legados = {};
  const anotar = (ruta: string, nombre: string | null | undefined) => { if (nombre) legados[ruta] = nombre; };
  anotar('personaFisica.tipoDocumento', d.personaFisica.tipoDocumentoNombre);
  anotar('personaFisica.estadoCivil', d.personaFisica.estadoCivilNombre);
  anotar('personaRepresentada.tipoDocumento', d.personaRepresentada?.tipoDocumentoNombre);
  anotar('personaRepresentada.representanteTipoDocumento', d.personaRepresentada?.representanteTipoDocumentoNombre);
  anotar('operacion.tipoOperacion', o.tipoOperacionNombre);
  anotar('operacion.modalidadPago', o.modalidadPagoNombre);
  anotar('operacion.moneda', o.monedaCodigo);
  anotar('operacion.origenFondos', o.origenFondosNombre);
  d.beneficiarios.forEach((b, i) => anotar(`beneficiarios.${i}.tipoDocumento`, b.tipoDocumentoNombre));

  return {
    legados,
    valores: {
      registro: { oficina: d.registro.oficina },
      personaFisica: personaDesdeDetalle(d.personaFisica),
      conRepresentada: d.personaRepresentada !== null,
      personaRepresentada: personaDesdeDetalle(d.personaRepresentada),
      operacion: {
        fechaOperacion: o.fechaOperacion, lugar: t(o.lugar), tipoOperacion: t(o.tipoOperacion), modalidadPago: t(o.modalidadPago), modalidadPagoTexto: t(o.modalidadPagoTexto),
        moneda: t(o.moneda), monto: montoTexto(o.monto), origenFondos: t(o.origenFondos), origenFondosTexto: t(o.origenFondosTexto), numeroComprobante: t(o.numeroComprobante),
        cuenta1: t(o.cuenta1), cuenta2: t(o.cuenta2), cuenta3: t(o.cuenta3), descripcion: t(o.descripcion),
      },
      beneficiarios: d.beneficiarios.map((b) => ({ nombre: b.nombre, tipoDocumento: t(b.tipoDocumento), numeroDocumento: t(b.numeroDocumento), fechaNacimiento: t(b.fechaNacimiento) })),
      motivo: '',
    },
  };
}

// ============================================================
// Reglas sobre el catálogo
// ============================================================

export const pideTexto = (lista: OpcionCodigo[], codigo: string): boolean => lista.find((o) => o.codigo === codigo)?.pideTexto === true;

/** Una persona jurídica se identifica con RUC (el diseño no trae un selector aparte de tipo de persona). */
export const esJuridica = (p: PersonaForm): boolean => p.tipoDocumento === 'RUC';

function obtener(objeto: unknown, ruta: string): unknown {
  return ruta.split('.').reduce<unknown>((acc, clave) => (acc == null ? undefined : (acc as Record<string, unknown>)[clave]), objeto);
}

const vacio = (valor: string) => valor.trim() === '';

/** Los datos mínimos de RO 2 (los cinco círculos): `true` = cumplido. */
export function datosMinimos(v: FormValues, cat: CatalogosOperacion): [boolean, boolean, boolean, boolean, boolean] {
  const p = v.personaFisica;
  const documento = (tipo: string, numero: string, motivo: string) => !vacio(tipo) && (pideTexto(cat.tiposDocumentoOperacion, tipo) ? !vacio(motivo) : !vacio(numero));
  const o = v.operacion;
  const monto = montoANumero(o.monto);
  return [
    documento(p.tipoDocumento, p.numeroDocumento, p.motivoSinDocumento) && !vacio(p.nombres) && !vacio(p.apellidos),
    !vacio(o.tipoOperacion) && !vacio(o.fechaOperacion) && monto !== null && monto > 0,
    !vacio(o.modalidadPago) && (!pideTexto(cat.modalidadesPago, o.modalidadPago) || !vacio(o.modalidadPagoTexto)) && !vacio(o.moneda),
    !vacio(o.origenFondos) && (!pideTexto(cat.origenesFondos, o.origenFondos) || !vacio(o.origenFondosTexto)),
    v.beneficiarios.some((b) => !vacio(b.nombre) && !vacio(b.tipoDocumento) && (pideTexto(cat.tiposDocumentoOperacion, b.tipoDocumento) || !vacio(b.numeroDocumento))),
  ];
}

export const LIMITE_MOTIVO = 300;

/**
 * Esquema de validación (el servidor valida lo mismo y manda la última palabra).
 * Al editar, un campo vacío que ya estaba vacío en el registro se acepta tal cual (registros anteriores a los datos nuevos).
 */
export function crearEsquema(cat: CatalogosOperacion, original: FormValues | null, edicion: boolean) {
  return FORMA.superRefine((v, ctx) => {
    const falta = (ruta: string, valor: string, mensaje: string) => {
      if (!vacio(valor)) return;
      if (original && obtener(original, ruta) === valor) return;
      ctx.addIssue({ code: 'custom', path: ruta.split('.'), message: mensaje });
    };
    const documento = (prefijo: string, tipo: string, numero: string, motivo: string) => {
      falta(`${prefijo}.tipoDocumento`, tipo, 'Elige el tipo de documento.');
      if (pideTexto(cat.tiposDocumentoOperacion, tipo)) falta(`${prefijo}.motivoSinDocumento`, motivo, 'Escribe el motivo por el que no tiene documento.');
      else falta(`${prefijo}.numeroDocumento`, numero, 'Escribe el número de documento.');
    };

    falta('registro.oficina', v.registro.oficina, cat.oficinas.length > 0 ? 'Elige una oficina de la lista.' : 'Escribe la oficina.');

    const f = v.personaFisica;
    documento('personaFisica', f.tipoDocumento, f.numeroDocumento, f.motivoSinDocumento);
    falta('personaFisica.nombres', f.nombres, 'Escribe los nombres.');
    falta('personaFisica.apellidos', f.apellidos, 'Escribe los apellidos.');

    if (v.conRepresentada) {
      const r = v.personaRepresentada;
      documento('personaRepresentada', r.tipoDocumento, r.numeroDocumento, r.motivoSinDocumento);
      if (esJuridica(r)) {
        falta('personaRepresentada.razonSocial', r.razonSocial, 'Escribe la razón social.');
      } else {
        falta('personaRepresentada.nombres', r.nombres, 'Escribe los nombres.');
        falta('personaRepresentada.apellidos', r.apellidos, 'Escribe los apellidos.');
      }
    }

    const o = v.operacion;
    falta('operacion.fechaOperacion', o.fechaOperacion, 'Indica la fecha de la operación.');
    falta('operacion.tipoOperacion', o.tipoOperacion, 'Elige el tipo de operación.');
    falta('operacion.modalidadPago', o.modalidadPago, 'Elige la modalidad de pago.');
    if (pideTexto(cat.modalidadesPago, o.modalidadPago)) falta('operacion.modalidadPagoTexto', o.modalidadPagoTexto, 'Escribe cuál es la otra modalidad de pago.');
    falta('operacion.moneda', o.moneda, 'Elige la moneda.');
    falta('operacion.origenFondos', o.origenFondos, 'Elige el origen de los fondos.');
    if (pideTexto(cat.origenesFondos, o.origenFondos)) falta('operacion.origenFondosTexto', o.origenFondosTexto, 'Describe el origen de los fondos.');
    if (vacio(o.monto)) {
      ctx.addIssue({ code: 'custom', path: ['operacion', 'monto'], message: 'Escribe el monto.' });
    } else {
      const monto = montoANumero(o.monto);
      if (monto === null || monto <= 0) ctx.addIssue({ code: 'custom', path: ['operacion', 'monto'], message: 'El monto debe ser un número mayor que cero.' });
      else if (decimalesDe(o.monto) > 2) ctx.addIssue({ code: 'custom', path: ['operacion', 'monto'], message: 'El monto admite hasta 2 decimales.' });
    }

    if (v.beneficiarios.length === 0) ctx.addIssue({ code: 'custom', path: ['beneficiarios'], message: 'Agrega al menos un beneficiario.' });
    v.beneficiarios.forEach((b, i) => {
      falta(`beneficiarios.${i}.nombre`, b.nombre, 'Escribe el nombre o la razón social del beneficiario.');
      falta(`beneficiarios.${i}.tipoDocumento`, b.tipoDocumento, 'Elige el tipo de documento.');
      if (!pideTexto(cat.tiposDocumentoOperacion, b.tipoDocumento)) falta(`beneficiarios.${i}.numeroDocumento`, b.numeroDocumento, 'Escribe el número de documento.');
    });

    if (edicion) {
      if (vacio(v.motivo)) ctx.addIssue({ code: 'custom', path: ['motivo'], message: 'Escribe el motivo del cambio.' });
      else if (v.motivo.length > LIMITE_MOTIVO) ctx.addIssue({ code: 'custom', path: ['motivo'], message: `El motivo admite hasta ${LIMITE_MOTIVO} caracteres.` });
    }
  });
}

// ============================================================
// Lo que se envía
// ============================================================

const nulo = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());

function personaSolicitud(p: PersonaForm, cat: CatalogosOperacion, tipo: 'FISICA' | 'REPRESENTADA'): PersonaSolicitud {
  const sinDocumento = pideTexto(cat.tiposDocumentoOperacion, p.tipoDocumento);
  const base = {
    tipoDocumento: p.tipoDocumento,
    numeroDocumento: sinDocumento ? '' : p.numeroDocumento.trim(),
    motivoSinDocumento: sinDocumento ? nulo(p.motivoSinDocumento) : null,
  };
  if (tipo === 'REPRESENTADA' && esJuridica(p)) {
    return {
      ...base,
      tipoPersona: 'JURIDICA',
      razonSocial: nulo(p.razonSocial),
      representanteLegal: nulo(p.representanteLegal),
      representanteTipoDocumento: nulo(p.representanteTipoDocumento),
      representanteNumeroDocumento: nulo(p.representanteNumeroDocumento),
      accionistasMayores25: nulo(p.accionistasMayores25),
      domicilioFiscal: nulo(p.domicilioFiscal),
    };
  }
  return {
    ...base,
    ...(tipo === 'REPRESENTADA' ? { tipoPersona: 'NATURAL' as const } : {}),
    nombres: p.nombres.trim(),
    apellidos: p.apellidos.trim(),
    fechaNacimiento: nulo(p.fechaNacimiento),
    nacionalidad: nulo(p.nacionalidad),
    telefono: nulo(p.telefono),
    ocupacion: nulo(p.ocupacion),
    estadoCivil: nulo(p.estadoCivil),
    domicilio: nulo(p.domicilio),
    codigoPostal: nulo(p.codigoPostal),
    departamento: nulo(p.departamento),
    provincia: nulo(p.provincia),
    distrito: nulo(p.distrito),
  };
}

/** Arma el cuerpo del alta (y de la edición, con `motivo`). El servidor pone número, fechas, empresa y responsable. */
export function aSolicitud(v: FormValues, cat: CatalogosOperacion, edicion: boolean): SolicitudOperacion {
  const o = v.operacion;
  const solicitud: SolicitudOperacion = {
    registro: { oficina: v.registro.oficina.trim() },
    personaFisica: personaSolicitud(v.personaFisica, cat, 'FISICA'),
    personaRepresentada: v.conRepresentada ? personaSolicitud(v.personaRepresentada, cat, 'REPRESENTADA') : null,
    operacion: {
      fechaOperacion: o.fechaOperacion,
      lugar: nulo(o.lugar),
      tipoOperacion: o.tipoOperacion,
      modalidadPago: o.modalidadPago,
      modalidadPagoTexto: pideTexto(cat.modalidadesPago, o.modalidadPago) ? nulo(o.modalidadPagoTexto) : null,
      moneda: o.moneda,
      monto: montoANumero(o.monto) ?? 0,
      origenFondos: o.origenFondos,
      origenFondosTexto: pideTexto(cat.origenesFondos, o.origenFondos) ? nulo(o.origenFondosTexto) : null,
      numeroComprobante: nulo(o.numeroComprobante),
      descripcion: nulo(o.descripcion),
      cuenta1: nulo(o.cuenta1),
      cuenta2: nulo(o.cuenta2),
      cuenta3: nulo(o.cuenta3),
    },
    beneficiarios: v.beneficiarios.map((b) => ({
      nombre: b.nombre.trim(),
      tipoDocumento: b.tipoDocumento,
      numeroDocumento: pideTexto(cat.tiposDocumentoOperacion, b.tipoDocumento) ? '' : b.numeroDocumento.trim(),
      fechaNacimiento: nulo(b.fechaNacimiento),
    })),
  };
  if (edicion) solicitud.motivo = v.motivo.trim();
  return solicitud;
}

// ============================================================
// Cambios detectados (RO 6): vista previa propia; el servidor calcula la verdadera al guardar
// ============================================================

export interface CambioVista { ruta: string; etiqueta: string; antes: string; despues: string }

const CAMPOS_PERSONA: [string, string][] = [
  ['tipoDocumento', 'Tipo de documento'], ['numeroDocumento', 'N.º de documento'], ['motivoSinDocumento', 'Motivo (sin documento)'], ['fechaNacimiento', 'Fecha de nacimiento'],
  ['nombres', 'Nombres'], ['apellidos', 'Apellidos'], ['nacionalidad', 'Nacionalidad'], ['telefono', 'Teléfono'], ['ocupacion', 'Ocupación'],
  ['estadoCivil', 'Estado civil'], ['domicilio', 'Domicilio'], ['departamento', 'Departamento'], ['provincia', 'Provincia'], ['distrito', 'Distrito'],
];
const CAMPOS_REPRESENTADA: [string, string][] = [
  ['tipoDocumento', 'Tipo de documento'], ['numeroDocumento', 'N.º de documento'], ['motivoSinDocumento', 'Motivo (sin documento)'], ['razonSocial', 'Razón social'],
  ['representanteLegal', 'Representante legal'], ['representanteTipoDocumento', 'Tipo de documento del representante'], ['representanteNumeroDocumento', 'N.º de documento del representante'],
  ['accionistasMayores25', 'Accionistas con más del 25 %'], ['domicilioFiscal', 'Domicilio fiscal'], ['nombres', 'Nombres'], ['apellidos', 'Apellidos'],
];
const CAMPOS_OPERACION: [string, string][] = [
  ['fechaOperacion', 'Fecha de la operación'], ['lugar', 'Lugar'], ['tipoOperacion', 'Tipo de operación'], ['modalidadPago', 'Modalidad de pago'],
  ['modalidadPagoTexto', 'Otra modalidad de pago'], ['moneda', 'Moneda'], ['monto', 'Monto'], ['origenFondos', 'Origen de los fondos'], ['origenFondosTexto', 'Detalle del origen de fondos'],
  ['numeroComprobante', 'N.º de comprobante'], ['cuenta1', 'Cuenta involucrada'], ['descripcion', 'Descripción'],
];
const CAMPOS_BENEFICIARIO: [string, string][] = [['nombre', 'Nombre'], ['tipoDocumento', 'Tipo de documento'], ['numeroDocumento', 'N.º de documento']];

/** Texto legible de un valor para «Antes → después»: nombre del catálogo, fecha dd/mm/aaaa o el texto tal cual. */
export function valorLegible(ruta: string, valor: string, cat: CatalogosOperacion, legados: Legados): string {
  if (vacio(valor)) return '—';
  const campo = ruta.split('.').pop() ?? '';
  const buscar = (lista: OpcionCodigo[]) => lista.find((x) => x.codigo === valor)?.nombre;
  const nombre =
    campo === 'tipoDocumento' || campo === 'representanteTipoDocumento' ? buscar(cat.tiposDocumentoOperacion)
    : campo === 'estadoCivil' ? buscar(cat.estadosCiviles)
    : campo === 'tipoOperacion' ? buscar(cat.tiposOperacion)
    : campo === 'modalidadPago' ? buscar(cat.modalidadesPago)
    : campo === 'origenFondos' ? buscar(cat.origenesFondos)
    : campo === 'moneda' ? cat.monedas.find((m) => m.codigo === valor)?.codigo
    : undefined;
  if (nombre) return nombre;
  if ((campo === 'fechaOperacion' || campo === 'fechaNacimiento') && /^\d{4}-\d{2}-\d{2}$/.test(valor)) return fechaCorta(valor) ?? valor;
  return legados[ruta] ?? valor;
}

export function detectarCambios(original: FormValues, actual: FormValues, cat: CatalogosOperacion, legados: Legados): CambioVista[] {
  const cambios: CambioVista[] = [];
  const comparar = (ruta: string, etiqueta: string, antes: string, despues: string) => {
    if (antes.trim() === despues.trim()) return;
    cambios.push({ ruta, etiqueta, antes: valorLegible(ruta, antes, cat, legados), despues: valorLegible(ruta, despues, cat, legados) });
  };
  comparar('registro.oficina', 'Oficina', original.registro.oficina, actual.registro.oficina);
  for (const [campo, etiqueta] of CAMPOS_PERSONA) comparar(`personaFisica.${campo}`, etiqueta, original.personaFisica[campo as keyof PersonaForm], actual.personaFisica[campo as keyof PersonaForm]);
  if (original.conRepresentada !== actual.conRepresentada) {
    cambios.push({ ruta: 'conRepresentada', etiqueta: 'Actúa en representación', antes: original.conRepresentada ? 'Sí' : 'No', despues: actual.conRepresentada ? 'Sí' : 'No' });
  } else if (actual.conRepresentada) {
    for (const [campo, etiqueta] of CAMPOS_REPRESENTADA) comparar(`personaRepresentada.${campo}`, `Representada · ${etiqueta}`, original.personaRepresentada[campo as keyof PersonaForm], actual.personaRepresentada[campo as keyof PersonaForm]);
  }
  for (const [campo, etiqueta] of CAMPOS_OPERACION) comparar(`operacion.${campo}`, etiqueta, original.operacion[campo as keyof FormValues['operacion']], actual.operacion[campo as keyof FormValues['operacion']]);
  const cuantos = Math.max(original.beneficiarios.length, actual.beneficiarios.length);
  for (let i = 0; i < cuantos; i += 1) {
    const antes = original.beneficiarios[i];
    const despues = actual.beneficiarios[i];
    if (!antes || !despues) {
      cambios.push({ ruta: `beneficiarios.${i}`, etiqueta: `Beneficiario ${i + 1}`, antes: antes ? antes.nombre : '—', despues: despues ? despues.nombre : 'Quitado' });
      continue;
    }
    for (const [campo, etiqueta] of CAMPOS_BENEFICIARIO) comparar(`beneficiarios.${i}.${campo}`, `Beneficiario ${i + 1} · ${etiqueta}`, antes[campo as keyof BeneficiarioForm], despues[campo as keyof BeneficiarioForm]);
  }
  return cambios;
}
