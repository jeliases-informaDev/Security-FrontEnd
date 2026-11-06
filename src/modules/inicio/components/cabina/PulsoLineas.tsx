'use client';

import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useAncho } from '../../hooks/useAncho';
import { diaYMes, entero, esNumero } from '../../lib/formato';
import { diaLargo, fechaDelDia, limitar, lineaQuebrada, marcasEje, serieDe } from '../../lib/grafico';
import type { CabinaTendencia } from '../../services/inicioService';
import { Instrumento, SinDato } from './Instrumento';

/*
 * Líneas «Pulso de 30 días»: una línea por serie (consultas, coincidencias, registros, evaluaciones y denuncias) con un número por día.
 * Los chips de arriba encienden y apagan cada serie y, al mismo tiempo, dicen el valor del día marcado (así no hay un globo que se
 * corte en el borde). Un solo eje: al apagar una serie el eje se reajusta a lo que queda, para ver de cerca las que valen poco.
 * El gráfico se dibuja en píxeles reales (mide su ancho), así los números de los ejes conservan su tamaño en cualquier pantalla.
 * Se recorre con el mouse, el dedo o las flechas del teclado.
 */

type Clave = 'consultas' | 'coincidencias' | 'registros' | 'evaluaciones' | 'denuncias';

/** Los cinco colores de serie (tokens `--cabina-serie-N`): fijos y en este orden, no se reparten por ranking. */
const SERIES: { clave: Clave; nombre: string; texto: string; fondo: string }[] = [
  { clave: 'consultas', nombre: 'Consultas', texto: 'text-cabina-serie-1', fondo: 'bg-cabina-serie-1' },
  { clave: 'coincidencias', nombre: 'Coincidencias', texto: 'text-cabina-serie-2', fondo: 'bg-cabina-serie-2' },
  { clave: 'registros', nombre: 'Registros', texto: 'text-cabina-serie-3', fondo: 'bg-cabina-serie-3' },
  { clave: 'evaluaciones', nombre: 'Evaluaciones', texto: 'text-cabina-serie-4', fondo: 'bg-cabina-serie-4' },
  { clave: 'denuncias', nombre: 'Denuncias', texto: 'text-cabina-serie-5', fondo: 'bg-cabina-serie-5' },
];

const ALTO = 196;
const MARGEN = { izq: 32, der: 10, arriba: 8, abajo: 24 };
/** Tope de días que se dibujan (el servidor manda 30). */
const MAX_DIAS = 120;

interface Serie {
  clave: Clave;
  nombre: string;
  texto: string;
  fondo: string;
  valores: number[];
}

/** Texto para el lector de pantalla: el periodo y, por serie, el total y el día más alto. */
function resumenDelGrafico(series: Serie[], dias: number, desde: string | null): string {
  const ini = diaYMes(fechaDelDia(desde, 0));
  const fin = diaYMes(fechaDelDia(desde, dias - 1));
  const rango = ini && fin ? `, del ${ini} al ${fin}` : '';
  const partes = series.map((s) => {
    const total = s.valores.reduce((suma, v) => suma + v, 0);
    const mayor = Math.max(...s.valores);
    const dia = mayor > 0 ? diaYMes(fechaDelDia(desde, s.valores.indexOf(mayor))) : null;
    return `${s.nombre}: ${entero(total)} en total${mayor > 0 ? `, el día más alto ${entero(mayor)}${dia ? ` el ${dia}` : ''}` : ''}`;
  });
  return `Pulso de ${dias} días${rango}. ${partes.join('. ')}.`;
}

