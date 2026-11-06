'use client';

import Link from 'next/link';
import { Eye, History, Pencil, Plus, UserMinus } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoOficial } from '@/shared/ui/iconos';
import { fechaCorta } from '../lib/formato';
import type { EstadoOficial } from '../services/oficialService';
import { TarjetaOficial } from './DesignacionGuardada';
import { BTN, BotonPronto, Dato, NotaLateral, NotaSoloLectura, RUTA_OFICIAL, Tarjeta } from './piezas';
import { TarjetaPlazo } from './TarjetaPlazo';

/**
 * Pantalla provisional de los estados «En evaluación», «Vigente» y «Cargo vacante»: sus pantallas definitivas (ficha, cambio de datos,
 * historial, remoción y cargo vacante) todavía no están hechas. Muestra lo que ya manda el servidor y deja apagado con «Pronto» lo que
 * aún no se puede hacer. Lo único que funciona es «Designar nuevo oficial» cuando el cargo está vacante.
 */
export function OficialResumen({ estado }: { estado: EstadoOficial }) {
  const vacante = estado.estado === 'VACANTE';
  const titular = estado.titular;
  const vacancia = estado.vacancia;
  const puedeDesignar = estado.permisos.puedeDesignar;

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Cumplimiento · UIF-Perú"
        icono={IconoOficial}
        titulo="Oficial de cumplimiento"
        descripcion={estado.estadoEtiqueta}
        sinLinea
        acciones={
          vacante ? (
            puedeDesignar && (
              <Link href={`${RUTA_OFICIAL}/designar`} className={`btn btn-primary ${BTN}`}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Designar nuevo oficial
              </Link>
            )
          ) : (
            <>
              <BotonPronto icono={Eye} className={BTN}>Ver ficha</BotonPronto>
              <BotonPronto icono={Pencil} className={BTN}>Cambiar datos</BotonPronto>
              <BotonPronto icono={History} className={BTN}>Historial</BotonPronto>
              <BotonPronto icono={UserMinus} className={BTN}>Remover o reemplazar</BotonPronto>
            </>
          )
        }
      />
      {vacante && !puedeDesignar && <NotaSoloLectura className="mb-5" />}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,33%,28.75rem)]">
        <div className="flex min-w-0 flex-col gap-5">
          {vacancia && (
            <Tarjeta titulo="Cargo vacante">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Dato rotulo="Oficial anterior">{vacancia.nombreCompleto}</Dato>
                <Dato rotulo="Motivo">{vacancia.motivoNombre}</Dato>
                <Dato rotulo="Fecha de la decisión">{fechaCorta(vacancia.fechaDecision)}</Dato>
              </div>
            </Tarjeta>
          )}
          {titular && (
            <Tarjeta titulo="Designación">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Dato rotulo="Designa">{titular.nombreOrgano}</Dato>
                <Dato rotulo="Fecha de designación">{fechaCorta(titular.fechaDesignacion)}</Dato>
                {titular.fechaNotificacion && <Dato rotulo="Respuesta de la UIF">{fechaCorta(titular.fechaNotificacion)}</Dato>}
              </div>
            </Tarjeta>
          )}
          <NotaLateral rotulo="Próximamente">
            {vacante
              ? 'El detalle del cargo vacante y su historial se están preparando.'
              : 'La ficha completa, el cambio de datos, el historial y la remoción de este cargo se están preparando.'}
          </NotaLateral>
        </div>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Plazo y oficial designado">
          {vacancia && <TarjetaPlazo plazo={vacancia.plazoDesignar} titulo="Plazo para designar" />}
          {titular && <TarjetaOficial titular={titular} />}
        </aside>
      </div>
    </PageShell>
  );
}
