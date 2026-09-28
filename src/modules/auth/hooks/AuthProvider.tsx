'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, UsuarioLoginResponse } from '@/modules/auth/services/authService';

interface AuthContextValue {
  usuario: UsuarioLoginResponse | null;
  cargando: boolean;
  error: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
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

  return (
    <AuthContext.Provider value={{ usuario, cargando, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
