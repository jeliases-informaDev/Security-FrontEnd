import type { ReactNode } from 'react';
import { Info } from 'lucide-react';

/** Aviso informativo del diseño: caja lavanda con el icono de información, un título corto y una explicación. */
export function AvisoLila({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <div role="note" className={`flex items-start gap-3.5 rounded-[14px] bg-brand-soft px-[18px] py-4 ${className}`}>
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="break-words text-[15px] font-semibold text-brand-ink">{titulo}</p>
        <p className="break-words text-sm leading-[21px] text-ink/80">{children}</p>
      </div>
    </div>
  );
}
