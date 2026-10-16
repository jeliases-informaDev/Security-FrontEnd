import type { ReactNode } from 'react';

/**
 * Estructura comun de todas las pantallas del panel: un solo ancho de contenido (alineado con la cabecera) y un solo
 * encabezado de pagina (titulo, descripcion y, a la derecha, las acciones de la pantalla).
 */
export function PageShell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 ${className}`}>{children}</main>;
}

interface PageHeaderProps {
  titulo: string;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  /** Sin la linea inferior: para pantallas que ponen pestanas justo debajo (las pestanas traen su propia linea). */
  sinLinea?: boolean;
}

export function PageHeader({ titulo, descripcion, acciones, sinLinea = false }: PageHeaderProps) {
  return (
    <header
      className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${
        sinLinea ? 'mb-5' : 'mb-6 border-b border-slate-300/70 pb-5'
      }`}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-brand-ink">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-brand-muted">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}

/** Superficie blanca de contenido (formularios, tablas, resultados). */
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white ${className}`}>{children}</section>;
}
