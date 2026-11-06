// Formulario del asistente «Designar oficial de cumplimiento»: forma de los datos, valores iniciales y validación.
// El servidor valida lo mismo y manda la última palabra; aquí solo se evita viajar para enterarse de un dato que falta.
// Las opciones de los desplegables y los textos de las reglas llegan del backend (`/catalogos`); no se escriben a mano.

import { z } from 'zod';
import type { FieldPath } from 'react-hook-form';
import type { Adjunto, CatalogosOficial, EstadoOficial } from '../services/oficialService';
import { hoyIso } from './formato';

const texto = z.string();
/** Archivo ya subido al servidor (queda suelto hasta que se guarda la designación) o nada. */
const archivo = z.custom<Adjunto | null>();

const FORMA = z.object({
  tipoEmpresa: texto,
  tipoCargo: texto,
  dedicacion: texto,
  persona: z.object({
    nombres: texto,
    apellidos: texto,
    nacionalidad: texto,
    tipoDocumento: texto,
    numeroDocumento: texto,
    fechaNacimiento: texto,
    domicilio: texto,
    telefono: texto,
    correo: texto,
  }),
  cargo: z.object({
    cargo: texto,
    fechaIngreso: texto,
    vinculo: texto,
    direccionOficina: texto,
  }),
  designacion: z.object({
    designa: texto,
    nombreOrgano: texto,
    documentoTipo: texto,
    documentoFecha: texto,
    fechaDesignacion: texto,
    adjunto: archivo,
  }),
  declaraciones: z.object({
    requisitos: z.object({ puntos: z.array(texto), firmaNombre: texto, fechaFirma: texto, adjunto: archivo }),
    designante: z.object({ aceptada: z.boolean(), firmaNombre: texto, fechaFirma: texto, adjunto: archivo }),
  }),
});

export type FormularioDesignacion = z.infer<typeof FORMA>;

/** Paso (0 a 3) al que pertenece cada campo: para saltar al paso con error cuando el servidor rechaza algo. */
export function pasoDeCampo(nombre: string): number {
  if (nombre.startsWith('designacion.')) return 1;
  if (nombre.startsWith('declaraciones.')) return 2;
  return 0;
}

/** Campos que se validan al pulsar «Continuar» en cada paso. */
export const CAMPOS_PASO: FieldPath<FormularioDesignacion>[][] = [
  [
    'tipoEmpresa', 'tipoCargo', 'dedicacion',
    'persona.nombres', 'persona.apellidos', 'persona.nacionalidad', 'persona.tipoDocumento', 'persona.numeroDocumento',
    'persona.fechaNacimiento', 'persona.domicilio', 'persona.telefono', 'persona.correo',
    'cargo.cargo', 'cargo.fechaIngreso', 'cargo.vinculo', 'cargo.direccionOficina',
  ],
  [],
  [],
  [],
];

// ============================================================
// Valores iniciales
// ============================================================

/** El cargo que se ofrece primero: el primero que el catálogo marca como disponible (hoy, «Titular»). */
const cargoInicial = (cat: CatalogosOficial): string => cat.tiposCargo.find((c) => c.disponible)?.codigo ?? '';

/** La dedicación con que abre el diseño («No exclusiva»), si el catálogo la trae. */
const dedicacionInicial = (cat: CatalogosOficial): string => cat.dedicaciones.find((d) => d.codigo === 'NO_EXCLUSIVA')?.codigo ?? '';

export function valoresIniciales(cat: CatalogosOficial, estado: EstadoOficial): FormularioDesignacion {
  const tipoEmpresa = cat.tiposEmpresa.some((t) => t.codigo === estado.tipoEmpresa) ? (estado.tipoEmpresa as string) : '';
  return {
    tipoEmpresa,
    tipoCargo: cargoInicial(cat),
    dedicacion: dedicacionInicial(cat),
    persona: {
      nombres: '',
      apellidos: '',
      nacionalidad: cat.nacionalidadInicial,
      tipoDocumento: cat.tipoDocumentoInicial,
      numeroDocumento: '',
      fechaNacimiento: '',
      domicilio: '',
      telefono: '',
      correo: '',
    },
    cargo: { cargo: '', fechaIngreso: '', vinculo: '', direccionOficina: '' },
    designacion: { designa: '', nombreOrgano: '', documentoTipo: '', documentoFecha: '', fechaDesignacion: '', adjunto: null },
    declaraciones: {
      requisitos: { puntos: [], firmaNombre: '', fechaFirma: '', adjunto: null },
      designante: { aceptada: false, firmaNombre: '', fechaFirma: '', adjunto: null },
    },
  };
}

// ============================================================
// Validación
// ============================================================

