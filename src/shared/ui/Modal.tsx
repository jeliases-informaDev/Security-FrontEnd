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
}

/** Ventana emergente: se cierra con Escape o haciendo clic fuera, y al abrirse deja el cursor en el primer campo. */
export function Modal({ titulo, subtitulo, onCerrar, children, pie }: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(evento) => evento.target === evento.currentTarget && onCerrar()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={idTitulo} className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-base font-semibold text-brand-ink">
              {titulo}
            </h2>
            {subtitulo && <p className="mt-0.5 truncate text-sm text-brand-muted">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div ref={cuerpoRef} className="space-y-3 px-5 py-5">
          {children}
        </div>

        {pie && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">{pie}</div>}
      </div>
    </div>
  );
}
