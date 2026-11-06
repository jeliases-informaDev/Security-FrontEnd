import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Etiqueta } from '@/shared/ui/kit';
import { diasTexto, fechaCorta } from '../lib/formato';
import type { EstadoPlazo, Plazo } from '../services/oficialService';
import { FilaClave, Tarjeta } from './piezas';

const TONO: Record<EstadoPlazo, 'ok' | 'warn' | 'bad'> = { EN_PLAZO: 'ok', POR_VENCER: 'warn', VENCIDO: 'bad' };
const RELLENO: Record<EstadoPlazo, string> = { EN_PLAZO: 'bg-brand', POR_VENCER: 'bg-warn', VENCIDO: 'bg-bad' };

/** Etiqueta del estado de un plazo («En plazo», «Por vencer», «Vencido»), con el texto y el tono que corresponden. */
export function EtiquetaPlazo({ plazo, className = '' }: { plazo: Plazo; className?: string }) {
  return <Etiqueta tono={TONO[plazo.estado]} className={className}>{plazo.estadoEtiqueta}</Etiqueta>;
}

/** Lo que va en grande: los días que quedan, tal como los contó el servidor (la unidad también la manda él). */
export function textoDeDiasRestantes(plazo: Plazo): string {
  if (plazo.estado === 'VENCIDO') return 'Plazo vencido';
  if (plazo.diasRestantes === 0) return 'Vence hoy';
  return diasTexto(plazo.diasRestantes, plazo.unidad);
}

/**
 * Tarjeta de un plazo que calcula el servidor: etiqueta de estado (en plazo / por vencer / vencido), días que quedan en grande,
 * barra de avance y fecha de vencimiento. El front solo pinta lo que llega; no suma ni compara fechas.
 */
export function TarjetaPlazo({ plazo, titulo, descripcion, children, className = '' }: { plazo: Plazo; titulo: string; descripcion?: ReactNode; children?: ReactNode; className?: string }) {
  const grande = textoDeDiasRestantes(plazo);
  return (
    <Tarjeta
      titulo={titulo}
      descripcion={descripcion}
      derecha={<Etiqueta tono={TONO[plazo.estado]} className="shrink-0">{plazo.estadoEtiqueta}</Etiqueta>}
      centrada
      className={`!gap-3 ${className}`}
    >
      <p className="text-[36px] font-bold leading-[1.3] tracking-[-0.02em] text-ink">{grande}</p>
      <div
        role="progressbar"
        aria-label={`Avance del plazo: ${titulo}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={plazo.avance}
        aria-valuetext={`${grande}. Vence el ${fechaCorta(plazo.vence)}`}
        className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.08]"
      >
        <div className={`h-2 rounded-full ${RELLENO[plazo.estado]}`} style={{ width: `${Math.min(100, Math.max(0, plazo.avance))}%` }} />
      </div>
      <FilaClave rotulo="Vence el">{fechaCorta(plazo.vence)}</FilaClave>
      {!plazo.cuentaFeriados && (
        <p className="flex items-start gap-2 text-sm text-warn">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Plazo estimado: no cuenta feriados.
        </p>
      )}
      {children}
    </Tarjeta>
  );
}
