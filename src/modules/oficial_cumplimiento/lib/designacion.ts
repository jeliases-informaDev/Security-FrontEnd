// Formulario del asistente «Designar oficial de cumplimiento»: forma de los datos, valores iniciales y validación.
// El servidor valida lo mismo y manda la última palabra; aquí solo se evita viajar para enterarse de un dato que falta.
// Las opciones de los desplegables y los textos de las reglas llegan del backend (`/catalogos`); no se escriben a mano.

import { z } from 'zod';
import type { FieldPath } from 'react-hook-form';
import type { Adjunto, CatalogosOficial, DatosVistaPrevia, EstadoOficial, FichaOficial, SolicitudDesignacion } from '../services/oficialService';
import { fechaCorta, hoyIso } from './formato';

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
    reemplazaOficialAnterior: z.boolean(),
  }),
  declaraciones: z.object({
    requisitos: z.object({ puntos: z.array(texto), firmaNombre: texto, fechaFirma: texto, adjunto: archivo }),
    designante: z.object({ aceptada: z.boolean(), firmaNombre: texto, fechaFirma: texto, adjunto: archivo }),
  }),
  /** Solo al corregir (`PUT`): por qué se corrige; queda en el historial. En una designación nueva no se usa ni se valida. */
  motivoCorreccion: texto,
});

export type FormularioDesignacion = z.infer<typeof FORMA>;

/** Paso (0 a 3) al que pertenece cada campo: para saltar al paso con error cuando el servidor rechaza algo. */
export function pasoDeCampo(nombre: string): number {
  if (nombre.startsWith('designacion.')) return 1;
  if (nombre.startsWith('declaraciones.')) return 2;
  if (nombre === 'motivoCorreccion') return 3;
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
  [
    'designacion.designa', 'designacion.nombreOrgano', 'designacion.documentoTipo', 'designacion.documentoFecha',
    'designacion.fechaDesignacion', 'designacion.adjunto',
  ],
  [
    'declaraciones.requisitos.puntos', 'declaraciones.requisitos.firmaNombre', 'declaraciones.requisitos.fechaFirma', 'declaraciones.requisitos.adjunto',
    'declaraciones.designante.aceptada', 'declaraciones.designante.firmaNombre', 'declaraciones.designante.fechaFirma', 'declaraciones.designante.adjunto',
  ],
  // La revisión no pide nada nuevo; solo al corregir se escribe el motivo (en una designación nueva este campo no se valida).
  ['motivoCorreccion'],
];

/** Al cambiar uno de estos campos, el que depende de él (si ya tiene error) se vuelve a validar. */
export const DEPENDIENTES: Partial<Record<FieldPath<FormularioDesignacion>, FieldPath<FormularioDesignacion>[]>> = {
  'designacion.fechaDesignacion': ['designacion.documentoFecha'],
  'declaraciones.requisitos.firmaNombre': ['declaraciones.requisitos.fechaFirma'],
  'declaraciones.requisitos.fechaFirma': ['declaraciones.requisitos.firmaNombre'],
  'declaraciones.requisitos.adjunto': ['declaraciones.requisitos.firmaNombre', 'declaraciones.requisitos.fechaFirma'],
  'declaraciones.designante.firmaNombre': ['declaraciones.designante.fechaFirma'],
  'declaraciones.designante.fechaFirma': ['declaraciones.designante.firmaNombre'],
  'declaraciones.designante.adjunto': ['declaraciones.designante.firmaNombre', 'declaraciones.designante.fechaFirma'],
};

// ============================================================
// Valores iniciales
// ============================================================

/** El cargo que se ofrece primero: el primero que el catálogo marca como disponible (hoy, «Titular»). */
const cargoInicial = (cat: CatalogosOficial): string => cat.tiposCargo.find((c) => c.disponible)?.codigo ?? '';

