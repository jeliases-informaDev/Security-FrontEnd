'use client';

import { AccesoDenegado, ConFicha } from '../PantallaCarga';
import { Asistente } from './Asistente';

const TITULO = 'Corregir la designación';

/**
 * Ruta `/oficial-cumplimiento/corregir`: corrige la designación del titular mientras no se comunica a la UIF (por ejemplo, tras un
 * «No procedente»). Es el asistente de designación ya lleno con lo guardado; solo se abre si el servidor dice que se puede corregir.
 */
export function PantallaCorregir() {
  return (
    <ConFicha titulo={TITULO}>
      {({ estado, catalogos, ficha }) =>
        ficha.permisos.puedeCorregir ? (
          <Asistente estado={estado} catalogos={catalogos} correccion={ficha} />
        ) : (
          <AccesoDenegado
            titulo={TITULO}
            puedeEscribir={ficha.permisos.puedeRegistrarPendientes}
            motivo="Solo se corrige una designación que todavía no se comunicó a la UIF. Si ya se comunicó, usa «Cambiar datos»."
          />
        )
      }
    </ConFicha>
  );
}
