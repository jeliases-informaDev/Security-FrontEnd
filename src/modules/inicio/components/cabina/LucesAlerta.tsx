import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { EstadoLuz, Luz } from '../../lib/luces';
import { Instrumento } from './Instrumento';
import { PALABRA_ESTADO, TEXTO_ESTADO } from './tonos';

/*
 * Luces de alerta, tipo «master caution»: una luz por área (Listas, Operaciones, Oficial, Denuncias, Scoring y Licencia) con el motivo
 * en una frase. Cada luz es un enlace a su módulo. Las reglas de color viven en `lib/luces.ts`. El estado se dice siempre con
 * palabra (NORMAL, REVISAR, ATENCIÓN, SIN DATO): el color solo lo refuerza.
 */

const BORDE_LUZ: Record<EstadoLuz, string> = {
  verde: 'border-cabina-borde',
  ambar: 'border-cabina-warn/40',
  rojo: 'border-cabina-bad/45',
  gris: 'border-cabina-borde',
};

/** La lámpara: un punto con brillo; en ámbar y rojo late despacio (sin movimiento si la persona lo pidió así). */
function Lampara({ estado }: { estado: EstadoLuz }) {
  const late = estado === 'ambar' || estado === 'rojo';
  return (
    <span className={`relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center ${TEXTO_ESTADO[estado]}`} aria-hidden="true">
      {late && <span className="cabina-destello absolute inset-0 rounded-full bg-current" />}
      <span className={`relative h-2.5 w-2.5 rounded-full bg-current ${estado === 'gris' ? 'opacity-60' : 'shadow-[0_0_10px_currentColor]'}`} />
    </span>
  );
}

function ContenidoLuz({ luz }: { luz: Luz }) {
  return (
    <>
      <Lampara estado={luz.estado} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-2">
          <span className="cabina-rotulo break-words !text-cabina-texto-2">{luz.etiqueta}</span>
          <span className={`font-mono text-[10px] uppercase tracking-[0.1em] ${TEXTO_ESTADO[luz.estado]}`}>{PALABRA_ESTADO[luz.estado]}</span>
        </span>
        <span className="mt-1 block break-words text-[12px] leading-snug text-cabina-texto">{luz.motivo}</span>
      </span>
    </>
  );
}

function FilaLuz({ luz }: { luz: Luz }) {
  const clase = `group flex h-full items-start gap-3 rounded-xl border bg-cabina-panel px-3 py-3 transition-colors hover:border-cabina-borde-fuerte hover:bg-cabina-panel-2 ${BORDE_LUZ[luz.estado]}`;
  return (
    <li>
      {luz.externo ? (
        // La licencia se maneja en el portal de Sulotec: se abre en otra pestaña.
        <a href={luz.enlace} target="_blank" rel="noopener noreferrer" className={clase}>
          <ContenidoLuz luz={luz} />
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cabina-tenue" aria-hidden="true" />
          <span className="sr-only">(se abre en otra pestaña)</span>
        </a>
      ) : (
        <Link href={luz.enlace} className={clase}>
          <ContenidoLuz luz={luz} />
        </Link>
      )}
    </li>
  );
}

export function LucesAlerta({ luces, className = '' }: { luces: Luz[]; className?: string }) {
  return (
    <Instrumento id="cabina-luces" titulo="Luces de alerta" subtitulo="Cada luz abre su módulo." className={className}>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(11.5rem,1fr))] gap-2.5" aria-label="Estado de cada área">
        {luces.map((luz) => (
          <FilaLuz key={luz.area} luz={luz} />
        ))}
      </ul>
    </Instrumento>
  );
}
