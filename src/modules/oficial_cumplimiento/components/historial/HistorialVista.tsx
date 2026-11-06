'use client';

import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Check, Eye, History, Lock, Pencil, UserMinus } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoHistorial, IconoOficial } from '@/shared/ui/iconos';
import { fechaCorta, fechaHora } from '../../lib/formato';
import type { CatalogosOficial, EventoHistorial, HistorialOficial } from '../../services/oficialService';
import { TarjetaPendientes } from '../comunicacion/TarjetaPendientes';
import { BTN, EtiquetaServidor, FilaClave, RUTA_OFICIAL, Tarjeta } from '../piezas';

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

const CAJA_LILA = 'bg-brand-soft text-brand-ink';
const CAJA_VERDE = 'bg-ok-soft text-ok';
const CAJA_ROJA = 'bg-bad-soft text-bad';
const CAJA_NEUTRA = 'border border-line bg-[#fbfbfc] text-ink';

/** Icono y color de la caja de cada tipo de evento (los cuatro primeros son los del diseño; el servidor puede mandar otros). */
const ESTILO_EVENTO: Record<string, { icono: Icono; caja: string }> = {
  DESIGNACION_GUARDADA: { icono: IconoOficial, caja: CAJA_VERDE },
  DESIGNACION_CORREGIDA: { icono: Pencil, caja: CAJA_LILA },
  COMUNICACION_PRESENTADA: { icono: ArrowRight, caja: CAJA_NEUTRA },
  DESIGNACION_PROCEDENTE: { icono: Check, caja: CAJA_VERDE },
  DESIGNACION_NO_PROCEDENTE: { icono: AlertTriangle, caja: CAJA_ROJA },
  CODIGOS_ACTUALIZADOS: { icono: Lock, caja: CAJA_LILA },
  CAMBIO_DATOS: { icono: Pencil, caja: CAJA_LILA },
  CAMBIO_COMUNICADO: { icono: Check, caja: CAJA_VERDE },
  REMOCION: { icono: UserMinus, caja: CAJA_ROJA },
  REMOCION_COMUNICADA: { icono: ArrowRight, caja: CAJA_NEUTRA },
};
const ESTILO_BASE = { icono: History, caja: CAJA_NEUTRA };

/** Un evento del historial: qué pasó, el detalle que anotó el servidor (sin códigos secretos), el motivo, y quién lo hizo y cuándo. */
function FilaEvento({ evento }: { evento: EventoHistorial }) {
  const { icono: IconoEvento, caja } = ESTILO_EVENTO[evento.tipo] ?? ESTILO_BASE;
  const hayCambios = evento.cambios.length > 0;
  return (
    <li className="flex gap-4 py-[18px] pl-4 pr-4 sm:pl-5 sm:pr-6">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${caja}`} aria-hidden="true">
        <IconoEvento className="h-[18px] w-[18px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-x-4 gap-y-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h3 className="min-w-0 break-words text-base font-semibold text-ink">{evento.titulo}</h3>
            {evento.etiqueta && <EtiquetaServidor etiqueta={evento.etiqueta} className="shrink-0" />}
          </div>
          {hayCambios ? (
            <ul className="mt-1 flex flex-col gap-0.5 text-sm leading-[21px] text-ink/80">
              {evento.cambios.map((c) => (
                <li key={c.campo} className="break-words [overflow-wrap:anywhere]">
                  <span className="font-medium text-ink">{c.etiqueta}:</span> {c.antes || '(vacío)'} → {c.despues || '(vacío)'}
                </li>
              ))}
            </ul>
          ) : (
            evento.detalle && <p className="mt-1 whitespace-pre-line break-words text-sm leading-[21px] text-ink/80">{evento.detalle}</p>
          )}
          {evento.motivo && <p className="mt-1 whitespace-pre-line break-words text-sm leading-[21px] text-ink/80">Motivo: {evento.motivo}</p>}
        </div>
        <div className="flex min-w-0 flex-col gap-0.5 sm:w-44 sm:shrink-0 sm:items-end sm:text-right">
          <p className="break-words text-sm font-medium text-ink">{evento.usuario.nombreCompleto || evento.usuario.usuario}</p>
          <p className="font-mono text-[11px] tracking-[0.02em] text-muted">{fechaHora(evento.fechaHora)}</p>
        </div>
      </div>
    </li>
  );
}

/**
 * OC 11 · Historial del oficial: lo que se hizo con esta designación (guardarla, comunicarla a la UIF, cambiar datos, removerla), de lo
 * más nuevo a lo más viejo, con quién y cuándo. Es solo de lectura: el servidor no tiene forma de editar ni borrar un evento.
 * `idExplicito` es el id de la URL cuando se mira a un oficial anterior (para volver a su ficha).
 */
export function HistorialVista({ historial, catalogos, idExplicito }: { historial: HistorialOficial; catalogos: CatalogosOficial; idExplicito: string | null }) {
  const sufijo = idExplicito ? `?id=${encodeURIComponent(idExplicito)}` : '';
  const { vigencia } = historial;

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo={historial.nombreCompleto}
        icono={IconoHistorial}
        titulo="Historial del oficial"
        descripcion="Designación, comunicaciones a la UIF y cambios de datos, con quién y cuándo. No se puede editar ni borrar."
        sinLinea
        acciones={
          <Link href={`${RUTA_OFICIAL}/ficha${sufijo}`} className={`btn btn-secondary ${BTN}`}>
            <Eye className="h-4 w-4" aria-hidden="true" /> Volver a la ficha
          </Link>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,33%,28.75rem)]">
        <section className="card min-w-0" aria-label="Eventos del historial, del más reciente al más antiguo">
          {historial.eventos.length > 0 ? (
            <ol className="divide-y divide-line">
              {historial.eventos.map((evento) => <FilaEvento key={evento.id} evento={evento} />)}
            </ol>
          ) : (
            <p className="px-6 py-8 text-center text-sm text-muted">Todavía no hay eventos en el historial de esta designación.</p>
          )}
        </section>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Pendientes y vigencia">
          <TarjetaPendientes
            pendientes={historial.pendientesUif}
            catalogos={catalogos}
            puedeRegistrar={false}
            titulo="Pendiente con la UIF"
            descripcion="Lo que falta comunicar."
          />
          <Tarjeta titulo="Vigencia" className="!gap-3">
            <FilaClave rotulo="Estado">{vigencia.estadoEtiqueta}</FilaClave>
            <FilaClave rotulo="En el cargo desde">{fechaCorta(vigencia.enElCargoDesde) || '—'}</FilaClave>
            <FilaClave rotulo="Revisión sugerida de requisitos">{fechaCorta(vigencia.revisionSugerida) || '—'}</FilaClave>
          </Tarjeta>
        </aside>
      </div>
    </PageShell>
  );
}
