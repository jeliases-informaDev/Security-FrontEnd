'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UsuarioLoginResponse } from '@/modules/auth/services/authService';

interface UseAuthResult {
  usuario: UsuarioLoginResponse | null;
  cargando: boolean;
  error: string | null;
  logout: () => void;
}

export function useAuth(): UseAuthResult {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioLoginResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    authService
      .me()
      .then(setUsuario)
      .catch(() => {
        setError('No se pudo confirmar la sesión con el backend');
      })
      .finally(() => setCargando(false));
  }, [router]);

  const logout = useCallback(() => {
    authService.logout();
    router.replace('/login');
  }, [router]);

  return { usuario, cargando, error, logout };
}
