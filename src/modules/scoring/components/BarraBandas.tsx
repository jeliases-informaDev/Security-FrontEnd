import type { NivelRiesgo } from '../services/scoringService';
import { BANDAS, ESCALA, NIVEL } from '../lib/formato';

const FONDO: Record<NivelRiesgo, string> = { BAJO: 'bg-ok-soft', MEDIO: 'bg-brand-soft', ALTO: 'bg-bad-soft' };
const ROTULO: Record<NivelRiesgo, string> = { BAJO: 'text-ok', MEDIO: 'text-info', ALTO: 'text-bad' };
const coma = (n: number) => n.toString().replace('.', ',');

function textoBanda(nivel: NivelRiesgo, desde: number, hasta: number): string {
  if (nivel === 'BAJO') return `menos de ${coma(hasta)}`;
  if (nivel === 'ALTO') return `${coma(desde)} o más`;
  // El borde superior de una banda es el inicio de la siguiente: la de en medio termina 0,01 antes.
  return `${coma(desde)} a ${coma(Number((hasta - 0.01).toFixed(2)))}`;
}

/** Barra de las tres bandas (bajo, medio, alto) con el marcador del puntaje en su sitio. */
export function BarraBandas({ puntaje }: { puntaje: number }) {
  const total = ESCALA.maximo - ESCALA.minimo;
  const posicion = Math.max(0, Math.min(100, ((puntaje - ESCALA.minimo) / total) * 100));
  return (
    <div className="mt-8" role="img" aria-label={`Puntaje ${puntaje.toFixed(2)} en una escala de ${ESCALA.minimo} a ${ESCALA.maximo}`}>
      <div className="relative">
        <div className="flex h-2 overflow-hidden rounded-full">
          {BANDAS.map((b) => (
            <div key={b.nivel} className={FONDO[b.nivel]} style={{ width: `${((b.hasta - b.desde) / total) * 100}%` }} />
          ))}
        </div>
        <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${posicion}%` }}>
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-ink px-2 py-0.5 font-mono text-[11px] text-paper">{puntaje.toFixed(2)}</span>
          <span className="block h-4 w-4 rounded-full border-2 border-white bg-ink shadow" />
        </span>
      </div>
      <div className="mt-3 flex">
        {BANDAS.map((b) => (
          <p key={b.nivel} className={`rotulo min-w-0 pr-2 ${ROTULO[b.nivel]}`} style={{ width: `${((b.hasta - b.desde) / total) * 100}%` }}>
            {NIVEL[b.nivel].etiqueta.replace('Riesgo ', '')} · {textoBanda(b.nivel, b.desde, b.hasta)}
          </p>
        ))}
      </div>
    </div>
  );
}
