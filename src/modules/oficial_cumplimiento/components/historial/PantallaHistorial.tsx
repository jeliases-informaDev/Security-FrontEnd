'use client';

import { useSearchParams } from 'next/navigation';
import { useHistorialOficial } from '../../hooks/useCarga';
import type { CatalogosOficial } from '../../services/oficialService';
import { ConEstado, MarcoCarga } from '../PantallaCarga';
import { EsqueletoPagina, ErrorPagina } from '../piezas';
import { HistorialVista } from './HistorialVista';

const TITULO = 'Historial del oficial';

/** Lee el historial de una designación ya conocida; mientras tanto el esqueleto y, si falla, el error con «Reintentar». */
function ConHistorial({ id, catalogos, idExplicito }: { id: string; catalogos: CatalogosOficial; idExplicito: string | null }) {
  const historial = useHistorialOficial(id);
  if (historial.error) return <MarcoCarga titulo={TITULO}><ErrorPagina mensaje={historial.error} onReintentar={historial.recargar} /></MarcoCarga>;
  if (!historial.datos) return <MarcoCarga titulo={TITULO}><EsqueletoPagina /></MarcoCarga>;
  return <HistorialVista historial={historial.datos} catalogos={catalogos} idExplicito={idExplicito} />;
}

/**
 * Ruta `/oficial-cumplimiento/historial`: el historial del titular de hoy o, con `?id=<designación>`, el de un oficial anterior.
 * Cualquier cuenta de la empresa puede verlo: es solo lectura.
 */
export function PantallaHistorial() {
  const id = useSearchParams().get('id');
  return (
    <ConEstado titulo={TITULO}>
      {(estado, catalogos) => {
        const designacionId = id ?? estado.titular?.id ?? null;
        return designacionId ? (
          <ConHistorial id={designacionId} catalogos={catalogos} idExplicito={id} />
        ) : (
          <MarcoCarga titulo={TITULO}>
            <ErrorPagina mensaje="Tu empresa todavía no tiene un oficial de cumplimiento designado." />
          </MarcoCarga>
        );
      }}
    </ConEstado>
  );
}
