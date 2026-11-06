'use client';

import { useCallback, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Etiqueta } from '@/shared/ui/kit';
import { useCarga } from '../../hooks/useCarga';
import { etiquetaDePlazo, fechaCorta, reglaTexto } from '../../lib/formato';
import { oficialService, type CatalogosOficial } from '../../services/oficialService';
import { esFechaCompleta } from '../campos';
import { NotaLateral, Tarjeta, URL_SISDEL } from '../piezas';

/** Regla del plazo para comunicar la designación a la UIF (el valor y la unidad los fija el servidor). */
export const REGLA_COMUNICAR_DESIGNACION = 'PLAZO_COMUNICAR_DESIGNACION';

function Fila({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted">{rotulo}</span>
      <span className="font-semibold tabular-nums text-ink">{children}</span>
    </div>
  );
}

/**
 * «Plazo para comunicar a la UIF» (aside del paso 2 y del paso 4). El vencimiento lo calcula el servidor con la fecha de designación
 * (días hábiles, con feriados si ya están cargados): el front solo lo pide y lo pinta, y lo pide de nuevo cuando la fecha cambia.
 * `variante="resumen"` es la del paso 4 (OC 6): sin la fila de la fecha de designación y con el texto corto del diseño.
 */
export function TarjetaPlazoUif({ desde, catalogos, variante = 'paso' }: { desde: string; catalogos: CatalogosOficial; variante?: 'paso' | 'resumen' }) {
  const hayFecha = esFechaCompleta(desde);
  const leer = useCallback(() => (hayFecha ? oficialService.plazo(REGLA_COMUNICAR_DESIGNACION, desde) : Promise.resolve(null)), [hayFecha, desde]);
  const { datos: plazo, error, cargando } = useCarga(leer, 'No se pudo calcular el vencimiento.');

  const regla = catalogos.reglas.find((r) => r.codigo === REGLA_COMUNICAR_DESIGNACION);
  const total = plazo ? etiquetaDePlazo(plazo) : reglaTexto(regla)?.toUpperCase();
  const esperando = hayFecha && cargando && !error;
  const resumen = variante === 'resumen';

  return (
    <Tarjeta
      titulo="Plazo para comunicar a la UIF"
      descripcion={resumen ? undefined : 'Desde la fecha de designación.'}
      derecha={total ? <Etiqueta tono="warn" className="shrink-0">{total}</Etiqueta> : undefined}
      centrada={resumen}
      className={resumen ? '!gap-2.5 !rounded-[22px]' : '!gap-3'}
    >
      {!resumen && <Fila rotulo="Fecha de designación">{hayFecha ? fechaCorta(desde) : '—'}</Fila>}
      <Fila rotulo="Vence el">
        {plazo ? fechaCorta(plazo.vence) : esperando ? <span className="skeleton inline-block h-4 w-20 align-middle" role="status" aria-label="Calculando el vencimiento" /> : '—'}
      </Fila>
      {error && hayFecha && <p className="text-sm text-muted" role="status">{error}</p>}
      {plazo && !plazo.cuentaFeriados && (
        <p className="flex items-start gap-2 text-sm text-warn">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Plazo estimado: no cuenta feriados.
        </p>
      )}
      {resumen ? (
        <p className="text-sm text-muted">Se comunica por SISDEL con las declaraciones y el acta.</p>
      ) : (
        <p className="text-sm text-muted">
          La comunicación se hace por SISDEL (
          <a href={URL_SISDEL} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-2">
            plaft.sbs.gob.pe/sisdel<span className="sr-only"> (se abre en otra pestaña)</span>
          </a>
          ).
        </p>
      )}
    </Tarjeta>
  );
}

/** «Reserva»: nota fija del diseño sobre el Registro Público. */
export function TarjetaReserva() {
  return (
    <NotaLateral rotulo="Reserva">
      La designación no se inscribe en Registros Públicos. Si el oficial tiene también un cargo gerencial, solo se inscribe la parte de ese cargo.
    </NotaLateral>
  );
}
