import { ExternalLink } from 'lucide-react';
import { ENLACE_LICENCIA } from '../lib/errores';

/** Enlace externo a la licencia en Sulotec. Siempre se abre en otra pestaña. */
export function EnlaceLicencia({ enlace, children, className = '' }: { enlace?: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={enlace || ENLACE_LICENCIA}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 font-semibold underline underline-offset-2 ${className}`}
    >
      {children}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}
