import type { ReactNode } from 'react';

/** Cuerpo de un paso del asistente: tarjetas a la izquierda (con los botones al pie) y, a la derecha, las tarjetas de ayuda. */
export function CuerpoPaso({ children, lateral, pie }: { children: ReactNode; lateral: ReactNode; pie: ReactNode }) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,33%,28.75rem)]">
      <div className="flex min-w-0 flex-col gap-5">
        {children}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pb-2">{pie}</div>
      </div>
      <aside className="flex flex-col gap-4 xl:sticky xl:top-4" aria-label="Ayuda de este paso">{lateral}</aside>
    </div>
  );
}
