'use client';

import Link from 'next/link';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { MODULOS_DASHBOARD } from '@/shared/lib/modulos';

export default function OverviewPage() {
  const { usuario, cargando, error, logout } = useAuth();

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="text-slate-500 text-sm">Verificando sesión…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-red-100 max-w-md w-full text-center">
          <p className="text-red-600 text-sm font-medium mb-4">{error}</p>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition"
          >
            Volver al login
          </button>
        </div>
      </main>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Hola, {usuario.nombreCompleto || usuario.usuario}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {usuario.rol} · Elegí un módulo para continuar
            </p>
          </div>
          <button
            onClick={logout}
            className="px-5 py-2.5 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition shadow-sm"
          >
            Cerrar sesión
          </button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULOS_DASHBOARD.map((modulo) => {
            const Icono = modulo.icono;

            const contenido = (
              <>
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${
                    modulo.disponible
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <Icono className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h2
                    className={`font-semibold ${
                      modulo.disponible ? 'text-slate-800' : 'text-slate-400'
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
                    modulo.disponible ? 'text-slate-500' : 'text-slate-400'
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
                className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-blue-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition"
              >
                {contenido}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
