// Formularios de la comunicación a la UIF: la de la designación (OC 8) y la de un pendiente (cambio de datos o remoción).
// El servidor valida lo mismo y manda la última palabra; aquí solo se evita viajar para enterarse de un dato que falta.

import { z } from 'zod';
import type { Adjunto, CatalogosOficial, FichaOficial, SolicitudComunicacion, SolicitudComunicacionPendiente } from '../services/oficialService';
import { fechaCorta, hoyIso } from './formato';

const texto = z.string();
const archivo = z.custom<Adjunto | null>();
const vacio = (valor: string): boolean => valor.trim() === '';
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

// ============================================================
// Comunicación de la designación (OC 8)
// ============================================================

const FORMA_UIF = z.object({
  fechaComunicacion: texto,
  numeroSolicitud: texto,
  resultado: texto,
  fechaNotificacion: texto,
  motivoNoProcedente: texto,
  codigoEmpresa: texto,
  codigoOficial: texto,
  constancia: archivo,
});

export type FormularioComunicacion = z.infer<typeof FORMA_UIF>;

/**
 * Qué respuestas de la UIF acepta el servidor según el estado de la designación (contrato §9): al presentar se puede dejar «En evaluación»,
 * «Procedente» o «No procedente»; ya vigente solo se pueden agregar o cambiar los códigos y la constancia (otra vez «Procedente»).
 * El servidor vuelve a revisarlo y responde 409 si no cabe; aquí solo se evita ofrecer una opción que seguro falla.
 */
export function resultadosPermitidos(estado: FichaOficial['estado']): string[] {
  if (estado === 'VIGENTE') return ['PROCEDENTE'];
  if (estado === 'PENDIENTE_COMUNICAR' || estado === 'EN_EVALUACION') return ['EN_EVALUACION', 'PROCEDENTE', 'NO_PROCEDENTE'];
  return [];
}

/** Con qué abre el formulario: si ya se presentó, lo natural es registrar la respuesta («Procedente»); si no, solo que se presentó. */
export function valoresInicialesComunicacion(ficha: FichaOficial): FormularioComunicacion {
  const previa = ficha.comunicacion;
  const yaPresentada = ficha.estado === 'EN_EVALUACION' || ficha.estado === 'VIGENTE';
  return {
    fechaComunicacion: yaPresentada ? previa?.fechaComunicacion ?? '' : '',
    numeroSolicitud: yaPresentada ? previa?.numeroSolicitud ?? '' : '',
    resultado: yaPresentada ? 'PROCEDENTE' : 'EN_EVALUACION',
    fechaNotificacion: yaPresentada ? previa?.fechaNotificacion ?? '' : '',
    motivoNoProcedente: '',
    codigoEmpresa: '',
    codigoOficial: '',
    constancia: null,
  };
}

/** Al cambiar uno de estos campos, los que dependen de él (si ya tienen error) se vuelven a validar. */
export const DEPENDIENTES_UIF: Partial<Record<keyof FormularioComunicacion, (keyof FormularioComunicacion)[]>> = {
  fechaComunicacion: ['fechaNotificacion'],
  resultado: ['fechaNotificacion', 'motivoNoProcedente', 'codigoEmpresa', 'codigoOficial'],
};

export function crearEsquemaComunicacion(catalogos: CatalogosOficial, ficha: FichaOficial) {
  const permitidos = resultadosPermitidos(ficha.estado);
  const designacion = ficha.designacion.fechaDesignacion;
  return FORMA_UIF.superRefine((v, ctx) => {
    const hoy = hoyIso();
    const error = (ruta: string, mensaje: string) => ctx.addIssue({ code: 'custom', path: [ruta], message: mensaje });

    // Solicitud
    if (vacio(v.fechaComunicacion)) error('fechaComunicacion', 'Indica la fecha en que presentaste la solicitud.');
    else if (!FECHA_ISO.test(v.fechaComunicacion)) error('fechaComunicacion', 'Escribe la fecha como dd/mm/aaaa.');
    else if (v.fechaComunicacion > hoy) error('fechaComunicacion', 'La fecha de comunicación no puede ser futura.');
    else if (v.fechaComunicacion < designacion) error('fechaComunicacion', 'La fecha de comunicación no puede ser anterior a la fecha de designación.');

    if (vacio(v.numeroSolicitud)) error('numeroSolicitud', 'Escribe el número de la solicitud en SISDEL.');
    else if (v.numeroSolicitud.trim().length > 50) error('numeroSolicitud', 'El número de solicitud admite hasta 50 caracteres.');

    if (!permitidos.includes(v.resultado) || !catalogos.resultadosUif.some((r) => r.codigo === v.resultado)) error('resultado', 'Elige el resultado de la UIF.');

    // La fecha de notificación solo existe cuando la UIF ya respondió.
    if (v.resultado === 'PROCEDENTE' || v.resultado === 'NO_PROCEDENTE') {
      if (vacio(v.fechaNotificacion)) error('fechaNotificacion', 'Indica la fecha en que la UIF notificó su respuesta.');
      else if (!FECHA_ISO.test(v.fechaNotificacion)) error('fechaNotificacion', 'Escribe la fecha como dd/mm/aaaa.');
      else if (v.fechaNotificacion > hoy) error('fechaNotificacion', 'La fecha de notificación no puede ser futura.');
      else if (FECHA_ISO.test(v.fechaComunicacion) && v.fechaNotificacion < v.fechaComunicacion) error('fechaNotificacion', 'La fecha de notificación no puede ser anterior a la de comunicación.');
    }

    if (v.resultado === 'NO_PROCEDENTE') {
      if (vacio(v.motivoNoProcedente)) error('motivoNoProcedente', 'Anota el motivo que dio la UIF.');
      else if (v.motivoNoProcedente.trim().length > 1000) error('motivoNoProcedente', 'El motivo admite hasta 1000 caracteres.');
    }

    // Códigos secretos: opcionales, solo con «Procedente»
    if (v.resultado === 'PROCEDENTE') {
      if (v.codigoEmpresa.trim().length > 100) error('codigoEmpresa', 'El código admite hasta 100 caracteres.');
      if (v.codigoOficial.trim().length > 100) error('codigoOficial', 'El código admite hasta 100 caracteres.');
    }
  });
}

