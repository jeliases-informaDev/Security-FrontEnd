import { ExternalLink } from 'lucide-react';
import type { ManchaResponse } from '@/modules/listas_negativas/services/listasNegativasService';

// Colorimetría real de Inspektor/Risk Consulting (grupoColor viene del backend);
// NOTICIAS y cualquier lista sin grupo cae en el estilo por defecto (gris).
export const COLOR_GRUPO_STYLES: Record<string, string> = {
  Vinotinto: 'bg-rose-50 text-rose-800 ring-rose-200',
  Rojo: 'bg-red-50 text-red-700 ring-red-200',
  Naranja: 'bg-orange-50 text-orange-700 ring-orange-200',
  Amarillo: 'bg-amber-50 text-amber-800 ring-amber-200',
  Verde: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};
export const COLOR_GRUPO_DEFECTO = 'bg-surface-2 text-muted ring-line';

export function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** Etiqueta de lista con la colorimetría del grupo. */
export function EtiquetaLista({ mancha, texto }: { mancha: ManchaResponse; texto?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${COLOR_GRUPO_STYLES[mancha.grupoColor ?? ''] ?? COLOR_GRUPO_DEFECTO}`}>
      {texto ?? mancha.tipoListaNombre ?? mancha.tipoListaCodigo}
    </span>
  );
}

export function ManchaCard({ mancha }: { mancha: ManchaResponse }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <EtiquetaLista mancha={mancha} />
        {mancha.esPep && <span className="badge badge-info">PEP</span>}
        <span className="text-xs tabular-nums text-muted">
          {formatearFecha(mancha.fechaRegistro)}
          {mancha.fechaHasta ? ` – ${formatearFecha(mancha.fechaHasta)}` : ''}
        </span>
      </div>

      {mancha.cargo || mancha.institucion ? (
        <p className="text-sm leading-relaxed text-ink">
          {[mancha.cargo, mancha.institucion].filter(Boolean).join(' — ')}
          {mancha.periodoDesde && mancha.periodoHasta ? ` (periodo: ${mancha.periodoDesde} – ${mancha.periodoHasta})` : ''}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-ink">{mancha.descripcion}</p>
      )}

      {mancha.link && (
        <a href={mancha.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-ink hover:underline">
          Ver fuente
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
