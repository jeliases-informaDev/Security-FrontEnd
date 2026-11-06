'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { UsuarioLoginResponse } from '@/modules/auth/services/authService';
import { menuVisible } from '@/shared/lib/modulos';
import { MARCA } from '@/shared/lib/marca';
import { MedidorTokens } from '@/modules/licencias/components/MedidorTokens';
import { LicenciaBanner } from '@/modules/licencias/components/LicenciaBanner';
import { IconoDestellos, IconoEscudo, IconoGalon, IconoLupa, IconoSalir } from '@/shared/ui/iconos';

interface AppShellProps {
  usuario: UsuarioLoginResponse;
  onLogout: () => void;
  indiraAbierta: boolean;
  onAlternarIndira: () => void;
  children: React.ReactNode;
}

/** Nombre legible del rol para mostrarlo bajo el nombre de la persona. */
const ROLES: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  ADMINISTRADOR_EMPRESA: 'Administrador de empresa',
  ADMIN_EMPRESA: 'Administrador de empresa',
  SUPERVISOR: 'Supervisor',
  USUARIO: 'Usuario',
};
const rolLegible = (rol: string | undefined) => (rol ? ROLES[rol.trim().toUpperCase()] ?? rol.replace(/_/g, ' ') : '');

function Logo({ compacto = false }: { compacto?: boolean }) {
  return (
    <Link href="/overview" className="flex items-center gap-3" aria-label={`${MARCA.nombre}, ir al inicio`} translate="no">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-ink text-white shadow-[0_8px_16px_-4px_rgb(14_17_22/0.28)]" aria-hidden="true">
        <IconoEscudo />
      </span>
      {!compacto && (
        <span className="solo-abierta min-w-0">
          <span className="block text-[17px] font-semibold leading-[1.5] tracking-[-0.01em] text-ink">{MARCA.nombre}</span>
          <span className="rotulo block truncate">{MARCA.corto}</span>
        </span>
      )}
    </Link>
  );
}

function Iniciales({ nombre }: { nombre: string }) {
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '·';
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-crema text-sm font-semibold text-ink" aria-hidden="true">
      {iniciales}
    </span>
  );
}

