import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { COLORES_MEDIDOR } from '@/modules/inicio/components/MedidorCoincidencia';
import type { EstadoFila } from '../services/listasNegativasService';
import { clasificacionCorta } from '../lib/formato';

/** Estilos por clasificación (los tres códigos que manda el backend); lo desconocido se ve neutro. */
export const ESTILO_CLASIFICACION: Record<string, { chip: string; punto: string; aviso: string; titulo: string }> = {
  SIN_COINCIDENCIAS: { chip: 'bg-ok-soft text-ok', punto: 'bg-ok', aviso: 'bg-ok-soft', titulo: 'text-ok' },
  MEDIA: { chip: 'bg-media-soft text-warn', punto: 'bg-media', aviso: 'bg-media-aviso', titulo: 'text-warn' },
  CRITICA: { chip: 'bg-critica text-white', punto: 'bg-white', aviso: 'bg-critica-soft', titulo: 'text-critica' },
};
export const ESTILO_NEUTRO = { chip: 'bg-paper text-muted', punto: 'bg-faint', aviso: 'bg-paper', titulo: 'text-ink' };
export const estiloDe = (clasificacion: string) => ESTILO_CLASIFICACION[clasificacion] ?? ESTILO_NEUTRO;

/** Insignia «MEDIA · 30%», «CRÍTICA · 75%» o «SIN COINCIDENCIAS» (historial y página principal). */
export function InsigniaResultado({ clasificacion, nombre, porcentaje }: { clasificacion: string; nombre: string; porcentaje: number }) {
  const sinCoincidencias = clasificacion === 'SIN_COINCIDENCIAS';
  const clase = clasificacion === 'CRITICA' ? 'badge-critica' : clasificacion === 'MEDIA' ? 'badge-warn' : sinCoincidencias ? 'badge-ok' : 'badge-neutral';
  return <span className={`badge ${clase}`}>{sinCoincidencias ? nombre : `${clasificacionCorta(nombre)} · ${porcentaje}%`}</span>;
}

/** Punto de estado de una fila: rojo con coincidencia, verde sin coincidencia, gris si no se consulta. */
export function PuntoEstado({ estado, tamano = 'h-[9px] w-[9px]' }: { estado: EstadoFila | 'SIN_CONSULTAR'; tamano?: string }) {
  const color = estado === 'COINCIDENCIA' ? 'bg-bad-solid' : estado === 'SIN_COINCIDENCIAS' ? 'bg-ok' : 'bg-faint';
  return <span className={`shrink-0 rounded-full ${tamano} ${color}`} aria-hidden="true" />;
}

/** Selector segmentado del diseño (¿A quién consultas?, pestañas del historial). */
export function Segmentado<T extends string>({ valor, opciones, onCambiar, ariaLabel, className = '' }: { valor: T; opciones: { valor: T; etiqueta: string }[]; onCambiar: (valor: T) => void; ariaLabel: string; className?: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={`flex max-w-full gap-1 overflow-x-auto rounded-[10px] border border-line bg-paper p-1 ${className}`}>
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activa}
            onClick={() => onCambiar(o.valor)}
            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-[14px] font-semibold leading-5 transition-colors ${activa ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
          >
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}

/** Anillo del porcentaje de coincidencia (176 × 176): marcas del verde al rojo, como la rueda de la página principal. */
export function AnilloCoincidencia({ porcentaje }: { porcentaje: number }) {
  const p = Math.min(100, Math.max(0, Math.round(porcentaje)));
  const segmentos = COLORES_MEDIDOR.length;
  const paso = 100 / segmentos;
  return (
    <div className="relative h-[176px] w-[176px] shrink-0" role="img" aria-label={`Coincidencia: ${p} por ciento`}>
      <svg viewBox="0 0 176 176" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx={88} cy={88} r={80} fill="none" strokeWidth={14} className="stroke-ink/10" />
        {COLORES_MEDIDOR.map((color, i) => {
          const inicio = i * paso;
          const largo = Math.min(p, inicio + paso) - inicio;
          if (largo <= 0) return null;
          return <circle key={color} cx={88} cy={88} r={80} fill="none" strokeWidth={14} stroke={color} pathLength={100} strokeDasharray={`${largo + 0.4} 100`} strokeDashoffset={-inicio} />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[40px] font-semibold leading-[42px] tracking-[-0.015em] text-ink">{p}%</span>
        <span className="rotulo mt-0.5">coincidencia</span>
      </div>
    </div>
  );
}

/** Chip de la clasificación (grande, con su punto o triángulo). */
export function ChipClasificacion({ clasificacion, nombre }: { clasificacion: string; nombre: string }) {
  const e = estiloDe(clasificacion);
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-medium leading-[22px] ${e.chip}`}>
      {clasificacion === 'CRITICA' ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <span className={`h-2 w-2 rounded-full ${e.punto}`} aria-hidden="true" />}
      {nombre}
    </span>
  );
}

/** Rótulo en mono sobre un bloque (FUENTES CONSULTADAS, POR QUÉ COINCIDE…). */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
}
