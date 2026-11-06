import type { CSSProperties } from 'react';
import { IconoMedidor } from '@/shared/ui/iconos';
import { entero, esNumero, SIN_DATO, puntajeTexto } from '../lib/formato';
import { arco, limitar } from '../lib/grafico';
import { leerEscala, zonaDePuntaje, type EscalaValida } from '../lib/luces';
import type { CabinaScoring, ResumenInicio } from '../services/inicioService';
import { EnlaceModulo, ROTULO, Tarjeta } from './piezas';

/*
 * Medidor de aguja «Riesgo promedio» del Inicio (el único instrumento que se queda de la antigua «cabina»): una tarjeta ancha y baja,
 * clara, entre la bienvenida y las cuatro tarjetas. A la izquierda el semicírculo con sus tres zonas (bajo, medio y alto) y la aguja en
 * el puntaje promedio del periodo; a la derecha, cuántas evaluaciones hay en cada nivel y cómo va contra el periodo anterior.
 *
 * Los cortes de las zonas son los REALES de la metodología (`cabina.scoring.escala`, los manda el servidor): aquí no se inventa ninguno.
 * Todo lo que dice el dibujo se dice también en texto (cifra, nivel, números por nivel): el color solo lo refuerza.
 * Sin `cabina.scoring` (o sin escala válida) no se dibuja NADA: ni tarjeta, ni esqueleto, ni margen.
 */

type Nivel = 'bajo' | 'medio' | 'alto';

const AMBAR = 'color-mix(in srgb, var(--media) 80%, var(--warn))';

/** Cada nivel con su color: `suave` pinta la zona del medidor, `fuerte` la zona donde cae la aguja; `punto` y `barra` salen de los mismos tonos. */
const NIVELES: { clave: Nivel; nombre: string; suave: string; fuerte: string; punto: string; chip: string }[] = [
  { clave: 'bajo', nombre: 'Bajo', suave: 'color-mix(in srgb, var(--vivo) 34%, white)', fuerte: 'var(--vivo)', punto: 'bg-vivo', chip: 'badge-ok' },
  { clave: 'medio', nombre: 'Medio', suave: `color-mix(in srgb, ${AMBAR} 38%, white)`, fuerte: AMBAR, punto: 'bg-[color-mix(in_srgb,var(--media)_80%,var(--warn))]', chip: 'badge-warn' },
  { clave: 'alto', nombre: 'Alto', suave: 'color-mix(in srgb, var(--bad-solid) 30%, white)', fuerte: 'var(--bad-solid)', punto: 'bg-bad-solid', chip: 'badge-bad' },
];

// Geometría del medidor (unidades del dibujo). El semicírculo tiene el grosor de la pista; el eje de la aguja queda justo en la base.
// El dibujo empieza en `VISTA_Y` (la cima del arco está en y = 2,5): así no sobra aire arriba y la tarjeta queda baja.
const ANCHO = 142;
const ALTO = 79;
const VISTA_Y = 2;
const CX = 71;
const CY = 71;
const RADIO = 64;
const GROSOR = 9;
const LARGO_AGUJA = 55;
const RADIO_EJE = 6;
/** Aire visible entre una zona y la siguiente, en unidades del dibujo (las puntas son redondas y miden medio grosor más allá del arco). */
const AIRE = 3;

/** El valor de la escala como ángulo del semicírculo: 180 grados es el mínimo (izquierda) y 360 el máximo (derecha). */
const anguloDe = (valor: number, escala: EscalaValida) => 180 + limitar((valor - escala.min) / (escala.max - escala.min), 0, 1) * 180;
const aGrados = (unidades: number) => (unidades / RADIO) * (180 / Math.PI);

/** Los tres tramos del semicírculo, de los cortes reales, con aire entre ellos. Un tramo demasiado angosto para dibujarse sale con `desde >= hasta`. */
function tramosDe(escala: EscalaValida) {
  const cortes = [escala.min, escala.corteMedio, escala.corteAlto, escala.max].map((valor) => anguloDe(valor, escala));
  const punta = aGrados(GROSOR / 2);
  return NIVELES.map((nivel, i) => ({
    ...nivel,
    desde: cortes[i] + punta + (i === 0 ? 0 : aGrados(AIRE / 2)),
    hasta: cortes[i + 1] - punta - (i === NIVELES.length - 1 ? 0 : aGrados(AIRE / 2)),
  }));
}

/** El bloque `cabina.scoring` junto con su escala, o null si falta cualquiera de los dos (sin escala no hay zonas que dibujar). */
export function leerRiesgo(resumen: ResumenInicio | null | undefined): { scoring: CabinaScoring; escala: EscalaValida } | null {
  const scoring = resumen?.cabina?.scoring;
  if (!scoring) return null;
  const escala = leerEscala(scoring.escala);
  return escala ? { scoring, escala } : null;
}

const numeroONull = (valor: number | null | undefined): number | null => (esNumero(valor) ? valor : null);

