'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, History, Plus, Send } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Etiqueta } from '@/shared/ui/kit';
import { IconoAlerta } from '@/shared/ui/iconos';
import { diasTexto, fechaCorta } from '../../lib/formato';
import type { CatalogosOficial, EstadoOficial, Plazo, Vacancia } from '../../services/oficialService';
import { ModalComunicarPendiente } from '../comunicacion/ModalComunicarPendiente';
import { Paso, Texto, circuloBase } from '../DesignacionGuardada';
import { BTN, NotaLateral, NotaSoloLectura, RUTA_OFICIAL, URL_SISDEL } from '../piezas';
import { TarjetaPlazo } from '../TarjetaPlazo';

/** «Quedan 30 días», «Queda 1 día»: lo que falta de un plazo, tal como lo contó el servidor. */
const quedan = (plazo: Plazo): string => `${plazo.diasRestantes === 1 ? 'Queda' : 'Quedan'} ${diasTexto(plazo.diasRestantes, plazo.unidad)}`;
const enPlazo = (plazo: Plazo): boolean => plazo.estado !== 'VENCIDO' && plazo.diasRestantes > 0;

/** Texto del aviso rojo: cuánto falta para designar y, mientras no se comunique la remoción, para comunicarla. */
function textoDeAlerta(vacancia: Vacancia): string {
  const designar = vacancia.plazoDesignar;
  const comunicar = vacancia.remocionComunicada ? null : vacancia.plazoComunicarRemocion;
  if (enPlazo(designar) && (!comunicar || enPlazo(comunicar))) {
    return comunicar
      ? `${quedan(designar)} para designar a uno nuevo y ${diasTexto(comunicar.diasRestantes, comunicar.unidad)} para comunicar la remoción.`
      : `${quedan(designar)} para designar a uno nuevo.`;
  }
  const frases = [
    designar.estado === 'VENCIDO' ? 'El plazo para designar a uno nuevo venció.' : enPlazo(designar) ? `${quedan(designar)} para designar a uno nuevo.` : 'Hoy vence el plazo para designar a uno nuevo.',
  ];
  if (comunicar) {
    frases.push(comunicar.estado === 'VENCIDO' ? 'El plazo para comunicar la remoción venció.' : enPlazo(comunicar) ? `${quedan(comunicar)} para comunicar la remoción.` : 'Hoy vence el plazo para comunicar la remoción.');
  }
  return frases.join(' ');
}

/**
 * OC 13 · Cargo vacante: la empresa no tiene oficial vigente. Muestra cuánto falta para designar a uno nuevo (máximo de vacancia) y para
 * comunicar la remoción a la UIF, y lleva a «Designar nuevo oficial» (el mismo asistente, con `reemplazaOficialAnterior`). Los plazos
 * y las fechas los calcula el servidor; aquí solo se pintan.
 */
