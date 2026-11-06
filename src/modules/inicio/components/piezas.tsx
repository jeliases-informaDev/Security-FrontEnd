import type { ComponentType, ReactNode, SVGProps } from 'react';
import Link from 'next/link';
import { IconoDerecha } from '@/shared/ui/iconos';
import type { EstadoResumen } from '../hooks/useResumenInicio';
import { entero, esNumero, porcentaje, soloNumeros, variacion } from '../lib/formato';

/*
 * Piezas del tablero de Inicio: tarjeta, cifra (KPI), mini-serie, barra apilada, barras horizontales y los estados de carga,
 * vacío y error. Son propias y livianas (SVG y CSS, sin librerías de gráficos). Colores y tipografía: los tokens de
 * «Propuesta suave» (marino, tinta, ámbar, rojo, verde; rótulos en mono y mayúsculas).
 * Regla de la casa: ningún texto se corta. Todo lo que varía (nombres, situaciones, tipos) pasa a otra línea.
 */

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

/** Lo que recibe cada tarjeta: en qué va la carga, su bloque del resumen (null si no se muestra o aún no llega) y cómo reintentar. */
export interface PropsBloque<T> {
  estado: EstadoResumen;
  bloque: T | null | undefined;
  /** Etiqueta del periodo del resumen («Noviembre 2026»), o null mientras llega. */
  periodoEtiqueta: string | null;
  onReintentar: () => void;
}

/** Rótulo en mono de 10 px (rótulos de las cifras y subtítulos de cada bloque). Tinta al 70 %: 7:1 de contraste sobre blanco (el gris `muted` daba 5,3:1 y se veía pálido a 10 px). */
const ROTULO_BASE = 'font-mono text-[10px] font-normal uppercase leading-[1.5] text-ink/70';
export const ROTULO = `${ROTULO_BASE} tracking-[0.05em]`;
/** El rótulo de una cifra, con la letra un poco más junta: así «Homónimos descartados» cabe en una línea en la cifra más angosta (cuatro por fila con la ventana a 1235 px). */
const ROTULO_CIFRA = `${ROTULO_BASE} tracking-[0.03em]`;

/** Color de la serie o del valor: la clase de texto que toma `currentColor`. El ámbar sale de mezclar los tokens `media` y `warn`. */
export const COLOR_SERIE = {
  marino: 'text-brand',
  ambar: 'text-[color-mix(in_srgb,var(--media)_80%,var(--warn))]',
} as const;
export type TonoSerie = keyof typeof COLOR_SERIE;

/** Relleno de los segmentos de las barras apiladas. */
export const FONDO = {
  critica: 'bg-bad',
  alta: 'bg-bad/45',
  media: 'bg-[color-mix(in_srgb,var(--media)_80%,var(--warn))]',
  verde: 'bg-vivo',
  gris: 'bg-ink/20',
  lila: 'bg-accent/55',
} as const;

// ------------------------------------------------------------
// Tarjeta
// ------------------------------------------------------------

interface TarjetaProps {
  /** Identificador estable: de él salen los id del título y de la región. */
  id: string;
  /** Caja de icono lavanda; si se pasa `avatar`, va este en su lugar. */
  icono?: Icono;
  avatar?: ReactNode;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  /** Nombre accesible de la región cuando el título es el nombre de una persona. */
  nombreAccesible?: string;
  /** Lo que va a la derecha del título (chip y enlace). Pasa a otra línea si no cabe. */
  derecha?: ReactNode;
  /** `derecha` es solo un chip corto (sin enlace): entonces cabe al lado del título desde mucho más angosto (17 rem de tarjeta en vez de 30). */
  derechaCorta?: boolean;
  children?: ReactNode;
}

