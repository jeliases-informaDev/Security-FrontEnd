'use client';

import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  titulo: string;
  /** Texto pequeño bajo el título (por ejemplo, a qué registro o cuenta se refiere). */
  subtitulo?: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
  /** Botones del pie (alineados a la derecha). */
  pie?: ReactNode;
  /** Ancho máximo de la ventana. */
  tamano?: 'sm' | 'md' | 'lg';
}

const ANCHO = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' } as const;

/** Ventana emergente: se cierra con Escape o haciendo clic fuera, y al abrirse deja el cursor en el primer campo. */
export function Modal({ titulo, subtitulo, onCerrar, children, pie, tamano = 'sm' }: ModalProps) {
  const idTitulo = useId();
  const cuerpoRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(evento) => evento.target === evento.currentTarget && onCerrar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={`zoom-entra flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-lg sm:rounded-2xl ${ANCHO[tamano]}`}
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-base font-semibold text-ink">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 truncate text-sm text-muted">{subtitulo}</p>}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="btn btn-ghost btn-icon -mr-2 -mt-1 text-muted">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div ref={cuerpoRef} className="space-y-3 overflow-y-auto px-5 py-5">
          {children}
        </div>

        {pie && <div className="flex justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-4">{pie}</div>}
      </div>
    </div>
  );
}
