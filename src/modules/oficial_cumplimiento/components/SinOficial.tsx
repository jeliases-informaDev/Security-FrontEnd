'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Clock, Info, Lock, Plus } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoOficial } from '@/shared/ui/iconos';
import { reglaTexto } from '../lib/formato';
import type { CatalogosOficial, EstadoOficial } from '../services/oficialService';
import { BTN, BotonPronto, NotaSoloLectura, RUTA_OFICIAL, Tarjeta } from './piezas';

/** Rótulos de «Qué incluye la designación» (copiados del diseño). */
const INCLUYE = [
  'Datos de la persona',
  'Acta de designación',
  'Declaración jurada de requisitos',
  'Declaración jurada de quién designó',
  'Comunicación a la UIF',
  'Códigos secretos',
];

/** Pasos de la designación (copiados del diseño; el quinto ocurre después, en la comunicación a la UIF). */
const PASOS = ['Datos de la persona', 'Designación y acta', 'Declaraciones juradas', 'Revisión y guardado', 'Comunicación a la UIF'];

function TarjetaRegla({ icono, titulo, children }: { icono: ReactNode; titulo: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-2.5 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-ink" aria-hidden="true">{icono}</span>
      <h3 className="text-base font-semibold text-ink">{titulo}</h3>
      <p className="text-sm text-muted">{children}</p>
    </section>
  );
}

/** OC 0 · Sin oficial designado. */
export function SinOficial({ estado, catalogos }: { estado: EstadoOficial; catalogos: CatalogosOficial }) {
  const puedeDesignar = estado.permisos.puedeDesignar;
  // El plazo sale de la regla que sirve el backend (no se escribe a mano).
  const plazo = reglaTexto(catalogos.reglas.find((r) => r.codigo === 'PLAZO_COMUNICAR_DESIGNACION'));

  const botonDesignar = (
    <Link href={`${RUTA_OFICIAL}/designar`} className={`btn btn-primary ${BTN}`}>
      <Plus className="h-4 w-4" aria-hidden="true" /> Designar oficial
    </Link>
  );

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Cumplimiento · UIF-Perú"
        icono={IconoOficial}
        titulo="Oficial de cumplimiento"
        descripcion="Designa a la persona responsable de vigilar el sistema de prevención de LA/FT de tu empresa y de comunicarse con la UIF-Perú."
        sinLinea
        acciones={
          <>
            <BotonPronto icono={Info} className={BTN}>Ver requisitos y plazos</BotonPronto>
            {puedeDesignar && botonDesignar}
          </>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,33%,28.75rem)]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="card flex flex-col items-center gap-3.5 p-6 text-center sm:p-12" aria-labelledby="oc0-titulo">
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-brand-soft text-ink" aria-hidden="true">
              <IconoOficial className="h-[34px] w-[34px]" />
            </span>
            <h2 id="oc0-titulo" className="max-w-[560px] text-[22px] font-bold leading-tight text-ink sm:text-[26px]">Aún no hay un oficial de cumplimiento designado</h2>
            <p className="max-w-[580px] text-base leading-6 text-muted">
              Es una persona natural que vigila el sistema de prevención, analiza las operaciones sospechosas y es el contacto con la UIF-Perú.
              {plazo ? ` Designarlo toma unos minutos y debe comunicarse a la UIF dentro de ${plazo}.` : ' Designarlo toma unos minutos.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {puedeDesignar && botonDesignar}
              <BotonPronto icono={Info} className={BTN}>Ver requisitos y plazos</BotonPronto>
            </div>
            {!puedeDesignar && <NotaSoloLectura className="mt-1 max-w-[580px]" />}

            <div className="mt-2 h-px w-full bg-line" aria-hidden="true" />
            <p className="font-mono text-xs text-muted">Qué incluye la designación</p>
            <ul className="flex flex-wrap items-center justify-center gap-2">
              {INCLUYE.map((rotulo) => (
                <li key={rotulo} className="badge badge-neutral">{rotulo}</li>
              ))}
            </ul>
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <TarjetaRegla icono={<IconoOficial className="h-5 w-5" />} titulo="Una persona natural">Es responsable del sistema. No necesita ser gerente.</TarjetaRegla>
            {plazo && (
              <TarjetaRegla icono={<Clock className="h-5 w-5" />} titulo={plazo}>Plazo para comunicar la designación a la UIF por SISDEL.</TarjetaRegla>
            )}
            <TarjetaRegla icono={<Lock className="h-5 w-5" />} titulo="Identidad reservada">La UIF le da códigos secretos; no se inscribe en Registros Públicos.</TarjetaRegla>
          </div>
        </div>

        <aside className="flex flex-col gap-4" aria-label="Quién designa y pasos">
          <Tarjeta titulo="Quién designa" descripcion="Según el tipo de empresa." className="!gap-3">
            <ul className="flex flex-col gap-3">
              {catalogos.tiposEmpresa.map((tipo) => (
                <li key={tipo.codigo} className="rounded-xl border border-line bg-paper px-3 py-2.5">
                  <p className="text-[15px] font-semibold text-ink">{tipo.nombre}</p>
                  <p className="text-sm text-muted">{tipo.quienDesigna}</p>
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta titulo="Pasos de la designación" className="!gap-3">
            <ol className="flex flex-col gap-3">
              {PASOS.map((paso, i) => (
                <li key={paso} className="flex items-center gap-3">
                  <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand-ink" aria-hidden="true">{i + 1}</span>
                  <span className="text-[15px] font-medium text-ink">{paso}</span>
                </li>
              ))}
            </ol>
          </Tarjeta>
        </aside>
      </div>
    </PageShell>
  );
}
