'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { esAdministrador, modulosVisibles } from '@/shared/lib/modulos';
import { PageShell } from '@/shared/ui/PageShell';
import { MARCA } from '@/shared/lib/marca';

function saludo() {
  const h = new Date().getHours();
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
}

export default function OverviewPage() {
  const { usuario } = useAuth();
  if (!usuario) return null;

  const nombre = (usuario.nombreCompleto || usuario.usuario).split(' ')[0];
  const modulos = modulosVisibles(usuario);
  const disponibles = modulos.filter((m) => m.disponible);
  const proximos = modulos.filter((m) => !m.disponible);
  const fecha = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  return (
    <PageShell>
      {/* Bienvenida */}
      <section className="aparece mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow capitalize">{fecha}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{saludo()}, {nombre}</h1>
          <p className="mt-1 text-sm text-muted">
            {esAdministrador(usuario) ? 'Tienes acceso a todos los módulos y a la administración de cuentas.' : 'Elige un módulo para empezar. Todo lo que hagas queda registrado.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => document.getElementById('boton-indira')?.click()}
          className="btn btn-secondary"
        >
          <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" /> Preguntarle a Indira
        </button>
      </section>

      {/* Módulos */}
      <section aria-labelledby="titulo-modulos">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="titulo-modulos" className="text-base font-semibold text-ink">Tus módulos</h2>
          <span className="text-sm text-muted">{disponibles.length} disponibles</span>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {disponibles.map((modulo, i) => {
            const Icono = modulo.icono;
            return (
              <li key={modulo.codigo} className="aparece" style={{ animationDelay: `${i * 40}ms` }}>
                <Link href={modulo.href} className="card card-hover group flex h-full flex-col gap-4 p-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-ink transition-colors group-hover:bg-brand group-hover:text-white" aria-hidden="true">
                    <Icono className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{modulo.nombre}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{modulo.descripcion}</span>
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-brand-ink">
                    Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {proximos.length > 0 && (
        <section className="mt-8" aria-labelledby="titulo-proximos">
          <h2 id="titulo-proximos" className="mb-3 text-base font-semibold text-ink">Próximamente</h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {proximos.map((modulo) => {
              const Icono = modulo.icono;
              return (
                <li key={modulo.codigo} className="card flex items-start gap-4 border-dashed p-5 opacity-80">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-faint" aria-hidden="true"><Icono className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 font-semibold text-ink">{modulo.nombre} <span className="badge badge-neutral">Pronto</span></span>
                    <span className="mt-1 block text-sm text-muted">{modulo.descripcion}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="mt-10 text-center text-xs text-faint">{MARCA.nombre} · {MARCA.producto} · por {MARCA.por}</p>
    </PageShell>
  );
}
