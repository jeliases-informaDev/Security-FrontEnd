'use client';

import { useEffect, useState } from 'react';
import type { AvisoDatos } from '@/shared/ui/kit';

/** Aviso de una sola vez entre pantallas (por ejemplo «Registro actualizado»): se deja al navegar y se muestra al llegar. */
const CLAVE = 'operaciones:aviso';

export function dejarAviso(texto: string): void {
  sessionStorage.setItem(CLAVE, texto);
}

/** Aviso pendiente (si lo hay) y su setter. Se lee al montar y se borra del navegador para que no vuelva a salir. */
export function useAvisoPendiente(): [AvisoDatos | null, (aviso: AvisoDatos | null) => void] {
  const [aviso, setAviso] = useState<AvisoDatos | null>(() => {
    const texto = typeof window === 'undefined' ? null : sessionStorage.getItem(CLAVE);
    return texto ? { tipo: 'ok', texto } : null;
  });
  useEffect(() => {
    sessionStorage.removeItem(CLAVE);
  }, []);
  return [aviso, setAviso];
}
