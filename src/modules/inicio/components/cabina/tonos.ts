import type { EstadoLuz } from '../../lib/luces';

/*
 * Colores de estado de la «Cabina de mando» (verde, ámbar, rojo y gris) para fondo oscuro: son clases de Tailwind que salen de los
 * tokens `--cabina-*` de globals.css. Ningún estado va solo en color: siempre lo acompaña su palabra (NORMAL, REVISAR…).
 */

export const TEXTO_ESTADO: Record<EstadoLuz, string> = {
  verde: 'text-cabina-ok',
  ambar: 'text-cabina-warn',
  rojo: 'text-cabina-bad',
  gris: 'text-cabina-tenue',
};

export const FONDO_ESTADO: Record<EstadoLuz, string> = {
  verde: 'bg-cabina-ok',
  ambar: 'bg-cabina-warn',
  rojo: 'bg-cabina-bad',
  gris: 'bg-cabina-tenue',
};

/** Cápsula de estado: borde y fondo suaves del mismo color que el texto. */
export const CHIP_ESTADO: Record<EstadoLuz, string> = {
  verde: 'border-cabina-ok/40 bg-cabina-ok-suave text-cabina-ok',
  ambar: 'border-cabina-warn/40 bg-cabina-warn-suave text-cabina-warn',
  rojo: 'border-cabina-bad/40 bg-cabina-bad-suave text-cabina-bad',
  gris: 'border-cabina-borde bg-cabina-panel text-cabina-texto-2',
};

/** La palabra que acompaña a cada color (para que el estado no dependa de verlo). */
export const PALABRA_ESTADO: Record<EstadoLuz, string> = {
  verde: 'NORMAL',
  ambar: 'REVISAR',
  rojo: 'ATENCIÓN',
  gris: 'SIN DATO',
};
