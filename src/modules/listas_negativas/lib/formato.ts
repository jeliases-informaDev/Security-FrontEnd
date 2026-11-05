// Formatos de fechas y textos de Listas Negativas (todo es presentación: ninguna regla de negocio vive aquí).

const formatoHora = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
const formatoDiaMes = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit' });
const formatoDiaMesCorto = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const formatoDiaMesAnio = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const formatoMesAnio = new Intl.DateTimeFormat('es-PE', { month: 'short', year: 'numeric', timeZone: 'UTC' });

const sinPunto = (texto: string) => texto.replace(/\./g, '');

/** «Hoy 16:32», «Ayer 17:20» o «02/11 15:12». */
export function cuando(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return '';
  const ahora = new Date();
  const inicioDeHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  const hora = formatoHora.format(fecha);
  if (fecha.getTime() >= inicioDeHoy) return `Hoy ${hora}`;
  if (fecha.getTime() >= inicioDeHoy - 86_400_000) return `Ayer ${hora}`;
  return `${formatoDiaMes.format(fecha)} ${hora}`;
}

/** Parte de «AAAA-MM-DD» (o de una fecha con hora) sin pasar por la zona horaria del navegador. */
function partesDeFecha(fecha: string): { anio: number; mes: number; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  return m ? { anio: Number(m[1]), mes: Number(m[2]), dia: Number(m[3]) } : null;
}

const aUtc = (fecha: string): Date | null => {
  const p = partesDeFecha(fecha);
  return p ? new Date(Date.UTC(p.anio, p.mes - 1, p.dia)) : null;
};

/** «14/11/2025». */
export function fechaCorta(fecha: string | null): string | null {
  const p = fecha ? partesDeFecha(fecha) : null;
  return p ? `${String(p.dia).padStart(2, '0')}/${String(p.mes).padStart(2, '0')}/${p.anio}` : null;
}

/** «28 oct». */
export function diaYMes(fecha: string | null): string | null {
  const d = fecha ? aUtc(fecha) : null;
  return d ? sinPunto(formatoDiaMesCorto.format(d)) : null;
}

/** «29 oct 2026». */
export function fechaConAnio(fecha: string | null): string | null {
  const d = fecha ? aUtc(fecha) : null;
  return d ? sinPunto(formatoDiaMesAnio.format(d)) : null;
}

/** De «2026-11» a «Nov 2026». */
export function mesYAnio(periodo: string): string {
  const d = aUtc(`${periodo}-01`);
  if (!d) return periodo;
  const texto = sinPunto(formatoMesAnio.format(d));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** «hace 8 años» cuando pasó al menos un año desde la fecha; si no, nada. */
export function haceAnios(fecha: string | null): string | null {
  const p = fecha ? partesDeFecha(fecha) : null;
  if (!p) return null;
  const hoy = new Date();
  let anios = hoy.getFullYear() - p.anio;
  if (hoy.getMonth() + 1 < p.mes || (hoy.getMonth() + 1 === p.mes && hoy.getDate() < p.dia)) anios -= 1;
  if (anios < 1) return null;
  return `hace ${anios} ${anios === 1 ? 'año' : 'años'}`;
}

export function iniciales(nombre: string): string {
  return nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '·';
}

export function nombreTipoPersona(tipo: string | null | undefined): string | null {
  if (tipo === 'NATURAL') return 'Persona natural';
  if (tipo === 'JURIDICA') return 'Persona jurídica';
  return null;
}

/** «Coincidencia media» → «media»: la insignia de las tablas lleva solo la clasificación y el porcentaje. */
export function clasificacionCorta(nombre: string): string {
  return nombre.replace(/^coincidencia\s+/i, '');
}

/** Iniciales de un medio a partir de su dominio («infobae.com» → «IN»). */
export function inicialesDeDominio(dominio: string | null): string {
  const limpio = (dominio ?? '').replace(/^www\./i, '');
  return limpio.slice(0, 2).toUpperCase() || '·';
}

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
