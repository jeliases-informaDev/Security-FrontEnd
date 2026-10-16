'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, MessageCircle, ShieldCheck } from 'lucide-react';
import type { Ref } from 'react';
import type { UsuarioLoginResponse } from '@/modules/auth/services/authService';
import { MODULOS_DASHBOARD } from '@/shared/lib/modulos';

interface DashboardHeaderProps {
  usuario: UsuarioLoginResponse;
  onLogout: () => void;
  indiraAbierta: boolean;
  onAlternarIndira: () => void;
  /** Para que el layout mida la cabecera y acople el chat justo debajo. */
  cabeceraRef?: Ref<HTMLElement>;
}

export function DashboardHeader({ usuario, onLogout, indiraAbierta, onAlternarIndira, cabeceraRef }: DashboardHeaderProps) {
  const pathname = usePathname();

  const nombre = usuario.nombreCompleto || usuario.usuario;
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');

  return (
    <header ref={cabeceraRef} className="sticky top-0 z-20 bg-brand-navy text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/overview" className="flex shrink-0 items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-brand-amber" />
          <span className="text-sm font-semibold tracking-tight sm:text-base">RegTech Core</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="boton-indira"
            type="button"
            onClick={onAlternarIndira}
            aria-pressed={indiraAbierta}
            aria-label={indiraAbierta ? 'Cerrar el chat con Indira' : 'Abrir el chat con Indira'}
            className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition ${
              indiraAbierta
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-white/15 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Indira</span>
          </button>

          <div className="mx-1 hidden h-6 w-px bg-white/15 sm:block" aria-hidden="true" />

          <div className="hidden flex-col items-end leading-tight sm:flex">
            <span className="text-sm font-medium text-white">{nombre}</span>
            <span className="text-xs text-white/60">{usuario.rol}</span>
          </div>

          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-amber-soft text-xs font-semibold text-brand-navy"
            aria-hidden="true"
          >
            {iniciales || '·'}
          </div>

          <button
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="border-t border-white/10 bg-brand-navy-2" aria-label="Módulos">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {MODULOS_DASHBOARD.map((modulo) => {
            const activo = pathname === modulo.href;

            if (!modulo.disponible) {
              return (
                <span
                  key={modulo.codigo}
                  className="shrink-0 cursor-not-allowed px-3.5 py-2.5 text-sm text-white/30"
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
                aria-current={activo ? 'page' : undefined}
                className={`shrink-0 border-b-2 px-3.5 py-2.5 text-sm transition ${
                  activo
                    ? 'border-brand-amber font-medium text-white'
                    : 'border-transparent text-white/60 hover:border-white/30 hover:text-white'
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
