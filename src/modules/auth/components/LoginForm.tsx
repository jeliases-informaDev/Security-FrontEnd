'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '@/modules/auth/services/authService';
import { botonPrimario, campo, campoError, etiqueta, mensajeError } from '@/shared/ui/estilos';

const loginSchema = z.object({
  usuario: z.string().min(1, 'Escribe tu usuario'),
  clave: z.string().min(1, 'Escribe tu contraseña'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [verClave, setVerClave] = useState(false);

  // Si ya hay una sesión abierta, no hace falta volver a entrar.
  useEffect(() => {
    if (authService.isAuthenticated()) router.replace('/overview');
  }, [router]);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorServidor(null);
    try {
      await authService.login(values);
      router.push('/overview');
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo conectar con el servidor. Inténtalo de nuevo en un momento.';
      setErrorServidor(mensaje);
      setFocus('clave');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, () => setFocus(errors.usuario ? 'usuario' : 'clave'))} className="space-y-4" noValidate>
      <div>
        <label htmlFor="usuario" className={etiqueta}>Usuario</label>
        <input
          id="usuario"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          aria-invalid={Boolean(errors.usuario)}
          aria-describedby={errors.usuario ? 'usuario-error' : undefined}
          className={`${campo} ${errors.usuario ? campoError : ''}`}
          {...register('usuario')}
        />
        {errors.usuario && <p id="usuario-error" className={mensajeError}>{errors.usuario.message}</p>}
      </div>

      <div>
        <label htmlFor="clave" className={etiqueta}>Contraseña</label>
        <div className="relative">
          <input
            id="clave"
            type={verClave ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.clave)}
            aria-describedby={errors.clave ? 'clave-error' : undefined}
            className={`${campo} pr-11 ${errors.clave ? campoError : ''}`}
            {...register('clave')}
          />
          <button
            type="button"
            onClick={() => setVerClave((visible) => !visible)}
            aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={verClave}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-faint transition-colors hover:text-ink"
          >
            {verClave ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {errors.clave && <p id="clave-error" className={mensajeError}>{errors.clave.message}</p>}
      </div>

      {errorServidor && (
        <div role="alert" className="rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
          {errorServidor}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting || undefined} className={`${botonPrimario} btn-lg w-full`}>
        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Ingresando…</> : 'Ingresar'}
      </button>
    </form>
  );
}
