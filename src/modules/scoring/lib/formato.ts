import type { ClienteScoring, DatosEvaluacion, DecisionAnalista, NivelRiesgo } from '../services/scoringService';

export const NIVEL: Record<NivelRiesgo, { etiqueta: string; badge: string; texto: string }> = {
  BAJO: { etiqueta: 'Riesgo bajo', badge: 'badge-ok', texto: 'text-ok' },
  MEDIO: { etiqueta: 'Riesgo medio', badge: 'bg-accent-soft text-accent', texto: 'text-accent' },
  ALTO: { etiqueta: 'Riesgo alto', badge: 'badge-bad', texto: 'text-bad' },
};

/** Tono de la categoría de las evaluaciones antiguas (versión 1), que conservan la que tenían. */
export function badgeCategoriaAntigua(categoria: string | null | undefined): string {
  const c = (categoria ?? '').toLowerCase();
  if (c.includes('bajo')) return 'badge-ok';
  if (c.includes('medio')) return 'badge-warn';
  if (c.includes('alto')) return 'badge-bad';
  return 'badge-neutral';
}

/** Color de la burbuja de un puntaje de 1 a 4 (o de un promedio, redondeado): 4 rojo, 3 crema, 2 neutro, 1 verde. */
export function tonoPuntaje(puntaje: number | null): string {
  if (puntaje == null) return 'border border-line bg-paper text-muted';
  const p = Math.round(puntaje);
  if (p >= 4) return 'bg-bad-soft text-bad';
  if (p === 3) return 'bg-crema text-ink';
  if (p <= 1) return 'bg-ok-soft text-ok';
  return 'border border-line bg-paper text-muted';
}

export function puntajeTexto(valor: number | null | undefined): string {
  return valor == null ? '—' : valor.toFixed(2);
}

const fechaLarga = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
const fechaCorta = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const hora = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });

function aFecha(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fechaLargaDe(valor: string | null | undefined): string {
  const d = aFecha(valor);
  return d ? fechaLarga.format(d) : '';
}

export function fechaCortaDe(valor: string | null | undefined): string {
  const d = aFecha(valor);
  return d ? `${fechaCorta.format(d)} ${hora.format(d)}` : '—';
}

/** «Hoy 10:18» si es de hoy; si no, la fecha y la hora. */
export function fechaConsulta(valor: string | null | undefined): string {
  const d = aFecha(valor);
  if (!d) return '';
  const hoy = new Date();
  const esHoy = d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth() && d.getDate() === hoy.getDate();
  return esHoy ? `Hoy ${hora.format(d)}` : `${fechaCorta.format(d)} ${hora.format(d)}`;
}

/** Texto de la decisión de una evaluación (o de una fila del historial). */
export function decisionTexto(decision: DecisionAnalista | null | undefined): string {
  const accion = decision?.accion;
  if (accion === 'ENVIAR_A_APROBACION') return 'Enviada a aprobación';
  if (accion === 'RECHAZAR') return 'Rechazada';
  return 'Sin decisión';
}

/** Lo que el analista escribe en el paso 2, tal cual (textos de los campos). */
export interface FormDatos {
  ocupacionId: string;
  monto: string;
  productoId: string;
  canalId: string;
  medioPagoId: string;
  departamentoResidenciaId: string;
  departamentoOperacionId: string;
  paisFondosId: string;
  sustentoId: string | null;
  sustentoNombre: string | null;
}

export const FORM_VACIO: FormDatos = {
  ocupacionId: '',
  monto: '',
  productoId: '',
  canalId: '',
  medioPagoId: '',
  departamentoResidenciaId: '',
  departamentoOperacionId: '',
  paisFondosId: '',
  sustentoId: null,
  sustentoNombre: null,
};

const aNumero = (v: string): number | null => (v === '' ? null : Number(v));

/** Monto escrito por la persona («5,000,000» o «5000000.50») → número, o null si no es un número. */
export function montoANumero(texto: string): number | null {
  const limpio = texto.replace(/[\s,]/g, '');
  if (limpio === '') return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Arma el cuerpo que esperan /vista-previa y /evaluar. */
export function aDatosEvaluacion(form: FormDatos, cliente: ClienteScoring): DatosEvaluacion {
  const nuevo = cliente.entidadId == null;
  return {
    entidadId: cliente.entidadId,
    cliente: nuevo ? { tipoPersona: cliente.tipoPersona, tipoDocumento: cliente.tipoDocumento, documento: cliente.documento, nombre: cliente.nombre } : null,
    ocupacionId: aNumero(form.ocupacionId),
    montoOperacion: montoANumero(form.monto),
    productoId: aNumero(form.productoId),
    canalId: aNumero(form.canalId),
    medioPagoId: aNumero(form.medioPagoId),
    departamentoResidenciaId: aNumero(form.departamentoResidenciaId),
    departamentoOperacionId: aNumero(form.departamentoOperacionId),
    paisFondosId: aNumero(form.paisFondosId),
    sustentoId: form.sustentoId,
  };
}
