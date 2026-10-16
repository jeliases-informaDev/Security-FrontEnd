import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export interface Aviso {
  tipo: 'ok' | 'error';
  texto: ReactNode;
}

/** Franja de confirmación (verde) o de error (roja) con botón para cerrarla. */
export function AvisoBanner({ aviso, onCerrar, children }: { aviso: Aviso; onCerrar: () => void; children?: ReactNode }) {
  return (
    <div
      role={aviso.tipo === 'error' ? 'alert' : 'status'}
      className={`mb-5 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
        aviso.tipo === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
      }`}
    >
      <div className="min-w-0">
        <p>{aviso.texto}</p>
        {children}
      </div>
      <button type="button" onClick={onCerrar} aria-label="Cerrar el aviso" className="shrink-0 opacity-70 transition hover:opacity-100">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