const vacio = (valor: string): boolean => valor.trim() === '';
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Formato del número según el tipo de documento (los códigos del catálogo). */
const FORMATO_DOCUMENTO: Record<string, { patron: RegExp; mensaje: string }> = {
  DNI: { patron: /^\d{8}$/, mensaje: 'El DNI tiene 8 dígitos.' },
  CE: { patron: /^\d{9,12}$/, mensaje: 'El carné de extranjería tiene de 9 a 12 dígitos.' },
  PASAPORTE: { patron: /^[A-Za-z0-9]{5,12}$/, mensaje: 'El pasaporte tiene de 5 a 12 letras o números.' },
};

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO = /^[0-9 +\-()]*$/;

export function crearEsquema(cat: CatalogosOficial) {
  return FORMA.superRefine((v, ctx) => {
    const hoy = hoyIso();
    const error = (ruta: string, mensaje: string) => ctx.addIssue({ code: 'custom', path: ruta.split('.'), message: mensaje });
    const obligatorio = (ruta: string, valor: string, mensaje: string): boolean => {
      if (!vacio(valor)) return true;
      error(ruta, mensaje);
      return false;
    };
    const largo = (ruta: string, valor: string, maximo: number, mensaje: string) => {
      if (valor.length > maximo) error(ruta, mensaje);
    };
    /** Fecha obligatoria, real, y con tope: «anterior» a hoy o «no futura». */
    const fecha = (ruta: string, valor: string, falta: string, tope: 'anterior' | 'no-futura', mensajeTope: string) => {
      if (!obligatorio(ruta, valor, falta)) return;
      if (!FECHA_ISO.test(valor)) return error(ruta, 'Escribe la fecha como dd/mm/aaaa.');
      if (tope === 'anterior' ? valor >= hoy : valor > hoy) error(ruta, mensajeTope);
    };

    // Tipo de cargo y dedicación
    if (!cat.tiposEmpresa.some((t) => t.codigo === v.tipoEmpresa)) error('tipoEmpresa', 'Elige el tipo de empresa.');
    if (!cat.tiposCargo.some((c) => c.codigo === v.tipoCargo && c.disponible)) error('tipoCargo', 'Elige el cargo a designar.');
    if (!cat.dedicaciones.some((d) => d.codigo === v.dedicacion)) error('dedicacion', 'Elige la dedicación.');

    // Datos de la persona
    const p = v.persona;
    if (obligatorio('persona.nombres', p.nombres, 'Escribe los nombres.')) largo('persona.nombres', p.nombres, 150, 'Los nombres admiten hasta 150 caracteres.');
    if (obligatorio('persona.apellidos', p.apellidos, 'Escribe los apellidos.')) largo('persona.apellidos', p.apellidos, 150, 'Los apellidos admiten hasta 150 caracteres.');
    if (!cat.nacionalidades.some((n) => n.codigo === p.nacionalidad)) error('persona.nacionalidad', 'Elige la nacionalidad.');
    if (!cat.tiposDocumento.some((t) => t.codigo === p.tipoDocumento)) {
      error('persona.tipoDocumento', 'Elige el tipo de documento.');
    }
    if (obligatorio('persona.numeroDocumento', p.numeroDocumento, 'Escribe el número de documento.')) {
      const formato = FORMATO_DOCUMENTO[p.tipoDocumento];
      if (formato && !formato.patron.test(p.numeroDocumento.trim())) error('persona.numeroDocumento', formato.mensaje);
    }
    fecha('persona.fechaNacimiento', p.fechaNacimiento, 'Indica la fecha de nacimiento.', 'anterior', 'La fecha de nacimiento debe ser anterior a hoy.');
    if (obligatorio('persona.domicilio', p.domicilio, 'Escribe el domicilio.')) largo('persona.domicilio', p.domicilio, 255, 'El domicilio admite hasta 255 caracteres.');
    if (!vacio(p.telefono)) {
      if (p.telefono.length > 30) error('persona.telefono', 'El teléfono admite hasta 30 caracteres.');
      else if (!TELEFONO.test(p.telefono)) error('persona.telefono', 'El teléfono solo admite números, espacios y los signos + - ( ).');
    }
    if (obligatorio('persona.correo', p.correo, 'Escribe el correo electrónico.')) {
      if (!CORREO.test(p.correo.trim())) error('persona.correo', 'El correo no tiene un formato válido.');
      else largo('persona.correo', p.correo, 150, 'El correo admite hasta 150 caracteres.');
    }

    // Cargo en la empresa
    const c = v.cargo;
    if (obligatorio('cargo.cargo', c.cargo, 'Escribe el cargo que desempeña.')) largo('cargo.cargo', c.cargo, 150, 'El cargo admite hasta 150 caracteres.');
    fecha('cargo.fechaIngreso', c.fechaIngreso, 'Indica la fecha de ingreso.', 'no-futura', 'La fecha de ingreso no puede ser futura.');
    if (!cat.vinculos.some((x) => x.codigo === c.vinculo)) error('cargo.vinculo', 'Elige el vínculo con la empresa.');
    if (obligatorio('cargo.direccionOficina', c.direccionOficina, 'Escribe la dirección de la oficina.')) largo('cargo.direccionOficina', c.direccionOficina, 255, 'La dirección admite hasta 255 caracteres.');
  });
}
