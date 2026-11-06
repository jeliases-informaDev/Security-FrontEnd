'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoOficial } from '@/shared/ui/iconos';
import { fechaCorta } from '../lib/formato';
import type { EstadoOficial } from '../services/oficialService';
import { BTN, Dato, NotaLateral, NotaSoloLectura, RUTA_OFICIAL, Tarjeta } from './piezas';
import { TarjetaPlazo } from './TarjetaPlazo';

/**
 * Pantalla provisional del «Cargo vacante»: su pantalla definitiva (OC 13) todavía no está hecha. Muestra lo que ya manda el servidor
 * y deja funcionando «Designar nuevo oficial». Los estados «En evaluación» y «Vigente» ya usan la ficha (OC 9).
 */
export function OficialResumen({ estado }: { estado: EstadoOficial }) {
  const vacancia = estado.vacancia;
  const puedeDesignar = estado.permisos.puedeDesignar;

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Cumplimiento · UIF-Perú"
        icono={IconoOficial}
        titulo="Oficial de cumplimiento"
        descripcion={estado.estadoEtiqueta}
        sinLinea
        acciones={
          puedeDesignar && (
            <Link href={`${RUTA_OFICIAL}/designar`} className={`btn btn-primary ${BTN}`}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Designar nuevo oficial
            </Link>
          )
        }
      />
      {!puedeDesignar && <NotaSoloLectura className="mb-5" />}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,33%,28.75rem)]">
        <div className="flex min-w-0 flex-col gap-5">
          {vacancia && (
            <Tarjeta titulo="Cargo vacante">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Dato rotulo="Oficial anterior">{vacancia.nombreCompleto}</Dato>
                <Dato rotulo="Motivo">{vacancia.motivoNombre}</Dato>
                <Dato rotulo="Fecha de la decisión">{fechaCorta(vacancia.fechaDecision)}</Dato>
              </div>
            </Tarjeta>
          )}
          <NotaLateral rotulo="Próximamente">El detalle del cargo vacante y su historial se están preparando.</NotaLateral>
        </div>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Plazo para designar">
          {vacancia && <TarjetaPlazo plazo={vacancia.plazoDesignar} titulo="Plazo para designar" />}
        </aside>
      </div>
    </PageShell>
  );
}
