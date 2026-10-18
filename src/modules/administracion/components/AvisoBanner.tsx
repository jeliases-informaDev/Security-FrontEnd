import type { ReactNode } from 'react';
import { Aviso as AvisoKit, type AvisoDatos } from '@/shared/ui/kit';

export type Aviso = AvisoDatos;

/** Franja de confirmación (verde) o de error (roja) con botón para cerrarla. Es el Aviso del sistema visual, con margen inferior. */
export function AvisoBanner({ aviso, onCerrar, children }: { aviso: Aviso; onCerrar: () => void; children?: ReactNode }) {
  return <AvisoKit aviso={aviso} onCerrar={onCerrar} className="mb-5">{children}</AvisoKit>;
}
