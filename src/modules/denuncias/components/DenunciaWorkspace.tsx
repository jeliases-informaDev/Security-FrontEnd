'use client';

import { useState } from 'react';
import { ArrowRight, FilePlus2, Inbox, MessageSquareWarning, Search, ShieldAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';
import { Pestanas } from '@/shared/ui/kit';

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
  { vista: 'registrar', nombre: 'Nueva denuncia', descripcion: 'Registra los hechos, los involucrados y el receptor, de forma identificada o anónima.', icono: FilePlus2 },
  { vista: 'consultar', nombre: 'Consultar denuncia', descripcion: 'Revisa el estado y el historial con el identificador y el PIN que se entregaron al registrarla.', icono: Search },
  { vista: 'recibidas', nombre: 'Denuncias recibidas', descripcion: 'Revisa las denuncias asignadas, sus evidencias y su historial, y registra los avances de atención.', icono: Inbox, soloGestion: true },
];

const PASOS = [
  { titulo: 'Registra la denuncia', texto: 'Completa la información necesaria y decide si te identificas o mantienes el anonimato.' },
  { titulo: 'Guarda tus credenciales', texto: 'Al terminar recibes un identificador y un PIN de seguimiento. Sin ellos no se puede consultar la denuncia.' },
  { titulo: 'Consulta el seguimiento', texto: 'Con el identificador y el PIN revisas el estado y los movimientos registrados.' },
];

export function DenunciaWorkspace() {
  const { usuario } = useAuth();

  const rol = usuario?.rol?.trim().toUpperCase();
  const puedeGestionarDenuncias = rol === 'ADMINISTRADOR' || rol === 'SUPERVISOR';

  const [vista, setVista] = useState<VistaDenuncias>('resumen');

  const secciones = SECCIONES.filter((seccion) => !seccion.soloGestion || puedeGestionarDenuncias);

  return (
    <PageShell>
      <PageHeader
        antetitulo="Integridad"
        icono={MessageSquareWarning}
        titulo="Canal de denuncias"
        sinLinea
        descripcion={
          puedeGestionarDenuncias
            ? 'Registra denuncias, consulta su seguimiento y gestiona las que se han recibido, según tus permisos.'
            : 'Registra una denuncia o consulta el seguimiento de una existente con su identificador y PIN.'
        }
      />

      <Pestanas
        ariaLabel="Secciones del canal de denuncias"
        valor={vista}
        onCambiar={setVista}
        opciones={[{ valor: 'resumen' as VistaDenuncias, etiqueta: 'Resumen' }, ...secciones.map((s) => ({ valor: s.vista, etiqueta: s.nombre }))]}
      />

      {vista === 'resumen' && (
        <div className="space-y-6">
          <ul className={`grid gap-4 ${secciones.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {secciones.map((seccion, i) => {
              const Icono = seccion.icono;
              return (
                <li key={seccion.vista} className="aparece" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    type="button"
                    onClick={() => setVista(seccion.vista)}
                    className="card card-hover group flex h-full w-full flex-col gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-ink transition-colors group-hover:bg-brand group-hover:text-white" aria-hidden="true">
                      <Icono className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{seccion.nombre}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted">{seccion.descripcion}</span>
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-brand-ink">
                      Ir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Panel titulo={<span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-brand" aria-hidden="true" /> Cómo funciona</span>} relleno>
            <ol className="grid gap-6 md:grid-cols-3">
              {PASOS.map((paso, indice) => (
                <li key={paso.titulo} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft font-mono text-sm font-semibold text-brand-ink" aria-hidden="true">{indice + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-ink">{paso.titulo}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{paso.texto}</p>
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
