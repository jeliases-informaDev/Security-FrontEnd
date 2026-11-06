'use client';

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const ENFOCABLES = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const CAMPOS = 'input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly])';

const sinSuscripcion = () => () => undefined;

interface VentanaProps {
  titulo: string;
  /** Línea pequeña en mayúsculas bajo el título (por ejemplo, «Vista previa · requisitos del oficial»). */
  rotulo?: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
  /** Botones del pie, alineados a la derecha. */
  pie?: ReactNode;
  /** Ancho máximo en píxeles (820 en el diseño). */
  ancho?: number;
  /** Fondo del cuerpo: el «papel» cálido del diseño o blanco. */
  fondo?: 'papel' | 'blanco';
  /** Con false, un clic en el velo no la cierra (para formularios con datos ya escritos). */
  cerrarAlPulsarFuera?: boolean;
}

/**
 * Ventana emergente del módulo con el aspecto del diseño (cabecera con título grande y rótulo en mono, cuerpo y pie).
 * Se cierra con Escape, con la X o con un clic en el velo; el Tab se queda dentro de la ventana, al abrir el foco entra a ella
 * (al primer campo, si lo hay) y al cerrar vuelve al botón que la abrió.
 */
export function Ventana({ titulo, rotulo, onCerrar, children, pie, ancho = 820, fondo = 'papel', cerrarAlPulsarFuera = true }: VentanaProps) {
  const idTitulo = useId();
  const panel = useRef<HTMLDivElement>(null);
  const cuerpo = useRef<HTMLDivElement>(null);
  const cerrar = useRef(onCerrar);
  // Solo hay documento en el navegador: en el servidor no se pinta nada.
  const enNavegador = useSyncExternalStore(sinSuscripcion, () => true, () => false);

  useEffect(() => {
    cerrar.current = onCerrar;
  });

  useEffect(() => {
    if (!enNavegador) return;
    const quienAbrio = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const nodo = panel.current;
    if (!nodo) return;
    (cuerpo.current?.querySelector<HTMLElement>(CAMPOS) ?? nodo).focus({ preventScroll: true });

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        // Si hay una lista desplegada dentro, el Escape es para cerrarla y no la ventana.
        if (nodo.querySelector('[aria-expanded="true"]')) return;
        evento.stopPropagation();
        cerrar.current();
        return;
      }
      if (evento.key !== 'Tab') return;
      const lista = Array.from(nodo.querySelectorAll<HTMLElement>(ENFOCABLES)).filter((el) => el.getClientRects().length > 0);
      if (lista.length === 0) {
        evento.preventDefault();
        nodo.focus();
        return;
      }
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      const activo = document.activeElement;
      if (evento.shiftKey && (activo === primero || activo === nodo)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && activo === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    };
    nodo.addEventListener('keydown', alPulsar);
    return () => {
      nodo.removeEventListener('keydown', alPulsar);
      if (quienAbrio && document.contains(quienAbrio)) quienAbrio.focus({ preventScroll: true });
    };
  }, [enNavegador]);

  if (!enNavegador) return null;

  return createPortal(
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(14_17_22/0.45)] p-3 sm:p-6"
      onMouseDown={(evento) => {
        if (cerrarAlPulsarFuera && evento.target === evento.currentTarget) onCerrar();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        style={{ maxWidth: ancho }}
        className="zoom-entra flex max-h-full w-full flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_30px_70px_-20px_rgb(14_17_22/0.25)] outline-none"
      >
        <div className="flex shrink-0 items-center gap-3 pb-[18px] pl-5 pr-4 pt-5 sm:pl-7 sm:pr-6 sm:pt-6">
          <div className="min-w-0 flex-1">
            <h2 id={idTitulo} className="break-words text-[22px] font-bold leading-normal text-ink">{titulo}</h2>
            {rotulo && <p className="mt-1 font-mono text-xs uppercase tracking-[0.04em] text-muted">{rotulo}</p>}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-line bg-white text-ink transition-colors hover:bg-ink/5"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="h-px shrink-0 bg-line" />
        <div ref={cuerpo} className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-8 sm:py-6 ${fondo === 'papel' ? 'bg-paper' : 'bg-white'}`}>
          {children}
        </div>
        {pie && (
          <>
            <div className="h-px shrink-0 bg-line" />
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 px-5 pb-5 pt-4 sm:px-7">{pie}</div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
