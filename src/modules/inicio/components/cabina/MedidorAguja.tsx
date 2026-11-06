import type { CSSProperties } from 'react';
import { decimal, entero, esNumero, plural } from '../../lib/formato';
import { limitar, polar, sectorAnillo } from '../../lib/grafico';
import { leerEscala, zonaDePuntaje, type EstadoLuz } from '../../lib/luces';
import type { CabinaScoring } from '../../services/inicioService';
import { ChipEstado, Instrumento, SinDato } from './Instrumento';
import { FONDO_ESTADO, TEXTO_ESTADO } from './tonos';

/*
 * Medidor de aguja «Riesgo promedio»: semicírculo con tres zonas (bajo, medio y alto) cuyos cortes son los REALES de la metodología
 * (`scoring.escala`, los manda el servidor), la aguja en el puntaje promedio del periodo y una flecha contra el periodo anterior.
 * Es SVG propio: marcas finas como un instrumento, la zona donde cae la aguja se ilumina y la aguja gira al aparecer (sin
 * movimiento si la persona lo pidió así). Todo lo importante se dice también en texto: el color solo lo refuerza.
 */

const ANCHO = 260;
const ALTO = 150;
const CX = 130;
const CY = 128;
const R_EXTERIOR = 100;
const R_INTERIOR = 82;
const R_MARCA = 104;
const R_ROTULO = 120;
const LARGO_AGUJA = 94;
/** Hueco entre zonas, en grados (la «separación» de color de fondo entre piezas que se tocan). */
const HUECO = 1.6;
const DIVISIONES_MENORES = 12;

const ZONAS: { clave: 'bajo' | 'medio' | 'alto'; nombre: string; estado: EstadoLuz }[] = [
  { clave: 'bajo', nombre: 'Bajo', estado: 'verde' },
  { clave: 'medio', nombre: 'Medio', estado: 'ambar' },
  { clave: 'alto', nombre: 'Alto', estado: 'rojo' },
];

/** El valor de la escala como ángulo del semicírculo: 180 grados es el mínimo (izquierda) y 360 el máximo (derecha). */
const anguloDe = (valor: number, min: number, max: number) => 180 + limitar((valor - min) / (max - min), 0, 1) * 180;

/** Texto de la flecha contra el periodo anterior. Si el riesgo baja es buena noticia (verde); si sube, aviso (ámbar). */
function comparar(actual: number, anterior: number | null | undefined): { flecha: string; texto: string; estado: EstadoLuz } {
  if (!esNumero(anterior)) return { flecha: '', texto: 'Sin periodo anterior para comparar', estado: 'gris' };
  const diferencia = Math.round((actual - anterior) * 10) / 10;
  const contra = `vs. periodo anterior (${decimal(anterior)})`;
  if (diferencia === 0) return { flecha: '=', texto: `Igual ${contra}`, estado: 'gris' };
  return diferencia > 0
    ? { flecha: '▲', texto: `+${decimal(diferencia)} ${contra}`, estado: 'ambar' }
    : { flecha: '▼', texto: `−${decimal(-diferencia)} ${contra}`, estado: 'verde' };
}

