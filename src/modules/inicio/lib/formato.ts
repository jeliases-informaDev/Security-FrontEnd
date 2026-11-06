// Formatos del tablero de Inicio (solo presentación: ninguna regla de negocio vive aquí).
// Lo que el servidor no pudo calcular llega como null y se muestra como una raya, nunca como «null» ni «NaN».

import { montoTexto } from '@/modules/operaciones/lib/formato';

export { diaYMes, fechaCorta, iniciales, plural } from '@/modules/listas_negativas/lib/formato';

export const SIN_DATO = '—';

export const esNumero = (valor: unknown): valor is number => typeof valor === 'number' && Number.isFinite(valor);

/** Los números del servidor sin nulos ni NaN, en el mismo orden (para las mini-series). */
export const soloNumeros = (valores: readonly unknown[] | null | undefined): number[] => (valores ?? []).filter(esNumero);

/** «1,234» (igual que el resto de PLAFT); sin dato, una raya. */
export function entero(valor: number | null | undefined): string {
  return esNumero(valor) ? Math.round(valor).toLocaleString('en-US') : SIN_DATO;
}

/** «23», «4,5»: hasta `maximo` decimales, con coma y sin ceros de sobra (el diseño usa la coma en las cifras resumidas). */
export function decimal(valor: number, maximo = 1): string {
  return valor.toLocaleString('en-US', { maximumFractionDigits: maximo, useGrouping: false }).replace('.', ',');
}

/** Porcentaje sin el signo (el signo va aparte, más pequeño): «23», «4,5». */
export const porcentaje = (valor: number | null | undefined): string => (esNumero(valor) ? decimal(valor) : SIN_DATO);

/** «US$ 2,4 M», «US$ 128,5 mil» o «US$ 850»: monto resumido para las tarjetas de cifras. */
export function montoResumido(valor: number | null | undefined, simbolo = 'US$'): string | null {
  if (!esNumero(valor)) return null;
  const abs = Math.abs(valor);
  if (abs >= 999_950) return `${simbolo} ${decimal(valor / 1_000_000)} M`;
  if (abs >= 1_000) return `${simbolo} ${decimal(valor / 1_000)} mil`;
  return `${simbolo} ${decimal(valor, 2)}`;
}

const SIMBOLO_MONEDA: Record<string, string> = { USD: 'US$', PEN: 'S/', EUR: '€' };

/** «US$ 128,500.00» o «S/ 520,000.00» (las filas de los últimos registros, como la lista de Registro de Operaciones). */
export function montoConSimbolo(monto: number | null | undefined, moneda: string | null | undefined): string {
  if (!esNumero(monto)) return SIN_DATO;
  const codigo = (moneda ?? '').trim().toUpperCase();
  return `${SIMBOLO_MONEDA[codigo] ?? codigo} ${montoTexto(monto)}`.trim();
}

/** Cambio contra el periodo anterior: «▲ +5%», «▼ −3,2%» o «= 0%» (el signo menos es el de verdad, no un guion). */
export function variacion(valor: number): { tendencia: 'sube' | 'baja' | 'igual'; texto: string } {
  const redondeado = Math.round(Math.abs(valor) * 10) / 10;
  if (redondeado === 0) return { tendencia: 'igual', texto: '0%' };
  return valor > 0 ? { tendencia: 'sube', texto: `+${decimal(redondeado)}%` } : { tendencia: 'baja', texto: `−${decimal(redondeado)}%` };
}

/** «Titular», «Alterno»…: el cargo que manda el servidor en mayúsculas, con inicial mayúscula. */
export function cargoLegible(cargo: string | null | undefined): string | null {
  const limpio = (cargo ?? '').trim().replace(/_/g, ' ').toLowerCase();
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : null;
}

/** Texto de un estado desconocido que llega como CODIGO_EN_MAYUSCULAS: «SIN_RESPONSABLE» → «Sin responsable». */
export function legible(codigo: string): string {
  const limpio = codigo.trim().replace(/_/g, ' ').toLowerCase();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
