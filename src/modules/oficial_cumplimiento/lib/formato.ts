// Formatos del módulo Oficial de cumplimiento (solo presentación: ninguna regla de negocio ni cálculo de fechas vive aquí).

import type { Adjunto, Plazo, ReglaOficial } from '../services/oficialService';

/** Partes de «AAAA-MM-DD» o «AAAA-MM-DDTHH:MM:SS» sin pasar por la zona horaria del navegador (el servidor ya manda hora de Lima). */
function partes(texto: string | null | undefined) {
  const m = texto ? /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(texto) : null;
  return m ? { anio: m[1], mes: m[2], dia: m[3], hora: m[4], minuto: m[5] } : null;
}

/** «03/11/2026»; vacío si no hay fecha. */
export function fechaCorta(fecha: string | null | undefined): string {
  const p = partes(fecha);
  return p ? `${p.dia}/${p.mes}/${p.anio}` : '';
}

/** «03/11/2026 10:42»; sin hora, solo la fecha. */
export function fechaHora(fechaHoraIso: string | null | undefined): string {
  const p = partes(fechaHoraIso);
  if (!p) return '';
  return `${p.dia}/${p.mes}/${p.anio}${p.hora ? ` ${p.hora}:${p.minuto}` : ''}`;
}

/** «10:42». */
export function soloHora(fechaHoraIso: string | null | undefined): string {
  const p = partes(fechaHoraIso);
  return p?.hora ? `${p.hora}:${p.minuto}` : '';
}

/** «03/11/2026 · 10:42» (fecha y hora separadas por un punto medio, como en el diseño). */
export function fechaYHora(fechaHoraIso: string | null | undefined): string {
  const fecha = fechaCorta(fechaHoraIso);
  const hora = soloHora(fechaHoraIso);
  return hora ? `${fecha} · ${hora}` : fecha;
}

/** Hoy en AAAA-MM-DD (hora del navegador): solo para limitar los selectores de fecha; el servidor valida. */
export const hoyIso = (): string => new Date().toLocaleDateString('en-CA');

/** «1 día», «15 días». */
export const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/** «15 días hábiles», «1 día hábil», «30 días». */
export function diasTexto(n: number, unidad: string): string {
  const habiles = unidad === 'DIAS_HABILES';
  return n === 1 ? (habiles ? '1 día hábil' : '1 día') : habiles ? `${n} días hábiles` : `${n} días`;
}

/** «15 días hábiles» de una regla (la unidad y el valor los fija el servidor). */
export function reglaTexto(regla: ReglaOficial | undefined): string | null {
  if (!regla) return null;
  if (regla.unidad === 'MESES') return plural(regla.valor, 'mes', 'meses');
  return diasTexto(regla.valor, regla.unidad);
}

/** «15 DÍAS HÁBILES» para la etiqueta de una tarjeta de plazo. */
export const etiquetaDePlazo = (plazo: Plazo): string => diasTexto(plazo.total, plazo.unidad).toUpperCase();

/** «PDF · 412 KB» (extensión y tamaño del archivo adjunto). */
export function descripcionArchivo(adjunto: Pick<Adjunto, 'nombre' | 'tamanoBytes'>): string {
  const extension = adjunto.nombre.includes('.') ? adjunto.nombre.split('.').pop()!.toUpperCase() : 'ARCHIVO';
  return `${extension} · ${tamanoLegible(adjunto.tamanoBytes)}`;
}

/** «412 KB» o «1.4 MB». */
export function tamanoLegible(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Texto o, si está vacío, una raya. */
export const textoOGuion = (valor: string | null | undefined): string => (valor && valor.trim() ? valor : '—');

/** Extensión en minúscula de un nombre de archivo. */
export const extensionDe = (nombre: string): string => (nombre.includes('.') ? nombre.split('.').pop()!.toLowerCase() : '');

/** Descarga en el navegador un archivo que llegó del servidor. */
export function guardarArchivo(archivo: Blob, nombre: string): void {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
