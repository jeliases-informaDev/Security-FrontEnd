'use client';

import { useSearchParams } from 'next/navigation';
import { ConFicha } from '../PantallaCarga';
import { FichaVista } from './FichaVista';

/**
 * Ruta `/oficial-cumplimiento/ficha`: la ficha del titular de hoy o, con `?id=<designación>`, la de un oficial anterior
 * (se llega desde el historial). Si el servidor no reconoce el id (otra empresa, borrado), muestra su mensaje.
 */
export function PantallaFicha() {
  const id = useSearchParams().get('id');
  return (
    <ConFicha titulo="Oficial de cumplimiento" designacionId={id}>
      {({ ficha, catalogos, recargar }) => <FichaVista ficha={ficha} catalogos={catalogos} recargar={recargar} idExplicito={id} />}
    </ConFicha>
  );
}
