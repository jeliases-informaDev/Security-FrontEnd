import type { ReactNode } from 'react';
import { Panel } from '@/shared/ui/PageShell';
import { etiqueta, mensajeError } from '@/shared/ui/estilos';

/** Campo de formulario: etiqueta arriba, el control y, si hay, el mensaje de error debajo. */
export function Campo({
  id,
  texto,
  error,
  ayuda,
  children,
  className = '',
}: {
  id: string;
  texto: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={etiqueta}>
        {texto}
      </label>
      {children}
      {ayuda && !error && <p className="mt-1 text-xs text-brand-muted">{ayuda}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className={mensajeError}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Bloque de un formulario largo: título, una línea de ayuda y los campos. */
export function Seccion({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: ReactNode }) {
  return (
    <Panel className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-brand-ink">{titulo}</h2>
        {descripcion && <p className="mt-0.5 text-sm text-brand-muted">{descripcion}</p>}
      </div>
      {children}
    </Panel>
  );
}
