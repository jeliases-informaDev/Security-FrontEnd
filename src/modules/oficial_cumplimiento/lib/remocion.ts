// Formulario de «Reemplazar o remover» (OC 12): registra por qué se quita al oficial, con su sustento, quién lo aprobó y el acta.
// El servidor valida lo mismo y manda la última palabra; aquí solo se evita viajar para enterarse de un dato que falta.

import { z } from 'zod';
import type { Adjunto, CatalogosOficial, FichaOficial, SolicitudRemocion } from '../services/oficialService';
import { hoyIso } from './formato';

const texto = z.string();
/** Acta ya subida al servidor (queda suelta hasta que se registra la remoción) o nada. */
const archivo = z.custom<Adjunto | null>();

const FORMA = z.object({
  motivo: texto,
  razones: texto,
  aprobadaPor: texto,
  /** Fecha de la decisión, del conocimiento del incumplimiento o de la vacancia (AAAA-MM-DD): desde ella corren los plazos. */
  fechaDecision: texto,
  acta: archivo,
});

export type FormularioRemocion = z.infer<typeof FORMA>;

/** Motivo en que el contrato exige quién aprobó y el acta: la empresa decide quitar al oficial (art. 7.5). En los demás son opcionales. */
export const MOTIVO_DECISION_EMPRESA = 'REMOCION_EMPRESA';

/** Al cambiar uno de estos campos, los que dependen de él (si ya tienen error) se vuelven a validar. */
export const DEPENDIENTES_REMOCION: Partial<Record<keyof FormularioRemocion, (keyof FormularioRemocion)[]>> = {
  motivo: ['aprobadaPor', 'acta'],
};

/** Con qué abre el formulario: el primer motivo que el catálogo deja elegir (el diseño abre en «Remoción por decisión de la empresa»). */
export function valoresInicialesRemocion(catalogos: CatalogosOficial): FormularioRemocion {
  return { motivo: catalogos.motivosRemocion.find((m) => m.disponible)?.codigo ?? '', razones: '', aprobadaPor: '', fechaDecision: '', acta: null };
}

const vacio = (valor: string): boolean => valor.trim() === '';
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function crearEsquemaRemocion(catalogos: CatalogosOficial, ficha: FichaOficial) {
  const designacion = ficha.designacion.fechaDesignacion;
  return FORMA.superRefine((v, ctx) => {
    const hoy = hoyIso();
    const error = (ruta: keyof FormularioRemocion, mensaje: string) => ctx.addIssue({ code: 'custom', path: [ruta], message: mensaje });
    const esDecision = v.motivo === MOTIVO_DECISION_EMPRESA;

    if (!catalogos.motivosRemocion.some((m) => m.codigo === v.motivo && m.disponible)) error('motivo', 'Elige el motivo.');

    if (vacio(v.razones)) error('razones', 'Escribe las razones que justifican la medida.');
    else if (v.razones.trim().length > 2000) error('razones', 'Las razones admiten hasta 2000 caracteres.');

    if (vacio(v.aprobadaPor)) {
      if (esDecision) error('aprobadaPor', 'Indica quién aprobó la remoción.');
    } else if (v.aprobadaPor.trim().length > 255) {
      error('aprobadaPor', 'Admite hasta 255 caracteres.');
    }

    if (vacio(v.fechaDecision)) error('fechaDecision', 'Indica la fecha de la decisión.');
    else if (!FECHA_ISO.test(v.fechaDecision)) error('fechaDecision', 'Escribe la fecha como dd/mm/aaaa.');
    else if (v.fechaDecision > hoy) error('fechaDecision', 'La fecha de la decisión no puede ser futura.');
    else if (v.fechaDecision < designacion) error('fechaDecision', 'La fecha no puede ser anterior a la designación.');

    if (esDecision && !v.acta) error('acta', 'Adjunta el acta o el documento de la decisión.');
  });
}

export function aSolicitudRemocion(v: FormularioRemocion): SolicitudRemocion {
  return {
    motivo: v.motivo,
    razones: v.razones.trim(),
    aprobadaPor: vacio(v.aprobadaPor) ? null : v.aprobadaPor.trim(),
    fechaDecision: v.fechaDecision,
    actaAdjuntoId: v.acta?.id ?? null,
  };
}

/** Campo del formulario que corresponde a una clave que devuelve el servidor en `campos` (o null si no es de este formulario). */
export function rutaDeCampoRemocion(clave: string): keyof FormularioRemocion | null {
  const ruta = clave === 'actaAdjuntoId' ? 'acta' : clave;
  return Object.keys(FORMA.shape).includes(ruta) ? (ruta as keyof FormularioRemocion) : null;
}
