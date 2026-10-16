'use client';

import { useState } from 'react';
import { ChevronRight, FilePlus2, Inbox, Search, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';

import { DenunciaForm } from './form/DenunciaForm';
import { ConsultaDenuncia } from './consulta/ConsultaDenuncia';
import { DenunciasRecibidas } from './admin/DenunciasRecibidas';

type VistaDenuncias = 'resumen' | 'registrar' | 'consultar' | 'recibidas';

interface Seccion {
  vista: VistaDenuncias;
  nombre: string;
  descripcion: string;
  icono: LucideIcon;
  /** Solo para quien puede gestionar las denuncias recibidas. */
  soloGestion?: boolean;
}

const SECCIONES: Seccion[] = [
  {
    vista: 'registrar',
    nombre: 'Nueva denuncia',
    descripcion: 'Registra los hechos, los involucrados y el receptor, de forma identificada o anónima.',
    icono: FilePlus2,
  },
  {
    vista: 'consultar',
    nombre: 'Consultar denuncia',
    descripcion: 'Revisa el estado y el historial con el identificador y el PIN que se entregaron al registrarla.',
    icono: Search,
  },
  {
    vista: 'recibidas',
    nombre: 'Denuncias recibidas',
    descripcion: 'Revisa las denuncias asignadas, sus evidencias y su historial, y registra los avances de atención.',
    icono: Inbox,
    soloGestion: true,
  },
];

const PASOS = [
  {
    titulo: 'Registra la denuncia',
    texto: 'Completa la información necesaria y decide si te identificas o mantienes el anonimato.',
  },
  {
    titulo: 'Guarda tus credenciales',
    texto: 'Al terminar recibes un identificador y un PIN de seguimiento. Sin ellos no se puede consultar la denuncia.',
  },
  {
    titulo: 'Consulta el seguimiento',
    texto: 'Con el identificador y el PIN revisas el estado y los movimientos registrados.',
  },
];

export function DenunciaWorkspace() {
  const { usuario } = useAuth();

  const rol = usuario?.rol?.trim().toUpperCase();
  const puedeGestionarDenuncias = rol === 'ADMINISTRADOR' || rol === 'SUPERVISOR';

  const [vista, setVista] = useState<VistaDenuncias>('resumen');

  const secciones = SECCIONES.filter((seccion) => !seccion.soloGestion || puedeGestionarDenuncias);
  const pestanas: { vista: VistaDenuncias; nombre: string; icono: LucideIcon }[] = [
    { vista: 'resumen', nombre: 'Resumen', icono: ShieldAlert },
    ...secciones.map(({ vista: v, nombre, icono }) => ({ vista: v, nombre, icono })),
  ];

  return (
    <PageShell>
      <PageHeader
        titulo="Canal de denuncias"
        sinLinea
        descripcion={
          puedeGestionarDenuncias
            ? 'Registra denuncias, consulta su seguimiento y gestiona las que se han recibido, según tus permisos.'
            : 'Registra una denuncia o consulta el seguimiento de una existente con su identificador y PIN.'
        }
      />

      <nav aria-label="Secciones del canal de denuncias" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-300/70">
        {pestanas.map((pestana) => {
          const Icono = pestana.icono;
          const activa = vista === pestana.vista;
          return (
            <button
              key={pestana.vista}
              type="button"
              onClick={() => setVista(pestana.vista)}
              aria-current={activa ? 'page' : undefined}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm transition ${
                activa
                  ? 'border-brand-navy font-medium text-brand-navy'
                  : 'border-transparent text-brand-muted hover:border-slate-400 hover:text-brand-ink'
              }`}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {pestana.nombre}
            </button>
          );
        })}
      </nav>

      {vista === 'resumen' && (
        <div className="space-y-6">
          <Panel>
            <ul className="divide-y divide-slate-200">
              {secciones.map((seccion) => {
                const Icono = seccion.icono;
                return (
                  <li key={seccion.vista}>
                    <button
                      type="button"
                      onClick={() => setVista(seccion.vista)}
                      className="group flex w-full items-center gap-4 px-5 py-4 text-left transition first:rounded-t-xl last:rounded-b-xl hover:bg-slate-50"
                    >
                      <Icono className="h-5 w-5 shrink-0 text-brand-navy" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-brand-ink">{seccion.nombre}</span>
                        <span className="block text-sm text-brand-muted">{seccion.descripcion}</span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-navy"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel className="p-6">
            <h2 className="text-base font-semibold text-brand-ink">Cómo funciona</h2>
            <ol className="mt-5 grid gap-6 md:grid-cols-3">
              {PASOS.map((paso, indice) => (
                <li key={paso.titulo} className="flex gap-3">
                  <span className="mt-0.5 font-mono text-sm font-medium text-brand-navy">{indice + 1}.</span>
                  <div>
                    <p className="text-sm font-medium text-brand-ink">{paso.titulo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-brand-muted">{paso.texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      )}

      {vista === 'registrar' && <DenunciaForm />}

      {vista === 'consultar' && <ConsultaDenuncia />}

      {vista === 'recibidas' && puedeGestionarDenuncias && <DenunciasRecibidas />}
    </PageShell>
  );
}
