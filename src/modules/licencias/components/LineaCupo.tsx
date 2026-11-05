'use client';

import { Users } from 'lucide-react';
import { useLicencia } from '../context/LicenciaContext';
import { EnlaceLicencia } from './EnlaceLicencia';

/** «Tu licencia permite N usuarios activos y hoy tienes M.» No se muestra si no hay datos de cupo. */
export function LineaCupo({ className = '' }: { className?: string }) {
  const { licencia } = useLicencia();
  if (!licencia || licencia.usuarios_max == null || licencia.usuarios_activos == null) return null;

  return (
    <p className={`flex flex-wrap items-center gap-1.5 text-xs text-muted ${className}`}>
      <Users className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
      <span>
        Tu licencia permite <strong className="tabular-nums text-ink">{licencia.usuarios_max}</strong> usuarios activos y hoy tienes{' '}
        <strong className="tabular-nums text-ink">{licencia.usuarios_activos}</strong>.
      </span>
      <EnlaceLicencia enlace={licencia.enlace} className="text-brand">Ver licencia</EnlaceLicencia>
    </p>
  );
}