/** La dedicación con que abre el diseño («No exclusiva»), si el catálogo la trae. */
const dedicacionInicial = (cat: CatalogosOficial): string => cat.dedicaciones.find((d) => d.codigo === 'NO_EXCLUSIVA')?.codigo ?? '';

/** Quién designa cuando el tipo de empresa solo admite a una persona u órgano (si admite varios, se elige en el paso 2). */
export function designanteUnico(cat: CatalogosOficial, tipoEmpresa: string): string {
  const permitidos = cat.tiposEmpresa.find((t) => t.codigo === tipoEmpresa)?.designantesPermitidos ?? [];
  return permitidos.length === 1 ? permitidos[0] : '';
}

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
    designacion: {
      designa: designanteUnico(cat, tipoEmpresa),
      nombreOrgano: '',
      documentoTipo: '',
      documentoFecha: '',
      fechaDesignacion: '',
      adjunto: null,
      // Con el cargo vacante, la nueva designación reemplaza al oficial que se removió.
      reemplazaOficialAnterior: estado.estado === 'VACANTE',
    },
    declaraciones: {
      requisitos: { puntos: [], firmaNombre: '', fechaFirma: '', adjunto: null },
      designante: { aceptada: false, firmaNombre: '', fechaFirma: '', adjunto: null },
    },
    motivoCorreccion: '',
  };
}

/**
 * Valores del asistente al corregir una designación que todavía no se comunicó (o que la UIF devolvió como «No procedente»): salen de
 * la ficha que entrega el servidor. Los archivos ya guardados siguen puestos (el servidor los acepta de nuevo); el motivo se escribe en la revisión.
 * Si la ficha dice que la declaración de requisitos está completa, están marcadas sus ocho afirmaciones.
 */
