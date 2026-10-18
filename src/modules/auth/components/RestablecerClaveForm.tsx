'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authService } from '@/modules/auth/services/authService';
import { botonPrimario, campo, campoError, etiqueta, mensajeError } from '@/shared/ui/estilos';

const esquema = z
  .object({
    clave: z
      .string()
      .min(10, 'Mínimo 10 caracteres')
      .regex(/[a-z]/, 'Incluye una minúscula')
      .regex(/[A-Z]/, 'Incluye una mayúscula')
      .regex(/\d/, 'Incluye un número'),
    repetida: z.string(),
  })
  .refine((v) => v.clave === v.repetida, { path: ['repetida'], message: 'Las contraseñas no coinciden' });

type Valores = z.infer<typeof esquema>;

/** Crea la contraseña con el enlace que llegó por correo (invitación o recuperación). */
export function RestablecerClaveForm() {
  const token = useSearchParams().get('token')?.trim() ?? '';
  const [listo, setListo] = useState(false);
  const [verClave, setVerClave] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(esquema) });

  const guardar = async ({ clave }: Valores) => {
    setErrorServidor(null);
    try {
      await authService.restablecerClave(token, clave);
      setListo(true);
    } catch (err) {
      const mensaje = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setErrorServidor(mensaje ?? 'No se pudo guardar la contraseña. Inténtalo de nuevo.');
    }
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <div role="alert" className="rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
          Este enlace está incompleto. Abre el enlace completo que llegó a tu correo.
        </div>
        <Link href="/recuperar-clave" className="btn btn-secondary w-full">Pedir un enlace nuevo</Link>
      </div>
    );
  }

  if (listo) {
    return (
      <div role="status" className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-ok/20 bg-ok-soft px-4 py-3 text-sm text-ink">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
          <p>Tu contraseña quedó guardada. Ya puedes iniciar sesión con tu correo o tu usuario.</p>
        </div>
        <Link href="/login" className={`${botonPrimario} btn-lg w-full`}>Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(guardar)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="clave" className={etiqueta}>Contraseña nueva</label>
        <div className="relative">
          <input
            id="clave"
            type={verClave ? 'text' : 'password'}
            autoComplete="new-password"
            autoFocus
            aria-invalid={Boolean(errors.clave)}
            aria-describedby="clave-ayuda"
            className={`${campo} pr-11 ${errors.clave ? campoError : ''}`}
            {...register('clave')}
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={verClave}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-faint transition-colors hover:text-ink"
          >
            {verClave ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        <p id="clave-ayuda" className="hint">Mínimo 10 caracteres, con mayúscula, minúscula y número.</p>
        {errors.clave && <p className={mensajeError}>{errors.clave.message}</p>}
      </div>

      <div>
        <label htmlFor="repetida" className={etiqueta}>Repite la contraseña</label>
        <input
          id="repetida"
          type={verClave ? 'text' : 'password'}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.repetida)}
          className={`${campo} ${errors.repetida ? campoError : ''}`}
          {...register('repetida')}
        />
        {errors.repetida && <p className={mensajeError}>{errors.repetida.message}</p>}
      </div>

      {errorServidor && (
        <div role="alert" className="rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">
          {errorServidor}{' '}
          <Link href="/recuperar-clave" className="font-medium underline">Pedir un enlace nuevo</Link>
        </div>
      )}

      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting || undefined} className={`${botonPrimario} btn-lg w-full`}>
        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Guardando…</> : 'Guardar contraseña'}
      </button>
    </form>
  );
}
