// Formatos de Registro de Operaciones (solo presentación: ninguna regla de negocio vive aquí).

import type { OperacionDetalleDatos, OperacionItem } from '../services/operacionesService';

export { fechaCorta, iniciales } from '@/modules/listas_negativas/lib/formato';

const formatoMonto = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoMes = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** «128,500.00». */
export const montoTexto = (monto: number): string => formatoMonto.format(monto);

/** Símbolo o código de la moneda; con un texto viejo irreconocible se usa tal cual. */
export function monedaTexto(d: { monedaSimbolo: string | null; monedaCodigo: string | null; moneda: string | null }): string {
  return d.monedaCodigo ? (d.monedaSimbolo ?? d.monedaCodigo) : (d.moneda ?? '');
}

/** «S/ 520,000.00» (lista y tarjetas). */
export function montoConMoneda(d: OperacionItem | OperacionDetalleDatos): string {
  if (d.monto == null) return '—';
  const moneda = monedaTexto(d);
  return `${moneda} ${montoTexto(d.monto)}`.trim();
}

/** Partes de «AAAA-MM-DDTHH:MM:SS» sin pasar por la zona horaria del navegador (el servidor ya manda hora de Lima). */
function partes(fechaHora: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(fechaHora);
  return m ? { anio: m[1], mes: m[2], dia: m[3], hora: m[4], minuto: m[5] } : null;
}

/** «03/11/2026 11:08». */
export function fechaHora(fechaHoraIso: string | null): string {
  const p = fechaHoraIso ? partes(fechaHoraIso) : null;
  if (!p) return '';
  return `${p.dia}/${p.mes}/${p.anio}${p.hora ? ` ${p.hora}:${p.minuto}` : ''}`;
}

/** «10:42». */
export function soloHora(fechaHoraIso: string | null): string {
  const p = fechaHoraIso ? partes(fechaHoraIso) : null;
  return p?.hora ? `${p.hora}:${p.minuto}` : '';
}

/** De «2026-11» a «Noviembre 2026». */
export function mesLargo(periodo: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo);
  if (!m) return periodo;
  const texto = formatoMes.format(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1))).replace(' de ', ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Primer nombre de «Ana Prueba Torres» (la lista muestra solo eso junto al avatar). */
export const nombreCorto = (nombreCompleto: string): string => nombreCompleto.trim().split(/\s+/)[0] ?? nombreCompleto;

/** Texto escrito por la persona → número (acepta «128,500.00» y «128500,50»); `null` si no es un monto válido. */
export function montoANumero(texto: string): number | null {
  let limpio = texto.replace(/\s/g, '');
  if (!limpio) return null;
  limpio = /,\d{1,2}$/.test(limpio) && !limpio.includes('.') ? limpio.replace(',', '.') : limpio.replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null;
  return Number(limpio);
}

/** Cuántos decimales trae lo escrito (el servidor acepta hasta 2). */
export function decimalesDe(texto: string): number {
  const limpio = texto.replace(/\s/g, '');
  const m = /[.,](\d+)$/.exec(limpio);
  return m ? m[1].length : 0;
}

/** Texto o, si está vacío, una raya. */
export const textoOGuion = (valor: string | null | undefined): string => (valor && valor.trim() ? valor : '—');

/** Hoy en formato AAAA-MM-DD (hora del navegador; el servidor pone la fecha de registro). */
export const hoyIso = (): string => new Date().toLocaleDateString('en-CA');
