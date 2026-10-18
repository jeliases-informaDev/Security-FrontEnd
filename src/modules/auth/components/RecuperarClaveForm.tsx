'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MailCheck } from 'lucide-react';
import { authService } from '@/modules/auth/services/authService';
import { botonPrimario, campo, campoError, etiqueta, mensajeError } from '@/shared/ui/estilos';

const esquema = z.object({
  correo: z.string().trim().min(1, 'Escribe tu correo').email('Escribe un correo válido'),
});

type Valores = z.infer<typeof esquema>;

/** Pide el correo y manda el enlace de recuperación. La respuesta es la misma exista o no la cuenta. */
export function RecuperarClaveForm() {
  const [enviado, setEnviado] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ resolver: zodResolver(esquema) });

  const enviar = async ({ correo }: Valores) => {
    setErrorServidor(null);
    try {
      await authService.solicitarRecuperacion(correo);
      setEnviado(correo);
    } catch {
      setErrorServidor('No se pudo enviar el pedido. Inténtalo de nuevo en un momento.');
    }
  };

  if (enviado) {
    return (
      <div role="status" className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-ok/20 bg-ok-soft px-4 py-3 text-sm text-ink">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden="true" />
          <p>
            Si <strong className="font-semibold">{enviado}</strong> tiene una cuenta, le enviamos un enlace para crear una contraseña nueva. Vale 30 minutos.
          </p>
        </div>
        <p className="text-sm text-muted">¿No llega? Revisa la carpeta de no deseados o pídele a tu administrador que te reenvíe la invitación.</p>
        <Link href="/login" className="btn btn-secondary w-full">Volver a iniciar sesión</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="correo" className={etiqueta}>Correo de tu cuenta</label>
        <input
          id="correo"
          type="email"
          autoComplete="email"
          autoFocus
          aria-invalid={Boolean(errors.correo)}
          aria-describedby={errors.correo ? 'correo-error' : undefined}
          className={`${campo} ${errors.correo ? campoError : ''}`}
          {...register('correo')}
        />
        {errors.correo && <p id="correo-error" className={mensajeError}>{errors.correo.message}</p>}
      </div>

      {errorServidor && (
        <div role="alert" className="rounded-xl border border-bad/20 bg-bad-soft px-3.5 py-2.5 text-sm text-bad">{errorServidor}</div>
      )}

      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting || undefined} className={`${botonPrimario} btn-lg w-full`}>
        {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Enviando…</> : 'Enviarme el enlace'}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="font-medium text-brand-ink hover:underline">Volver a iniciar sesión</Link>
      </p>
    </form>
  );
}
