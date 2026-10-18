'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronRight, LogOut, Menu, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { UsuarioLoginResponse } from '@/modules/auth/services/authService';
import { MODULOS_DASHBOARD, modulosVisibles } from '@/shared/lib/modulos';
import { MARCA } from '@/shared/lib/marca';

/** Alto fijo de la barra superior: el panel de Indira y el menú móvil se acoplan debajo de ella. */
export const ALTO_BARRA_PX = 64;

interface AppShellProps {
  usuario: UsuarioLoginResponse;
  onLogout: () => void;
  indiraAbierta: boolean;
  onAlternarIndira: () => void;
  children: React.ReactNode;
}

function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link href="/overview" className="flex items-center gap-3" aria-label={`${MARCA.nombre}, ir al inicio`} translate="no">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-white shadow-sm" aria-hidden="true">
        <ShieldCheck className="h-5 w-5" />
      </span>
      {!compacto && (
        <span className="leading-tight">
          <span className="block text-[15px] font-semibold tracking-tight text-ink">{MARCA.nombre}</span>
          <span className="block text-[11px] text-muted">{MARCA.producto}</span>
        </span>
      )}
    </Link>
  );
}

function Iniciales({ nombre }: { nombre: string }) {
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '·';
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-brand-ink" aria-hidden="true">
      {iniciales}
    </span>
  );
}

function Navegacion({ usuario, onNavegar }: { usuario: UsuarioLoginResponse; onNavegar?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Módulos" className="flex flex-col gap-1">
      {modulosVisibles(usuario).map((modulo) => {
        const Icono = modulo.icono;
        const activo = pathname === modulo.href || pathname.startsWith(`${modulo.href}/`);
        if (!modulo.disponible) {
          return (
            <span key={modulo.codigo} className="nav-item cursor-not-allowed opacity-50" title="Próximamente" aria-disabled="true">
              <Icono className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className="truncate">{modulo.nombre}</span>
              <span className="ml-auto badge badge-neutral px-1.5 text-[10px]">Pronto</span>
            </span>
          );
        }
        return (
          <Link key={modulo.codigo} href={modulo.href} aria-current={activo ? 'page' : undefined} className="nav-item" onClick={onNavegar}>
            <Icono className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
            <span className="truncate">{modulo.nombre}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Estructura del panel: menú lateral fijo en pantallas anchas (cajón deslizable en móvil), barra superior con el módulo actual,
 * el botón de Indira y la cuenta, y el contenido en el centro. Todo claro, con la marca en los acentos.
 */
export function AppShell({ usuario, onLogout, indiraAbierta, onAlternarIndira, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const nombre = usuario.nombreCompleto || usuario.usuario;
  const moduloActual = MODULOS_DASHBOARD.find((m) => pathname === m.href || pathname.startsWith(`${m.href}/`));

  // El cajón móvil se cierra con Escape (y al elegir un módulo, desde el propio enlace).
  useEffect(() => {
    if (!menuAbierto) return;
    const alPresionar = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAbierto(false); };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [menuAbierto]);

  const barraLateral = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4"><Logo /></div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <p className="eyebrow mb-2 px-3">Módulos</p>
        <Navegacion usuario={usuario} onNavegar={() => setMenuAbierto(false)} />
      </div>
      <div className="border-t border-line p-3">
        <button
          type="button"
          onClick={() => { onAlternarIndira(); setMenuAbierto(false); }}
          aria-pressed={indiraAbierta}
          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${indiraAbierta ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line bg-surface hover:border-brand/40 hover:bg-brand-soft/40'}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-amber-500 text-white" aria-hidden="true"><Sparkles className="h-4 w-4" /></span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-semibold text-ink">Indira</span>
            <span className="block truncate text-xs text-muted">Asistente de cumplimiento</span>
          </span>
          <ChevronRight className="ml-auto h-4 w-4 text-faint" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Menú lateral fijo (pantallas anchas) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block" aria-label="Menú principal">
        {barraLateral}
      </aside>

      {/* Cajón móvil */}
      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" aria-hidden="true" onClick={() => setMenuAbierto(false)} />
          <aside role="dialog" aria-modal="true" aria-label="Menú principal" className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-[panel-entra_180ms_ease-out] bg-surface shadow-lg [animation-direction:reverse]">
            <button type="button" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" className="btn btn-ghost btn-icon absolute right-2 top-3.5"><X className="h-4 w-4" /></button>
            {barraLateral}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Barra superior */}
        <header className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur" style={{ height: ALTO_BARRA_PX }}>
          <div className="flex h-full items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú" className="btn btn-ghost btn-icon -ml-2 lg:hidden"><Menu className="h-5 w-5" /></button>
            <div className="lg:hidden"><Logo compacto /></div>
            <nav aria-label="Ruta" className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
              <Link href="/overview" className="text-muted hover:text-ink">Inicio</Link>
              {moduloActual && (<><ChevronRight className="h-4 w-4 text-faint" aria-hidden="true" /><span className="truncate font-medium text-ink">{moduloActual.nombre}</span></>)}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <button
                id="boton-indira"
                type="button"
                onClick={onAlternarIndira}
                aria-pressed={indiraAbierta}
                aria-label={indiraAbierta ? 'Cerrar el chat con Indira' : 'Abrir el chat con Indira'}
                className={`btn btn-sm ${indiraAbierta ? 'btn-primary' : 'btn-secondary'}`}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Indira</span>
              </button>
              <div className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden="true" />
              <div className="hidden flex-col items-end leading-tight sm:flex">
                <span className="max-w-[16rem] truncate text-sm font-medium text-ink">{nombre}</span>
                <span className="text-xs text-muted">{usuario.rol}</span>
              </div>
              <Iniciales nombre={nombre} />
              <button onClick={onLogout} aria-label="Cerrar sesión" title="Cerrar sesión" className="btn btn-ghost btn-icon text-muted hover:text-bad">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Contenido: en pantallas anchas se corre para dejarle sitio al chat de Indira (nada queda tapado) */}
        <div className={`transition-[padding] duration-200 ease-out ${indiraAbierta ? 'xl:pr-[26rem]' : ''}`}>{children}</div>
      </div>
    </div>
  );
}