export function CargoVacante({ estado, vacancia, catalogos, recargar }: { estado: EstadoOficial; vacancia: Vacancia; catalogos: CatalogosOficial; recargar: () => void }) {
  const [registrando, setRegistrando] = useState(false);
  const puedeDesignar = estado.permisos.puedeDesignar;
  const puedeRegistrar = estado.permisos.puedeRegistrarPendientes;
  const pendienteRemocion = estado.pendientes.find((p) => p.id === vacancia.pendienteRemocionId) ?? null;
  const comunicada = vacancia.remocionComunicada;
  const plazoComunicar = comunicada ? null : vacancia.plazoComunicarRemocion;
  const fechaDecision = fechaCorta(vacancia.fechaDecision);
  const aprobada = vacancia.aprobadaPor ? `, aprobada por ${vacancia.aprobadaPor}` : '';

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo={`Oficial de cumplimiento · ${estado.estadoEtiqueta}`}
        icono={IconoAlerta}
        titulo="Cargo vacante"
        descripcion={
          comunicada
            ? `La remoción quedó registrada el ${fechaDecision} y ya se comunicó a la UIF. Designa a un nuevo oficial.`
            : `La remoción quedó registrada el ${fechaDecision}. Comunícala a la UIF y designa a un nuevo oficial.`
        }
        sinLinea
        acciones={
          <>
            <Link href={`${RUTA_OFICIAL}/historial?id=${encodeURIComponent(vacancia.designacionRemovidaId)}`} className={`btn btn-secondary ${BTN}`}>
              <History className="h-4 w-4" aria-hidden="true" /> Ver historial
            </Link>
            {puedeDesignar && (
              <Link href={`${RUTA_OFICIAL}/designar`} className={`btn btn-primary ${BTN}`}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Designar nuevo oficial
              </Link>
            )}
          </>
        }
      />
      {!puedeDesignar && <NotaSoloLectura className="mb-5" />}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,33%,28.75rem)]">
        <div className="flex min-w-0 flex-col gap-5">
          <div role="note" className="flex items-center gap-4 rounded-2xl bg-bad-solid px-[22px] py-5 text-white">
            <IconoAlerta className="h-6 w-6 shrink-0" aria-hidden="true" />
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <p className="break-words text-[19px] font-bold leading-snug">No hay un oficial de cumplimiento vigente</p>
              <p className="break-words text-[15px] leading-[22px] text-white/85">{textoDeAlerta(vacancia)}</p>
            </div>
          </div>

          <section className="card min-w-0" aria-label="Pasos para cubrir el cargo">
            <ol className="divide-y divide-line">
              <Paso
                titulo="Remoción registrada"
                circulo={<span className={`${circuloBase} bg-ok-soft text-ok`} aria-hidden="true"><Check className="h-4 w-4" strokeWidth={3} /></span>}
              >
                <Texto>{fechaDecision} · {vacancia.motivoNombre}{aprobada}.</Texto>
              </Paso>

              {comunicada ? (
                <Paso
                  titulo="Remoción comunicada a la UIF"
                  circulo={<span className={`${circuloBase} bg-ok-soft text-ok`} aria-hidden="true"><Check className="h-4 w-4" strokeWidth={3} /></span>}
                >
                  <Texto>Ya se anotó la comunicación de la remoción. Queda en el historial del oficial anterior.</Texto>
                </Paso>
              ) : (
                <Paso titulo="Comunica la remoción a la UIF" destacado circulo={<span className={`${circuloBase} bg-brand text-white`} aria-hidden="true">2</span>}>
                  <Texto>
                    Hazlo por SISDEL con el sustento y la aprobación.
                    {plazoComunicar && ` Plazo: ${diasTexto(plazoComunicar.total, plazoComunicar.unidad)}, hasta el ${fechaCorta(plazoComunicar.vence)}${plazoComunicar.cuentaFeriados ? '' : ' (estimado: no cuenta feriados)'}.`}
                  </Texto>
                  <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
                    <a href={URL_SISDEL} target="_blank" rel="noopener noreferrer" className="btn btn-primary h-auto min-h-11 max-w-full py-2.5 text-center">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" /> Abrir SISDEL (sitio de la SBS)
                      <span className="sr-only"> (se abre en otra pestaña)</span>
                    </a>
                    <Etiqueta tono="brand">Se abre fuera de PLAFT</Etiqueta>
                    {puedeRegistrar && pendienteRemocion && (
                      <button type="button" onClick={() => setRegistrando(true)} className={`btn btn-secondary ${BTN}`}>
                        <Send className="h-4 w-4" aria-hidden="true" /> Registrar comunicación
                      </button>
                    )}
                  </div>
                </Paso>
              )}

              <Paso
                titulo="Designa a un nuevo oficial"
                destacado={comunicada}
                circulo={
                  comunicada
                    ? <span className={`${circuloBase} bg-brand text-white`} aria-hidden="true">3</span>
                    : <span className={`${circuloBase} border border-line bg-white text-ink/50`} aria-hidden="true">3</span>
                }
              >
                <Texto>Con los mismos pasos: datos, designación y acta, declaraciones juradas y comunicación a la UIF.</Texto>
                {puedeDesignar && (
                  <Link href={`${RUTA_OFICIAL}/designar`} className={`btn btn-secondary mt-1 self-start ${BTN}`}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Designar nuevo oficial
                  </Link>
                )}
              </Paso>
            </ol>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Plazo para designar">
          <TarjetaPlazo
            plazo={vacancia.plazoDesignar}
            titulo="Plazo para designar"
            descripcion={`Máximo ${diasTexto(vacancia.plazoDesignar.total, vacancia.plazoDesignar.unidad)} de vacancia.`}
          />
          <NotaLateral rotulo="Mientras tanto">
            Si tienes oficial alterno comunicado a la UIF, puede cumplir las funciones hasta que se designe al nuevo. Sin alterno, nadie envía el RO ni comunica ROS a la UIF en nombre de la empresa.
          </NotaLateral>
        </aside>
      </div>

      {registrando && pendienteRemocion && (
        <ModalComunicarPendiente
          pendiente={pendienteRemocion}
          catalogos={catalogos}
          onCerrar={() => setRegistrando(false)}
          onGuardado={() => {
            setRegistrando(false);
            recargar();
          }}
        />
      )}
    </PageShell>
  );
}
