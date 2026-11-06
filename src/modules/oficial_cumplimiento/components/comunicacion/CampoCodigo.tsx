'use client';

import { useState, type ReactNode } from 'react';
import { get, useFormContext } from 'react-hook-form';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Campo, idDeRuta } from '../campos';

/**
 * Campo de un código secreto: va tapado como una contraseña (no se ve por encima del hombro) y tiene el candado del diseño.
 * El botón del ojo lo muestra mientras se escribe, para revisar que quedó bien. Nada se guarda en el navegador.
 */
export function CampoCodigo({ ruta, texto, ayuda, deshabilitado = false }: { ruta: string; texto: string; ayuda?: ReactNode; deshabilitado?: boolean }) {
  const { register, formState: { errors } } = useFormContext();
  const [visible, setVisible] = useState(false);
  const id = idDeRuta(ruta);
  const error = get(errors, ruta)?.message as string | undefined;

  return (
    <Campo id={id} texto={texto} error={error} ayuda={ayuda}>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={100}
          placeholder="Ingresa el código"
          disabled={deshabilitado}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined}
          className={`input pl-11 pr-11 ${error ? 'input-error' : ''}`}
          {...register(ruta)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={deshabilitado}
          aria-pressed={visible}
          aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${texto.toLowerCase()}`}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </Campo>
  );
}
