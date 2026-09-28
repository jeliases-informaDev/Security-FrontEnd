'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/modules/auth/services/authService';

const loginSchema = z.object({
  usuario: z.string().min(1, 'El usuario es obligatorio'),
  clave: z.string().min(1, 'La contraseña es obligatoria'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label htmlFor="usuario" className="block text-sm font-medium text-slate-700 mb-1.5">
          Usuario
        </label>
        <input
          id="usuario"
          type="text"
          autoComplete="username"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="lavado_pru"
          {...register('usuario')}
        />
        {errors.usuario && (
          <p className="mt-1.5 text-xs text-red-600">{errors.usuario.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="clave" className="block text-sm font-medium text-slate-700 mb-1.5">
          Contraseña
        </label>
        <input
          id="clave"
          type="password"
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
          {...register('clave')}
        />
        {errors.clave && (
          <p className="mt-1.5 text-xs text-red-600">{errors.clave.message}</p>
        )}
      </div>

      {errorServidor && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {errorServidor}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-8 py-3.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Ingresando…' : 'Ingresar'}
      </button>
    </form>
  );
}
