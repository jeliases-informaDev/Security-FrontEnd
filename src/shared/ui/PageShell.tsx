import type { ComponentType, ReactNode, SVGProps } from 'react';

/**
 * Estructura común de todas las pantallas del panel: un solo ancho de contenido y un solo encabezado de página
 * (antetítulo opcional, título, descripción y, a la derecha, las acciones de la pantalla).
 */
export function PageShell({ children, className = '', ancho = 'normal' }: { children: ReactNode; className?: string; ancho?: 'normal' | 'amplio' }) {
  return (
    <main className={`mx-auto w-full px-4 pb-10 pt-4 sm:px-6 lg:px-10 lg:pb-12 lg:pt-6 ${ancho === 'amplio' ? 'max-w-[1500px]' : 'max-w-6xl'} ${className}`}>
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
  /** Icono de la pantalla: cualquier componente SVG (lucide o los de shared/ui/iconos). */
  icono?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Sin la línea inferior: para pantallas que ponen pestañas justo debajo (las pestañas traen su propia línea). */
  sinLinea?: boolean;
}

/** Encabezado de pantalla del diseño «Propuesta suave»: caja de icono lavanda, antetítulo en mono y título en serif azul marino. */
export function PageHeader({ titulo, descripcion, acciones, antetitulo, icono: Icono, sinLinea = false }: PageHeaderProps) {
  return (
    <header className={`aparece flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${sinLinea ? 'mb-6' : 'mb-7 border-b border-line pb-6'}`}>
      <div className="flex min-w-0 items-start gap-4 sm:gap-5">
        {Icono && (
          <span className="mt-1 hidden h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-brand-soft text-ink sm:flex" aria-hidden="true">
            <Icono className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0">
          {antetitulo && <p className="eyebrow mb-1.5">{antetitulo}</p>}
          <h1 className="titulo-serif text-[clamp(2.25rem,2.9vw,3.25rem)]">{titulo}</h1>
          {descripcion && <p className="mt-2.5 max-w-3xl text-[15px] leading-relaxed text-muted sm:text-base">{descripcion}</p>}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            {titulo && <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{titulo}</h2>}
            {descripcion && <p className="mt-0.5 text-sm text-muted">{descripcion}</p>}
          </div>
          {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
        </div>
      )}
      <div className={relleno ? 'p-5 sm:p-6' : ''}>{children}</div>
    </section>
  );
}