/** Texto y tono de la comparación con el periodo anterior. Si el riesgo baja es buena noticia (verde); si sube, aviso (ámbar). */
function comparar(actual: number, anterior: number | null): { valor: string; flecha: string; detalle: string; tono: string } {
  if (anterior == null) return { valor: SIN_DATO, flecha: '', detalle: 'Sin periodo anterior', tono: 'text-faint' };
  // Se compara con los mismos dos decimales con que se escriben los puntajes: si en pantalla son distintos, no se dice «igual».
  const diferencia = Math.round((actual - anterior) * 100) / 100;
  if (diferencia === 0) return { valor: '0', flecha: '=', detalle: `Sin cambio · antes ${puntajeTexto(anterior)}`, tono: 'text-muted' };
  return diferencia > 0
    ? { valor: `+${puntajeTexto(diferencia)}`, flecha: '▲', detalle: `Sube el riesgo · antes ${puntajeTexto(anterior)}`, tono: 'text-warn' }
    : { valor: `−${puntajeTexto(-diferencia)}`, flecha: '▼', detalle: `Baja el riesgo · antes ${puntajeTexto(anterior)}`, tono: 'text-ok' };
}

interface PropsMedidor {
  escala: EscalaValida;
  /** Puntaje promedio del periodo; null si no hay evaluaciones (el medidor queda vacío, sin aguja). */
  puntaje: number | null;
  zona: Nivel | null;
  descripcion: string;
}

/** El semicírculo con sus zonas, la aguja y el eje. La aguja barre desde el mínimo hasta su valor al aparecer (sin movimiento si la persona lo pidió así). */
function Medidor({ escala, puntaje, zona, descripcion }: PropsMedidor) {
  const angulo = puntaje == null ? 180 : anguloDe(puntaje, escala);
  // La aguja se dibuja apuntando al mínimo (izquierda) y gira `--ang` grados en sentido horario; la animación `riesgo-aguja` parte de 0.
  const giro = { '--ang': `${(angulo - 180).toFixed(2)}deg`, transform: 'rotate(var(--ang))', transformOrigin: `${CX}px ${CY}px` } as CSSProperties;
  return (
    <svg viewBox={`0 ${VISTA_Y} ${ANCHO} ${ALTO - VISTA_Y}`} className="mx-auto block h-auto w-full max-w-[9rem] overflow-visible" role="img" aria-label={descripcion}>
      {tramosDe(escala).map((tramo) =>
        tramo.hasta > tramo.desde ? (
          <path
            key={tramo.clave}
            d={arco(CX, CY, RADIO, tramo.desde, tramo.hasta)}
            fill="none"
            stroke={zona === tramo.clave ? tramo.fuerte : tramo.suave}
            strokeWidth={GROSOR}
            strokeLinecap="round"
          />
        ) : null,
      )}
      {puntaje != null && (
        <g className="riesgo-aguja" style={giro} aria-hidden="true">
          {/* Aguja fina que se afina hacia la punta; el trazo del mismo color le redondea la punta. */}
          <polygon
            points={`${CX},${CY - 2.4} ${CX - LARGO_AGUJA},${CY - 0.7} ${CX - LARGO_AGUJA},${CY + 0.7} ${CX},${CY + 2.4}`}
            fill="var(--brand)"
            stroke="var(--brand)"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </g>
      )}
      <circle cx={CX} cy={CY} r={RADIO_EJE} fill={puntaje == null ? 'var(--line-strong)' : 'var(--brand)'} aria-hidden="true" />
      <circle cx={CX} cy={CY} r={2} fill="white" aria-hidden="true" />
    </svg>
  );
}

interface PropsRiesgo {
  /** El resumen ya cargado (null mientras llega o si falló: en ese caso no se dibuja nada). */
  resumen: ResumenInicio | null;
  /** Turno de la tarjeta en la entrada de la página (`.inicio-entra`). */
  paso: number;
}

