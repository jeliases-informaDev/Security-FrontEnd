'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listasNegativasService, type HistorialConsultaResponse } from '@/modules/listas_negativas/services/listasNegativasService';
import { IconoDerecha } from '@/shared/ui/iconos';

/** Cuántas búsquedas se muestran en la página principal. */
const CUANTAS = 3;

const formatoHora = new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
const formatoDia = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });

/** «Hoy 16:32», «Ayer 09:10» o «29 oct». */
function cuando(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return '';
  const ahora = new Date();
  const inicioDeHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  if (fecha.getTime() >= inicioDeHoy) return `Hoy ${formatoHora.format(fecha)}`;
  if (fecha.getTime() >= inicioDeHoy - 86_400_000) return `Ayer ${formatoHora.format(fecha)}`;
  return formatoDia.format(fecha).replace('.', '');
}

const iniciales = (nombre: string) => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '·';

/** Lo que el producto sabe hoy de cada búsqueda: si la persona es PEP y en cuántas listas aparece (no hay porcentaje todavía). */
function Coincidencias({ item }: { item: HistorialConsultaResponse }) {
  const manchas = item.resultado.manchas ?? [];
  if (manchas.length === 0) return <span className="badge badge-ok">Sin coincidencias</span>;
  if (manchas.some((mancha) => mancha.esPep)) return <span className="badge badge-bad">PEP</span>;
  return <span className="badge badge-warn">{manchas.length} {manchas.length === 1 ? 'coincidencia' : 'coincidencias'}</span>;
}

type Estado = { fase: 'cargando' } | { fase: 'error' } | { fase: 'listo'; items: HistorialConsultaResponse[] };

/** Tarjeta «Últimas búsquedas» de la página principal: las más recientes del historial real de Listas Negativas. */
export function UltimasBusquedas() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });

  useEffect(() => {
    let vigente = true;
    listasNegativasService
      .obtenerHistorial(0, CUANTAS)
      .then((pagina) => { if (vigente) setEstado({ fase: 'listo', items: (pagina.content ?? []).slice(0, CUANTAS) }); })
      .catch(() => { if (vigente) setEstado({ fase: 'error' }); });
    return () => { vigente = false; };
  }, []);

  return (
    <section className="card px-5 pb-[22px] pt-6 sm:px-7" aria-labelledby="titulo-ultimas-busquedas">
      <div className="flex items-center gap-2.5">
        <h2 id="titulo-ultimas-busquedas" className="min-w-0 flex-1 text-[17px] font-semibold leading-[1.5] tracking-[-0.01em] text-ink">Últimas búsquedas</h2>
        <Link href="/listas-negativas" className="inline-flex shrink-0 items-center gap-1.5 rounded-full text-sm font-semibold leading-5 text-ink underline-offset-4 hover:underline">
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
          {estado.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-[7px]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-crema text-xs font-semibold text-ink" aria-hidden="true">
                {iniciales(item.resultado.nombreCompleto)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium leading-[22px] text-ink">{item.resultado.nombreCompleto}</span>
                <span className="rotulo block truncate">{item.resultado.tipoDocumento ?? 'Doc.'} {item.resultado.documento}</span>
              </span>
              <Coincidencias item={item} />
              <span className="rotulo hidden shrink-0 sm:block">{cuando(item.fechaConsulta)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
