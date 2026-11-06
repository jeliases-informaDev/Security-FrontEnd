'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Eye, Pencil } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Etiqueta } from '@/shared/ui/kit';
import { fechaCorta, fechaYHora, minusculaInicial } from '../lib/formato';
import type { EstadoOficial, ResumenDesignacion } from '../services/oficialService';
import { BTN, BotonPronto, EtiquetaEstado, Iniciales, NotaSoloLectura, RUTA_OFICIAL, Tarjeta, URL_SISDEL } from './piezas';
import { TarjetaPlazo } from './TarjetaPlazo';

/** Un paso de la lista: círculo con su número (o visto), título y lo que hay que hacer. */
export function Paso({ circulo, titulo, destacado = false, children }: { circulo: ReactNode; titulo: string; destacado?: boolean; children?: ReactNode }) {
  return (
    <li className={`flex items-start gap-4 px-5 py-[22px] sm:px-6 ${destacado ? 'bg-[#fbfbfc]' : ''}`}>
      {circulo}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="text-[17px] font-semibold text-ink">{titulo}</h3>
        {children}
      </div>
    </li>
  );
}

export const Texto = ({ children }: { children: ReactNode }) => <p className="text-[15px] leading-[22px] text-muted">{children}</p>;

export const circuloBase = 'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold';

/** Tarjeta «Oficial designado» del aside: iniciales, nombre, cargo y estado. */
export function TarjetaOficial({ titular }: { titular: Pick<ResumenDesignacion, 'iniciales' | 'nombreCompleto' | 'tipoCargoNombre' | 'dedicacionNombre' | 'documento' | 'estado' | 'estadoEtiqueta'> }) {
  return (
    <Tarjeta className="!gap-3 !rounded-[22px]">
      <div className="flex items-center gap-3.5">
        <Iniciales iniciales={titular.iniciales} />
        <div className="min-w-0">
          <p className="break-words text-[17px] font-bold leading-snug text-ink">{titular.nombreCompleto}</p>
          <p className="text-sm text-muted">{titular.tipoCargoNombre} · {titular.dedicacionNombre} · {titular.documento}</p>
        </div>
      </div>
      <EtiquetaEstado estado={titular.estado} texto={titular.estadoEtiqueta} className="self-start" />
    </Tarjeta>
  );
}

/**
 * OC 7 · Designación guardada: lo que sigue es comunicarla a la UIF por SISDEL (fuera de PLAFT) y registrar aquí esa comunicación.
 * Si la UIF respondió «No procedente», el servidor lo avisa en `observacionUif` y no hay plazo nuevo: se muestra su respuesta.
 * «Ver ficha» y «Registrar comunicación» llevan a OC 9 y OC 8. «Corregir los datos» queda «Pronto» hasta que esté la corrección.
 */
export function DesignacionGuardada({ estado, titular }: { estado: EstadoOficial; titular: ResumenDesignacion }) {
  const puedeComunicar = estado.permisos.puedeComunicar;
  const observacion = estado.observacionUif;

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Oficial de cumplimiento · Pendiente de comunicar a la UIF"
        icono={Check}
        titulo="Designación guardada"
        descripcion={`Se designó a ${titular.nombreCompleto} como oficial ${minusculaInicial(titular.tipoCargoNombre)} el ${fechaCorta(titular.fechaDesignacion)}. Falta comunicarlo a la UIF-Perú.`}
        sinLinea
        acciones={
          <>
            <Link href={`${RUTA_OFICIAL}/ficha`} className={`btn btn-secondary ${BTN}`}>
              <Eye className="h-4 w-4" aria-hidden="true" /> Ver ficha
            </Link>
            {puedeComunicar && (
              <Link href={`${RUTA_OFICIAL}/comunicacion`} className={`btn btn-secondary ${BTN}`}>
                <ArrowRight className="h-4 w-4" aria-hidden="true" /> Registrar comunicación
              </Link>
            )}
          </>
        }
      />
      {!puedeComunicar && <NotaSoloLectura className="mb-5" />}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,33%,28.75rem)]">
        <section className="card min-w-0" aria-label="Pasos para completar la designación">
          <ol className="divide-y divide-line">
            <Paso
              titulo="Designación guardada"
              circulo={<span className={`${circuloBase} bg-ok-soft text-ok`} aria-hidden="true"><Check className="h-4 w-4" strokeWidth={3} /></span>}
            >
              <Texto>{fechaYHora(titular.guardadaEn)} · con las declaraciones juradas y el acta de designación.</Texto>
            </Paso>

            <Paso titulo="Comunica la designación a la UIF" destacado circulo={<span className={`${circuloBase} bg-brand text-white`} aria-hidden="true">2</span>}>
              <Texto>Entra a SISDEL (plaft.sbs.gob.pe/sisdel) y presenta la solicitud de designación en línea con los datos, las declaraciones juradas y el acta.</Texto>
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                <a href={URL_SISDEL} target="_blank" rel="noopener noreferrer" className="btn btn-primary h-auto min-h-11 max-w-full py-2.5 text-center">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" /> Abrir SISDEL (sitio de la SBS)
                  <span className="sr-only"> (se abre en otra pestaña)</span>
                </a>
                <Etiqueta tono="brand">Se abre fuera de PLAFT</Etiqueta>
              </div>
            </Paso>

            <Paso titulo="Registra la comunicación y los códigos secretos" circulo={<span className={`${circuloBase} border border-line bg-white text-ink/50`} aria-hidden="true">3</span>}>
              <Texto>Cuando la UIF notifique que la designación es procedente, anota la constancia y los códigos secretos que te asigne.</Texto>
              {puedeComunicar && (
                <Link href={`${RUTA_OFICIAL}/comunicacion`} className={`btn btn-secondary mt-1 self-start ${BTN}`}>
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Registrar comunicación
                </Link>
              )}
            </Paso>
          </ol>
        </section>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Plazo y oficial designado">
          {observacion ? (
            <Tarjeta
              titulo="Respuesta de la UIF"
              descripcion={`Notificada el ${fechaCorta(observacion.fechaNotificacion)}.`}
              derecha={<Etiqueta tono="bad" className="shrink-0">No procedente</Etiqueta>}
              centrada
              className="!gap-3"
            >
              <p className="whitespace-pre-line break-words text-[15px] leading-[22px] text-ink">{observacion.motivo}</p>
              {estado.permisos.puedeCorregir && <BotonPronto className={`self-start ${BTN}`}>Corregir los datos</BotonPronto>}
            </Tarjeta>
          ) : (
            estado.plazoComunicacion && (
              <TarjetaPlazo plazo={estado.plazoComunicacion} titulo="Plazo para comunicar a la UIF" descripcion={`Desde el ${fechaCorta(estado.plazoComunicacion.desde)}.`} />
            )
          )}
          <TarjetaOficial titular={titular} />
        </aside>
      </div>
    </PageShell>
  );
}