export function valoresDeFicha(ficha: FichaOficial, cat: CatalogosOficial): FormularioDesignacion {
  const { persona, cargo, designacion } = ficha;
  const requisitos = ficha.declaraciones.requisitos;
  const designante = ficha.declaraciones.designante;
  return {
    tipoEmpresa: ficha.tipoEmpresa,
    tipoCargo: ficha.tipoCargo,
    dedicacion: ficha.dedicacion,
    persona: {
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      nacionalidad: persona.nacionalidad,
      tipoDocumento: persona.tipoDocumento,
      numeroDocumento: persona.numeroDocumento,
      fechaNacimiento: persona.fechaNacimiento,
      domicilio: persona.domicilio,
      telefono: persona.telefono ?? '',
      correo: persona.correo,
    },
    cargo: { cargo: cargo.cargo, fechaIngreso: cargo.fechaIngreso, vinculo: cargo.vinculo, direccionOficina: cargo.direccionOficina },
    designacion: {
      designa: designacion.designa,
      nombreOrgano: designacion.nombreOrgano,
      documentoTipo: designacion.documentoTipo,
      documentoFecha: designacion.documentoFecha,
      fechaDesignacion: designacion.fechaDesignacion,
      adjunto: designacion.adjunto,
      reemplazaOficialAnterior: designacion.reemplazaAId !== null,
    },
    declaraciones: {
      requisitos: {
        puntos: requisitos.completa ? cat.declaracionRequisitos.map((p) => p.letra) : [],
        firmaNombre: requisitos.firmaNombre ?? '',
        fechaFirma: requisitos.fechaFirma ?? '',
        adjunto: requisitos.adjunto,
      },
      designante: {
        aceptada: designante.completa,
        firmaNombre: designante.firmaNombre ?? '',
        fechaFirma: designante.fechaFirma ?? '',
        adjunto: designante.adjunto,
      },
    },
    motivoCorreccion: '',
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
  CE: { patron: /^[A-Za-z0-9]{6,12}$/, mensaje: 'El carné de extranjería tiene de 6 a 12 letras o números.' },
  PASAPORTE: { patron: /^[A-Za-z0-9]{5,12}$/, mensaje: 'El pasaporte tiene de 5 a 12 letras o números.' },
};

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO = /^[0-9 +\-()]*$/;

/** `corregir`: además de todo lo del alta, pide el motivo de la corrección (`PUT /designaciones/{id}`). */
export function crearEsquema(cat: CatalogosOficial, corregir = false) {
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

    // Designación
    const d = v.designacion;
    const permitidos = cat.tiposEmpresa.find((t) => t.codigo === v.tipoEmpresa)?.designantesPermitidos ?? [];
    if (!permitidos.includes(d.designa) || !cat.quienDesigna.some((q) => q.codigo === d.designa)) error('designacion.designa', 'Elige quién designa.');
    if (obligatorio('designacion.nombreOrgano', d.nombreOrgano, 'Escribe el nombre del órgano.')) largo('designacion.nombreOrgano', d.nombreOrgano, 255, 'El nombre del órgano admite hasta 255 caracteres.');
    if (!cat.documentosDesignacion.some((x) => x.codigo === d.documentoTipo)) error('designacion.documentoTipo', 'Elige el tipo de documento.');
    fecha('designacion.fechaDesignacion', d.fechaDesignacion, 'Indica la fecha de designación.', 'no-futura', 'La fecha de designación no puede ser futura.');
    fecha('designacion.documentoFecha', d.documentoFecha, 'Indica la fecha del documento.', 'no-futura', 'La fecha del documento no puede ser futura.');
    if (FECHA_ISO.test(d.documentoFecha) && FECHA_ISO.test(d.fechaDesignacion) && d.documentoFecha > d.fechaDesignacion) {
      error('designacion.documentoFecha', 'La fecha del documento no puede ser posterior a la fecha de designación.');
    }
    if (!d.adjunto) error('designacion.adjunto', 'Adjunta el acta o el documento de designación.');

    // Declaraciones juradas: todos los puntos marcados y la firma (nombre y fecha escritos, o la declaración firmada subida)
    const r = v.declaraciones.requisitos;
    if (!cat.declaracionRequisitos.every((p) => r.puntos.includes(p.letra))) error('declaraciones.requisitos.puntos', 'Marca todas las declaraciones para continuar.');
    if (!v.declaraciones.designante.aceptada) error('declaraciones.designante.aceptada', 'Marca la declaración para continuar.');

    const firma = (prefijo: 'declaraciones.requisitos' | 'declaraciones.designante', f: { firmaNombre: string; fechaFirma: string; adjunto: Adjunto | null }) => {
      const hayNombre = !vacio(f.firmaNombre);
      const hayFecha = !vacio(f.fechaFirma);
      if (!hayNombre && !hayFecha) {
        if (!f.adjunto) {
          error(`${prefijo}.firmaNombre`, 'Escribe el nombre completo para firmar o sube la declaración firmada.');
          error(`${prefijo}.fechaFirma`, 'Indica la fecha de la firma.');
        }
        return;
      }
      if (!hayNombre) error(`${prefijo}.firmaNombre`, 'Escribe el nombre completo para firmar.');
      else largo(`${prefijo}.firmaNombre`, f.firmaNombre, 255, 'El nombre admite hasta 255 caracteres.');
      if (!hayFecha) error(`${prefijo}.fechaFirma`, 'Indica la fecha de la firma.');
      else if (!FECHA_ISO.test(f.fechaFirma)) error(`${prefijo}.fechaFirma`, 'Escribe la fecha como dd/mm/aaaa.');
      else if (f.fechaFirma > hoy) error(`${prefijo}.fechaFirma`, 'La fecha de la firma no puede ser futura.');
    };
    firma('declaraciones.requisitos', r);
    firma('declaraciones.designante', v.declaraciones.designante);

    // Motivo de la corrección (solo al corregir): obligatorio, hasta 500 caracteres
    if (corregir && obligatorio('motivoCorreccion', v.motivoCorreccion, 'Escribe el motivo de la corrección.')) {
      largo('motivoCorreccion', v.motivoCorreccion, 500, 'El motivo admite hasta 500 caracteres.');
    }
  });
}

