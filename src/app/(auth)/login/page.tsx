import { ShieldCheck } from 'lucide-react';
import { LoginForm } from '@/modules/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-brand-amber" aria-hidden="true" />
          <span className="text-base font-semibold tracking-tight text-brand-navy">RegTech Core</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-7">
          <h1 className="text-xl font-semibold tracking-tight text-brand-ink">Iniciar sesión</h1>
          <p className="mb-6 mt-1 text-sm text-brand-muted">
            Usa el usuario y la contraseña que te asignó tu oficial de cumplimiento.
          </p>

          <LoginForm />
        </div>

        <p className="mt-6 text-xs text-slate-500">Acceso restringido. La actividad en la plataforma queda registrada.</p>
      </div>
    </main>
  );
}
