import { ShieldCheck } from 'lucide-react';
import { RecuperarClaveForm } from '@/modules/auth/components/RecuperarClaveForm';
import { MARCA } from '@/shared/lib/marca';

export default function RecuperarClavePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10 sm:px-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3" translate="no">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-white"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
          <span className="leading-tight"><span className="block font-semibold text-ink">{MARCA.nombre}</span><span className="block text-xs text-muted">{MARCA.producto}</span></span>
        </div>
        <div className="card aparece p-7 sm:p-8">
          <p className="eyebrow">Acceso</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">¿Olvidaste tu contraseña?</h1>
          <p className="mb-6 mt-1 text-sm text-muted">Escribe el correo de tu cuenta y te enviamos un enlace para crear una nueva.</p>
          <RecuperarClaveForm />
        </div>
      </div>
    </main>
  );
}
