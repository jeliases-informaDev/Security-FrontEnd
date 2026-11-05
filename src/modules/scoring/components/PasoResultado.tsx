'use client';

import { Fragment, useState } from 'react';
import { AlertTriangle, ArrowRight, CalendarDays, Check, Download, Flag, Info, RefreshCw, ShieldCheck } from 'lucide-react';
import { scoringService, type BandaNivel, type DecisionAnalista, type ResultadoScoring } from '../services/scoringService';
import { esBolsaAgotada, mensajeDe } from '@/modules/licencias/lib/errores';
import { Aviso, Boton } from '@/shared/ui/kit';
import { BarraBandas } from './BarraBandas';
import { NIVEL, decisionTexto, fechaCortaDe, fechaLargaDe, tonoPuntaje } from '../lib/formato';

interface Props {
  resultado: ResultadoScoring;
  bandas: BandaNivel[];
  onResultado: (r: ResultadoScoring) => void;
  onOtro: () => void;
}

const dos = (n: number) => n.toFixed(2);
const iniciales = (nombre: string) => nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '·';

function Tarjeta({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card aparece flex flex-col p-6 ${className}`}>{children}</section>;
}

function Titulo({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[17px] font-semibold leading-[25px] tracking-[-0.01em] text-ink">{children}</h2>;
}

function CajaIcono({ children }: { children: React.ReactNode }) {
  return <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent" aria-hidden="true">{children}</span>;
}

export function PasoResultado({ resultado, bandas, onResultado, onOtro }: Props) {
  const [comentario, setComentario] = useState('');
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [decidiendo, setDecidiendo] = useState<DecisionAnalista['accion'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);
  const nivel = NIVEL[resultado.nivel];
  const esAlto = resultado.nivel === 'ALTO';
  const q = resultado.queHacer;
  const c = resultado.cliente;
  const escalaMaxima = bandas.length > 0 ? bandas[bandas.length - 1].hasta : null;

  const decidir = async (accion: DecisionAnalista['accion']) => {
    setDecidiendo(accion);
    setError(null);
    try {
      onResultado(await scoringService.decidir(resultado.id, accion, comentario.trim()));
    } catch (err: unknown) {
      setError(mensajeDe(err, 'No se pudo registrar la decisión.'));
    } finally {
      setDecidiendo(null);
    }
  };

  const descargar = async () => {
    setDescargando(true);
    setError(null);
    try {
      const blob = await scoringService.descargarPdf(resultado.id);
      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.setAttribute('download', `scoring-${c.documento}-${resultado.id}.pdf`);
      document.body.appendChild(enlace);
      enlace.click();
      enlace.parentNode?.removeChild(enlace);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(esBolsaAgotada(err) ? null : mensajeDe(err, 'No se pudo generar el PDF. Inténtalo de nuevo en un momento.'));
    } finally {
      setDescargando(false);
    }
  };

  const alternar = (texto: string) =>
    setMarcados((m) => {
      const n = new Set(m);
      if (n.has(texto)) n.delete(texto); else n.add(texto);
      return n;
    });

  // Con nivel Alto la decisión final no es del analista: envía a aprobación; con Bajo o Medio, aprueba él.
  const accionPrincipal: DecisionAnalista['accion'] = esAlto ? 'ENVIAR_A_APROBACION' : 'APROBAR';
  const sinComentario = esAlto && comentario.trim() === '';

  return (
    <div className="space-y-6">
      {error && <Aviso aviso={{ tipo: 'error', texto: error }} onCerrar={() => setError(null)} />}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_23.75rem]">
        <div className="space-y-5">
          <Tarjeta className="gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent" aria-hidden="true">{iniciales(c.nombre)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold leading-[25px] tracking-[-0.01em] text-ink">{c.nombre}</p>
                <p className="rotulo">{c.tipoDocumento} {c.documento} · {c.ocupacion} · {c.departamento}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`badge ${nivel.badge}`}>{esAlto && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}{nivel.etiqueta}</span>
                <p className="flex items-end gap-2">
                  <span className="text-[40px] font-semibold leading-[42px] tracking-[-0.015em] tabular-nums text-ink">{dos(resultado.puntaje)}</span>
                  {escalaMaxima != null && <span className="rotulo">de {escalaMaxima}</span>}
                </p>
              </div>
            </div>

            <BarraBandas puntaje={resultado.puntaje} bandas={bandas} />

            {resultado.fijadoPorRegla && resultado.avisoRegla ? (
              <div role="status" className="flex gap-3 rounded-[14px] bg-bad-soft p-4">
                <Flag className="mt-0.5 h-5 w-5 shrink-0 text-bad" aria-hidden="true" />
                <div>
                  <p className="text-[15px] font-medium leading-[22px] text-bad">{resultado.avisoRegla.titulo}</p>
                  <p className="mt-0.5 text-sm leading-[22px] text-ink">{resultado.avisoRegla.detalle}</p>
                </div>
              </div>
            ) : (
              <div role="status" className="flex gap-3 rounded-[14px] bg-accent-soft p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-[15px] font-medium leading-[22px] text-accent">Nivel calculado por promedio</p>
                  <p className="mt-0.5 text-sm leading-[22px] text-ink">No se activó ninguna regla de nivel mínimo. El resultado sale solo del promedio ponderado.</p>
                </div>
              </div>
            )}
          </Tarjeta>

          <Tarjeta className="gap-1">
            <div className="pb-2"><Titulo>Por qué salió {dos(resultado.puntaje)}</Titulo></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line">
                    <th scope="col" className="rotulo w-[200px] pb-1.5 pr-3 font-normal">Factor</th>
                    <th scope="col" className="rotulo pb-1.5 pr-3 font-normal">Dato</th>
                    <th scope="col" className="rotulo w-[70px] pb-1.5 text-center font-normal">Puntaje</th>
                    <th scope="col" className="rotulo w-[60px] pb-1.5 text-right font-normal">Peso</th>
                    <th scope="col" className="rotulo w-[60px] pb-1.5 text-right font-normal">Aporte</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.grupos.map((g) => (
                    <Fragment key={g.codigo}>
                      <tr>
                        <td colSpan={5} className="pb-1 pt-3.5">
                          <span className="eyebrow mr-2.5">{g.nombre}</span>
                          <span className="badge badge-neutral">{g.peso} % del puntaje</span>
                        </td>
                      </tr>
                      {g.factores.map((f) => (
                        <tr key={f.codigo}>
                          <td className="py-[9px] pr-3 text-[15px] font-medium leading-[22px] text-ink">{f.nombre}</td>
                          <td className="py-[9px] pr-3 text-sm leading-[22px] text-muted">{f.dato}{f.automatico ? ' · automático' : ''}</td>
                          <td className="py-[9px] text-center">
                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${tonoPuntaje(f.puntaje)}`}>{f.puntaje}</span>
                          </td>
                          <td className="rotulo py-[9px] text-right">{f.peso} %</td>
                          <td className="py-[9px] text-right text-sm font-semibold tabular-nums text-ink">{dos(f.aporte)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                  <tr className="border-t border-line">
                    <td colSpan={4} className="pt-4 text-[15px] font-medium text-ink">Puntaje total</td>
                    <td className="pt-4 text-right text-[28px] font-semibold leading-[31px] tracking-[-0.015em] tabular-nums text-ink">{dos(resultado.puntaje)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Tarjeta>

          <div className="flex flex-wrap gap-3">
            <Boton variante="secundario" icono={RefreshCw} onClick={onOtro}>Evaluar otro cliente</Boton>
            <Boton variante="secundario" icono={Download} cargando={descargando} onClick={descargar}>Descargar PDF</Boton>
          </div>
        </div>

        <aside className="space-y-4">
          <Tarjeta className="gap-3.5">
            <Titulo>Qué hacer ahora</Titulo>
            <div className="flex items-center gap-2.5">
              <CajaIcono><ShieldCheck className="h-4 w-4" /></CajaIcono>
              <div><p className="rotulo">Debida diligencia</p><p className="text-[15px] font-medium leading-[22px] text-ink">{q.debidaDiligencia}</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <CajaIcono><ShieldCheck className="h-4 w-4" /></CajaIcono>
              <div><p className="rotulo">{esAlto ? 'Decide la aceptación' : 'Aprueba'}</p><p className="text-[15px] font-medium leading-[22px] text-ink">{q.decide}</p></div>
            </div>
            <div className="flex items-center gap-2.5">
              <CajaIcono><CalendarDays className="h-4 w-4" /></CajaIcono>
              <div>
                <p className="rotulo">Próxima revisión</p>
                <p className="text-[15px] font-medium leading-[22px] text-ink">En {q.revisionMeses} meses{q.proximaRevision ? ` · ${fechaLargaDe(q.proximaRevision)}` : ''}</p>
              </div>
            </div>
            {q.reunir.length > 0 && (
              <>
                <div className="h-px bg-line" />
                <p className="eyebrow">{esAlto ? 'Antes de aprobar, reunir' : 'Antes de aprobar, revisar'}</p>
                <ul className="space-y-3.5">
                  {q.reunir.map((texto) => (
                    <li key={texto}>
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm leading-[22px] text-ink">
                        <input type="checkbox" className="peer sr-only" checked={marcados.has(texto)} onChange={() => alternar(texto)} />
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-line bg-white text-paper peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100" aria-hidden="true">
                          <Check className="h-3 w-3" />
                        </span>
                        <span className="min-w-0 flex-1">{texto}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Tarjeta>

          <Tarjeta className="gap-3">
            <div className="flex items-center gap-2.5">
              <Titulo>Reglas activadas</Titulo>
              <span className={`badge ${resultado.reglas.length > 0 ? 'badge-bad' : 'badge-neutral'}`}>{resultado.reglas.length}</span>
            </div>
            {resultado.reglas.length === 0 ? (
              <p className="flex gap-2.5 text-sm leading-[22px] text-muted"><Flag className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />Ninguna regla de nivel mínimo se activó con estos datos.</p>
            ) : (
              resultado.reglas.map((r) => (
                <div key={r.codigo} className="flex gap-2.5">
                  <Flag className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-hidden="true" />
                  <div><p className="text-[15px] font-medium leading-[22px] text-ink">{r.titulo}</p><p className="text-[13px] leading-[22px] text-muted">{r.detalle}</p></div>
                </div>
              ))
            )}
          </Tarjeta>

          <Tarjeta className="gap-3">
            <Titulo>Decisión del analista</Titulo>
            {resultado.decision ? (
              <div className="space-y-2 text-sm">
                <span className={`badge ${resultado.decision.accion === 'RECHAZAR' ? 'badge-bad' : 'badge-ok'}`}>{decisionTexto(resultado.decision)}</span>
                {resultado.decision.comentario && <p className="leading-[22px] text-ink">{resultado.decision.comentario}</p>}
                <p className="rotulo">{resultado.decision.por} · {fechaCortaDe(resultado.decision.fecha)}</p>
              </div>
            ) : (
              <>
                <label htmlFor="sc-comentario" className="sr-only">Comentario del analista</label>
                <textarea
                  id="sc-comentario"
                  className="h-[84px] w-full resize-none rounded-[10px] border border-line bg-paper p-3.5 text-sm leading-[22px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
                  placeholder={esAlto ? 'Comentario obligatorio para riesgo Alto…' : 'Comentario opcional…'}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
                <div className="flex flex-wrap gap-2.5">
                  <Boton variante="secundario" cargando={decidiendo === 'RECHAZAR'} disabled={decidiendo !== null || sinComentario} onClick={() => decidir('RECHAZAR')}>Rechazar</Boton>
                  <Boton cargando={decidiendo === accionPrincipal} disabled={decidiendo !== null || sinComentario} onClick={() => decidir(accionPrincipal)}>
                    {esAlto ? 'Enviar a aprobación' : 'Aprobar'}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Boton>
                </div>
                <p className="rotulo">Queda registrado quién decidió y cuándo.</p>
              </>
            )}
          </Tarjeta>
        </aside>
      </div>
    </div>
  );
}
