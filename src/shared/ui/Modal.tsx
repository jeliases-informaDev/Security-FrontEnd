'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { IconoCerrar } from './iconos';

interface ModalProps {
  titulo: string;
  /** Texto pequeño bajo el título (por ejemplo, a qué registro o cuenta se refiere). */
  subtitulo?: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
  /** Botones del pie (alineados a la derecha). */
  pie?: ReactNode;
  /** Ancho máximo de la ventana. */
  tamano?: 'sm' | 'md' | 'lg' | 'xl';
  /** `suave` es el diseño nuevo («Propuesta suave»): esquinas de 20 px, título grande, divisores finos y pie sin fondo. `estandar` es el de siempre. */
  variante?: 'estandar' | 'suave';
  /** Clases del cuerpo: reemplazan a las de la variante (por ejemplo, para darle fondo de papel o más margen). */
  claseCuerpo?: string;
}

const ANCHO = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-4xl' } as const;
const ANCHO_SUAVE = { sm: 'max-w-[35rem]', md: 'max-w-xl', lg: 'max-w-[51.25rem]', xl: 'max-w-4xl' } as const;

/** Ventana emergente: se cierra con Escape o haciendo clic fuera, y al abrirse deja el cursor en el primer campo. */
export function Modal({ titulo, subtitulo, onCerrar, children, pie, tamano = 'sm', variante = 'estandar', claseCuerpo }: ModalProps) {
  const suave = variante === 'suave';
  const idTitulo = useId();
  const cuerpoRef = useRef<HTMLDivElement>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  useEffect(() => {
    cuerpoRef.current?.querySelector<HTMLElement>('select:not([disabled]), input:not([disabled]), textarea:not([disabled])')?.focus();
  }, []);

  const contenido = (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 ${suave ? 'bg-ink/45' : 'bg-ink/40 backdrop-blur-[2px]'}`}
      onMouseDown={(evento) => evento.target === evento.currentTarget && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={`zoom-entra flex max-h-[92vh] w-full flex-col overflow-hidden ${suave ? `rounded-t-[20px] border border-line bg-white shadow-[0_30px_70px_-20px_rgba(14,17,22,0.25)] sm:rounded-[20px] ${ANCHO_SUAVE[tamano]}` : `rounded-t-2xl bg-surface shadow-lg sm:rounded-2xl ${ANCHO[tamano]}`}`}
        style={{ overscrollBehavior: 'contain' }}
      >
        {suave ? (
          <>
            <div className="flex items-center gap-3 pb-[18px] pl-7 pr-6 pt-6">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 id={idTitulo} className="text-[22px] font-bold leading-[normal] text-ink">{titulo}</h2>
                {subtitulo && <p className="truncate font-mono text-xs leading-[normal] tracking-[0.04em] text-muted">{subtitulo}</p>}
              </div>
              <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-line bg-white text-ink/80 transition-colors hover:bg-paper">
                <IconoCerrar className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="h-px shrink-0 bg-line" />
          </>
        ) : (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <h2 id={idTitulo} className="text-base font-semibold text-ink">{titulo}</h2>
              {subtitulo && <p className="mt-0.5 truncate text-sm text-muted">{subtitulo}</p>}
            </div>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="btn btn-ghost btn-icon -mr-2 -mt-1 text-muted">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div ref={cuerpoRef} className={claseCuerpo ?? (suave ? 'flex flex-col gap-2.5 overflow-y-auto px-7 py-5' : 'space-y-3 overflow-y-auto px-5 py-5')}>
          {children}
        </div>

        {pie && (suave
          ? <div className="flex justify-end gap-2.5 border-t border-line px-7 pb-5 pt-4">{pie}</div>
          : <div className="flex justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-4">{pie}</div>)}
      </div>
    </div>
  );

  if (!montado) return null;
  return createPortal(contenido, document.body);
}
