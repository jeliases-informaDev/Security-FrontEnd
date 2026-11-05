import Link from 'next/link';
import type { FilaHistorial } from '@/modules/listas_negativas/services/listasNegativasService';
import { cuando, iniciales } from '@/modules/listas_negativas/lib/formato';
import { InsigniaResultado } from '@/modules/listas_negativas/components/piezas';
import { IconoDerecha } from '@/shared/ui/iconos';

/** Cuántas búsquedas se muestran en la página principal (el servidor manda las tres últimas). */
const CUANTAS = 3;

export type EstadoUltimas = { fase: 'cargando' } | { fase: 'error' } | { fase: 'listo'; items: FilaHistorial[] };

/** Tarjeta «Últimas búsquedas» de la página principal: las consultas más recientes de Listas Negativas, con su porcentaje y clasificación. */
export function UltimasBusquedas({ estado }: { estado: EstadoUltimas }) {
  return (
    <section className="card px-5 pb-[22px] pt-6 sm:px-7" aria-labelledby="titulo-ultimas-busquedas">
      <div className="flex items-center gap-2.5">
        <h2 id="titulo-ultimas-busquedas" className="min-w-0 flex-1 text-[17px] font-semibold leading-[1.5] tracking-[-0.01em] text-ink">Últimas búsquedas</h2>
        <Link href="/listas-negativas/historial" className="inline-flex shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold leading-5 text-ink underline-offset-4 hover:underline">
          Ver todas <IconoDerecha className="h-3.5 w-3.5" />
        </Link>
      </div>

      {estado.fase === 'cargando' && (
        <ul className="mt-2.5 flex flex-col gap-2.5" aria-busy="true" aria-label="Cargando las últimas búsquedas">
          {Array.from({ length: CUANTAS }, (_, i) => (
            <li key={i} className="flex items-center gap-3 py-[7px]">
              <span className="skeleton h-9 w-9 shrink-0 rounded-full" />
              <span className="flex-1 space-y-2">
                <span className="skeleton block h-3.5 w-2/5" />
                <span className="skeleton block h-2.5 w-1/4" />
              </span>
              <span className="skeleton h-6 w-24 rounded-full" />
            </li>
          ))}
        </ul>
      )}

      {estado.fase === 'error' && (
        <p className="mt-4 text-sm text-muted">No se pudo cargar el historial. Puedes verlo completo en Listas Negativas.</p>
      )}

      {estado.fase === 'listo' && estado.items.length === 0 && (
        <p className="mt-4 text-sm text-muted">Todavía no hay búsquedas. La primera que hagas en Listas Negativas aparecerá aquí.</p>
      )}

      {estado.fase === 'listo' && estado.items.length > 0 && (
        <ul className="mt-2.5 flex flex-col gap-2.5">
          {estado.items.slice(0, CUANTAS).map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-[7px]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crema text-xs font-semibold text-ink" aria-hidden="true">
                {iniciales(item.consultado)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium leading-[22px] text-ink">{item.consultado}</span>
                <span className="rotulo block truncate">{item.documento ? `${item.tipoDocumento ?? 'Doc.'} ${item.documento}` : item.tipoConsultaNombre}</span>
              </span>
              <InsigniaResultado clasificacion={item.clasificacion} nombre={item.clasificacionNombre} porcentaje={item.porcentaje} />
              <span className="rotulo hidden shrink-0 sm:block">{cuando(item.fecha)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
