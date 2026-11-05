'use client';

import { Fragment, useState } from 'react';
import { ArrowRight, CalendarDays, Download, Flag, RotateCcw, ShieldCheck } from 'lucide-react';
import { scoringService, type ResultadoScoring } from '../services/scoringService';
import { esBolsaAgotada, mensajeDe } from '@/modules/licencias/lib/errores';
import { Panel } from '@/shared/ui/PageShell';
import { Avatar, Aviso, Boton } from '@/shared/ui/kit';
import { BarraBandas } from './BarraBandas';
import { NIVEL, decisionTexto, fechaCortaDe, fechaLargaDe, tonoPuntaje } from '../lib/formato';

interface Props {
  resultado: ResultadoScoring;
  onResultado: (r: ResultadoScoring) => void;
  onOtro: () => void;
}

const ACTUALIZADO = (n: number) => n.toFixed(2);

export function PasoResultado({ resultado, onResultado, onOtro }: Props) {
  const [comentario, setComentario] = useState('');
  const [decidiendo, setDecidiendo] = useState<'RECHAZAR' | 'ENVIAR_A_APROBACION' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);
  const nivel = NIVEL[resultado.nivel];
  const esAlto = resultado.nivel === 'ALTO';
  const q = resultado.queHacer;
  const c = resultado.cliente;

  const decidir = async (accion: 'RECHAZAR' | 'ENVIAR_A_APROBACION') => {
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

  const sinComentario = esAlto && comentario.trim() === '';

  return (
    <div className="space-y-6">
      {error && <Aviso aviso={{ tipo: 'error', texto: error }} onCerrar={() => setError(null)} />}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-6">
          <Panel className="aparece" relleno>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar nombre={c.nombre} tamano="lg" />
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink">{c.nombre}</p>
                  <p className="rotulo mt-0.5">{c.tipoDocumento} {c.documento} · {c.ocupacion} · {c.departamento}</p>
                </div>
              </div>
              <div className="text-right">
                <span className={`badge ${nivel.badge}`}>{nivel.etiqueta}</span>
                <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-ink">
                  {ACTUALIZADO(resultado.puntaje)} <span className="rotulo align-baseline">de 4</span>
                </p>
              </div>
            </div>

            <BarraBandas puntaje={resultado.puntaje} />

            {resultado.fijadoPorRegla && resultado.avisoRegla && (
              <div role="status" className="mt-6 flex gap-3 rounded-2xl bg-bad-soft p-4 text-bad">
                <Flag className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">{resultado.avisoRegla.titulo}</p>
                  <p className="mt-0.5 text-sm text-ink">{resultado.avisoRegla.detalle}</p>
                </div>
              </div>
            )}
          </Panel>

          <Panel className="aparece" titulo={`Por qué salió ${ACTUALIZADO(resultado.puntaje)}`}>
            <div className="overflow-x-auto">
              <table className="tabla min-w-[34rem]">
                <thead>
                  <tr>
                    <th scope="col">Factor</th>
                    <th scope="col">Dato</th>
                    <th scope="col" className="text-center">Puntaje</th>
                    <th scope="col" className="num">Peso</th>
                    <th scope="col" className="num">Aporte</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.grupos.map((g) => (
                    <Fragment key={g.codigo}>
                      <tr className="bg-paper/60 hover:bg-paper/60">
                        <td colSpan={5} className="!py-2.5">
                          <span className="rotulo mr-2">{g.nombre}</span>
                          <span className="badge badge-neutral">{g.peso} % del puntaje</span>
                        </td>
                      </tr>
                      {g.factores.map((f) => (
                        <tr key={f.codigo}>
                          <td className="font-medium">{f.nombre}</td>
                          <td className="text-muted">{f.dato}{f.automatico ? ' · automático' : ''}</td>
                          <td className="text-center">
                            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium tabular-nums ${tonoPuntaje(f.puntaje)}`}>{f.puntaje}</span>
                          </td>
                          <td className="num font-mono text-xs text-muted">{f.peso} %</td>
                          <td className="num font-medium">{ACTUALIZADO(f.aporte)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                  <tr>
                    <td colSpan={4} className="font-medium">Puntaje total</td>
                    <td className="num text-lg font-semibold">{ACTUALIZADO(resultado.puntaje)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Panel>

          <div className="flex flex-wrap gap-3">
            <Boton variante="secundario" icono={RotateCcw} onClick={onOtro}>Evaluar otro cliente</Boton>
            <Boton variante="secundario" icono={Download} cargando={descargando} onClick={descargar}>Descargar PDF</Boton>
          </div>
        </div>

        <aside className="space-y-4">
          <Panel className="aparece" titulo="Qué hacer ahora" relleno>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-ink" aria-hidden="true" />
                <div><p className="rotulo">Debida diligencia</p><p className="text-sm font-medium text-ink">{q.debidaDiligencia}</p></div>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-ink" aria-hidden="true" />
                <div><p className="rotulo">Decide la aceptación</p><p className="text-sm font-medium text-ink">{q.decide}</p></div>
              </li>
              <li className="flex gap-3">
                <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-ink" aria-hidden="true" />
                <div>
                  <p className="rotulo">Próxima revisión</p>
                  <p className="text-sm font-medium text-ink">En {q.revisionMeses} meses{q.proximaRevision ? ` · ${fechaLargaDe(q.proximaRevision)}` : ''}</p>
                </div>
              </li>
            </ul>
            {q.reunir.length > 0 && (
              <div className="mt-4 border-t border-line pt-4">
                <p className="rotulo mb-3">Antes de aprobar, reunir</p>
                <ul className="space-y-2.5">
                  {q.reunir.map((texto, i) => (
                    <li key={texto}>
                      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
                        <input type="checkbox" id={`sc-reunir-${i}`} className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-[var(--brand)]" />
                        <span>{texto}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>

          <Panel className="aparece" titulo={<span className="flex items-center gap-2">Reglas activadas <span className="badge badge-bad">{resultado.reglas.length}</span></span>} relleno>
            {resultado.reglas.length === 0 ? (
              <p className="text-sm text-muted">Ninguna regla fijó el nivel: sale del promedio.</p>
            ) : (
              <ul className="space-y-3">
                {resultado.reglas.map((r) => (
                  <li key={r.codigo} className="flex gap-3">
                    <Flag className="mt-0.5 h-4 w-4 shrink-0 text-bad" aria-hidden="true" />
                    <div><p className="text-sm font-medium text-ink">{r.titulo}</p><p className="text-xs text-muted">{r.detalle}</p></div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel className="aparece" titulo="Decisión del analista" relleno>
            {resultado.decision ? (
              <div className="space-y-2 text-sm">
                <span className={`badge ${resultado.decision.accion === 'RECHAZAR' ? 'badge-bad' : 'badge-ok'}`}>{decisionTexto(resultado.decision)}</span>
                {resultado.decision.comentario && <p className="text-ink">{resultado.decision.comentario}</p>}
                <p className="rotulo">{resultado.decision.por} · {fechaCortaDe(resultado.decision.fecha)}</p>
              </div>
            ) : (
              <>
                <label htmlFor="sc-comentario" className="sr-only">Comentario del analista</label>
                <textarea
                  id="sc-comentario"
                  rows={3}
                  className="input h-auto resize-none py-3"
                  placeholder={esAlto ? 'Comentario obligatorio para riesgo Alto…' : 'Comentario (opcional)…'}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Boton variante="secundario" cargando={decidiendo === 'RECHAZAR'} disabled={decidiendo !== null || sinComentario} onClick={() => decidir('RECHAZAR')}>Rechazar</Boton>
                  <Boton cargando={decidiendo === 'ENVIAR_A_APROBACION'} disabled={decidiendo !== null || sinComentario} onClick={() => decidir('ENVIAR_A_APROBACION')}>
                    Enviar a aprobación<ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Boton>
                </div>
                <p className="rotulo mt-3">Queda registrado quién decidió y cuándo.</p>
              </>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
