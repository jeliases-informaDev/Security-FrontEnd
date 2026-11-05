'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/modules/auth/services/authService';
import { Aviso } from '@/shared/ui/kit';

/**
 * Botón «Entrar con tu cuenta Sulotec» de la página de login. Solo aparece si el servidor
 * dice que el inicio con la cuenta Sulotec está activo. También muestra el aviso cuando
 * /sso nos devuelve aquí porque no está habilitado.
 */
export function SsoAcceso() {
  const [activo, setActivo] = useState(false);
  const inactivo = useSearchParams().get('sso') === 'inactivo';

  useEffect(() => {
    let cancelado = false;
    authService
      .ssoConfig()
      .then((config) => { if (!cancelado) setActivo(config.activo === true); })
      .catch(() => { if (!cancelado) setActivo(false); });
    return () => { cancelado = true; };
  }, []);

  return (
    <>
      {inactivo && (
        <Aviso
          className="mb-4"
          aviso={{ tipo: 'info', texto: 'El inicio con la cuenta Sulotec no está habilitado por ahora. Entra con tu usuario y contraseña.' }}
        />
      )}
      {activo && (
        <div className="mt-5">
          <div className="mb-4 flex items-center gap-3 text-xs text-faint" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            o
            <span className="h-px flex-1 bg-line" />
          </div>
          <Link href="/sso" className="btn btn-secondary btn-lg w-full">Entrar con tu cuenta Sulotec</Link>
        </div>
      )}
    </>
  );
}