// Cabecera de dos filas (título y lo de la derecha / subtítulo), solo desde cierto ancho de tarjeta. Son clases escritas completas
// para que Tailwind las encuentre: no se pueden armar con texto.
const CABECERA = {
  larga: {
    rejilla: '@[30rem]:grid-cols-[minmax(0,1fr)_auto] @[30rem]:gap-x-3 @[30rem]:gap-y-0',
    titulo: '@[30rem]:col-start-1 @[30rem]:row-start-1',
    subtitulo: '@[30rem]:col-span-2 @[30rem]:row-start-2',
    derecha: '@[30rem]:col-start-2 @[30rem]:row-start-1 @[30rem]:justify-end',
  },
  corta: {
    rejilla: '@[17rem]:grid-cols-[minmax(0,1fr)_auto] @[17rem]:gap-x-3 @[17rem]:gap-y-0',
    titulo: '@[17rem]:col-start-1 @[17rem]:row-start-1',
    subtitulo: '@[17rem]:col-span-2 @[17rem]:row-start-2',
    derecha: '@[17rem]:col-start-2 @[17rem]:row-start-1 @[17rem]:justify-end',
  },
} as const;

/**
 * Superficie blanca de un bloque del tablero. Es además un «contenedor» de CSS: las cuadrículas de cifras y los dos
 * bloques de abajo se acomodan según el ancho de la tarjeta (no el de la pantalla), así caben igual en la columna ancha,
 * en la angosta y en una sola columna.
 *
 * Cabecera (como en el diseño): a la izquierda la caja de icono o el avatar; al lado, el título con lo de la derecha (chip y
 * enlace) a su altura, y el subtítulo debajo, con todo el ancho para no partirse. Desde 30 rem de tarjeta va así (17 rem si la
 * derecha es solo un chip); más angosta, en una sola columna: título, subtítulo y, debajo, el chip y el enlace.
 *
 * Altura: si el tablero la estira (la última tarjeta de la columna más corta, para que las dos terminen parejas), la diferencia
 * se reparte entre los bloques (`justify-between`, solo con tres o más: cargando, error y vacío son título + un bloque y ese
 * bloque se queda pegado al título) en vez de dejar un vacío al final. Y no se estira de más: `calc-size` limita la tarjeta a
 * su alto natural + 6 rem; con una diferencia mayor (estados raros) las columnas terminan distintas, como siempre.
 * (Un navegador sin `calc-size` ignora ese tope y estira del todo.)
 */
export function Tarjeta({ id, icono: Icono, avatar, titulo, subtitulo, nombreAccesible, derecha, derechaCorta = false, children }: TarjetaProps) {
  const idTitulo = `${id}-titulo`;
  const c = derechaCorta ? CABECERA.corta : CABECERA.larga;
  return (
    <section
      className="card @container flex max-h-[calc-size(max-content,size_+_6rem)] flex-col gap-4 p-4 has-[>:nth-child(3)]:justify-between sm:p-5"
      aria-labelledby={nombreAccesible ? undefined : idTitulo}
      aria-label={nombreAccesible}
    >
      <header className="flex items-center gap-3">
        {avatar ?? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-ink" aria-hidden="true">
            {Icono && <Icono className="h-[18px] w-[18px]" />}
          </span>
        )}
        <div className={`grid min-w-0 flex-1 items-center gap-y-1.5 ${c.rejilla}`}>
          <h2 id={idTitulo} className={`min-w-0 break-words text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink ${c.titulo}`}>{titulo}</h2>
          {subtitulo && <p className={`${ROTULO} min-w-0 break-words ${c.subtitulo}`}>{subtitulo}</p>}
          {derecha && <div className={`flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 ${c.derecha}`}>{derecha}</div>}
        </div>
      </header>
      {children}
    </section>
  );
}

