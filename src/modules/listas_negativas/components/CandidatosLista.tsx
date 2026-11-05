'use client';

import { Flag } from 'lucide-react';
import { Boton, Paginacion } from '@/shared/ui/kit';
import type { BusquedaCandidatos } from '../services/listasNegativasService';
import { iniciales, nombreTipoPersona, plural } from '../lib/formato';

interface Props {
  busqueda: BusquedaCandidatos;
  /** Candidato que se está abriendo (para mostrar la carga en su botón). */
  abriendo: number | null;
  cargandoPagina: boolean;
  onElegir: (entidadId: number) => void;
  onCambiarPagina: (pagina: number) => void;
}

/** Varias personas coinciden con el nombre escrito: se elige a la correcta y se abre su resultado. */
export function CandidatosLista({ busqueda, abriendo, cargandoPagina, onElegir, onCambiarPagina }: Props) {
  const desde = busqueda.totalElements === 0 ? 0 : busqueda.number * busqueda.size + 1;
  const hasta = Math.min(busqueda.totalElements, (busqueda.number + 1) * busqueda.size);

  return (
    <section className="card aparece overflow-hidden" aria-labelledby="titulo-candidatos">
      <div className="flex flex-col gap-1 p-6 pb-4">
        <h2 id="titulo-candidatos" className="text-[17px] font-semibold leading-[25.5px] tracking-[-0.01em] text-ink">Elige a la persona</h2>
        <p className="text-[15px] leading-[22px] text-muted">
          {plural(busqueda.totalElements, 'persona coincide', 'personas coinciden')} con «{busqueda.criterio.texto}». Verifica que no sea un homónimo antes de continuar.
        </p>
      </div>

      <ul className={`flex flex-col px-6 transition-opacity ${cargandoPagina ? 'opacity-60' : ''}`}>
        {busqueda.candidatos.map((c) => {
          const linea = [c.documento ? `${c.tipoDocumento ?? 'Doc.'} ${c.documento}` : null, nombreTipoPersona(c.tipoPersona), c.pais].filter(Boolean).join(' · ');
          return (
            <li key={c.entidadId} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-line py-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent" aria-hidden="true">{iniciales(c.nombre)}</span>
              <div className="min-w-0 flex-1 basis-56">
                <p className="break-words text-[15px] font-medium leading-[22px] text-ink">{c.nombre}</p>
                {linea && <p className="rotulo">{linea}</p>}
                {c.alias && <p className="text-[13px] leading-[22px] text-muted">También: {c.alias}</p>}
                {c.listas.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {c.listas.map((lista) => <span key={lista} className="badge badge-neutral max-w-[16rem] truncate">{lista}</span>)}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {c.esPep && <span className="badge badge-bad gap-1.5"><Flag className="h-3 w-3" aria-hidden="true" />PEP</span>}
                <span className="badge badge-neutral">{plural(c.apariciones, 'aparición', 'apariciones')}</span>
                <Boton
                  variante={c.consultaId != null ? 'secundario' : 'primario'}
                  className="h-[46px] text-[15px]"
                  cargando={abriendo === c.entidadId}
                  disabled={abriendo != null}
                  onClick={() => onElegir(c.entidadId)}
                >
                  {c.consultaId != null ? 'Volver a abrir' : 'Ver resultado'}
                </Boton>
              </div>
            </li>
          );
        })}
      </ul>

      <Paginacion
        desde={desde}
        hasta={hasta}
        total={busqueda.totalElements}
        pagina={busqueda.number}
        totalPaginas={busqueda.totalPages}
        cargando={cargandoPagina}
        onCambiar={onCambiarPagina}
      />
    </section>
  );
}
