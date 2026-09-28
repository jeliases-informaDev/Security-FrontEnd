'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, LogOut } from 'lucide-react';
import type { UsuarioLoginResponse } from '@/modules/auth/services/authService';
import { MODULOS_DASHBOARD } from '@/shared/lib/modulos';

interface DashboardHeaderProps {
  usuario: UsuarioLoginResponse;
  onLogout: () => void;
}

export function DashboardHeader({ usuario, onLogout }: DashboardHeaderProps) {
  const pathname = usePathname();

  const iniciales = (usuario.nombreCompleto || usuario.usuario)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-10 bg-brand-navy text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/overview" className="flex items-center gap-2.5 shrink-0">
          <ShieldCheck className="w-6 h-6 text-brand-amber" />
          <span className="font-semibold tracking-tight text-sm sm:text-base">
            RegTech Core
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <span className="text-sm font-medium text-white">
              {usuario.nombreCompleto || usuario.usuario}
            </span>
            <span className="text-xs text-white/60">{usuario.rol}</span>
          </div>

          <div className="w-9 h-9 rounded-full bg-brand-amber-soft text-brand-navy text-xs font-semibold flex items-center justify-center shrink-0">
            {iniciales || '·'}
          </div>

          <button
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="bg-brand-navy-2 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {MODULOS_DASHBOARD.map((modulo) => {
            const activo = pathname === modulo.href;

            if (!modulo.disponible) {
              return (
                <span
                  key={modulo.codigo}
                  className="shrink-0 px-3.5 py-2.5 text-sm text-white/30 cursor-not-allowed"
                  title="Próximamente"
                >
                  {modulo.nombre}
                </span>
              );
            }

            return (
              <Link
                key={modulo.codigo}
                href={modulo.href}
                className={`shrink-0 px-3.5 py-2.5 text-sm border-b-2 transition ${
                  activo
                    ? 'text-white border-brand-amber font-medium'
                    : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
                }`}
              >
                {modulo.nombre}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
