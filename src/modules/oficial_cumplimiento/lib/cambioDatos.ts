// Formulario de «Cambiar datos» (OC 10): solo el contacto y el cargo de un oficial que ya se comunicó a la UIF.
// El servidor valida lo mismo y manda la última palabra; aquí solo se evita viajar para enterarse de un dato que falta.

import { z } from 'zod';
import type { FichaOficial, SolicitudCambioDatos } from '../services/oficialService';
import { hoyIso } from './formato';

const texto = z.string();

const FORMA = z.object({
  telefono: texto,
  correo: texto,
  domicilio: texto,
  cargo: texto,
  direccionOficina: texto,
  /** Fecha en que ocurrió el cambio (AAAA-MM-DD). Vacía = hoy, lo decide el servidor. */
  fechaCambio: texto,
  motivo: texto,
});

export type FormularioCambioDatos = z.infer<typeof FORMA>;

/** Los cinco datos que se pueden cambiar. Cualquier otro (nombre, documento…) se cambia reemplazando al oficial. */
export type CampoDato = 'telefono' | 'correo' | 'domicilio' | 'cargo' | 'direccionOficina';

/** Rótulos del diseño, en el orden en que se muestran. */
export const ETIQUETAS_DATOS: Record<CampoDato, string> = {
  telefono: 'Teléfono',
  correo: 'Correo electrónico',
  domicilio: 'Domicilio',
  cargo: 'Cargo que desempeña',
  direccionOficina: 'Dirección de la oficina',
};

export const CAMPOS_DATOS = Object.keys(ETIQUETAS_DATOS) as CampoDato[];

/** Lo que tiene hoy el oficial en cada uno de los cinco datos (el teléfono puede no existir). */
export function datosActuales(ficha: FichaOficial): Record<CampoDato, string> {
  return {
    telefono: ficha.persona.telefono ?? '',
    correo: ficha.persona.correo,
    domicilio: ficha.persona.domicilio,
    cargo: ficha.cargo.cargo,
    direccionOficina: ficha.cargo.direccionOficina,
  };
}

/** Con qué abre el formulario: los datos de hoy (cada campo cambia solo si la persona lo toca). */
export function valoresInicialesCambio(ficha: FichaOficial): FormularioCambioDatos {
  return { ...datosActuales(ficha), fechaCambio: '', motivo: '' };
}

/** ¿Este dato es distinto del que hay hoy? El servidor recorta los espacios de los extremos antes de comparar, igual que aquí. */
export const cambioDe = (campo: CampoDato, valor: string, actuales: Record<CampoDato, string>): boolean => valor.trim() !== actuales[campo].trim();

/** Los datos que la persona cambió, con su valor de antes y el de ahora (en el orden del diseño). */
export function cambiosDetectados(v: Pick<FormularioCambioDatos, CampoDato>, actuales: Record<CampoDato, string>): { campo: CampoDato; antes: string; despues: string }[] {
  return CAMPOS_DATOS.filter((campo) => cambioDe(campo, v[campo], actuales)).map((campo) => ({ campo, antes: actuales[campo].trim(), despues: v[campo].trim() }));
}

const vacio = (valor: string): boolean => valor.trim() === '';
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;
// Mismas reglas de formato que el alta de la designación.
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONO = /^[0-9 +\-()]*$/;

export function crearEsquemaCambio(ficha: FichaOficial) {
  const designacion = ficha.designacion.fechaDesignacion;
  return FORMA.superRefine((v, ctx) => {
    const hoy = hoyIso();
    const error = (ruta: keyof FormularioCambioDatos, mensaje: string) => ctx.addIssue({ code: 'custom', path: [ruta], message: mensaje });
    /** Texto obligatorio (el teléfono es el único que se puede dejar vacío) con su máximo de caracteres. */
    const obligatorio = (ruta: CampoDato, valor: string, falta: string, maximo: number, mensajeMaximo: string): boolean => {
      if (vacio(valor)) {
        error(ruta, falta);
        return false;
      }
      if (valor.trim().length > maximo) {
        error(ruta, mensajeMaximo);
        return false;
      }
      return true;
    };

    // Teléfono: opcional; vacío = se borra.
    if (!vacio(v.telefono)) {
      if (v.telefono.trim().length > 30) error('telefono', 'El teléfono admite hasta 30 caracteres.');
      else if (!TELEFONO.test(v.telefono)) error('telefono', 'El teléfono solo admite números, espacios y los signos + - ( ).');
    }
    if (obligatorio('correo', v.correo, 'Escribe el correo electrónico.', 150, 'El correo admite hasta 150 caracteres.') && !CORREO.test(v.correo.trim())) {
      error('correo', 'El correo no tiene un formato válido.');
    }
    obligatorio('domicilio', v.domicilio, 'Escribe el domicilio.', 255, 'El domicilio admite hasta 255 caracteres.');
    obligatorio('cargo', v.cargo, 'Escribe el cargo que desempeña.', 150, 'El cargo admite hasta 150 caracteres.');
    obligatorio('direccionOficina', v.direccionOficina, 'Escribe la dirección de la oficina.', 255, 'La dirección admite hasta 255 caracteres.');

    // Fecha en que ocurrió el cambio: opcional, real, no futura ni anterior a la designación.
    if (!vacio(v.fechaCambio)) {
      if (!FECHA_ISO.test(v.fechaCambio)) error('fechaCambio', 'Escribe la fecha como dd/mm/aaaa.');
      else if (v.fechaCambio > hoy) error('fechaCambio', 'La fecha del cambio no puede ser futura.');
      else if (v.fechaCambio < designacion) error('fechaCambio', 'El cambio no puede ser anterior a la designación.');
    }

    if (vacio(v.motivo)) error('motivo', 'Escribe el motivo del cambio.');
    else if (v.motivo.trim().length > 500) error('motivo', 'El motivo admite hasta 500 caracteres.');
  });
}

/**
 * Lo que se envía: solo los datos que cambiaron (el servidor toma «null» como «no tocar»; un teléfono vacío lo borra).
 * Sin fecha del cambio, el servidor usa la de hoy.
 */
export function aSolicitudCambio(v: FormularioCambioDatos, actuales: Record<CampoDato, string>): SolicitudCambioDatos {
  const nuevo = (campo: CampoDato): string | null => (cambioDe(campo, v[campo], actuales) ? v[campo].trim() : null);
  return {
    telefono: nuevo('telefono'),
    correo: nuevo('correo'),
    domicilio: nuevo('domicilio'),
    cargo: nuevo('cargo'),
    direccionOficina: nuevo('direccionOficina'),
    fechaCambio: vacio(v.fechaCambio) ? null : v.fechaCambio,
    motivo: v.motivo.trim(),
  };
}

/** Campo del formulario que corresponde a una clave que devuelve el servidor en `campos` (o null si no es de este formulario). */
export function rutaDeCampoCambio(clave: string): keyof FormularioCambioDatos | null {
  return Object.keys(FORMA.shape).includes(clave) ? (clave as keyof FormularioCambioDatos) : null;
}
