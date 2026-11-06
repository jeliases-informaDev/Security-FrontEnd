'use client';

import { AccesoDenegado, ConFicha } from '../PantallaCarga';
import { ComunicacionUif } from './ComunicacionUif';

const TITULO = 'Comunicación a la UIF';

/** Ruta `/oficial-cumplimiento/comunicacion`: registra la comunicación a la UIF del titular de hoy (OC 8). */
export function PantallaComunicacion() {
  return (
    <ConFicha titulo={TITULO}>
      {({ ficha, catalogos }) =>
        ficha.permisos.puedeComunicar ? (
          <ComunicacionUif ficha={ficha} catalogos={catalogos} />
        ) : (
          <AccesoDenegado titulo={TITULO} puedeEscribir={ficha.permisos.puedeRegistrarPendientes} motivo="Esta designación ya no admite registrar comunicaciones a la UIF." />
        )
      }
    </ConFicha>
  );
}
