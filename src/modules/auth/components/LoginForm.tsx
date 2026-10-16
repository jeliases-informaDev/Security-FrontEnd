'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '@/modules/auth/services/authService';
import { botonPrimario, campo, campoError, etiqueta, mensajeError } from '@/shared/ui/estilos';

const loginSchema = z.object({
  usuario: z.string().min(1, 'El usuario es obligatorio'),
  clave: z.string().min(1, 'La contraseña es obligatoria'),
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
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorServidor(null);
    try {
      await authService.login(values);
      router.push('/overview');
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo conectar con el backend. Verifica que esté corriendo.';
      setErrorServidor(mensaje);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="usuario" className={etiqueta}>
          Usuario
        </label>
        <input
          id="usuario"
          type="text"
          autoComplete="username"
          autoFocus
          aria-invalid={Boolean(errors.usuario)}
          className={`${campo} ${errors.usuario ? campoError : ''}`}
          {...register('usuario')}
        />
        {errors.usuario && <p className={mensajeError}>{errors.usuario.message}</p>}
      </div>

      <div>
        <label htmlFor="clave" className={etiqueta}>
          Contraseña
        </label>
        <div className="relative">
          <input
            id="clave"
            type={verClave ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.clave)}
            className={`${campo} pr-10 ${errors.clave ? campoError : ''}`}
            {...register('clave')}
          />
          <button
            type="button"
            onClick={() => setVerClave((visible) => !visible)}
            aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition hover:text-slate-700"
          >
            {verClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.clave && <p className={mensajeError}>{errors.clave.message}</p>}
      </div>

      {errorServidor && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {errorServidor}
        </div>
      )}

      <button type="submit" disabled={isSubmitting} className={`${botonPrimario} w-full`}>
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