// ============================================================
// Estado de las declaraciones (para las tarjetas «Completa» y la revisión)
// ============================================================

/** ¿Hay firma? El nombre y la fecha escritos, o la declaración firmada ya subida. */
const hayFirma = (f: { firmaNombre: string; fechaFirma: string; adjunto: Adjunto | null }): boolean => f.adjunto !== null || (!vacio(f.firmaNombre) && FECHA_ISO.test(f.fechaFirma));

export const requisitosCompletos = (v: FormularioDesignacion, cat: CatalogosOficial): boolean =>
  cat.declaracionRequisitos.every((p) => v.declaraciones.requisitos.puntos.includes(p.letra)) && hayFirma(v.declaraciones.requisitos);

export const designanteCompleto = (v: FormularioDesignacion): boolean => v.declaraciones.designante.aceptada && hayFirma(v.declaraciones.designante);

/** Texto de los puntos de la declaración de requisitos: el punto «h» cambia según el vínculo elegido en el paso 1 (lo dicta el catálogo). */
export function puntosDeRequisitos(cat: CatalogosOficial, vinculo: string): { letra: string; texto: string }[] {
  return cat.declaracionRequisitos.map((p) => ({ letra: p.letra, texto: p.letra === 'h' ? cat.declaracionRequisitosPuntoH[vinculo] ?? p.texto : p.texto }));
}

/** «Acta de sesión de directorio del 30/10/2026»: el documento que acredita la designación, como lo escribe el servidor en la ficha. */
export function documentoQueAcredita(cat: CatalogosOficial, v: FormularioDesignacion): string {
  const tipo = cat.documentosDesignacion.find((x) => x.codigo === v.designacion.documentoTipo)?.nombre ?? '';
  const fecha = FECHA_ISO.test(v.designacion.documentoFecha) ? fechaCorta(v.designacion.documentoFecha) : '';
  return tipo && fecha ? `${tipo} del ${fecha}` : tipo;
}

// ============================================================
// Revisión y guardado
// ============================================================

/** «firmada el 03/11/2026»: cómo quedó firmada una declaración (nombre y fecha escritos, archivo firmado subido, o las dos cosas). */
export function textoFirma(f: { firmaNombre: string; fechaFirma: string; adjunto: Adjunto | null }): string {
  const fecha = FECHA_ISO.test(f.fechaFirma) ? fechaCorta(f.fechaFirma) : '';
  const escrita = !vacio(f.firmaNombre) && fecha !== '';
  if (escrita && f.adjunto) return `firmada el ${fecha} · con el archivo firmado adjunto`;
  if (escrita) return `firmada el ${fecha}`;
  if (f.adjunto) return 'firmada (archivo adjunto)';
  return 'sin firma';
}

