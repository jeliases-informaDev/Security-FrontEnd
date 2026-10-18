import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Estructura común de todas las pantallas del panel: un solo ancho de contenido y un solo encabezado de página
 * (antetítulo opcional, título, descripción y, a la derecha, las acciones de la pantalla).
 */
export function PageShell({ children, className = '', ancho = 'normal' }: { children: ReactNode; className?: string; ancho?: 'normal' | 'amplio' }) {
  return (
    <main className={`mx-auto w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8 ${ancho === 'amplio' ? 'max-w-[1400px]' : 'max-w-6xl'} ${className}`}>
      {children}
    </main>
  );
}

interface PageHeaderProps {
  titulo: string;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  /** Texto pequeño sobre el título (el módulo o la sección a la que pertenece la pantalla). */
  antetitulo?: string;
  icono?: LucideIcon;
  /** Sin la línea inferior: para pantallas que ponen pestañas justo debajo (las pestañas traen su propia línea). */
  sinLinea?: boolean;
}

export function PageHeader({ titulo, descripcion, acciones, antetitulo, icono: Icono, sinLinea = false }: PageHeaderProps) {
  return (
    <header className={`aparece flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${sinLinea ? 'mb-5' : 'mb-6 border-b border-line pb-5'}`}>
      <div className="flex min-w-0 items-start gap-4">
        {Icono && (
          <span className="mt-0.5 hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink sm:flex" aria-hidden="true">
            <Icono className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          {antetitulo && <p className="eyebrow mb-1">{antetitulo}</p>}
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.65rem]">{titulo}</h1>
          {descripcion && <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{descripcion}</p>}
        </div>
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}

interface PanelProps {
  children: ReactNode;
  className?: string;
  /** Cabecera opcional de la superficie: título, texto de apoyo y acciones a la derecha. */
  titulo?: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  /** Relleno interior del cuerpo (las tablas suelen ir sin relleno). */
  relleno?: boolean;
}

/** Superficie blanca de contenido (formularios, tablas, resultados). */
export function Panel({ children, className = '', titulo, descripcion, acciones, relleno = false }: PanelProps) {
  return (
    <section className={`card overflow-hidden ${className}`}>
      {(titulo || acciones) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            {titulo && <h2 className="text-base font-semibold text-ink">{titulo}</h2>}
            {descripcion && <p className="mt-0.5 text-sm text-muted">{descripcion}</p>}
          </div>
          {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
        </div>
      )}
      <div className={relleno ? 'p-5' : ''}>{children}</div>
    </section>
  );
}
