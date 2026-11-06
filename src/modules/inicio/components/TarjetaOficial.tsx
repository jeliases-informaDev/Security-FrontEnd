import type { ReactNode } from 'react';
import { IconoOficial } from '@/shared/ui/iconos';
import { Avatar, Etiqueta } from '@/shared/ui/kit';
import type { ResumenOficial } from '../services/inicioService';
import { cargoLegible, esNumero, fechaCorta, legible, SIN_DATO } from '../lib/formato';
import { EnlaceModulo, ErrorTarjeta, Franja, ROTULO, Tarjeta, VacioTarjeta, type PropsBloque } from './piezas';

const RUTA_OFICIAL = '/oficial-cumplimiento';

/** Fila «RÓTULO … valor» de la tarjeta. El valor pasa a otra línea si no cabe. */
function Dato({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <>
      <dt className={`${ROTULO} break-words`}>{rotulo}</dt>
      <dd className="min-w-0 break-words text-[13px] leading-snug text-ink">{children}</dd>
    </>
  );
}

/** Nombre del oficial alterno, que según el servidor puede venir como texto o como objeto; null si no hay. */
function nombreAlterno(alterno: ResumenOficial['alterno']): string | null {
  if (!alterno) return null;
  const nombre = typeof alterno === 'string' ? alterno : (alterno.nombreCompleto ?? alterno.nombre);
  return nombre?.trim() || null;
}

/** El chip de la esquina: cómo está el cargo. Con un estado que no se conoce no se dibuja nada. */
function chipDe(b: ResumenOficial): { tono: 'ok' | 'warn' | 'bad' | 'info'; texto: string } | null {
  if (b.estado === 'EN_EVALUACION') return { tono: 'info', texto: 'En evaluación' };
  if (b.estado === 'PENDIENTE_COMUNICAR') return { tono: 'warn', texto: 'Por comunicar' };
  if (b.estado === 'VACANTE') return { tono: 'bad', texto: 'Cargo vacante' };
  if (b.estado === 'VIGENTE') {
    if (b.alDia === true) return { tono: 'ok', texto: 'Al día' };
    if (b.alDia === false) return { tono: 'warn', texto: 'Con pendientes' };
  }
  return null;
}

function DatosOficial({ b }: { b: ResumenOficial }) {
  const comunicado = b.comunicadoUif;
  const vigentes = b.declaraciones?.vigentes;
  const total = b.declaraciones?.total;
  const alterno = nombreAlterno(b.alterno);

  return (
    <dl className="grid grid-cols-[fit-content(50%)_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2.5">
      <Dato rotulo="Comunicado a la UIF">
        {comunicado?.fecha ? (
          <>
            {fechaCorta(comunicado.fecha) ?? comunicado.fecha}
            {comunicado.enPlazo === true && ' · en plazo'}
            {comunicado.enPlazo === false && <span className="text-bad"> · fuera de plazo</span>}
          </>
        ) : b.estado === 'PENDIENTE_COMUNICAR' ? (
          <span className="text-warn">Pendiente de comunicar</span>
        ) : (
          SIN_DATO
        )}
      </Dato>
      <Dato rotulo="Declaraciones">
        {!esNumero(vigentes) || !esNumero(total) ? (
          SIN_DATO
        ) : total <= 0 ? (
          'Sin declaraciones'
        ) : (
          <span className={vigentes < total ? 'text-warn' : undefined}>{vigentes} de {total} vigentes</span>
        )}
      </Dato>
      <Dato rotulo="Alterno">{alterno ?? 'No designado'}</Dato>
    </dl>
  );
}

/** Tarjeta del oficial de cumplimiento de Inicio: quién es, cómo está su cargo y sus pendientes con la UIF. */
export function TarjetaOficial({ estado, bloque, onReintentar }: PropsBloque<ResumenOficial>) {
  const marco = { id: 'inicio-oficial', icono: IconoOficial, titulo: 'Oficial de cumplimiento' };

  if (estado === 'listo' && !bloque) return null;
  if (estado === 'cargando') {
    return (
      <Tarjeta {...marco}>
        <div role="status" aria-live="polite" aria-label="Cargando…" aria-busy="true" className="space-y-3">
          <div className="skeleton h-3 w-4/5" />
          <div className="skeleton h-3 w-3/5" />
          <div className="skeleton h-3 w-2/3" />
        </div>
      </Tarjeta>
    );
  }
  if (estado === 'error' || !bloque) return <Tarjeta {...marco}><ErrorTarjeta onReintentar={onReintentar} /></Tarjeta>;

  if (bloque.estado === 'SIN_OFICIAL') {
    return (
      <Tarjeta {...marco} subtitulo="Sin designar">
        <VacioTarjeta texto="Todavía no hay un oficial de cumplimiento designado en tu empresa." href={RUTA_OFICIAL} enlace="Designar oficial de cumplimiento" />
      </Tarjeta>
    );
  }

  const nombre = bloque.nombre?.trim() || null;
  const cargo = cargoLegible(bloque.cargo);
  const chip = chipDe(bloque);
  const vacante = bloque.estado === 'VACANTE';

  return (
    <Tarjeta
      id={marco.id}
      icono={marco.icono}
      avatar={nombre ? <Avatar nombre={nombre} /> : undefined}
      titulo={nombre ?? marco.titulo}
      nombreAccesible={marco.titulo}
      subtitulo={nombre ? `${cargo ? `${cargo} · ` : ''}Oficial de cumplimiento` : (cargo ?? legible(String(bloque.estado)))}
      derecha={chip ? <Etiqueta tono={chip.tono} punto>{chip.texto}</Etiqueta> : undefined}
    >
      {vacante ? (
        <Franja tono="bad">El cargo está vacante. Designa a un nuevo oficial de cumplimiento.</Franja>
      ) : (
        <>
          <DatosOficial b={bloque} />
          {bloque.alDia === false && <Franja tono="warn">Hay pendientes vencidos con la UIF.</Franja>}
        </>
      )}
      <EnlaceModulo href={RUTA_OFICIAL}>Abrir oficial de cumplimiento</EnlaceModulo>
    </Tarjeta>
  );
}