/** Enlace de la tarjeta a su módulo: «Ver todas →», «Abrir oficial de cumplimiento →». */
export function EnlaceModulo({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-[13px] font-semibold leading-5 text-ink underline-offset-4 hover:underline">
      <span>{children}</span>
      <IconoDerecha className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Subtítulo de un bloque dentro de la tarjeta («RESULTADO DE LAS CONSULTAS»). */
export function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className={`${ROTULO} mb-2.5 break-words`}>{children}</h3>;
}

// ------------------------------------------------------------
// Cifras (KPI)
// ------------------------------------------------------------

/**
 * Cuadrícula de cifras: de a dos cuando no caben cuatro (o tres). Cada cifra es una «subcuadrícula» que comparte las filas
 * (rótulo, valor, detalle y serie) con las de su fila: si un rótulo largo pasa a dos líneas, todos los valores bajan juntos
 * y quedan alineados.
 */
export function Cifras({ children, columnas = 4 }: { children: ReactNode; columnas?: 3 | 4 }) {
  // De a tres: si no caben, de a dos y la tercera ocupa todo el ancho de la segunda fila (no queda sola a medias).
  const columnasClase =
    columnas === 3
      ? '@[19.5rem]:grid-cols-3 [&>:last-child:nth-child(odd)]:col-span-2 @[19.5rem]:[&>:last-child:nth-child(odd)]:col-span-1'
      : '@[41rem]:grid-cols-4';
  return <div className={`-mb-2.5 grid grid-cols-2 gap-x-2.5 ${columnasClase}`}>{children}</div>;
}

const TONO_VALOR = { tinta: 'text-ink', rojo: 'text-bad', ambar: 'text-warn', verde: 'text-ok' } as const;
export type TonoValor = keyof typeof TONO_VALOR;

interface CifraProps {
  rotulo: string;
  valor: string;
  /** Unidad pequeña junto al valor (el «%»). */
  unidad?: string;
  detalle?: ReactNode;
  tono?: TonoValor;
  /** La mini-serie de los últimos días. Todas las cifras de una misma cuadrícula llevan `conSerie` o ninguna lo lleva (comparten filas). */
  serie?: { valores: readonly unknown[] | null | undefined; color: TonoSerie; etiqueta: string };
  conSerie?: boolean;
  className?: string;
}

export function Cifra({ rotulo, valor, unidad, detalle, tono = 'tinta', serie, conSerie = false, className = '' }: CifraProps) {
  return (
    <div className={`${conSerie ? 'row-span-4' : 'row-span-3'} mb-2.5 grid min-w-0 grid-rows-subgrid rounded-2xl border border-line bg-white/70 px-2.5 py-3 ${className}`}>
      <p className={`${ROTULO_CIFRA} break-words`}>{rotulo}</p>
      <p className={`mt-1.5 flex flex-wrap items-baseline gap-x-1 ${TONO_VALOR[tono]}`}>
        <span className="text-[1.75rem] font-medium leading-none tracking-[-0.02em] tabular-nums">{valor}</span>
        {unidad && <span className="text-[13px] font-medium leading-none text-muted">{unidad}</span>}
      </p>
      <div className="mt-1.5 min-w-0 break-words text-[12px] leading-[1.4] text-muted">{detalle}</div>
      {conSerie && <div className="mt-2.5 min-w-0">{serie && <MiniSerie valores={serie.valores} color={serie.color} etiqueta={serie.etiqueta} />}</div>}
    </div>
  );
}

/**
 * «▲ +5% vs. periodo anterior» (verde si sube; gris si baja o no cambia). Sin dato no dice nada. Con la tarjeta angosta (cada cifra mide
 * menos de unos 160 px) la frase completa no cabe en una línea, y se dice «vs. anterior»; ancha, completa. Las dos dicen lo mismo.
 */
export function Tendencia({ valor, contra, contraCorto }: { valor: number | null | undefined; contra: string; contraCorto?: string }) {
  if (!esNumero(valor)) return null;
  const v = variacion(valor);
  return (
    <span className={`font-mono text-[10px] leading-[1.5] tracking-[0.02em] ${v.tendencia === 'sube' ? 'text-ok' : 'text-ink/70'}`}>
      {v.tendencia === 'sube' ? '▲ ' : v.tendencia === 'baja' ? '▼ ' : ''}
      {v.texto}{' '}
      {contraCorto ? (
        <>
          <span className="@[48rem]:hidden">{contraCorto}</span>
          <span className="hidden @[48rem]:inline">{contra}</span>
        </>
      ) : (
        contra
      )}
    </span>
  );
}

// ------------------------------------------------------------
// Mini-serie (sparkline)
// ------------------------------------------------------------

const ANCHO = 100;
const ALTO = 30;
const MARGEN = 3;

/**
 * Línea de los últimos días con un área suave debajo y un punto en el último valor. Se dibuja con SVG y se estira al ancho
 * de su cifra (el grosor del trazo no cambia al estirarse). Con menos de dos números no hay línea que dibujar.
 */
export function MiniSerie({ valores, color, etiqueta }: { valores: readonly unknown[] | null | undefined; color: TonoSerie; etiqueta: string }) {
  const v = soloNumeros(valores);
  if (v.length < 2) return null;

  const minimo = Math.min(...v);
  const rango = Math.max(...v) - minimo;
  const x = (i: number) => (i / (v.length - 1)) * ANCHO;
  // Sin variación (todo igual) la línea va al medio; si no, de MARGEN (el mayor) a ALTO - MARGEN (el menor).
  const y = (n: number) => (rango === 0 ? ALTO / 2 : MARGEN + (1 - (n - minimo) / rango) * (ALTO - 2 * MARGEN));

  const puntos = v.map((n, i) => `${x(i).toFixed(2)},${y(n).toFixed(2)}`);
  const linea = `M${puntos.join(' L')}`;
  const area = `${linea} L${ANCHO},${ALTO} L0,${ALTO} Z`;
  const yFinal = y(v[v.length - 1]);

  return (
    <span className={`relative block h-9 w-full ${COLOR_SERIE[color]}`} role="img" aria-label={etiqueta}>
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} preserveAspectRatio="none" className="block h-full w-full overflow-visible" aria-hidden="true">
        <path d={area} fill="currentColor" fillOpacity={0.08} stroke="none" />
        <path d={linea} fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* Punto del último valor: redondo aunque la línea se estire, con un aro blanco para que se despegue del trazo. */}
      <span className="absolute h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-current ring-[1.5px] ring-white" style={{ left: 'calc(100% - 3.5px)', top: `${(yFinal / ALTO) * 100}%` }} aria-hidden="true" />
    </span>
  );
}

