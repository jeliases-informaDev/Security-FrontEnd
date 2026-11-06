import type { ReactNode } from 'react';
import type { EstadoLuz } from '../../lib/luces';
import { CHIP_ESTADO } from './tonos';

/*
 * Piezas comunes de la «Cabina de mando»: el marco de un instrumento, la cápsula de estado y el estado «Sin dato».
 * Regla de la casa: ningún texto se corta; todo lo que varía pasa a otra línea (break-words, min-w-0, sin alturas fijas).
 */

interface InstrumentoProps {
  /** Identificador estable: de él sale el id del título. */
  id: string;
  titulo: string;
  /** Línea pequeña bajo el título (la unidad, el periodo…). */
  subtitulo?: ReactNode;
  /** Lo que va a la derecha del título (un chip, una nota). Pasa a otra línea si no cabe. */
  derecha?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Marco de un instrumento: panel translúcido con rótulo en mono. Es además un «contenedor» de CSS: lo de adentro se acomoda según
 * el ancho del instrumento y no el de la pantalla.
 */
export function Instrumento({ id, titulo, subtitulo, derecha, className = '', children }: InstrumentoProps) {
  const idTitulo = `${id}-titulo`;
  return (
    <section aria-labelledby={idTitulo} className={`cabina-instrumento @container flex min-w-0 flex-col gap-3.5 p-4 ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <div className="min-w-0">
          <h3 id={idTitulo} className="cabina-rotulo flex items-center gap-2 break-words !text-cabina-texto-2">
            <span className="h-3 w-0.5 shrink-0 rounded-full bg-cabina-borde-fuerte" aria-hidden="true" />
            {titulo}
          </h3>
          {subtitulo && <p className="mt-0.5 break-words pl-2.5 text-[12px] leading-snug text-cabina-tenue">{subtitulo}</p>}
        </div>
        {derecha && <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">{derecha}</div>}
      </header>
      {children}
    </section>
  );
}

/** Cápsula de estado: «● TODO NORMAL», «● REVISAR»… (en mono y mayúsculas; una palabra o dos, nunca más). */
export function ChipEstado({ estado, children }: { estado: EstadoLuz; children: ReactNode }) {
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.1em] ${CHIP_ESTADO[estado]}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

/** El instrumento no tiene dato: lo dice y no dibuja nada (nunca un error ni un hueco sin explicación). */
export function SinDato({ texto }: { texto?: string }) {
  return (
    <div className="flex flex-col gap-1 py-1">
      <p className="flex items-baseline gap-2 text-[14px] font-medium leading-snug text-cabina-texto-2">
        <span className="font-mono" aria-hidden="true">—</span>
        Sin dato
      </p>
      {texto && <p className="break-words text-[12px] leading-snug text-cabina-tenue">{texto}</p>}
    </div>
  );
}
