'use client';

import { useCallback, type ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Etiqueta } from '@/shared/ui/kit';
import { useCarga } from '../hooks/useCarga';
import { etiquetaDePlazo, fechaCorta, reglaTexto } from '../lib/formato';
import { oficialService, type CatalogosOficial } from '../services/oficialService';
import { esFechaCompleta } from './campos';
import { FilaClave as Fila, Tarjeta } from './piezas';

/**
 * Tarjeta «Comunicar a la UIF» de las pantallas que registran un hecho (cambio de datos, corrección): el vencimiento lo calcula el
 * servidor con la fecha de partida (días hábiles, con feriados si ya están cargados). El front solo lo pide y lo pinta, y lo pide de
 * nuevo cuando la fecha cambia; nunca suma días por su cuenta.
 */
export function TarjetaPlazoCalculado({ regla, desde, catalogos, titulo, descripcion, rotuloDesde, children }: {
  /** Código de la regla del plazo (por ejemplo `PLAZO_COMUNICAR_CAMBIO`). */
  regla: string;
  /** Fecha de partida AAAA-MM-DD; mientras no sea una fecha completa se muestra la regla sin vencimiento. */
  desde: string;
  catalogos: CatalogosOficial;
  titulo: string;
  descripcion?: string;
  /** Rótulo de la fila con la fecha de partida («Cambio registrado»). */
  rotuloDesde: string;
  children?: ReactNode;
}) {
  const hayFecha = esFechaCompleta(desde);
  const leer = useCallback(() => (hayFecha ? oficialService.plazo(regla, desde) : Promise.resolve(null)), [hayFecha, regla, desde]);
  const { datos: plazo, error, cargando } = useCarga(leer, 'No se pudo calcular el vencimiento.');

  const reglaDelServidor = catalogos.reglas.find((r) => r.codigo === regla);
  const total = plazo ? etiquetaDePlazo(plazo) : reglaTexto(reglaDelServidor)?.toUpperCase();
  const esperando = hayFecha && cargando && !error;

  return (
    <Tarjeta titulo={titulo} descripcion={descripcion} derecha={total ? <Etiqueta tono="warn" className="shrink-0">{total}</Etiqueta> : undefined} className="!gap-3">
      <Fila rotulo={rotuloDesde}>{hayFecha ? fechaCorta(desde) : '—'}</Fila>
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
      {children}
    </Tarjeta>
  );
}