// ------------------------------------------------------------
// Barras
// ------------------------------------------------------------

export interface Segmento {
  clave: string;
  etiqueta: string;
  /** Porcentaje (o cualquier cantidad: las barras reparten el ancho en proporción). */
  valor: number | null;
  fondo: string;
}

/** Barra apilada con su leyenda («● Crítica 4%  ● Alta 8% …»). Un segmento sin valor no se dibuja, pero su leyenda dice «—». */
export function BarraApilada({ segmentos, etiqueta }: { segmentos: Segmento[]; etiqueta: string }) {
  const conValor = segmentos.filter((s): s is Segmento & { valor: number } => esNumero(s.valor) && s.valor > 0);
  const total = conValor.reduce((suma, s) => suma + s.valor, 0);
  const resumen = segmentos.map((s) => `${s.etiqueta} ${porcentaje(s.valor)} por ciento`).join(', ');
  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-line" role="img" aria-label={`${etiqueta}: ${resumen}`}>
        {conValor.map((s) => (
          // El ancho de cada tramo es su parte del total (así llena la barra aunque los porcentajes no sumen justo 100).
          <span key={s.clave} className={`block h-full min-w-[3px] ${s.fondo}`} style={{ flex: `${(s.valor / total) * 100} 1 0%` }} />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[11px] leading-snug text-muted">
        {segmentos.map((s) => (
          <li key={s.clave} className="flex min-w-0 items-baseline gap-1.5">
            <span className={`h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full ${s.fondo}`} aria-hidden="true" />
            <span className="min-w-0 break-words">
              {s.etiqueta} <b className="font-semibold text-ink">{esNumero(s.valor) ? `${porcentaje(s.valor)}%` : '—'}</b>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface FilaBarra {
  clave: string;
  etiqueta: string;
  valor: number;
}

/**
 * Barras horizontales: nombre a la izquierda, barra marino proporcional a la mayor y el valor a la derecha. La columna de los
 * nombres mide lo que el más largo (hasta el 45 % del ancho): si no cabe, pasa a otra línea. Todas las filas comparten las
 * mismas columnas (subcuadrícula), así las barras quedan alineadas.
 */
export function BarrasHorizontales({ filas, etiqueta }: { filas: FilaBarra[]; etiqueta: string }) {
  const mayor = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <ul className="grid grid-cols-[fit-content(45%)_minmax(0,1fr)_2.25rem] items-center gap-x-3 gap-y-2.5 text-[12px] leading-snug text-ink" aria-label={etiqueta}>
      {filas.map((fila) => (
        <li key={fila.clave} className="col-span-full grid grid-cols-subgrid items-center">
          <span className="min-w-[4.5rem] break-words">{fila.etiqueta}</span>
          <span className="block h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, (fila.valor / mayor) * 100))}%` }} />
          </span>
          <span className="text-right font-medium tabular-nums">{entero(fila.valor)}</span>
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------
// Estados de la tarjeta: carga, vacío y error
// ------------------------------------------------------------

/** Una línea de esqueleto: fina y redondeada, del tono de los rótulos (nada de cajas grises pesadas). Late suave; sin movimiento, queda quieta. */
export const LINEA_ESQUELETO = 'animate-pulse rounded-full bg-ink/[0.06]';

/** Esqueleto con la forma de la tarjeta: cada cifra con su recuadro (rótulo, valor y detalle) y los bloques de abajo como líneas finas. */
export function EsqueletoTarjeta({ cifras = 4, bloques = 2 }: { cifras?: 3 | 4; bloques?: 1 | 2 }) {
  return (
    <div role="status" aria-live="polite" aria-label="Cargando…" aria-busy="true" className="flex flex-col gap-4">
      <div className={`grid grid-cols-2 gap-2.5 ${cifras === 3 ? '@[19.5rem]:grid-cols-3' : '@[41rem]:grid-cols-4'}`}>
        {Array.from({ length: cifras }, (_, i) => (
          <div key={i} className="flex min-h-[6.5rem] flex-col gap-2.5 rounded-2xl border border-line bg-white/70 px-2.5 py-3">
            <div className={`h-2 w-2/5 ${LINEA_ESQUELETO}`} />
            <div className="h-6 w-1/3 animate-pulse rounded-lg bg-ink/[0.06]" />
            <div className={`h-2 w-3/5 ${LINEA_ESQUELETO}`} />
          </div>
        ))}
      </div>
      <div className={`grid gap-x-7 gap-y-5 ${bloques === 2 ? '@[38rem]:grid-cols-2' : ''}`}>
        {Array.from({ length: bloques }, (_, i) => (
          <div key={i} className="space-y-3">
            <div className={`h-2 w-1/3 ${LINEA_ESQUELETO}`} />
            <div className={`h-2 w-full ${LINEA_ESQUELETO}`} />
            <div className={`h-2 w-4/5 ${LINEA_ESQUELETO}`} />
            <div className={`h-2 w-3/5 ${LINEA_ESQUELETO}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Tarjeta sin datos todavía: texto breve y el enlace al módulo para empezar. */
export function VacioTarjeta({ texto, href, enlace }: { texto: string; href: string; enlace: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line-strong bg-paper/60 px-4 py-5">
      <p className="text-[13px] leading-snug text-muted">{texto}</p>
      <EnlaceModulo href={href}>{enlace}</EnlaceModulo>
    </div>
  );
}

/** Error de una sola tarjeta: dice qué pasó, deja claro que lo demás sigue funcionando y deja reintentar. */
export function ErrorTarjeta({ onReintentar }: { onReintentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-bad/20 bg-bad-soft px-4 py-4 text-[13px] leading-snug text-bad">
      <p>No pudimos cargar esta sección. El resto de la página sigue funcionando.</p>
      <button type="button" onClick={onReintentar} className="btn btn-secondary btn-sm">Reintentar</button>
    </div>
  );
}

/** Franja de aviso dentro de la tarjeta (rojo, verde o ámbar): una cápsula que, si el texto es largo, crece a dos líneas. */
export function Franja({ tono, children }: { tono: 'bad' | 'ok' | 'warn'; children: ReactNode }) {
  const estilo = tono === 'bad' ? 'bg-bad-soft text-bad' : tono === 'ok' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn';
  const punto = tono === 'bad' ? 'bg-bad-solid' : tono === 'ok' ? 'bg-ok' : 'bg-warn';
  return (
    <p className={`flex w-fit max-w-full items-start gap-2 rounded-2xl px-3.5 py-2 text-[12px] leading-snug ${estilo}`}>
      <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${punto}`} aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}
