// Geometría y escalas de los instrumentos de la «Cabina de mando» (todo puro: sin React y sin acceso al DOM).

import { esNumero } from './formato';

export const limitar = (valor: number, minimo: number, maximo: number): number => Math.min(maximo, Math.max(minimo, valor));

/** Un punto sobre una circunferencia. Ángulo en grados: 0 = derecha y 90 = abajo (en SVG el eje y crece hacia abajo, así que el giro positivo es el horario). */
export function polar(cx: number, cy: number, radio: number, grados: number): { x: number; y: number } {
  const rad = (grados * Math.PI) / 180;
  return { x: cx + radio * Math.cos(rad), y: cy + radio * Math.sin(rad) };
}

const f = (n: number) => n.toFixed(2);

/** Sector de anillo entre `radioInterior` y `radioExterior`, de `desde` a `hasta` grados en sentido horario (menos de 180 grados de abertura). */
export function sectorAnillo(cx: number, cy: number, radioInterior: number, radioExterior: number, desde: number, hasta: number): string {
  const a = polar(cx, cy, radioExterior, desde);
  const b = polar(cx, cy, radioExterior, hasta);
  const c = polar(cx, cy, radioInterior, hasta);
  const d = polar(cx, cy, radioInterior, desde);
  const grande = hasta - desde > 180 ? 1 : 0;
  return `M${f(a.x)} ${f(a.y)}A${radioExterior} ${radioExterior} 0 ${grande} 1 ${f(b.x)} ${f(b.y)}L${f(c.x)} ${f(c.y)}A${radioInterior} ${radioInterior} 0 ${grande} 0 ${f(d.x)} ${f(d.y)}Z`;
}

/** Arco de una circunferencia (solo línea) de `desde` a `hasta` grados en sentido horario. */
export function arco(cx: number, cy: number, radio: number, desde: number, hasta: number): string {
  const a = polar(cx, cy, radio, desde);
  const b = polar(cx, cy, radio, hasta);
  return `M${f(a.x)} ${f(a.y)}A${radio} ${radio} 0 ${hasta - desde > 180 ? 1 : 0} 1 ${f(b.x)} ${f(b.y)}`;
}

/** «M10 20L30 40…»: los puntos como una línea quebrada. */
export function lineaQuebrada(puntos: readonly { x: number; y: number }[]): string {
  return puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p.x)} ${f(p.y)}`).join('');
}

/**
 * Marcas de un eje que parte de 0: un máximo redondo y 4 o 5 marcas con números enteros limpios (0, 5, 10…; nunca 2,5).
 * Como todo lo que se cuenta aquí son cantidades enteras, el paso mínimo es 1.
 */
export function marcasEje(maximo: number, objetivo = 4): { max: number; marcas: number[] } {
  const m = Math.max(1, esNumero(maximo) ? maximo : 1);
  const crudo = m / objetivo;
  const potencia = Math.pow(10, Math.floor(Math.log10(crudo)));
  const fraccion = crudo / potencia;
  const paso = Math.max(1, (fraccion <= 1 ? 1 : fraccion <= 2 ? 2 : fraccion <= 5 ? 5 : 10) * potencia);
  const max = Math.ceil(m / paso) * paso;
  const marcas: number[] = [];
  for (let v = 0; v <= max + paso / 2; v += paso) marcas.push(Math.round(v));
  return { max, marcas };
}

/** Un arreglo de exactamente `largo` enteros: lo que falta o no es número cuenta como 0 (los días sin datos). */
export function serieDe(valores: readonly unknown[] | null | undefined, largo: number): number[] {
  return Array.from({ length: largo }, (_, i) => {
    const v = valores?.[i];
    return esNumero(v) && v > 0 ? v : 0;
  });
}

/** «AAAA-MM-DD» del día `indice` después de `desde` (sin pasar por la zona horaria del navegador). Null si `desde` no es una fecha. */
export function fechaDelDia(desde: string | null | undefined, indice: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(desde ?? '');
  if (!m) return null;
  const fecha = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + indice));
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString().slice(0, 10);
}

const formatoDiaLargo = new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/** «mié 5 nov» a partir de «AAAA-MM-DD». */
export function diaLargo(fecha: string | null): string | null {
  const m = fecha ? /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha) : null;
  if (!m) return null;
  return formatoDiaLargo.format(new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))).replace(/\./g, '');
}

/** Quita tildes y mayúsculas y junta los espacios: «San  Martín» y «SAN MARTIN» dan lo mismo. */
export function normalizarNombre(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
