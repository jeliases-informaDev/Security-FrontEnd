'use client';

import { useMemo, useState, type KeyboardEvent, type PointerEvent as EventoPuntero } from 'react';
import { useAncho } from '../../hooks/useAncho';
import { entero, esNumero, montoResumido } from '../../lib/formato';
import { limitar, normalizarNombre } from '../../lib/grafico';
import { DEPARTAMENTOS_MAPA_PERU, MAPA_PERU_ALTO, MAPA_PERU_ANCHO, type DepartamentoMapa } from '../../lib/peruDepartamentos';
import type { CabinaMapa, DepartamentoCifras } from '../../services/inicioService';
import { Instrumento, SinDato } from './Instrumento';

/*
 * Mapa de calor del Perú: la silueta real con los 25 departamentos (rutas SVG de `lib/peruDepartamentos.ts`), pintados por intensidad
 * con un solo tono según lo que se mida: registros, evaluaciones o evaluaciones de riesgo alto. Sin datos = gris apagado. Callao es
 * diminuto y lleva además un marcador circular. Cada departamento se enfoca con el teclado (una sola parada de Tab y las flechas
 * recorren los departamentos de norte a sur), y al pasar el mouse, enfocar o tocar muestra su nombre y sus cifras. Nada depende del
 * mouse: siempre está la lista «Los 5 con más …» y cada departamento dice sus cifras en su nombre accesible.
 * Se enlaza por código INEI (01 a 25) y, si falta o no calza, por nombre sin tildes; lo que no calza («Extranjero») va aparte.
 */

type Metrica = 'registros' | 'evaluaciones' | 'altos';

interface Cifras {
  registros: number;
  montoUsd: number;
  evaluaciones: number;
  altos: number;
}

const SIN_CIFRAS: Cifras = { registros: 0, montoUsd: 0, evaluaciones: 0, altos: 0 };

/** Qué se mide: el rótulo del botón, lo que dice la lista y el tono (un solo color por medida, de los de serie y el de riesgo). */
const METRICAS: { clave: Metrica; boton: string; lista: string; nota: string; tono: string }[] = [
  { clave: 'registros', boton: 'Registros', lista: 'registros', nota: 'Los registros se cuentan en el departamento de la persona que hizo la operación.', tono: 'var(--cabina-serie-3)' },
  { clave: 'evaluaciones', boton: 'Evaluaciones', lista: 'evaluaciones', nota: 'Las evaluaciones se cuentan en el departamento de residencia de la persona evaluada.', tono: 'var(--cabina-serie-4)' },
  { clave: 'altos', boton: 'Alto riesgo', lista: 'casos de riesgo alto', nota: 'Son las evaluaciones de nivel alto, por el departamento de residencia de la persona evaluada.', tono: 'var(--cabina-bad)' },
];

/** Cuánto del tono lleva cada escalón de intensidad (0 = sin datos). Son cinco escalones parejos entre 1 y el máximo. */
const MEZCLA = [0, 24, 42, 60, 80, 100];
const ESCALONES = MEZCLA.length - 1;

/** Los departamentos de norte a sur (y de izquierda a derecha si empatan): el orden en que las flechas los recorren. */
const ORDEN = [...DEPARTAMENTOS_MAPA_PERU].sort((a, b) => a.centro[1] - b.centro[1] || a.centro[0] - b.centro[0]).map((d) => d.codigo);
const POR_CODIGO = new Map<string, DepartamentoMapa>(DEPARTAMENTOS_MAPA_PERU.map((d) => [d.codigo, d]));
const POR_NOMBRE = new Map<string, string>(DEPARTAMENTOS_MAPA_PERU.map((d) => [normalizarNombre(d.nombre), d.codigo]));
const CODIGO_CALLAO = '07';

