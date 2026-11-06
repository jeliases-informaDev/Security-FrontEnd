// Formatos de la entrega B de Registro de Operaciones (solo presentación: ninguna regla de negocio vive aquí).

import { hoyIso, mesLargo, montoTexto } from './formato';

/** «US$ 128,500.00». */
export const usd = (monto: number): string => `US$ ${montoTexto(monto)}`;

/** Tipo de cambio con sus seis decimales: «3.512345». */
export const tipoCambioTexto = (valor: number): string => valor.toFixed(6);

/** Segundos que faltan → «23 h 12 min» (con menos de una hora, «12 min»; con menos de un minuto, «Menos de 1 min»). */
export function tiempoRestante(segundos: number): string {
  const minutos = Math.floor(Math.max(0, segundos) / 60);
  if (minutos < 1) return 'Menos de 1 min';
  const horas = Math.floor(minutos / 60);
  return horas > 0 ? `${horas} h ${minutos % 60} min` : `${minutos} min`;
}

/** Los últimos meses calendario, el actual primero: [{ valor: '2026-11', etiqueta: 'Noviembre 2026' }, …]. */
export function ultimosMeses(cuantos = 12): { valor: string; etiqueta: string }[] {
  const [anio, mes] = hoyIso().split('-').map(Number);
  return Array.from({ length: cuantos }, (_, i) => {
    const indice = anio * 12 + (mes - 1) - i;
    const periodo = `${Math.floor(indice / 12)}-${String((indice % 12) + 1).padStart(2, '0')}`;
    return { valor: periodo, etiqueta: mesLargo(periodo) };
  });
}

/** «AAAA-MM-DDTHH:MM» de este momento (hora del navegador), para el campo de fecha y hora. */
export function ahoraLocal(): string {
  const d = new Date();
  return `${d.toLocaleDateString('en-CA')}T${d.toTimeString().slice(0, 5)}`;
}

/**
 * Número escrito con punto o con coma decimal y sin separador de miles («3.512345» o «3,512345»), con cuántos enteros y decimales trae.
 * `null` si no es un número. (El tipo de cambio no lleva miles: una coma siempre es el separador decimal.)
 */
export function numeroDecimal(texto: string): { valor: number; enteros: number; decimales: number } | null {
  const limpio = texto.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null;
  const [enteros, decimales = ''] = limpio.split('.');
  return { valor: Number(limpio), enteros: enteros.replace(/^0+(?=\d)/, '').length, decimales: decimales.length };
}
