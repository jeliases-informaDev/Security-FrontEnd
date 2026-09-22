import { ExternalLink } from 'lucide-react';
import type { ManchaResponse } from '@/modules/listas_negativas/services/listasNegativasService';

const TIPO_LISTA_STYLES: Record<string, string> = {
  PEP: 'bg-blue-50 text-blue-700 border-blue-100',
  ACTOS_ILICITOS: 'bg-red-50 text-red-700 border-red-100',
  NOTICIAS: 'bg-amber-50 text-amber-700 border-amber-100',
  INTERNACIONAL: 'bg-purple-50 text-purple-700 border-purple-100',
};

export function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

export function ManchaCard({ mancha }: { mancha: ManchaResponse }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/60">
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
            TIPO_LISTA_STYLES[mancha.tipoListaCodigo ?? ''] ??
            'bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          {mancha.tipoListaNombre ?? mancha.tipoListaCodigo}
        </span>
        <span className="text-xs text-brand-muted">
          {formatearFecha(mancha.fechaRegistro)}
          {mancha.fechaHasta ? ` – ${formatearFecha(mancha.fechaHasta)}` : ''}
        </span>
      </div>

      {mancha.cargo || mancha.institucion ? (
        <p className="text-sm text-brand-ink">
          {[mancha.cargo, mancha.institucion].filter(Boolean).join(' — ')}
          {mancha.periodoDesde && mancha.periodoHasta
            ? ` (periodo: ${mancha.periodoDesde} – ${mancha.periodoHasta})`
            : ''}
        </p>
      ) : (
        <p className="text-sm text-brand-ink">{mancha.descripcion}</p>
      )}

      {mancha.link && (
        <a
          href={mancha.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-navy hover:underline"
        >
          Ver fuente
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
