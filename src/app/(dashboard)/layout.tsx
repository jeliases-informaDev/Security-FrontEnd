'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from '@/modules/auth/hooks/AuthProvider';
import { IndiraPanel } from '@/modules/indira/components/IndiraPanel';
import { DashboardHeader } from '@/shared/ui/DashboardHeader';

// Alto aproximado de la cabecera hasta que se mide (evita que el panel salte al abrirse la primera vez).
const ALTO_CABECERA_INICIAL_PX = 107;

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { usuario, cargando, error, logout } = useAuth();
  const [indiraAbierta, setIndiraAbierta] = useState(false);
  const [altoCabecera, setAltoCabecera] = useState(ALTO_CABECERA_INICIAL_PX);
  const cabeceraRef = useRef<HTMLElement>(null);

  // El panel de Indira se acopla justo debajo de la cabecera, sea cual sea su alto.
  useEffect(() => {
    const cabecera = cabeceraRef.current;
    if (!cabecera) return;
    const medir = () => setAltoCabecera(cabecera.getBoundingClientRect().height);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(cabecera);
    return () => observador.disconnect();
  }, [usuario]);

  const cerrarIndira = useCallback(() => {
    setIndiraAbierta(false);
    document.getElementById('boton-indira')?.focus();
  }, []);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-paper">
        <p className="text-sm text-brand-muted">Verificando sesión…</p>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-paper p-6">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="mb-4 text-sm font-medium text-red-600">{error ?? 'No se pudo confirmar la sesión'}</p>
          <button
            onClick={logout}
            className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper">
      <DashboardHeader
        usuario={usuario}
        onLogout={logout}
        indiraAbierta={indiraAbierta}
        onAlternarIndira={() => setIndiraAbierta((abierta) => !abierta)}
        cabeceraRef={cabeceraRef}
      />
      {/* En pantallas anchas el contenido se corre para dejarle sitio al chat: nada queda tapado */}
      <div className={`transition-[padding] duration-200 ease-out ${indiraAbierta ? 'xl:pr-[26rem]' : ''}`}>{children}</div>
      <IndiraPanel abierto={indiraAbierta} onCerrar={cerrarIndira} top={altoCabecera} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
