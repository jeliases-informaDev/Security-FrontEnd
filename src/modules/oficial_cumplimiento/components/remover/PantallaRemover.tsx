'use client';

import { AccesoDenegado, ConFicha } from '../PantallaCarga';
import { RemoverOficial } from './RemoverOficial';

const TITULO = 'Reemplazar o remover';

/** Ruta `/oficial-cumplimiento/remover`: registra la remoción del titular de hoy (OC 12). */
export function PantallaRemover() {
  return (
    <ConFicha titulo={TITULO}>
      {({ ficha, catalogos }) =>
        ficha.permisos.puedeRemover ? (
          <RemoverOficial ficha={ficha} catalogos={catalogos} />
        ) : (
          <AccesoDenegado
            titulo={TITULO}
            puedeEscribir={ficha.permisos.puedeRegistrarPendientes}
            motivo="Solo se remueve a un oficial que ya se comunicó a la UIF. Si todavía no se comunicó, corrige la designación."
          />
        )
      }
    </ConFicha>
  );
}