export function MedidorAguja({ scoring, className = '' }: { scoring: CabinaScoring | null | undefined; className?: string }) {
  const marco = { id: 'cabina-aguja', titulo: 'Riesgo promedio', className };
  if (!scoring) {
    return (
      <Instrumento {...marco}>
        <SinDato texto="Tu cuenta no ve el scoring, o todavía no hay datos." />
      </Instrumento>
    );
  }
  const escala = leerEscala(scoring.escala);
  if (!escala) {
    return (
      <Instrumento {...marco}>
        <SinDato texto="El servidor no mandó la escala de la metodología, así que no se pueden dibujar las zonas." />
      </Instrumento>
    );
  }

  const { min, max, corteMedio, corteAlto } = escala;
  const puntaje = esNumero(scoring.puntajePromedio) ? scoring.puntajePromedio : null;
  const evaluaciones = esNumero(scoring.evaluaciones) ? scoring.evaluaciones : null;
  const zona = puntaje == null ? null : zonaDePuntaje(puntaje, escala);
  const angulo = puntaje == null ? 180 : anguloDe(puntaje, min, max);
  const comparacion = puntaje == null ? null : comparar(puntaje, scoring.puntajePromedioAnterior);

  // Tramos de zona: [desde, hasta] en grados.
  const cortes = [min, corteMedio, corteAlto, max].map((v) => anguloDe(v, min, max));
  const tramos = ZONAS.map((z, i) => ({ ...z, desde: cortes[i] + (i === 0 ? 0 : HUECO / 2), hasta: cortes[i + 1] - (i === 2 ? 0 : HUECO / 2) }));

  // Marcas: menores a intervalos iguales y mayores (con número) en el mínimo, los dos cortes y el máximo.
  const menores = Array.from({ length: DIVISIONES_MENORES + 1 }, (_, i) => 180 + (i / DIVISIONES_MENORES) * 180);
  const mayores = [min, corteMedio, corteAlto, max].map((valor) => ({ valor, angulo: anguloDe(valor, min, max) }));

  const rangos: Record<'bajo' | 'medio' | 'alto', string> = {
    bajo: `menos de ${decimal(corteMedio)}`,
    medio: `${decimal(corteMedio)} a ${decimal(corteAlto)}`,
    alto: `${decimal(corteAlto)} o más`,
  };
  const resumenAccesible =
    puntaje == null
      ? 'Riesgo promedio: sin evaluaciones en el periodo.'
      : `Riesgo promedio ${decimal(puntaje)} en una escala de ${decimal(min)} a ${decimal(max)}, nivel ${zona}.${esNumero(scoring.puntajePromedioAnterior) ? ` Periodo anterior: ${decimal(scoring.puntajePromedioAnterior)}.` : ''} Zonas: bajo, menos de ${decimal(corteMedio)}; medio, de ${decimal(corteMedio)} a ${decimal(corteAlto)}; alto, ${decimal(corteAlto)} o más.`;

  // La aguja se dibuja apuntando al mínimo (izquierda) y gira `--ang` grados en sentido horario; la animación `cabina-aguja` parte de 0.
  const aguja = { '--ang': `${(angulo - 180).toFixed(2)}deg`, transform: 'rotate(var(--ang))', transformOrigin: `${CX}px ${CY}px` } as CSSProperties;

  return (
    <Instrumento
      {...marco}
      subtitulo="Puntaje promedio del periodo"
      derecha={evaluaciones != null && <span className="cabina-rotulo">{plural(evaluaciones, 'evaluación', 'evaluaciones')}</span>}
    >
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="mx-auto block h-auto w-full max-w-[22rem]" role="img" aria-label={resumenAccesible}>
        {/* Zonas: la que contiene la aguja se ilumina; las otras quedan tenues. */}
        {tramos.map((t) => (
          <path key={t.clave} d={sectorAnillo(CX, CY, R_INTERIOR, R_EXTERIOR, t.desde, t.hasta)} className={TEXTO_ESTADO[t.estado]} fill="currentColor" opacity={zona == null || zona === t.clave ? 1 : 0.38} />
        ))}

        {/* Marcas finas */}
        <g stroke="var(--cabina-borde-fuerte)" strokeWidth={1} aria-hidden="true">
          {menores.map((a) => {
            const p = polar(CX, CY, R_MARCA, a);
            const q = polar(CX, CY, R_MARCA + 3, a);
            return <line key={a} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
          })}
        </g>
        <g stroke="var(--cabina-texto-2)" strokeWidth={1.5} aria-hidden="true">
          {mayores.map(({ angulo: a }) => {
            const p = polar(CX, CY, R_MARCA, a);
            const q = polar(CX, CY, R_MARCA + 7, a);
            return <line key={a} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
          })}
        </g>
        <g className="font-mono" fill="var(--cabina-tenue)" fontSize={10} textAnchor="middle" dominantBaseline="central" aria-hidden="true">
          {mayores.map(({ valor, angulo: a }) => {
            const p = polar(CX, CY, R_ROTULO, a);
            return (
              <text key={a} x={p.x} y={p.y}>
                {decimal(valor)}
              </text>
            );
          })}
        </g>

        {/* Aguja */}
        {puntaje != null && (
          <g className="cabina-aguja" style={aguja} aria-hidden="true">
            <polygon points={`${CX - LARGO_AGUJA},${CY} ${CX},${CY - 3.6} ${CX + 14},${CY - 2} ${CX + 14},${CY + 2} ${CX},${CY + 3.6}`} fill="var(--cabina-texto)" />
          </g>
        )}
        <circle cx={CX} cy={CY} r={7} fill="var(--cabina-fondo-2)" stroke="var(--cabina-texto)" strokeWidth={2} aria-hidden="true" />
        <circle cx={CX} cy={CY} r={2.4} fill="var(--cabina-texto)" aria-hidden="true" />
      </svg>

      <div className="flex flex-col items-center gap-1.5 text-center">
        {puntaje == null ? (
          <p className="text-[13px] leading-snug text-cabina-texto-2">Sin evaluaciones en este periodo.</p>
        ) : (
          <>
            <p className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
              <span className="text-[2.5rem] font-medium leading-none tracking-[-0.02em] text-cabina-texto">{decimal(puntaje)}</span>
              <span className="text-[13px] text-cabina-tenue">de {decimal(max)}</span>
              <ChipEstado estado={zona === 'alto' ? 'rojo' : zona === 'medio' ? 'ambar' : 'verde'}>Riesgo {zona}</ChipEstado>
            </p>
            {comparacion && (
              <p className={`break-words font-mono text-[11px] leading-snug tracking-[0.02em] ${TEXTO_ESTADO[comparacion.estado]}`}>
                {comparacion.flecha && <span aria-hidden="true">{comparacion.flecha} </span>}
                {comparacion.texto}
              </p>
            )}
          </>
        )}
      </div>

      <ul className="grid grid-cols-[repeat(auto-fit,minmax(5.75rem,1fr))] gap-x-2 gap-y-2 border-t border-cabina-borde pt-3" aria-label="Evaluaciones por nivel de riesgo">
        {ZONAS.map((z) => {
          const cantidad = scoring.porNivel?.[z.clave];
          return (
            <li key={z.clave} className="min-w-0">
              <p className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${FONDO_ESTADO[z.estado]}`} aria-hidden="true" />
                <span className="cabina-rotulo !text-cabina-texto-2">{z.nombre}</span>
              </p>
              <p className="mt-0.5 text-[1.125rem] font-medium leading-tight text-cabina-texto">{esNumero(cantidad) ? entero(cantidad) : '—'}</p>
              <p className="break-words text-[11px] leading-snug text-cabina-tenue">{rangos[z.clave]}</p>
            </li>
          );
        })}
      </ul>
    </Instrumento>
  );
}