function GraficoPulso({ dias, desde, series }: { dias: number; desde: string | null; series: Serie[] }) {
  const [activas, setActivas] = useState<Record<Clave, boolean>>({ consultas: true, coincidencias: true, registros: true, evaluaciones: true, denuncias: true });
  const [cursor, setCursor] = useState<number | null>(null);
  const { ref, ancho } = useAncho<HTMLDivElement>();
  const idBase = useId();

  const visibles = series.filter((s) => activas[s.clave]);
  // El eje se ajusta a lo que está encendido (si se apaga todo, se queda con el total para no saltar).
  const { max: techo, marcas } = marcasEje(Math.max(0, ...(visibles.length > 0 ? visibles : series).flatMap((s) => s.valores)), 4);
  const indice = cursor ?? dias - 1;
  const fechaActiva = fechaDelDia(desde, indice);
  const etiquetaDia = diaLargo(fechaActiva) ?? `Día ${indice + 1}`;

  const W = ancho;
  const x0 = MARGEN.izq;
  const x1 = Math.max(x0 + 1, W - MARGEN.der);
  const y0 = MARGEN.arriba;
  const y1 = ALTO - MARGEN.abajo;
  const x = (i: number) => x0 + (i / (dias - 1)) * (x1 - x0);
  const y = (v: number) => y1 - (limitar(v, 0, techo) / techo) * (y1 - y0);

  // Marcas del eje X: 4 en pantallas angostas y 5 en las demás, repartidas parejo (la primera y la última pegadas a los bordes).
  const cantidadFechas = W < 420 ? 4 : 5;
  const indicesFecha = [...new Set(Array.from({ length: cantidadFechas }, (_, j) => Math.round((j * (dias - 1)) / (cantidadFechas - 1))))];

  const alMover = (e: PointerEvent<SVGRectElement>) => {
    const caja = e.currentTarget.getBoundingClientRect();
    setCursor(limitar(Math.round(((e.clientX - caja.left) / Math.max(1, caja.width)) * (dias - 1)), 0, dias - 1));
  };
  const alSalir = (e: PointerEvent<SVGRectElement>) => {
    // Con el dedo el día marcado se queda al levantarlo; con el mouse vuelve al último día.
    if (e.pointerType === 'mouse') setCursor(null);
  };
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const pasos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowDown: -1, ArrowUp: 1 };
    if (e.key in pasos) setCursor(limitar(indice + pasos[e.key], 0, dias - 1));
    else if (e.key === 'Home') setCursor(0);
    else if (e.key === 'End') setCursor(dias - 1);
    else if (e.key === 'Escape') setCursor(null);
    else return;
    e.preventDefault();
  };

  const anuncio = cursor == null ? '' : `${etiquetaDia}: ${series.map((s) => `${s.nombre} ${entero(s.valores[indice])}`).join(', ')}.`;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="cabina-rotulo !text-cabina-texto-2">{cursor == null ? `Último día · ${etiquetaDia}` : etiquetaDia}</p>
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Series: enciende o apaga cada una">
          {series.map((s) => {
            const encendida = activas[s.clave];
            return (
              <li key={s.clave}>
                <button
                  type="button"
                  aria-pressed={encendida}
                  onClick={() => setActivas((previas) => ({ ...previas, [s.clave]: !previas[s.clave] }))}
                  className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[12px] leading-none transition-colors ${
                    encendida ? 'border-cabina-borde-fuerte bg-cabina-panel-2 text-cabina-texto hover:bg-cabina-borde' : 'border-cabina-borde bg-transparent text-cabina-tenue hover:bg-cabina-panel'
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${encendida ? s.fondo : 'border border-cabina-borde-fuerte'}`} aria-hidden="true" />
                  <span>{s.nombre}</span>
                  <b className={`font-medium tabular-nums ${encendida ? 'text-cabina-texto' : 'text-cabina-tenue'}`}>{entero(s.valores[indice])}</b>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* El gráfico: foco con Tab y recorrido con las flechas (Inicio y Fin saltan a los extremos; Esc vuelve al último día) */}
      <div
        ref={ref}
        tabIndex={0}
        role="group"
        aria-label={`Gráfico de líneas de ${dias} días. Usa las flechas izquierda y derecha para recorrer los días.`}
        onKeyDown={alTeclear}
        onBlur={() => setCursor(null)}
        className="rounded-lg"
      >
        {W > 0 && (
          <svg width={W} height={ALTO} viewBox={`0 0 ${W} ${ALTO}`} className="block" role="img" aria-label={resumenDelGrafico(series, dias, desde)}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.clave} id={`${idBase}-${s.clave}`} x1="0" y1="0" x2="0" y2="1" className={s.texto}>
                  <stop offset="0" stopColor="currentColor" stopOpacity={0.24} />
                  <stop offset="1" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {/* Rejilla (líneas finas) y números del eje Y */}
            <g aria-hidden="true">
              {marcas.map((m) => (
                <line key={m} x1={x0} x2={x1} y1={y(m)} y2={y(m)} stroke={m === 0 ? 'var(--cabina-borde-fuerte)' : 'var(--cabina-rejilla)'} strokeWidth={1} />
              ))}
              <g className="font-mono" fill="var(--cabina-tenue)" fontSize={10} textAnchor="end" dominantBaseline="central">
                {marcas.map((m) => (
                  <text key={m} x={x0 - 7} y={y(m)}>
                    {entero(m)}
                  </text>
                ))}
              </g>
              <g className="font-mono" fill="var(--cabina-tenue)" fontSize={10} dominantBaseline="hanging">
                {indicesFecha.map((i, j) => (
                  <text key={i} x={x(i)} y={y1 + 8} textAnchor={j === 0 ? 'start' : j === indicesFecha.length - 1 ? 'end' : 'middle'}>
                    {diaYMes(fechaDelDia(desde, i)) ?? `Día ${i + 1}`}
                  </text>
                ))}
              </g>
            </g>

            {/* Áreas con degradado y líneas de las series encendidas */}
            {visibles.map((s) => {
              const puntos = s.valores.map((v, i) => ({ x: x(i), y: y(v) }));
              const linea = lineaQuebrada(puntos);
              return (
                <g key={s.clave} className={s.texto} aria-hidden="true">
                  <path d={`${linea}L${x(dias - 1).toFixed(2)} ${y1}L${x0} ${y1}Z`} fill={`url(#${idBase}-${s.clave})`} />
                  <path d={linea} pathLength={1} className="cabina-traza" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                </g>
              );
            })}

            {visibles.length === 0 && (
              <text className="font-mono" x={(x0 + x1) / 2} y={(y0 + y1) / 2} textAnchor="middle" fill="var(--cabina-tenue)" fontSize={11}>
                Enciende una serie para ver su línea
              </text>
            )}

            {/* Día marcado: línea fina y un punto por serie encendida (con aro del color del fondo) */}
            <line x1={x(indice)} x2={x(indice)} y1={y0} y2={y1} stroke="var(--cabina-texto-2)" strokeWidth={1} aria-hidden="true" />
            {visibles.map((s) => (
              <circle key={s.clave} cx={x(indice)} cy={y(s.valores[indice])} r={4} className={s.texto} fill="currentColor" stroke="var(--cabina-fondo-2)" strokeWidth={2} aria-hidden="true" />
            ))}

            {/* Zona que recibe el mouse y el dedo: más grande que cualquier marca */}
            <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="transparent" onPointerMove={alMover} onPointerDown={alMover} onPointerLeave={alSalir} style={{ touchAction: 'pan-y' }} />
          </svg>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
    </div>
  );
}

