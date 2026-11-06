'use client';

import { useCallback } from 'react';
import { Info } from 'lucide-react';
import { useCarga } from '../../hooks/useCarga';
import { diasTexto, fechaCorta, plural, reglaTexto } from '../../lib/formato';
import { oficialService, type CatalogosOficial } from '../../services/oficialService';
import { esFechaCompleta } from '../campos';
import { FilaClave as Fila, Tarjeta } from '../piezas';

const REGLA_VACANCIA = 'VACANCIA_MAXIMA';
const REGLA_ALTERNO = 'ALTERNO_MAXIMO';

/**
 * «Plazos que corren» de la remoción: los vencimientos los calcula el servidor con la fecha de la decisión (días hábiles con feriados
 * si ya están cargados); el front solo los pide y los pinta, y los pide otra vez cuando la fecha cambia. Hasta que haya una fecha
 * completa se muestran las reglas sin fechas.
 */
export function TarjetaPlazosRemocion({ fechaDecision, catalogos }: { fechaDecision: string; catalogos: CatalogosOficial }) {
  const hayFecha = esFechaCompleta(fechaDecision);
  const leer = useCallback(() => (hayFecha ? oficialService.plazosRemocion(fechaDecision) : Promise.resolve(null)), [hayFecha, fechaDecision]);
  const { datos: plazos, error, cargando } = useCarga(leer, 'No se pudieron calcular los vencimientos.');

  const regla = (codigo: string) => reglaTexto(catalogos.reglas.find((r) => r.codigo === codigo));
  const vacante = plazos ? diasTexto(plazos.vacancia.total, plazos.vacancia.unidad) : regla(REGLA_VACANCIA);
  const alterno = plazos ? plural(plazos.alternoMaximoMeses, 'mes', 'meses') : regla(REGLA_ALTERNO);
  const esperando = hayFecha && cargando && !error;
  const vence = (fecha: string | undefined) =>
    fecha ? fechaCorta(fecha) : esperando ? <span className="skeleton inline-block h-4 w-20 align-middle" role="status" aria-label="Calculando el vencimiento" /> : '—';

  return (
    <Tarjeta titulo="Plazos que corren" className="!gap-2.5">
      <Fila rotulo="Comunicar la remoción a la UIF">{vence(plazos?.comunicarRemocion.vence)}</Fila>
      <Fila rotulo={vacante ? `Cargo vacante (máximo ${vacante})` : 'Cargo vacante'}>{vence(plazos?.vacancia.vence)}</Fila>
      <Fila rotulo="Alterno por ausencia (máximo)">{alterno ?? '—'}</Fila>
      {!hayFecha && <p className="text-sm text-muted">Indica la fecha de la decisión para ver cuándo vence cada plazo.</p>}
      {error && hayFecha && <p className="text-sm text-muted" role="status">{error}</p>}
      {plazos && (!plazos.comunicarRemocion.cuentaFeriados || !plazos.vacancia.cuentaFeriados) && (
        <p className="flex items-start gap-2 text-sm text-warn">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Plazo estimado: no cuenta feriados.
        </p>
      )}
    </Tarjeta>
  );
}
