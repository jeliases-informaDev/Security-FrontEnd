'use client';

import { useCallback, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { AuthProvider, useAuth } from '@/modules/auth/hooks/AuthProvider';
import { IndiraPanel } from '@/modules/indira/components/IndiraPanel';
import { ALTO_BARRA_PX, AppShell } from '@/shared/ui/AppShell';
import { MARCA } from '@/shared/lib/marca';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { usuario, cargando, error, logout } = useAuth();
  const [indiraAbierta, setIndiraAbierta] = useState(false);

  const cerrarIndira = useCallback(() => {
    setIndiraAbierta(false);
    document.getElementById('boton-indira')?.focus();
  }, []);

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" aria-hidden="true" />
          Verificando sesión…
        </div>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
        <div className="card zoom-entra w-full max-w-md p-8 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-bad-soft text-bad" aria-hidden="true"><ShieldAlert className="h-6 w-6" /></span>
          <p className="text-base font-semibold text-ink">No pudimos confirmar tu sesión</p>
          <p className="mt-1 text-sm text-muted">{error ?? `Vuelve a entrar a ${MARCA.nombre} para continuar.`}</p>
          <button onClick={logout} className="btn btn-primary mt-6">Volver al inicio de sesión</button>
        </div>
      </div>
    );
  }

  return (
    <AppShell usuario={usuario} onLogout={logout} indiraAbierta={indiraAbierta} onAlternarIndira={() => setIndiraAbierta((abierta) => !abierta)}>
      {children}
      <IndiraPanel abierto={indiraAbierta} onCerrar={cerrarIndira} top={ALTO_BARRA_PX} />
    </AppShell>
  );
}

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
