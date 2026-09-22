'use client';

import { useAuth } from '@/modules/auth/hooks/useAuth';

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
    <main className="min-h-screen p-6 flex flex-col items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 max-w-lg w-full">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <p className="text-sm font-medium text-green-700">
            Conexión con la base de datos confirmada
          </p>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">
          Hola, {usuario.nombreCompleto || usuario.usuario}
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          Sesión iniciada correctamente contra el backend y la base de datos.
        </p>

        <dl className="grid grid-cols-2 gap-4 text-sm mb-8">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <dt className="text-slate-400 text-xs mb-1">Usuario</dt>
            <dd className="text-slate-800 font-medium">{usuario.usuario}</dd>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <dt className="text-slate-400 text-xs mb-1">Rol</dt>
            <dd className="text-slate-800 font-medium">{usuario.rol}</dd>
          </div>
        </dl>

        <button
          onClick={logout}
          className="w-full px-8 py-3.5 bg-white text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition shadow-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
