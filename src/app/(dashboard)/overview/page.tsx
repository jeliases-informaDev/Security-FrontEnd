'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { MODULOS_DASHBOARD } from '@/shared/lib/modulos';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';

export default function OverviewPage() {
  const { usuario } = useAuth();

  if (!usuario) {
    return null;
  }

  return (
    <PageShell>
      <PageHeader titulo={`Hola, ${usuario.nombreCompleto || usuario.usuario}`} descripcion="Elige un módulo para continuar." />

      <Panel>
        <ul className="divide-y divide-slate-200">
          {MODULOS_DASHBOARD.map((modulo) => {
            const Icono = modulo.icono;

            if (!modulo.disponible) {
              return (
                <li key={modulo.codigo} className="flex items-center gap-4 px-5 py-4">
                  <Icono className="h-5 w-5 shrink-0 text-slate-300" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-400">{modulo.nombre}</p>
                    <p className="text-sm text-slate-400">{modulo.descripcion}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">Próximamente</span>
                </li>
              );
            }

            return (
              <li key={modulo.codigo}>
                <Link
                  href={modulo.href}
                  className="group flex items-center gap-4 px-5 py-4 transition first:rounded-t-xl last:rounded-b-xl hover:bg-slate-50"
                >
                  <Icono className="h-5 w-5 shrink-0 text-brand-navy" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-ink">{modulo.nombre}</p>
                    <p className="text-sm text-brand-muted">{modulo.descripcion}</p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-navy"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    </PageShell>
  );
}