export function RiesgoPromedio({ resumen, paso }: PropsRiesgo) {
  const leido = leerRiesgo(resumen);
  if (!resumen || !leido) return null;
  const { scoring, escala } = leido;
  const { min, max, corteMedio, corteAlto } = escala;

  const conteos = NIVELES.map((nivel) => numeroONull(scoring.porNivel?.[nivel.clave]));
  const sumaNiveles = conteos.reduce<number>((suma, n) => suma + (n ?? 0), 0);
  const total = esNumero(scoring.evaluaciones) ? scoring.evaluaciones : sumaNiveles;
  const puntaje = numeroONull(scoring.puntajePromedio);
  const anterior = numeroONull(scoring.puntajePromedioAnterior);
  const hayDatos = puntaje != null && total > 0;
  const zona = hayDatos ? zonaDePuntaje(puntaje, escala) : null;
  const nivel = NIVELES.find((n) => n.clave === zona) ?? null;
  const periodo = resumen.periodoEtiqueta;

  const zonas = `Zonas: bajo, menos de ${puntajeTexto(corteMedio)}; medio, de ${puntajeTexto(corteMedio)} a menos de ${puntajeTexto(corteAlto)}; alto, ${puntajeTexto(corteAlto)} o más.`;
  const descripcion = hayDatos
    ? `Riesgo promedio ${puntajeTexto(puntaje)} en una escala de ${puntajeTexto(min)} a ${puntajeTexto(max)}, nivel ${zona}.${anterior != null ? ` Periodo anterior: ${puntajeTexto(anterior)}.` : ''} ${zonas}`
    : `Riesgo promedio: sin evaluaciones en el periodo. ${zonas}`;

  const subtitulo = periodo ? `Scoring de riesgo · ${periodo}` : 'Scoring de riesgo';
  const comparacion = hayDatos ? comparar(puntaje, anterior) : null;

  return (
    <div className="inicio-entra mt-7" style={{ '--paso': paso } as CSSProperties}>
      <Tarjeta
        id="inicio-riesgo"
        icono={IconoMedidor}
        titulo="Riesgo promedio"
        subtitulo={subtitulo}
        derecha={hayDatos && <EnlaceModulo href="/scoring">Ver evaluaciones</EnlaceModulo>}
      >
        {/*
          Se acomoda según el ancho de la tarjeta (no el de la pantalla). Debajo de 36 rem: una sola columna, con el medidor arriba y las
          cifras debajo. Desde 36 rem: medidor, evaluaciones por nivel y comparación en una sola fila baja, repartidos a lo ancho.
        */}
        <div
          className={`grid gap-x-6 gap-y-5 @[36rem]:-mt-2 @[44rem]:gap-x-10 ${
            hayDatos
              ? 'items-start @[36rem]:grid-cols-[11rem_minmax(0,30rem)_auto] @[36rem]:justify-between'
              : 'items-center @[36rem]:grid-cols-[11rem_minmax(0,36rem)] @[36rem]:justify-start'
          }`}
        >
          <div className="mx-auto w-full max-w-[11rem] @[36rem]:mx-0">
            <Medidor escala={escala} puntaje={hayDatos ? puntaje : null} zona={zona} descripcion={descripcion} />
            <p className="mt-0.5 flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1.5">
              <span className={`text-[2rem] font-medium leading-none tracking-[-0.02em] tabular-nums ${hayDatos ? 'text-ink' : 'text-faint'}`}>{hayDatos ? puntajeTexto(puntaje) : SIN_DATO}</span>
              <span className="text-[12px] leading-none text-muted">de {puntajeTexto(max)}</span>
              {nivel && (
                <span className={`badge ${nivel.chip} ml-1`}>
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
                  <span className="sr-only">Riesgo </span>
                  {nivel.nombre}
                </span>
              )}
            </p>
          </div>

          {hayDatos && comparacion ? (
            <>
              <div className="min-w-0">
                <div className="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className={`${ROTULO} break-words`}>Por nivel</h3>
                  <p className={`${ROTULO} break-words`}>
                    {entero(total)} {total === 1 ? 'evaluación' : 'evaluaciones'}
                  </p>
                </div>
                <ul className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 text-[12px] leading-snug text-ink" aria-label="Evaluaciones por nivel de riesgo">
                  {NIVELES.map((n, i) => {
                    const cantidad = conteos[i];
                    const parte = cantidad != null && sumaNiveles > 0 ? (cantidad / sumaNiveles) * 100 : 0;
                    return (
                      <li key={n.clave} className="col-span-full grid grid-cols-subgrid items-center">
                        <span className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${n.punto}`} aria-hidden="true" />
                          {n.nombre}
                        </span>
                        <span className="block h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                          <span className={`block h-full rounded-full ${n.punto}`} style={{ width: `${cantidad ? Math.max(2, parte) : 0}%` }} />
                        </span>
                        <span className="text-right tabular-nums">
                          <b className="font-semibold">{entero(cantidad)}</b>
                          {cantidad != null && sumaNiveles > 0 && <span className="text-muted"> · {Math.round(parte)} %</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="min-w-0 max-w-[14rem]">
                <h3 className={`${ROTULO} mb-2.5 break-words`}>Vs. periodo anterior</h3>
                <p className={`flex flex-wrap items-baseline gap-x-1.5 ${comparacion.tono}`}>
                  {comparacion.flecha && (
                    <span className="text-[0.875rem] leading-none" aria-hidden="true">
                      {comparacion.flecha}
                    </span>
                  )}
                  <span className="text-[1.75rem] font-medium leading-none tracking-[-0.02em] tabular-nums">{comparacion.valor}</span>
                </p>
                <p className="mt-1.5 break-words text-[12px] leading-[1.4] text-muted">{comparacion.detalle}</p>
              </div>
            </>
          ) : (
            <div className="flex min-w-0 flex-col items-start gap-2.5">
              <p className="break-words text-[15px] font-semibold leading-snug text-ink">Sin evaluaciones en el periodo</p>
              <p className="max-w-[34rem] break-words text-[13px] leading-snug text-muted">
                Cuando evalúes a un cliente en Scoring de riesgo, aquí verás el promedio, cuántas evaluaciones hay en cada nivel y cómo va contra el periodo anterior.
              </p>
              <EnlaceModulo href="/scoring">Evaluar a un cliente</EnlaceModulo>
            </div>
          )}
        </div>
      </Tarjeta>
    </div>
  );
}