/** Cuerpo de `POST /designaciones/{id}/comunicacion`. Lo que no corresponde al resultado elegido no se manda. */
export function aSolicitudComunicacion(v: FormularioComunicacion): SolicitudComunicacion {
  const procedente = v.resultado === 'PROCEDENTE';
  const respondida = procedente || v.resultado === 'NO_PROCEDENTE';
  const codigo = (valor: string): string | null => (procedente && !vacio(valor) ? valor.trim() : null);
  return {
    fechaComunicacion: v.fechaComunicacion,
    numeroSolicitud: v.numeroSolicitud.trim(),
    resultado: v.resultado,
    fechaNotificacion: respondida ? v.fechaNotificacion : null,
    motivoNoProcedente: v.resultado === 'NO_PROCEDENTE' ? v.motivoNoProcedente.trim() : null,
    codigoEmpresa: codigo(v.codigoEmpresa),
    codigoOficial: codigo(v.codigoOficial),
    constanciaAdjuntoId: v.constancia?.id ?? null,
  };
}

/** Clave que manda el servidor en `campos` → campo del formulario (los archivos se guardan aquí como `constancia`). */
export function rutaDeCampoComunicacion(clave: string): keyof FormularioComunicacion | null {
  const ruta = clave === 'constanciaAdjuntoId' ? 'constancia' : clave;
  return Object.keys(FORMA_UIF.shape).includes(ruta) ? (ruta as keyof FormularioComunicacion) : null;
}

// ============================================================
// Comunicación de un pendiente (cambio de datos o remoción)
// ============================================================

const FORMA_PENDIENTE = z.object({
  fecha: texto,
  numeroSolicitud: texto,
  nota: texto,
  constancia: archivo,
});

export type FormularioPendiente = z.infer<typeof FORMA_PENDIENTE>;

export const valoresInicialesPendiente = (): FormularioPendiente => ({ fecha: '', numeroSolicitud: '', nota: '', constancia: null });

/** `desde`: el día desde el que corre el plazo del pendiente (la comunicación no puede ser anterior). */
export function crearEsquemaPendiente(desde: string | null) {
  return FORMA_PENDIENTE.superRefine((v, ctx) => {
    const hoy = hoyIso();
    const error = (ruta: string, mensaje: string) => ctx.addIssue({ code: 'custom', path: [ruta], message: mensaje });
    if (vacio(v.fecha)) error('fecha', 'Indica la fecha en que comunicaste esto a la UIF.');
    else if (!FECHA_ISO.test(v.fecha)) error('fecha', 'Escribe la fecha como dd/mm/aaaa.');
    else if (v.fecha > hoy) error('fecha', 'La fecha no puede ser futura.');
    else if (desde && FECHA_ISO.test(desde) && v.fecha < desde) error('fecha', `La fecha no puede ser anterior al ${fechaCorta(desde)}, desde cuando corre el plazo.`);
    if (v.numeroSolicitud.trim().length > 50) error('numeroSolicitud', 'El número de solicitud admite hasta 50 caracteres.');
    if (v.nota.trim().length > 500) error('nota', 'La nota admite hasta 500 caracteres.');
  });
}

/** Cuerpo de `POST /pendientes/{id}/comunicacion`. */
export function aSolicitudPendiente(v: FormularioPendiente): SolicitudComunicacionPendiente {
  return {
    fecha: v.fecha,
    numeroSolicitud: vacio(v.numeroSolicitud) ? null : v.numeroSolicitud.trim(),
    nota: vacio(v.nota) ? null : v.nota.trim(),
    constanciaAdjuntoId: v.constancia?.id ?? null,
  };
}

export function rutaDeCampoPendiente(clave: string): keyof FormularioPendiente | null {
  const ruta = clave === 'constanciaAdjuntoId' ? 'constancia' : clave;
  return Object.keys(FORMA_PENDIENTE.shape).includes(ruta) ? (ruta as keyof FormularioPendiente) : null;
}
