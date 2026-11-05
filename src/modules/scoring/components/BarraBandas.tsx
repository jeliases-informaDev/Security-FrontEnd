import type { BandaNivel, NivelRiesgo } from '../services/scoringService';
import { NIVEL } from '../lib/formato';

const FONDO: Record<NivelRiesgo, string> = { BAJO: 'bg-ok-soft', MEDIO: 'bg-accent-soft', ALTO: 'bg-bad-soft' };
const ROTULO: Record<NivelRiesgo, string> = { BAJO: 'text-ok', MEDIO: 'text-accent', ALTO: 'text-bad' };

function textoBanda(banda: BandaNivel, indice: number, total: number): string {
  if (indice === 0) return `menos de ${banda.hasta}`;
  if (indice === total - 1) return `${banda.desde} o más`;
  // El borde superior de una banda es el inicio de la siguiente: la de en medio termina 0,01 antes.
  return `${banda.desde} a ${Number((banda.hasta - 0.01).toFixed(2))}`;
}

/** Barra de las bandas de nivel (las que manda el servidor) con el marcador del puntaje en su sitio. */
export function BarraBandas({ puntaje, bandas }: { puntaje: number; bandas: BandaNivel[] }) {
  if (bandas.length === 0) return null;
  const minimo = bandas[0].desde;
  const maximo = bandas[bandas.length - 1].hasta;
  const total = maximo - minimo;
  const pct = (valor: number) => Math.max(0, Math.min(100, ((valor - minimo) / total) * 100));
  const posicion = pct(puntaje);

  return (
    <div className="relative h-[74px] w-full" role="img" aria-label={`Puntaje ${puntaje.toFixed(2)} en una escala de ${minimo} a ${maximo}`}>
      <div className="absolute inset-x-0 top-8 flex h-2.5 overflow-hidden rounded-[5px]">
        {bandas.map((b) => (
          <div key={b.nivel} className={FONDO[b.nivel]} style={{ width: `${pct(b.hasta) - pct(b.desde)}%` }} />
        ))}
      </div>
      <span className="absolute top-7 h-[18px] w-[18px] -translate-x-1/2 rounded-full border-[3px] border-white bg-ink shadow-md" style={{ left: `${posicion}%` }} />
      <span className="absolute top-0 -translate-x-1/2 rounded-md bg-ink px-2 py-[3px] font-mono text-[11px] uppercase leading-[16.5px] tracking-[0.04em] text-paper" style={{ left: `${posicion}%` }}>
        {puntaje.toFixed(2)}
      </span>
      {bandas.map((b, i) => (
        <p key={b.nivel} className={`rotulo absolute top-[54px] whitespace-nowrap ${ROTULO[b.nivel]}`} style={{ left: `${pct(b.desde)}%` }}>
          {NIVEL[b.nivel].etiqueta.replace('Riesgo ', '')} · {textoBanda(b, i, bandas.length)}
        </p>
      ))}
    </div>
  );
}