/** Menú por grupos (Analítica, Riesgos, Registro, Procesos internos). Lo que aún no existe en el producto sale como «Pronto». */
function Navegacion({ usuario, onNavegar }: { usuario: UsuarioLoginResponse; onNavegar?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Módulos" className="flex flex-col gap-[9px]">
      {menuVisible(usuario).map(({ grupo, opciones }) => (
        <div key={grupo} role="group" aria-label={grupo}>
          <p className="eyebrow solo-abierta flex items-center gap-2 pb-2 pl-3" aria-hidden="true">
            <span className="h-[5px] w-[5px] rounded-full bg-ink" />
            {grupo}
          </p>
          <ul className="flex flex-col gap-[5px]">
            {opciones.map((opcion) => {
              const Icono = opcion.icono;
              if (!opcion.disponible) {
                return (
                  <li key={opcion.codigo}>
                    <span className="nav-item" aria-disabled="true" title="Próximamente">
                      <Icono />
                      <span className="solo-abierta etiqueta-menu min-w-0 flex-1">{opcion.nombre}</span>
                      <span className="solo-abierta badge badge-neutral px-2.5 py-[3px]">Pronto</span>
                    </span>
                  </li>
                );
              }
              const activo = pathname === opcion.href || pathname.startsWith(`${opcion.href}/`);
              return (
                <li key={opcion.codigo}>
                  <Link href={opcion.href} aria-current={activo ? 'page' : undefined} className="nav-item" onClick={onNavegar}>
                    <Icono />
                    <span className="solo-abierta etiqueta-menu min-w-0">{opcion.nombre}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * Marco de la aplicación (diseño «Propuesta suave»): fondo que baja de blanco a azulado, menú lateral por grupos con Indira al pie
 * (cajón deslizable en móvil) y, a la derecha, el panel principal de esquina redondeada con la barra superior y el contenido.
 * En pantallas anchas el panel ocupa el alto de la ventana y es él quien se desplaza: el menú queda siempre a la vista.
 */
export function AppShell({ usuario, onLogout, indiraAbierta, onAlternarIndira, children }: AppShellProps) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  // La barra superior es opaca; solo al desplazar la página le sale una sombra suave que la separa del contenido que pasa por debajo.
  const [desplazado, setDesplazado] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const nombre = usuario.nombreCompleto || usuario.usuario;
  const enPrincipal = pathname === '/overview';

  // El cajón móvil se cierra con Escape (y al elegir un módulo, desde el propio enlace).
  useEffect(() => {
    if (!menuAbierto) return;
    const alPresionar = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuAbierto(false); };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [menuAbierto]);

  // Al cambiar de pantalla el panel vuelve arriba (en pantallas anchas se desplaza el panel, no la ventana).
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // En pantallas anchas se desplaza el panel; en las angostas, la ventana. Se escuchan los dos.
  useEffect(() => {
    const panel = panelRef.current;
    const alDesplazar = () => setDesplazado((panel?.scrollTop ?? 0) > 2 || window.scrollY > 2);
    panel?.addEventListener('scroll', alDesplazar, { passive: true });
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => {
      panel?.removeEventListener('scroll', alDesplazar);
      window.removeEventListener('scroll', alDesplazar);
    };
  }, []);

  // El botón de Indira del menú fijo lleva el id al que vuelve el foco al cerrar el chat; el del cajón móvil no lo repite.
  const lateral = (fijo: boolean) => (
    <div className="barra-plegable-interior flex h-full flex-col pb-[26px] pl-[clamp(0.875rem,1.35vw,1.625rem)] pr-3 pt-7">
      <Logo />
      <div className="-mx-2 mt-[27px] min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        <div className="max-w-[var(--ancho-fila-menu)]">
          <Navegacion usuario={usuario} onNavegar={() => setMenuAbierto(false)} />
        </div>
      </div>
      <button
        id={fijo ? 'boton-indira' : undefined}
        type="button"
        onClick={() => { onAlternarIndira(); setMenuAbierto(false); }}
        aria-pressed={indiraAbierta}
        aria-label={indiraAbierta ? 'Cerrar el chat con Indira' : 'Abrir el chat con Indira'}
        className="indira-tarjeta mt-3 flex w-full max-w-[275px] items-center gap-3 rounded-[24px] border border-white bg-white/70 p-3 text-left shadow-[0_8px_20px_-8px_rgb(14_17_22/0.06)] transition-[background-color,box-shadow] duration-150 hover:bg-white hover:shadow-md"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-noche text-white" aria-hidden="true"><IconoDestellos /></span>
        <span className="solo-abierta min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-5 text-ink">Indira</span>
          <span className="rotulo block">Asistente</span>
        </span>
        <IconoGalon className="solo-abierta shrink-0 text-faint" />
      </button>
    </div>
  );

  return (
    <div className="marco-fondo min-h-dvh">
      {/* Menú lateral fijo (pantallas anchas). Con mouse queda plegado en un riel de iconos y se despliega al pasar el mouse (ver .barra-plegable en globals.css) */}
      <aside className="barra-plegable fixed inset-y-0 left-0 z-30 hidden w-[var(--ancho-menu)] lg:block" aria-label="Menú principal">
        {lateral(true)}
      </aside>

      {/* Cajón móvil */}
      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" aria-hidden="true" onClick={() => setMenuAbierto(false)} />
          <aside role="dialog" aria-modal="true" aria-label="Menú principal" className="marco-fondo absolute inset-y-0 left-0 w-[18.5rem] max-w-[88vw] animate-[panel-entra_180ms_ease-out] shadow-lg [animation-direction:reverse]">
            <button type="button" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" className="btn btn-ghost btn-icon absolute right-2 top-7"><X className="h-4 w-4" /></button>
            {lateral(false)}
          </aside>
        </div>
      )}

      <div className="lg:pl-[var(--ancho-menu-reposo)]">
        <div
          ref={panelRef}
          className="panel-principal flex min-h-dvh flex-col panel-desplazable lg:h-dvh lg:min-h-0 lg:overflow-y-auto lg:border-b-0 lg:border-r-0 lg:border-t-0"
        >
          {/* Barra superior: buscador (solo en la página principal) y la cuenta. Superficie sólida: el contenido no se transparenta al desplazar. */}
          <header className={`sticky top-0 z-20 flex h-[var(--alto-barra)] shrink-0 items-center gap-3 bg-white px-4 transition-shadow duration-200 sm:px-6 lg:items-center lg:pl-[clamp(1.5rem,2.03vw,2.4375rem)] lg:pr-[clamp(1.5rem,3.33vw,4rem)] ${desplazado ? 'shadow-[0_12px_24px_-16px_rgb(14_17_22/0.24)]' : ''}`}>
            <button type="button" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú" className="btn btn-ghost btn-icon -ml-1.5 lg:hidden"><Menu className="h-5 w-5" /></button>
            <div className="lg:hidden"><Logo compacto /></div>

            {enPrincipal && (
              // Todavía no hay buscador general en el producto: se muestra como en el diseño, marcado «Pronto».
              <div
                className="hidden h-[52px] min-w-0 max-w-[560px] flex-1 items-center gap-3 rounded-full border border-ink/6 bg-white/92 pl-5 pr-3 shadow-[0_10px_24px_-10px_rgb(14_17_22/0.07)] md:flex"
                title="Próximamente: buscar un cliente desde aquí"
              >
                <IconoLupa className="shrink-0 text-muted" />
                <span className="min-w-0 flex-1 truncate text-[15px] text-muted">Buscar cliente, DNI o RUC…</span>
                <span className="shrink-0 rounded-[14px] bg-ink/7 px-3 py-[5px] font-mono text-[11px] uppercase tracking-[0.08em] text-muted">Pronto</span>
              </div>
            )}

            <div className="ml-auto flex items-center gap-2.5 sm:gap-4">
              {/* Tokens del mes (administrador de la empresa) o «sin límite» (Sulotec) */}
              <MedidorTokens />

              <button
                type="button"
                onClick={onAlternarIndira}
                aria-pressed={indiraAbierta}
                aria-label={indiraAbierta ? 'Cerrar el chat con Indira' : 'Abrir el chat con Indira'}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-noche text-white lg:hidden"
              >
                <IconoDestellos className="h-[18px] w-[18px]" />
              </button>

              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-[18rem] truncate text-sm font-semibold leading-5 text-ink">{nombre}</p>
                <p className="rotulo truncate">{rolLegible(usuario.rol)}</p>
              </div>
              <Iniciales nombre={nombre} />
              <button
                type="button"
                onClick={onLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-muted transition-colors duration-150 hover:border-bad/30 hover:text-bad"
              >
                <IconoSalir />
              </button>
            </div>
          </header>

          {/* Franja de licencia: solo aparece si hay algo que avisar (bloqueo, tokens o vencimiento) */}
          <LicenciaBanner />

          {/* Contenido: en pantallas anchas se corre para dejarle sitio al chat de Indira (nada queda tapado) */}
          <div className={`min-w-0 flex-1 transition-[padding] duration-200 ease-out ${indiraAbierta ? 'xl:pr-[26rem]' : ''}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