export function PulsoLineas({ tendencia, className = '' }: { tendencia: CabinaTendencia | null | undefined; className?: string }) {
  const sinDatos = (texto: string) => (
    <Instrumento id="cabina-lineas" titulo="Pulso de 30 días" className={className}>
      <SinDato texto={texto} />
    </Instrumento>
  );
  if (!tendencia) return sinDatos('Tu cuenta no ve este módulo, o todavía no hay datos.');

  const largoMayor = Math.max(0, ...SERIES.map((s) => tendencia[s.clave]?.length ?? 0));
  const dias = Math.min(MAX_DIAS, esNumero(tendencia.dias) && tendencia.dias >= 2 ? Math.round(tendencia.dias) : largoMayor);
  if (dias < 2) return sinDatos('Todavía no hay una serie de días para dibujar.');

  const series: Serie[] = SERIES.map((s) => ({ ...s, valores: serieDe(tendencia[s.clave], dias) }));
  const desde = tendencia.desde ?? null;
  const ini = diaYMes(fechaDelDia(desde, 0));
  const fin = diaYMes(fechaDelDia(desde, dias - 1));

  return (
    <Instrumento id="cabina-lineas" titulo={`Pulso de ${dias} días`} subtitulo={ini && fin ? `Cantidad por día, del ${ini} al ${fin}` : 'Cantidad por día'} className={className}>
      <GraficoPulso dias={dias} desde={desde} series={series} />
    </Instrumento>
  );
}
