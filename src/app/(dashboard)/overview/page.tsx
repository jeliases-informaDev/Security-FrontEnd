'use client';

import Link from 'next/link';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { MODULOS_DASHBOARD } from '@/shared/lib/modulos';

export default function OverviewPage() {
  const { usuario } = useAuth();

  if (!usuario) {
    return null;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-ink tracking-tight">
          Hola, {usuario.nombreCompleto || usuario.usuario}
        </h1>
        <p className="text-brand-muted text-sm mt-1">Elegí un módulo para continuar</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULOS_DASHBOARD.map((modulo) => {
          const Icono = modulo.icono;

          const contenido = (
            <>
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                  modulo.disponible
                    ? 'bg-brand-amber-soft text-brand-navy'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icono className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                <h2
                  className={`font-semibold ${
                    modulo.disponible ? 'text-brand-ink' : 'text-slate-400'
                  }`}
                >
                  {modulo.nombre}
                </h2>
                {!modulo.disponible && (
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    Próximamente
                  </span>
                )}
              </div>
              <p
                className={`text-sm mt-1 ${
                  modulo.disponible ? 'text-brand-muted' : 'text-slate-400'
                }`}
              >
                {modulo.descripcion}
              </p>
            </>
          );

          if (!modulo.disponible) {
            return (
              <div
                key={modulo.codigo}
                className="bg-white p-5 rounded-2xl border border-slate-100 opacity-60 cursor-not-allowed"
              >
                {contenido}
              </div>
            );
          }

          return (
            <Link
              key={modulo.codigo}
              href={modulo.href}
              className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-brand-amber/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition"
            >
              {contenido}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
