'use client';

import { useAuth } from '@/modules/auth/hooks/useAuth';
import { BuscadorListasNegativas } from '@/modules/listas_negativas/components/BuscadorListasNegativas';

export default function ListasNegativasPage() {
  const { usuario, cargando, error } = useAuth();

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-500 text-sm">Verificando sesión…</p>
      </main>
    );
  }

  if (error || !usuario) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-600 text-sm">{error ?? 'No se pudo confirmar la sesión'}</p>
      </main>
    );
  }

  return <BuscadorListasNegativas />;
}
