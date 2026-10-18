import { FileSearch, Lock, ShieldCheck, Sparkles, Waypoints } from 'lucide-react';
import { LoginForm } from '@/modules/auth/components/LoginForm';
import { MARCA } from '@/shared/lib/marca';

const PILARES = [
  { icono: FileSearch, titulo: 'Listas y PEP al instante', texto: 'Consulta personas y empresas en listas negativas, PEP y noticias con el historial de cada búsqueda.' },
  { icono: Waypoints, titulo: 'Riesgo con trazabilidad', texto: 'Scoring, matrices y registro de operaciones con cada decisión guardada y auditable.' },
  { icono: Lock, titulo: 'Cada empresa, lo suyo', texto: 'Separación por empresa aplicada en el servidor: nadie ve datos que no le corresponden.' },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1.1fr_1fr]">
      {/* Lado de marca */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-brand-hover via-brand to-[#159e91] text-white lg:flex lg:flex-col lg:justify-between lg:p-12" aria-hidden="true">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(55% 45% at 15% 15%, rgba(255,255,255,.14) 0, transparent 60%), radial-gradient(45% 45% at 88% 85%, rgba(253,241,220,.35) 0, transparent 60%)' }} />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 top-1/4 h-72 w-72 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3" translate="no">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20"><ShieldCheck className="h-6 w-6" /></span>
          <span className="leading-tight"><span className="block text-lg font-semibold tracking-tight">{MARCA.nombre}</span><span className="block text-sm text-white/70">{MARCA.producto}</span></span>
        </div>
        <div className="relative max-w-lg">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight">{MARCA.lema}</h2>
          <ul className="mt-10 space-y-6">
            {PILARES.map((p) => (
              <li key={p.titulo} className="flex gap-4">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"><p.icono className="h-5 w-5" /></span>
                <span><span className="block font-semibold">{p.titulo}</span><span className="block text-sm leading-relaxed text-white/70">{p.texto}</span></span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 text-sm text-white/60"><Sparkles className="h-4 w-4" /> Con Indira, tu asistente de cumplimiento, siempre a un clic.</p>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden" translate="no">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-hover text-white"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
            <span className="leading-tight"><span className="block font-semibold text-ink">{MARCA.nombre}</span><span className="block text-xs text-muted">{MARCA.producto}</span></span>
          </div>

          <div className="card aparece p-7 sm:p-8">
            <p className="eyebrow">Bienvenido</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">Iniciar sesión</h1>
            <p className="mb-6 mt-1 text-sm text-muted">Entra con tu correo (o tu usuario) y tu contraseña.</p>
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-faint">Acceso restringido. La actividad en la plataforma queda registrada. · {MARCA.nombre} por {MARCA.por}</p>
        </div>
      </section>
    </main>
  );
}