/** Cuerpo del «Guardar designación» (`POST /designaciones`) a partir del formulario ya validado. */
export function aSolicitud(v: FormularioDesignacion, cat: CatalogosOficial): SolicitudDesignacion {
  const limpio = (s: string): string => s.trim();
  const opcional = (s: string): string | null => (vacio(s) ? null : s.trim());
  const orden = cat.declaracionRequisitos.map((p) => p.letra);
  const r = v.declaraciones.requisitos;
  const d = v.declaraciones.designante;
  return {
    tipoEmpresa: v.tipoEmpresa,
    tipoCargo: v.tipoCargo,
    dedicacion: v.dedicacion,
    persona: {
      nombres: limpio(v.persona.nombres),
      apellidos: limpio(v.persona.apellidos),
      nacionalidad: v.persona.nacionalidad,
      tipoDocumento: v.persona.tipoDocumento,
      numeroDocumento: limpio(v.persona.numeroDocumento),
      fechaNacimiento: v.persona.fechaNacimiento,
      domicilio: limpio(v.persona.domicilio),
      telefono: opcional(v.persona.telefono),
      correo: limpio(v.persona.correo),
    },
    cargo: {
      cargo: limpio(v.cargo.cargo),
      fechaIngreso: v.cargo.fechaIngreso,
      vinculo: v.cargo.vinculo,
      direccionOficina: limpio(v.cargo.direccionOficina),
    },
    designacion: {
      designa: v.designacion.designa,
      nombreOrgano: limpio(v.designacion.nombreOrgano),
      documentoTipo: v.designacion.documentoTipo,
      documentoFecha: v.designacion.documentoFecha,
      fechaDesignacion: v.designacion.fechaDesignacion,
      // La validación ya exigió el archivo; si faltara, el servidor lo rechaza con su mensaje.
      adjuntoId: v.designacion.adjunto?.id ?? '',
      hojaVidaAdjuntoId: null,
      documentoVinculoAdjuntoId: null,
      esOficialOtraEmpresa: false,
      reemplazaOficialAnterior: v.designacion.reemplazaOficialAnterior,
    },
    declaraciones: {
      requisitos: {
        puntos: [...r.puntos].sort((a, b) => orden.indexOf(a) - orden.indexOf(b)),
        firmaNombre: opcional(r.firmaNombre),
        fechaFirma: opcional(r.fechaFirma),
        adjuntoId: r.adjunto?.id ?? null,
      },
      designante: {
        aceptada: d.aceptada,
        firmaNombre: opcional(d.firmaNombre),
        fechaFirma: opcional(d.fechaFirma),
        adjuntoId: d.adjunto?.id ?? null,
      },
    },
  };
}

/**
 * Cuerpo del «Guardar corrección» (`PUT /designaciones/{id}`): el mismo del alta más el motivo. La hoja de vida y el documento del
 * vínculo no se dibujan en el asistente: se mandan tal como ya están guardados, para que corregir no los quite.
 */
export function aSolicitudCorreccion(v: FormularioDesignacion, cat: CatalogosOficial, ficha: FichaOficial): SolicitudDesignacion {
  const base = aSolicitud(v, cat);
  return {
    ...base,
    designacion: {
      ...base.designacion,
      hojaVidaAdjuntoId: ficha.designacion.hojaVida?.id ?? null,
      documentoVinculoAdjuntoId: ficha.designacion.documentoVinculo?.id ?? null,
    },
    motivo: v.motivoCorreccion.trim(),
  };
}

const RUTAS_DEL_FORMULARIO = new Set<string>(CAMPOS_PASO.flat());

/**
 * Clave que manda el servidor en `campos` → campo del formulario. Los archivos se guardan aquí como `adjunto` y el contrato los
 * llama `adjuntoId`; el `motivo` de la corrección se guarda como `motivoCorreccion`. Devuelve null si el formulario no tiene ese
 * campo (por ejemplo, la hoja de vida, que el diseño no dibuja).
 */
export function rutaDeCampo(clave: string): FieldPath<FormularioDesignacion> | null {
  if (clave === 'motivo') return 'motivoCorreccion';
  const ruta = clave.replace(/adjuntoId$/, 'adjunto');
  return RUTAS_DEL_FORMULARIO.has(ruta) ? (ruta as FieldPath<FormularioDesignacion>) : null;
}

/**
 * Lo que pide la vista previa de la declaración de requisitos (no se guarda nada). La fecha de la hoja es la de la firma;
 * si todavía no se escribió, no se manda y el servidor usa la de hoy.
 */
export function datosVistaPrevia(v: FormularioDesignacion): DatosVistaPrevia {
  const fechaFirma = v.declaraciones.requisitos.fechaFirma;
  return {
    nombres: v.persona.nombres.trim(),
    apellidos: v.persona.apellidos.trim(),
    tipoDocumento: v.persona.tipoDocumento,
    numeroDocumento: v.persona.numeroDocumento.trim(),
    tipoCargo: v.tipoCargo,
    vinculo: v.cargo.vinculo,
    ...(FECHA_ISO.test(fechaFirma) ? { fecha: fechaFirma } : {}),
  };
}
