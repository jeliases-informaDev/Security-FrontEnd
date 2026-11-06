import Link from 'next/link';
import { IconoRecibo } from '@/shared/ui/iconos';
import { Etiqueta } from '@/shared/ui/kit';
import type { ResumenOperaciones, UltimoRegistro } from '../services/inicioService';
import { entero, esNumero, legible, montoConSimbolo, montoResumido, plural, porcentaje, SIN_DATO } from '../lib/formato';
import {
  Cifra,
  Cifras,
  EnlaceModulo,
  EsqueletoTarjeta,
  ErrorTarjeta,
  Subtitulo,
  Tarjeta,
  VacioTarjeta,
  type PropsBloque,
  type TonoValor,
} from './piezas';

/** Chip del estado de un registro: lo más urgente primero (sin responsable ámbar, inusual rojo). */
const ESTADO_REGISTRO: Record<string, { texto: string; tono: 'warn' | 'bad' | 'ok' | 'neutral' }> = {
  SIN_RESPONSABLE: { texto: 'Sin responsable', tono: 'warn' },
  INUSUAL: { texto: 'Inusual', tono: 'bad' },
  ENVIADO: { texto: 'Enviado', tono: 'ok' },
  REGISTRADO: { texto: 'Registrado', tono: 'neutral' },
};

/**
 * Una fila de «Últimos registros». Ancha: código, persona, tipo, monto y estado en una sola línea. Angosta: arriba el código y
 * el estado; en medio la persona; abajo el tipo y el monto. Todo pasa a otra línea antes de cortarse.
 */
function FilaRegistro({ registro }: { registro: UltimoRegistro }) {
  const estado = ESTADO_REGISTRO[registro.estado] ?? { texto: legible(String(registro.estado ?? '')), tono: 'neutral' as const };
  return (
    <li>
      <Link
        href={`/operaciones/${registro.id}`}
        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-xl px-1 py-2.5 transition-colors hover:bg-brand-soft/40 @[40rem]:grid-cols-[minmax(7.75rem,auto)_minmax(0,1.25fr)_minmax(0,1fr)_auto_auto]"
      >
        <span className="order-1 min-w-0 break-words font-mono text-[11px] leading-snug tracking-[0.02em] text-ink">{registro.codigo}</span>
        <span className="order-3 col-span-2 min-w-0 break-words text-[13px] font-medium leading-snug text-ink @[40rem]:order-2 @[40rem]:col-span-1">{registro.persona || SIN_DATO}</span>
        <span className="order-4 min-w-0 break-words text-[13px] leading-snug text-muted @[40rem]:order-3">{registro.tipo || SIN_DATO}</span>
        <span className="order-5 min-w-0 justify-self-end text-right text-[13px] font-semibold leading-snug tabular-nums text-ink @[40rem]:order-4">{montoConSimbolo(registro.monto, registro.moneda)}</span>
        <span className="order-2 justify-self-end @[40rem]:order-5">
          <Etiqueta tono={estado.tono} punto>{estado.texto}</Etiqueta>
        </span>
      </Link>
    </li>
  );
}

function ContenidoOperaciones({ b }: { b: ResumenOperaciones }) {
  const ultimos = (b.ultimos ?? []).filter((u) => u && typeof u.id === 'number');
  const bajoMeta = esNumero(b.mismoDiaPct) && esNumero(b.metaMismoDiaPct) && b.mismoDiaPct < b.metaMismoDiaPct;
  const tonoMismoDia: TonoValor = !esNumero(b.mismoDiaPct) || !esNumero(b.metaMismoDiaPct) ? 'tinta' : bajoMeta ? 'ambar' : 'verde';
  const total = montoResumido(b.montoTotalUsd);

  return (
    <>
      <Cifras>
        <Cifra rotulo="Registros" valor={entero(b.registros)} detalle={total ? `${total} en total` : undefined} />
        <Cifra
          rotulo="Inusuales"
          valor={entero(b.inusuales)}
          tono={esNumero(b.inusuales) && b.inusuales > 0 ? 'rojo' : 'tinta'}
          detalle="en análisis o con ROS"
        />
        <Cifra rotulo="Sobre el umbral" valor={entero(b.sobreUmbral)} detalle={esNumero(b.registros) ? `de los ${entero(b.registros)} registros` : 'de los registros'} />
        <Cifra
          rotulo="Mismo día"
          valor={porcentaje(b.mismoDiaPct)}
          unidad={esNumero(b.mismoDiaPct) ? '%' : undefined}
          tono={tonoMismoDia}
          detalle={esNumero(b.metaMismoDiaPct) ? `meta sugerida: ${porcentaje(b.metaMismoDiaPct)}%` : undefined}
        />
      </Cifras>

      {ultimos.length > 0 && (
        <div>
          <Subtitulo>Últimos registros</Subtitulo>
          <ul className="divide-y divide-line border-y border-line" aria-label="Últimos registros de operaciones">
            {ultimos.map((registro) => (
              <FilaRegistro key={registro.id} registro={registro} />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

/** Tarjeta «Registro de operaciones» de Inicio: cifras del periodo y los últimos registros guardados. */
export function TarjetaOperaciones({ estado, bloque, periodoEtiqueta, onReintentar }: PropsBloque<ResumenOperaciones>) {
  const marco = { id: 'inicio-operaciones', icono: IconoRecibo, titulo: 'Registro de operaciones', subtitulo: periodoEtiqueta };

  if (estado === 'listo' && !bloque) return null;
  if (estado === 'cargando') return <Tarjeta {...marco}><EsqueletoTarjeta bloques={1} /></Tarjeta>;
  if (estado === 'error' || !bloque) return <Tarjeta {...marco}><ErrorTarjeta onReintentar={onReintentar} /></Tarjeta>;

  const vacio = !esNumero(bloque.registros) || bloque.registros <= 0;
  return (
    <Tarjeta
      {...marco}
      derecha={
        vacio ? undefined : (
          <>
            <Etiqueta tono="brand">{plural(bloque.registros as number, 'registro', 'registros')}</Etiqueta>
            <EnlaceModulo href="/operaciones">Ver todos</EnlaceModulo>
          </>
        )
      }
    >
      {vacio ? (
        <VacioTarjeta
          texto={`Todavía no hay registros de operaciones${periodoEtiqueta ? ` en ${periodoEtiqueta}` : ' en este periodo'}. El primero que guardes aparecerá aquí.`}
          href="/operaciones"
          enlace="Ir a Registro de operaciones"
        />
      ) : (
        <ContenidoOperaciones b={bloque} />
      )}
    </Tarjeta>
  );
}