/** Tamaño del recuadro de cada departamento en el lienzo (se calcula una vez de su ruta): decide en cuáles cabe el rótulo. */
const TAMANO = new Map<string, { ancho: number; alto: number }>(
  DEPARTAMENTOS_MAPA_PERU.map((d) => {
    const numeros = (d.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const xs = numeros.filter((_, i) => i % 2 === 0);
    const ys = numeros.filter((_, i) => i % 2 === 1);
    return [d.codigo, { ancho: Math.max(...xs) - Math.min(...xs), alto: Math.max(...ys) - Math.min(...ys) }];
  }),
);

const num = (v: number | null | undefined) => (esNumero(v) && v > 0 ? v : 0);

/** A qué departamento del mapa corresponde una fila del servidor: por código INEI y, si no, por nombre sin tildes (Callao también por «…del Callao»). */
function codigoDe(d: DepartamentoCifras): string | null {
  const codigo = (d.codigo ?? '').toString().trim();
  if (codigo) {
    const dos = codigo.padStart(2, '0');
    if (POR_CODIGO.has(dos)) return dos;
  }
  const nombre = normalizarNombre(d.nombre);
  if (POR_NOMBRE.has(nombre)) return POR_NOMBRE.get(nombre) ?? null;
  return /\bcallao\b/.test(nombre) ? CODIGO_CALLAO : null;
}

function agrupar(departamentos: readonly (DepartamentoCifras | null)[] | null | undefined) {
  const porCodigo = new Map<string, Cifras>();
  const sinDepartamento: { nombre: string; cifras: Cifras }[] = [];
  for (const d of departamentos ?? []) {
    if (!d) continue;
    const cifras: Cifras = { registros: num(d.registros), montoUsd: num(d.montoUsd), evaluaciones: num(d.evaluaciones), altos: num(d.altos) };
    const codigo = codigoDe(d);
    if (codigo) {
      // Si el servidor manda dos filas del mismo departamento (por ejemplo, dos nombres), se suman.
      const previas = porCodigo.get(codigo) ?? SIN_CIFRAS;
      porCodigo.set(codigo, {
        registros: previas.registros + cifras.registros,
        montoUsd: previas.montoUsd + cifras.montoUsd,
        evaluaciones: previas.evaluaciones + cifras.evaluaciones,
        altos: previas.altos + cifras.altos,
      });
    } else {
      sinDepartamento.push({ nombre: (d.nombre ?? '').trim() || 'Sin nombre', cifras });
    }
  }
  return { porCodigo, sinDepartamento };
}

const hayMovimiento = (c: Cifras) => c.registros > 0 || c.evaluaciones > 0 || c.altos > 0;

/** Las cifras de un departamento en una frase («33 registros (US$ 1,2 M), 19 evaluaciones, 3 de riesgo alto»). */
function resumenCifras(c: Cifras): string {
  if (!hayMovimiento(c)) return 'sin movimientos en este periodo';
  return [
    c.registros > 0 && `${entero(c.registros)} ${c.registros === 1 ? 'registro' : 'registros'}${c.montoUsd > 0 ? ` (${montoResumido(c.montoUsd)})` : ''}`,
    c.evaluaciones > 0 && `${entero(c.evaluaciones)} ${c.evaluaciones === 1 ? 'evaluación' : 'evaluaciones'}`,
    c.altos > 0 && `${entero(c.altos)} de riesgo alto`,
  ]
    .filter((p): p is string => typeof p === 'string')
    .join(', ');
}

const escalonDe = (valor: number, maximo: number) => (valor <= 0 || maximo <= 0 ? 0 : Math.min(ESCALONES, Math.ceil((valor / maximo) * ESCALONES)));
const colorDe = (escalon: number, tono: string) => (escalon === 0 ? 'var(--cabina-panel-2)' : `color-mix(in srgb, ${tono} ${MEZCLA[escalon]}%, var(--cabina-fondo-2))`);

const ANCHO_GLOBO = 176;

export function MapaPeru({ mapa, className = '' }: { mapa: CabinaMapa | null | undefined; className?: string }) {
  const marco = { id: 'cabina-mapa', titulo: 'Mapa del Perú', className };
  if (!mapa) {
    return (
      <Instrumento {...marco}>
        <SinDato texto="Tu cuenta no ve estos módulos, o todavía no hay datos." />
      </Instrumento>
    );
  }
  return (
    <Instrumento {...marco} subtitulo="Por departamento, en el periodo">
      <ContenidoMapa departamentos={mapa.departamentos} />
    </Instrumento>
  );
}

function ContenidoMapa({ departamentos }: { departamentos: CabinaMapa['departamentos'] }) {
  const { porCodigo, sinDepartamento } = useMemo(() => agrupar(departamentos), [departamentos]);
  const [metrica, setMetrica] = useState<Metrica>(() => METRICAS.find((m) => [...porCodigo.values()].some((c) => c[m.clave] > 0))?.clave ?? 'registros');
  const [pasando, setPasando] = useState<string | null>(null);
  const [enfocado, setEnfocado] = useState<string | null>(null);
  const [actual, setActual] = useState<string | null>(null);
  const { ref: refMapa, ancho } = useAncho<HTMLDivElement>();

  const def = METRICAS.find((m) => m.clave === metrica) ?? METRICAS[0];
  const valorDe = (codigo: string) => (porCodigo.get(codigo) ?? SIN_CIFRAS)[metrica];
  const maximo = Math.max(0, ...DEPARTAMENTOS_MAPA_PERU.map((d) => valorDe(d.codigo)));
  const ranking = DEPARTAMENTOS_MAPA_PERU.map((d) => ({ dep: d, valor: valorDe(d.codigo), cifras: porCodigo.get(d.codigo) ?? SIN_CIFRAS }))
    .filter((f) => f.valor > 0)
    .sort((a, b) => b.valor - a.valor || a.dep.nombre.localeCompare(b.dep.nombre, 'es'))
    .slice(0, 5);

  // Una sola parada de Tab: el departamento «actual» (por defecto, el primero del ranking).
  const tabulable = actual ?? ranking[0]?.dep.codigo ?? ORDEN[0];
  const activo = pasando ?? enfocado;
  const escala = ancho / MAPA_PERU_ANCHO;
  // Antes de medir el mapa (ancho 0) el marcador de Callao ya se dibuja con una escala de reserva: así el teclado pasa por él desde el primer momento.
  const escalaMarcador = escala > 0 ? escala : 0.6;

  const propiedadesDe = (dep: DepartamentoMapa) => {
    const cifras = porCodigo.get(dep.codigo) ?? SIN_CIFRAS;
    return {
      onPointerEnter: (e: EventoPuntero) => e.pointerType === 'mouse' && setPasando(dep.codigo),
      onPointerLeave: (e: EventoPuntero) => e.pointerType === 'mouse' && setPasando(null),
      focus: {
        role: 'img' as const,
        'aria-label': `${dep.nombre}: ${resumenCifras(cifras)}`,
        tabIndex: dep.codigo === tabulable ? 0 : -1,
        onFocus: () => {
          setEnfocado(dep.codigo);
          setActual(dep.codigo);
        },
        onBlur: () => setEnfocado((previo) => (previo === dep.codigo ? null : previo)),
        onClick: () => {
          setEnfocado(dep.codigo);
          setActual(dep.codigo);
        },
        onKeyDown: (e: KeyboardEvent<SVGElement>) => {
          const i = ORDEN.indexOf(dep.codigo);
          const siguiente =
            e.key === 'ArrowRight' || e.key === 'ArrowDown' ? Math.min(ORDEN.length - 1, i + 1) : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? Math.max(0, i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? ORDEN.length - 1 : -1;
          if (siguiente < 0) return;
          e.preventDefault();
          // El siguiente departamento se busca en el mismo dibujo por su código (sin guardar referencias a cada elemento); si alguno
          // no está dibujado, se sigue de largo hacia el mismo lado en vez de quedarse trabado.
          const dibujo = e.currentTarget.ownerSVGElement;
          const sentido = siguiente >= i ? 1 : -1;
          for (let j = siguiente; j >= 0 && j < ORDEN.length; j += sentido) {
            const elemento = dibujo?.querySelector<SVGElement>(`[data-codigo="${ORDEN[j]}"]`);
            if (!elemento) continue;
            setActual(ORDEN[j]);
            elemento.focus();
            return;
          }
        },
        'data-codigo': dep.codigo,
        className: 'cursor-pointer outline-none',
      },
    };
  };

  const globo = activo ? POR_CODIGO.get(activo) : null;
  const cifrasGlobo = activo ? (porCodigo.get(activo) ?? SIN_CIFRAS) : SIN_CIFRAS;

  return (
    <div className="flex flex-col gap-3.5">
      <div role="group" aria-label="Qué medir en el mapa" className="flex flex-wrap gap-1.5">
        {METRICAS.map((m) => (
          <button
            key={m.clave}
            type="button"
            aria-pressed={metrica === m.clave}
            onClick={() => setMetrica(m.clave)}
            className={`rounded-full border px-3 py-1.5 text-[12px] leading-none transition-colors ${
              metrica === m.clave ? 'border-cabina-borde-fuerte bg-cabina-panel-2 font-medium text-cabina-texto' : 'border-cabina-borde text-cabina-tenue hover:bg-cabina-panel hover:text-cabina-texto-2'
            }`}
          >
            {m.boton}
          </button>
        ))}
      </div>

      <div className="grid gap-4 @[30rem]:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] @[30rem]:items-start">
        <div ref={refMapa} className="relative mx-auto w-full max-w-[15rem] @[30rem]:mx-0 @[30rem]:max-w-none">
          <svg
            viewBox={`0 0 ${MAPA_PERU_ANCHO} ${MAPA_PERU_ALTO}`}
            className="block h-auto w-full"
            role="group"
            aria-label={`Mapa del Perú por departamentos: ${def.boton.toLowerCase()}. Con las flechas pasas de un departamento al siguiente, de norte a sur.`}
          >
            {DEPARTAMENTOS_MAPA_PERU.map((dep) => {
              const p = propiedadesDe(dep);
              const esCallao = dep.codigo === CODIGO_CALLAO;
              return (
                <path
                  key={dep.codigo}
                  d={dep.d}
                  style={{ fill: colorDe(escalonDe(valorDe(dep.codigo), maximo), def.tono), stroke: 'var(--cabina-fondo-2)', strokeWidth: 1 }}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                  onPointerEnter={p.onPointerEnter}
                  onPointerLeave={p.onPointerLeave}
                  // Callao se enfoca por su marcador (el contorno apenas se ve): aquí solo reacciona al mouse.
                  {...(esCallao ? { 'aria-hidden': true } : p.focus)}
                />
              );
            })}

            {/* Rótulos de tres letras: solo en los departamentos donde caben y con el mapa ancho; en el celular no hay rótulos adentro. */}
            {escala >= 0.62 && (
              <g className="font-mono" fontSize={10 / escala} textAnchor="middle" dominantBaseline="central" pointerEvents="none" aria-hidden="true">
                {DEPARTAMENTOS_MAPA_PERU.filter((d) => {
                  const t = TAMANO.get(d.codigo);
                  return d.codigo !== CODIGO_CALLAO && !!t && t.ancho * escala >= 34 && t.alto * escala >= 20;
                }).map((d) => {
                  const e = escalonDe(valorDe(d.codigo), maximo);
                  return (
                    <text key={d.codigo} x={d.centro[0]} y={d.centro[1]} fill={e >= 4 ? 'var(--ink)' : e === 0 ? 'var(--cabina-tenue)' : 'var(--cabina-texto)'}>
                      {d.abreviatura}
                    </text>
                  );
                })}
              </g>
            )}

            {/* Callao: un marcador circular junto a Lima (el contorno es un punto). El círculo transparente de afuera es su zona de toque. */}
            {(() => {
              const dep = POR_CODIGO.get(CODIGO_CALLAO);
              if (!dep) return null;
              const p = propiedadesDe(dep);
              const escalon = escalonDe(valorDe(CODIGO_CALLAO), maximo);
              return (
                <g>
                  <circle cx={dep.centro[0]} cy={dep.centro[1]} r={5 / escalaMarcador} style={{ fill: colorDe(escalon, def.tono), stroke: 'var(--cabina-texto-2)', strokeWidth: 1.5 }} vectorEffect="non-scaling-stroke" pointerEvents="none" aria-hidden="true" />
                  <circle cx={dep.centro[0]} cy={dep.centro[1]} r={12 / escalaMarcador} fill="transparent" onPointerEnter={p.onPointerEnter} onPointerLeave={p.onPointerLeave} {...p.focus} />
                </g>
              );
            })()}

            {/* El departamento marcado (con el mouse o el teclado): contorno claro por encima de los demás */}
            {globo && (
              <path d={globo.d} fill="none" stroke="var(--cabina-texto)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" pointerEvents="none" aria-hidden="true" />
            )}
            {globo && globo.codigo === CODIGO_CALLAO && (
              <circle cx={globo.centro[0]} cy={globo.centro[1]} r={7.5 / escalaMarcador} fill="none" stroke="var(--cabina-texto)" strokeWidth={2} vectorEffect="non-scaling-stroke" pointerEvents="none" aria-hidden="true" />
            )}
          </svg>

          {/* Globo con el nombre y las cifras del departamento marcado. Ancho fijo y siempre dentro del mapa; el texto pasa a otra línea. */}
          {globo && ancho > 0 && (
            <div
              className="pointer-events-none absolute z-10 rounded-lg border border-cabina-borde-fuerte bg-cabina-fondo px-3 py-2 shadow-lg"
              style={{
                width: Math.min(ANCHO_GLOBO, ancho),
                left: ancho < ANCHO_GLOBO ? ancho / 2 : limitar(globo.centro[0] * escala, ANCHO_GLOBO / 2, ancho - ANCHO_GLOBO / 2),
                top: globo.centro[1] * escala,
                transform: globo.centro[1] * escala > 130 ? 'translate(-50%, calc(-100% - 14px))' : 'translate(-50%, 16px)',
              }}
              aria-hidden="true"
            >
              <p className="break-words text-[13px] font-medium leading-snug text-cabina-texto">{globo.nombre}</p>
              {hayMovimiento(cifrasGlobo) ? (
                <dl className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 text-[12px] leading-snug">
                  <dt className="text-cabina-tenue">Registros</dt>
                  <dd className="text-right font-medium tabular-nums text-cabina-texto">{entero(cifrasGlobo.registros)}</dd>
                  {cifrasGlobo.montoUsd > 0 && (
                    <>
                      <dt className="text-cabina-tenue">Monto</dt>
                      <dd className="text-right font-medium tabular-nums text-cabina-texto">{montoResumido(cifrasGlobo.montoUsd)}</dd>
                    </>
                  )}
                  <dt className="text-cabina-tenue">Evaluaciones</dt>
                  <dd className="text-right font-medium tabular-nums text-cabina-texto">{entero(cifrasGlobo.evaluaciones)}</dd>
                  <dt className="text-cabina-tenue">Riesgo alto</dt>
                  <dd className="text-right font-medium tabular-nums text-cabina-texto">{entero(cifrasGlobo.altos)}</dd>
                </dl>
              ) : (
                <p className="mt-1 text-[12px] leading-snug text-cabina-tenue">Sin movimientos en este periodo</p>
              )}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {/* Leyenda: de menos a más, con el mínimo (1) y el máximo del periodo */}
          <div>
            <p className="cabina-rotulo mb-1.5">Intensidad</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] leading-none text-cabina-tenue">{maximo > 0 ? '1' : '0'}</span>
              <span className="flex h-2 min-w-0 flex-1 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
                {MEZCLA.slice(1).map((_, i) => (
                  <span key={i} className="h-full flex-1" style={{ background: colorDe(i + 1, def.tono) }} />
                ))}
              </span>
              <span className="font-mono text-[10px] leading-none text-cabina-tenue">{entero(maximo)}</span>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] leading-snug text-cabina-tenue">
              <span className="h-2 w-3 shrink-0 rounded-sm border border-cabina-borde bg-cabina-panel-2" aria-hidden="true" />
              Gris: sin movimientos
            </p>
          </div>

          <div>
            <h4 className="cabina-rotulo mb-2 !text-cabina-texto-2">Los 5 con más {def.lista}</h4>
            {ranking.length === 0 ? (
              <p className="text-[12px] leading-snug text-cabina-tenue">Todavía no hay {def.lista} en el periodo.</p>
            ) : (
              <ol className="flex flex-col gap-2" aria-label={`Los 5 departamentos con más ${def.lista}`}>
                {ranking.map((f, i) => (
                  <li key={f.dep.codigo} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-baseline gap-x-2">
                    <span className="font-mono text-[10px] leading-snug text-cabina-tenue">{i + 1}</span>
                    <span className="min-w-0">
                      <span className="block break-words text-[13px] leading-snug text-cabina-texto">{f.dep.nombre}</span>
                      <span className="mt-1 block h-1 overflow-hidden rounded-full bg-cabina-panel-2" aria-hidden="true">
                        <span className="block h-full rounded-full" style={{ width: `${limitar((f.valor / Math.max(1, maximo)) * 100, 0, 100)}%`, background: def.tono }} />
                      </span>
                    </span>
                    <span className="text-right text-[13px] font-medium tabular-nums leading-snug text-cabina-texto">{entero(f.valor)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {sinDepartamento.length > 0 && (
            <div className="border-t border-cabina-borde pt-3">
              <p className="cabina-rotulo mb-1.5 !text-cabina-texto-2">Sin departamento</p>
              <ul className="flex flex-col gap-1">
                {sinDepartamento.map((s, i) => (
                  <li key={`${s.nombre}-${i}`} className="break-words text-[12px] leading-snug text-cabina-tenue">
                    <span className="text-cabina-texto-2">{s.nombre}</span>: {resumenCifras(s.cifras)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] leading-snug text-cabina-tenue">{def.nota}</p>
        </div>
      </div>
    </div>
  );
}
