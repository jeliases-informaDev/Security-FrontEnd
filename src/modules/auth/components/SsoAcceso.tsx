'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authService } from '@/modules/auth/services/authService';
import { Aviso } from '@/shared/ui/kit';

/**
 * Cuerpo del login. Si el servidor dice que el inicio con la cuenta Sulotec está activo,
 * «Entrar con tu cuenta Sulotec» es el botón principal y el formulario de usuario y contraseña
 * (que reciben `children`) queda debajo: las cuentas antiguas lo siguen usando.
 * También muestra el aviso cuando /sso nos devuelve aquí porque no está habilitado.
 */
export function SsoAcceso({ children }: { children: ReactNode }) {
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
        <>
          <Link href="/sso" className="btn btn-primary btn-lg w-full">Entrar con tu cuenta Sulotec</Link>
          <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="rotulo">o entra con usuario y contraseña</span>
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      {children}
    </>
  );
}
