import { decimal, esNumero } from '../../lib/formato';
import { limitar, lineaQuebrada, polar } from '../../lib/grafico';
import { leerEscala, zonaDePuntaje, type EscalaValida, type EstadoLuz } from '../../lib/luces';
import type { CabinaScoring, FactorRadar } from '../../services/inicioService';
import { Instrumento, SinDato } from './Instrumento';
import { FONDO_ESTADO, TEXTO_ESTADO } from './tonos';

/*
 * Radar «Perfil de riesgo»: un eje por factor de la metodología de scoring (hoy 8). El polígono relleno es el promedio del periodo y la
 * línea punteada, el del periodo anterior. Los nombres de los factores NO van alrededor del gráfico (ahí se cortarían o se pisarían):
 * cada eje lleva un número y la leyenda numerada de abajo dice el nombre, el valor y el cambio. Todo es SVG propio.
 */

const LADO = 260;
const CENTRO = LADO / 2;
const RADIO = 84;
const RADIO_NODO = RADIO + 19;

interface Fila {
  numero: number;
  nombre: string;
  valor: number | null;
  anterior: number | null;
}

/** Los puntos de un polígono de radar: cada valor de la escala sale como distancia al centro (el mínimo es el centro y el máximo, el aro de afuera). */
function puntosRadar(valores: readonly (number | null)[], escala: EscalaValida): { x: number; y: number }[] {
  return valores.map((v, i) => {
    const t = limitar(((v ?? escala.min) - escala.min) / (escala.max - escala.min), 0, 1);
    return polar(CENTRO, CENTRO, RADIO * t, -90 + (i * 360) / valores.length);
  });
}

/** El aro de un valor de la escala: un polígono con un vértice por eje. */
function aro(valor: number, escala: EscalaValida, ejes: number): string {
  const r = (RADIO * (valor - escala.min)) / (escala.max - escala.min);
  return `${lineaQuebrada(Array.from({ length: ejes }, (_, i) => polar(CENTRO, CENTRO, r, -90 + (i * 360) / ejes)))}Z`;
}

const ESTADO_ZONA: Record<'bajo' | 'medio' | 'alto', EstadoLuz> = { bajo: 'verde', medio: 'ambar', alto: 'rojo' };

/** El cambio contra el periodo anterior de un factor: si el riesgo sube es aviso (ámbar) y si baja, buena noticia (verde). */
function cambio(valor: number | null, anterior: number | null): { texto: string; estado: EstadoLuz } | null {
  if (valor == null || anterior == null) return null;
  const d = Math.round((valor - anterior) * 10) / 10;
  if (d === 0) return { texto: '= igual', estado: 'gris' };
  return d > 0 ? { texto: `▲ +${decimal(d)}`, estado: 'ambar' } : { texto: `▼ −${decimal(-d)}`, estado: 'verde' };
}

