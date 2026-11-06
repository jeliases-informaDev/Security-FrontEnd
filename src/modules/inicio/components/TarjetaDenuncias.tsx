import type { ReactNode } from 'react';
import { IconoMensaje } from '@/shared/ui/iconos';
import { Etiqueta } from '@/shared/ui/kit';
import type { ResumenDenuncias } from '../services/inicioService';
import { entero, esNumero, plural, porcentaje, SIN_DATO } from '../lib/formato';
import {
  BarraApilada,
  BarrasHorizontales,
  Cifra,
  Cifras,
  EnlaceModulo,
  EsqueletoTarjeta,
  ErrorTarjeta,
  FONDO,
  ROTULO,
  Subtitulo,
  Tarjeta,
  VacioTarjeta,
  type PropsBloque,
  type Segmento,
  type TonoValor,
} from './piezas';

/**
 * Color de «Plazos» según el porcentaje atendido a tiempo. Los cortes (80 y 50) son solo de presentación: verde si va bien,
 * ámbar si empieza a fallar y rojo si la mayoría se pasa del plazo.
 */
function tonoPlazos(pct: number | null | undefined): TonoValor {
  if (!esNumero(pct)) return 'tinta';
  return pct >= 80 ? 'verde' : pct >= 50 ? 'ambar' : 'rojo';
}

/** «— · Sin dato»: el servidor todavía no guarda este dato (hoy el cierre y la derivación). El guion lleva el color del valor y la leyenda va en gris. */
function SinDato() {
  return (
    <>
      <span aria-hidden="true">{SIN_DATO}</span>
      <span className="font-normal text-muted"> · Sin dato</span>
    </>
  );
}

/** Fila «RÓTULO … valor» del pie de la tarjeta: el rótulo ocupa lo que necesita y pasa a otra línea antes de cortarse. */
function FilaPie({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-t border-line py-2.5 first:border-t-0">
      <dt className={`${ROTULO} break-words`}>{rotulo}</dt>
      <dd className="text-right text-[13px] font-semibold leading-snug tabular-nums text-ink">{children}</dd>
    </div>
  );
}

function ContenidoDenuncias({ b }: { b: ResumenDenuncias }) {
  const situaciones = (b.porSituacion ?? []).filter((s) => s && typeof s.situacion === 'string' && esNumero(s.cantidad));
  const c = b.cierres;
  const segmentosCierres: Segmento[] | null = c
    ? [
        { clave: 'fundada', etiqueta: 'Fundada', valor: c.fundadaPct, fondo: FONDO.verde },
        { clave: 'infundada', etiqueta: 'Infundada', valor: c.infundadaPct, fondo: FONDO.gris },
        { clave: 'archivada', etiqueta: 'Archivada', valor: c.archivadaPct, fondo: FONDO.lila },
      ]
    : null;
  const hayCierres = segmentosCierres?.some((s) => esNumero(s.valor) && s.valor > 0) ?? false;

  return (
    <>
      <Cifras columnas={3}>
        <Cifra rotulo="Recibidas" valor={entero(b.recibidas)} detalle="en el mes" />
        <Cifra rotulo="Por atender" valor={entero(b.porAtender)} detalle={esNumero(b.sinAbrir) ? `${entero(b.sinAbrir)} sin abrir` : undefined} />
        <Cifra
          rotulo="Plazos"
          valor={porcentaje(b.plazosATiempoPct)}
          unidad={esNumero(b.plazosATiempoPct) ? '%' : undefined}
          tono={tonoPlazos(b.plazosATiempoPct)}
          detalle="a tiempo"
        />
      </Cifras>

      <div>
        <Subtitulo>Por situación</Subtitulo>
        {situaciones.length > 0 ? (
          <BarrasHorizontales etiqueta="Denuncias por situación" filas={situaciones.map((s) => ({ clave: s.situacion, etiqueta: s.situacion, valor: s.cantidad }))} />
        ) : (
          <p className="text-[13px] text-muted">Todavía no hay denuncias clasificadas por situación.</p>
        )}
      </div>

      <div>
        <Subtitulo>Resultado de los cierres</Subtitulo>
        {segmentosCierres && hayCierres ? (
          <BarraApilada etiqueta="Resultado de los cierres" segmentos={segmentosCierres} />
        ) : segmentosCierres ? (
          <p className="text-[13px] text-muted">Todavía no hay denuncias cerradas en este periodo.</p>
        ) : (
          // Sin el reparto (el servidor aún no lo guarda).
          <p className="text-[13px] text-ink"><SinDato /></p>
        )}
      </div>

      <dl className="border-t border-line">
        <FilaPie rotulo="Tiempo promedio hasta el cierre">
          {esNumero(b.tiempoPromedioCierreDias) ? plural(Math.round(b.tiempoPromedioCierreDias), 'día', 'días') : <SinDato />}
        </FilaPie>
        <FilaPie rotulo="Derivadas al oficial de cumplimiento">
          {esNumero(b.derivadasAlOficial) ? `${entero(b.derivadasAlOficial)} · en reserva` : <SinDato />}
        </FilaPie>
      </dl>
    </>
  );
}

/** Tarjeta «Canal de denuncias» de Inicio: lo recibido, lo que falta atender y cómo se cierra. El detalle de las derivadas es reservado. */
export function TarjetaDenuncias({ estado, bloque, periodoEtiqueta, onReintentar }: PropsBloque<ResumenDenuncias>) {
  const periodo = bloque?.periodoEtiqueta || periodoEtiqueta;
  const marco = { id: 'inicio-denuncias', icono: IconoMensaje, titulo: 'Canal de denuncias', subtitulo: periodo };

  if (estado === 'listo' && !bloque) return null;
  if (estado === 'cargando') return <Tarjeta {...marco}><EsqueletoTarjeta cifras={3} bloques={1} /></Tarjeta>;
  if (estado === 'error' || !bloque) return <Tarjeta {...marco}><ErrorTarjeta onReintentar={onReintentar} /></Tarjeta>;

  const vencidas = esNumero(bloque.vencidas) ? bloque.vencidas : null;
  const vacio =
    (!esNumero(bloque.recibidas) || bloque.recibidas <= 0) &&
    (!esNumero(bloque.porAtender) || bloque.porAtender <= 0) &&
    (vencidas ?? 0) <= 0 &&
    (bloque.porSituacion ?? []).length === 0;

  return (
    <Tarjeta
      {...marco}
      derecha={
        vencidas == null ? undefined : vencidas > 0 ? (
          <Etiqueta tono="bad" punto>{plural(vencidas, 'vencida', 'vencidas')}</Etiqueta>
        ) : (
          <Etiqueta tono="ok" punto>Sin vencidas</Etiqueta>
        )
      }
      derechaCorta
    >
      {vacio ? (
        <VacioTarjeta
          texto={`No hay denuncias${periodo ? ` en ${periodo}` : ' en este periodo'}. Las que lleguen por el canal aparecerán aquí.`}
          href="/denuncias"
          enlace="Ir al canal de denuncias"
        />
      ) : (
        <>
          <ContenidoDenuncias b={bloque} />
          <EnlaceModulo href="/denuncias">Abrir canal de denuncias</EnlaceModulo>
        </>
      )}
    </Tarjeta>
  );
}
