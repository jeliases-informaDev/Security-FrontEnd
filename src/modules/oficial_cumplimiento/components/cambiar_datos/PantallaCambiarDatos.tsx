'use client';

import { AccesoDenegado, ConFicha } from '../PantallaCarga';
import { CambiarDatos } from './CambiarDatos';

const TITULO = 'Cambiar datos';

/** Ruta `/oficial-cumplimiento/cambiar-datos`: corrige el contacto y el cargo del titular de hoy (OC 10). */
export function PantallaCambiarDatos() {
  return (
    <ConFicha titulo={TITULO}>
      {({ ficha, catalogos }) =>
        ficha.permisos.puedeCambiarDatos ? (
          <CambiarDatos ficha={ficha} catalogos={catalogos} />
        ) : (
          <AccesoDenegado
            titulo={TITULO}
            puedeEscribir={ficha.permisos.puedeRegistrarPendientes}
            motivo="Solo se cambian los datos de un oficial que ya se comunicó a la UIF. Si todavía no se comunicó, corrige la designación."
          />
        )
      }
    </ConFicha>
  );
}