export function RadarPerfil({ scoring, className = '' }: { scoring: CabinaScoring | null | undefined; className?: string }) {
  const marco = { id: 'cabina-radar', titulo: 'Perfil de riesgo', className };
  if (!scoring) {
    return (
      <Instrumento {...marco}>
        <SinDato texto="Tu cuenta no ve el scoring, o todavía no hay datos." />
      </Instrumento>
    );
  }
  const escala = leerEscala(scoring.escala);
  const filas: Fila[] = (scoring.radar ?? [])
    .filter((f): f is FactorRadar => !!f)
    .map((f, i) => ({
      numero: i + 1,
      nombre: (f.factor ?? '').trim() || `Factor ${i + 1}`,
      valor: esNumero(f.valor) ? f.valor : null,
      anterior: esNumero(f.anterior) ? f.anterior : null,
    }));

  if (!escala || filas.length < 3) {
    return (
      <Instrumento {...marco} subtitulo="Promedio de cada factor de la metodología">
        <SinDato texto={!escala ? 'El servidor no mandó la escala de la metodología.' : 'Todavía no hay evaluaciones con factores en este periodo.'} />
      </Instrumento>
    );
  }

  const n = filas.length;
  const hayAnterior = filas.every((f) => f.anterior != null);
  const poligono = `${lineaQuebrada(puntosRadar(filas.map((f) => f.valor), escala))}Z`;
  const poligonoAnterior = hayAnterior ? `${lineaQuebrada(puntosRadar(filas.map((f) => f.anterior), escala))}Z` : null;
  const vertices = puntosRadar(filas.map((f) => f.valor), escala);
  const aros = [escala.corteMedio, escala.corteAlto, escala.max];
  const resumenAccesible = `Perfil de riesgo del periodo, de ${decimal(escala.min)} a ${decimal(escala.max)}: ${filas.map((f) => `${f.nombre} ${f.valor == null ? 'sin dato' : decimal(f.valor)}`).join('; ')}.${hayAnterior ? ' La línea punteada es el periodo anterior.' : ''}`;

  return (
    <Instrumento {...marco} subtitulo={`Promedio de cada factor, de ${decimal(escala.min)} a ${decimal(escala.max)}`}>
      <svg viewBox={`0 0 ${LADO} ${LADO}`} className="mx-auto block h-auto w-full max-w-[17rem]" role="img" aria-label={resumenAccesible}>
        {/* Rejilla: un aro por corte de la escala y un radio por factor */}
        <g fill="none" stroke="var(--cabina-rejilla)" strokeWidth={1} aria-hidden="true">
          {aros.map((v, i) => (
            <path key={v} d={aro(v, escala, n)} stroke={i === aros.length - 1 ? 'var(--cabina-borde-fuerte)' : 'var(--cabina-rejilla)'} />
          ))}
          {filas.map((f, i) => {
            const p = polar(CENTRO, CENTRO, RADIO, -90 + (i * 360) / n);
            return <line key={f.numero} x1={CENTRO} y1={CENTRO} x2={p.x} y2={p.y} />;
          })}
        </g>
        <g className="font-mono" fill="var(--cabina-tenue)" fontSize={9} aria-hidden="true">
          {aros.map((v) => (
            <text key={v} x={CENTRO + 4} y={CENTRO - (RADIO * (v - escala.min)) / (escala.max - escala.min) - 2.5}>
              {decimal(v)}
            </text>
          ))}
        </g>

        {/* Periodo anterior (punteado) y periodo actual (relleno) */}
        {poligonoAnterior && <path d={poligonoAnterior} fill="none" stroke="var(--cabina-texto-2)" strokeWidth={1.5} strokeDasharray="4 4" strokeLinejoin="round" aria-hidden="true" />}
        <path d={poligono} fill="var(--cabina-serie-1)" fillOpacity={0.28} stroke="var(--cabina-serie-1)" strokeWidth={2} strokeLinejoin="round" aria-hidden="true" />
        <g fill="var(--cabina-serie-1)" stroke="var(--cabina-fondo-2)" strokeWidth={2} aria-hidden="true">
          {vertices.map((p, i) => (
            <circle key={filas[i].numero} cx={p.x} cy={p.y} r={4} />
          ))}
        </g>

        {/* Ejes numerados: el nombre de cada factor está en la leyenda de abajo */}
        <g className="font-mono" textAnchor="middle" dominantBaseline="central" fontSize={10} aria-hidden="true">
          {filas.map((f, i) => {
            const p = polar(CENTRO, CENTRO, RADIO_NODO, -90 + (i * 360) / n);
            return (
              <g key={f.numero}>
                <circle cx={p.x} cy={p.y} r={9} fill="var(--cabina-panel-2)" stroke="var(--cabina-borde-fuerte)" strokeWidth={1} />
                <text x={p.x} y={p.y + 0.5} fill="var(--cabina-texto)">
                  {f.numero}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px] leading-snug text-cabina-texto-2">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 shrink-0 rounded-full bg-cabina-serie-1" aria-hidden="true" />
          Periodo actual
        </span>
        {hayAnterior && (
          <span className="flex items-center gap-1.5">
            <svg width="20" height="2" viewBox="0 0 20 2" className="shrink-0" aria-hidden="true">
              <line x1="0" y1="1" x2="20" y2="1" stroke="var(--cabina-texto-2)" strokeWidth="2" strokeDasharray="4 3" />
            </svg>
            Periodo anterior
          </span>
        )}
      </p>

      <ol className="grid gap-x-4 gap-y-2 border-t border-cabina-borde pt-3 @[24rem]:grid-cols-2" aria-label="Factores del perfil de riesgo">
        {filas.map((f) => {
          const zona = f.valor == null ? null : zonaDePuntaje(f.valor, escala);
          const dif = cambio(f.valor, f.anterior);
          return (
            <li key={f.numero} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-x-2">
              <span className="mt-px flex h-5 w-5 items-center justify-center rounded-full border border-cabina-borde-fuerte bg-cabina-panel-2 font-mono text-[10px] leading-none text-cabina-texto" aria-hidden="true">
                {f.numero}
              </span>
              <span className="min-w-0">
                <span className="block break-words text-[12px] leading-snug text-cabina-texto-2">{f.nombre}</span>
                <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="flex items-center gap-1.5 text-[14px] font-medium leading-snug text-cabina-texto">
                    {zona && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${FONDO_ESTADO[ESTADO_ZONA[zona]]}`} aria-hidden="true" />}
                    {f.valor == null ? '—' : decimal(f.valor)}
                    {zona && <span className="sr-only">, riesgo {zona}</span>}
                  </span>
                  {dif && <span className={`font-mono text-[10px] leading-snug tracking-[0.02em] ${TEXTO_ESTADO[dif.estado]}`}>{dif.texto}</span>}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </Instrumento>
  );
}
