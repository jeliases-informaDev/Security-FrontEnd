'use client';

import { AuthProvider, useAuth } from '@/modules/auth/hooks/AuthProvider';
import { DashboardHeader } from '@/shared/ui/DashboardHeader';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { usuario, cargando, error, logout } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-paper">
        <p className="text-brand-muted text-sm">Verificando sesión…</p>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-paper p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <p className="text-red-600 text-sm font-medium mb-4">
            {error ?? 'No se pudo confirmar la sesión'}
          </p>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper">
      <DashboardHeader usuario={usuario} onLogout={logout} />
      {children}
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
