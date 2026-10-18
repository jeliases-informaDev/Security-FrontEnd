'use client';

import { useEffect, useState } from 'react';
import { Gauge, IdCard, Landmark, MapPin, RotateCcw, Search, User } from 'lucide-react';
import { listasNegativasService, ResultadoBusquedaResponse } from '@/modules/listas_negativas/services/listasNegativasService';
import { scoringService, CatalogosScoring, ScoringResult } from '@/modules/scoring/services/scoringService';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';
import { Avatar, Aviso, Boton, Esqueleto, EstadoVacio } from '@/shared/ui/kit';

// Tono de cada categoría de riesgo (texto, fondo y color del medidor).
const CATEGORIA: Record<string, { badge: string; barra: string }> = {
  'Riesgo Muy Bajo': { badge: 'badge-ok', barra: 'bg-ok' },
  'Riesgo Bajo': { badge: 'badge-ok', barra: 'bg-ok' },
  'Riesgo Medio': { badge: 'badge-warn', barra: 'bg-warn' },
  'Riesgo Alto': { badge: 'badge-bad', barra: 'bg-bad' },
  'Riesgo Muy Alto': { badge: 'badge-bad', barra: 'bg-bad' },
};

/** Campo con icono a la izquierda (texto o selector). */
function CampoIcono({ icono: Icono, children }: { icono: typeof Search; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icono className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
      {children}
    </div>
  );
}

const PASOS = ['Cliente', 'Datos', 'Resultado'] as const;

export function EvaluarScoring() {
  const [catalogos, setCatalogos] = useState<CatalogosScoring | null>(null);

  const [documentoBusqueda, setDocumentoBusqueda] = useState('');
  const [candidatos, setCandidatos] = useState<ResultadoBusquedaResponse[] | null>(null);
  const [buscando, setBuscando] = useState(false);

  const [entidadSeleccionada, setEntidadSeleccionada] = useState<ResultadoBusquedaResponse | null>(null);
  const [idOcupacion, setIdOcupacion] = useState('');
  const [idDepartamento, setIdDepartamento] = useState('');
  const [volumenTransaccional, setVolumenTransaccional] = useState('');

  const [resultado, setResultado] = useState<ScoringResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [evaluando, setEvaluando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    scoringService
      .obtenerCatalogos()
      .then((data) => { if (!cancelado) setCatalogos(data); })
      .catch(() => { if (!cancelado) setError('No se pudieron cargar los catálogos de scoring.'); });
    return () => { cancelado = true; };
  }, []);

  const buscarEntidad = async () => {
    if (!documentoBusqueda.trim()) return;
    setBuscando(true);
    setError(null);
    try {
      const data = await listasNegativasService.buscar({ documento: documentoBusqueda.trim() });
      setCandidatos(data);
    } catch {
      setError('No se pudo completar la búsqueda.');
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarEntidad = (persona: ResultadoBusquedaResponse) => {
    setEntidadSeleccionada(persona);
    setCandidatos(null);
    setResultado(null);
  };

  const evaluar = async () => {
    if (!entidadSeleccionada || !idOcupacion || !idDepartamento || !volumenTransaccional) return;
    setEvaluando(true);
    setError(null);
    try {
      const data = await scoringService.evaluar({
        entidadId: entidadSeleccionada.entidadId,
        idOcupacion: Number(idOcupacion),
        idDepartamento: Number(idDepartamento),
        volumenTransaccional: Number(volumenTransaccional),
      });
      setResultado(data);
    } catch (err: unknown) {
      const mensaje = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'No se pudo completar la evaluación.';
      setError(mensaje);
    } finally {
      setEvaluando(false);
    }
  };

  const reiniciar = () => {
    setEntidadSeleccionada(null);
    setResultado(null);
    setIdOcupacion('');
    setIdDepartamento('');
    setVolumenTransaccional('');
    setDocumentoBusqueda('');
    setCandidatos(null);
  };

  const paso = resultado ? 2 : entidadSeleccionada ? 1 : 0;
  const tono = resultado ? CATEGORIA[resultado.categoria] ?? { badge: 'badge-neutral', barra: 'bg-faint' } : null;
  const pesoTotal = resultado ? resultado.factores.reduce((suma, f) => suma + Number(f.peso || 0), 0) : 0;

  return (
    <PageShell>
      <PageHeader
        antetitulo="Debida diligencia"
        icono={Gauge}
        titulo="Scoring de Riesgo"
        descripcion="Evaluación de riesgo LA/FT por ocupación, zona geográfica y volumen transaccional."
        acciones={entidadSeleccionada ? <Boton variante="secundario" icono={RotateCcw} onClick={reiniciar}>Evaluar otro cliente</Boton> : null}
      />

      <div className="max-w-3xl space-y-6">
        {/* Pasos */}
        <ol className="flex items-center gap-2 text-sm" aria-label="Pasos de la evaluación">
          {PASOS.map((nombre, i) => (
            <li key={nombre} className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${i < paso ? 'bg-brand text-white' : i === paso ? 'bg-brand-soft text-brand-ink ring-2 ring-brand/30' : 'bg-surface-2 text-muted'}`} aria-current={i === paso ? 'step' : undefined}>{i + 1}</span>
              <span className={i === paso ? 'font-medium text-ink' : 'text-muted'}>{nombre}</span>
              {i < PASOS.length - 1 && <span className="mx-1 h-px w-8 bg-line" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        {error && <Aviso aviso={{ tipo: 'error', texto: error }} onCerrar={() => setError(null)} />}

        {!entidadSeleccionada && (
          <Panel className="aparece" titulo="1. Elige al cliente" descripcion="Busca por documento entre las entidades ya registradas." relleno>
            <label htmlFor="sc-doc" className="label">Documento del cliente</label>
            <div className="flex gap-3">
              <CampoIcono icono={IdCard}>
                <input
                  id="sc-doc"
                  type="text"
                  className="input pl-10 font-mono"
                  placeholder="DNI, RUC o pasaporte"
                  autoComplete="off"
                  spellCheck={false}
                  value={documentoBusqueda}
                  onChange={(e) => setDocumentoBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarEntidad()}
                />
              </CampoIcono>
              <Boton icono={Search} cargando={buscando} onClick={buscarEntidad} className="shrink-0">{buscando ? 'Buscando…' : 'Buscar'}</Boton>
            </div>
            <p className="hint mt-2">Si el cliente es nuevo, búscalo primero en Listas Negativas: aquí solo se evalúan entidades ya registradas.</p>

            {candidatos !== null && (
              <div className="mt-5 space-y-2" aria-live="polite">
                {candidatos.length === 0 ? (
                  <EstadoVacio icono={Search} titulo="No se encontró ninguna entidad con ese documento" className="py-6" />
                ) : (
                  candidatos.map((c) => (
                    <button key={c.entidadId} onClick={() => seleccionarEntidad(c)} className="card card-hover flex w-full items-center gap-3 p-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">
                      <Avatar nombre={c.nombreCompleto} tamano="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{c.nombreCompleto}</p>
                        <p className="text-xs text-muted">{c.tipoDocumento}: <span className="font-mono">{c.documento}</span></p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </Panel>
        )}

        {entidadSeleccionada && !resultado && (
          <Panel className="aparece" titulo="2. Datos de la evaluación" relleno acciones={<button type="button" onClick={() => setEntidadSeleccionada(null)} className="btn btn-ghost btn-sm">Cambiar cliente</button>}>
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-surface-2/70 p-3">
              <Avatar nombre={entidadSeleccionada.nombreCompleto} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{entidadSeleccionada.nombreCompleto}</p>
                <p className="text-xs text-muted">{entidadSeleccionada.tipoDocumento}: <span className="font-mono">{entidadSeleccionada.documento}</span></p>
              </div>
            </div>

            {!catalogos ? (
              <Esqueleto lineas={4} />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="sc-ocupacion" className="label">Ocupación / profesión</label>
                  <CampoIcono icono={User}>
                    <select id="sc-ocupacion" className="input pl-10" value={idOcupacion} onChange={(e) => setIdOcupacion(e.target.value)}>
                      <option value="">Selecciona…</option>
                      {catalogos.ocupaciones.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                    </select>
                  </CampoIcono>
                </div>
                <div>
                  <label htmlFor="sc-departamento" className="label">Departamento (residencia)</label>
                  <CampoIcono icono={MapPin}>
                    <select id="sc-departamento" className="input pl-10" value={idDepartamento} onChange={(e) => setIdDepartamento(e.target.value)}>
                      <option value="">Selecciona…</option>
                      {catalogos.departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                  </CampoIcono>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="sc-volumen" className="label">Volumen transaccional mensual estimado (S/)</label>
                  <CampoIcono icono={Landmark}>
                    <input id="sc-volumen" type="number" min="0" inputMode="decimal" className="input pl-10 tabular-nums" placeholder="Ej. 15000" value={volumenTransaccional} onChange={(e) => setVolumenTransaccional(e.target.value)} />
                  </CampoIcono>
                </div>
              </div>
            )}

            <Boton className="mt-6 w-full" tamano="lg" cargando={evaluando} disabled={!catalogos || !idOcupacion || !idDepartamento || !volumenTransaccional} onClick={evaluar}>
              {evaluando ? 'Evaluando…' : 'Evaluar riesgo'}
            </Boton>
          </Panel>
        )}

        {resultado && tono && (
          <Panel className="aparece">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <Avatar nombre={resultado.nombreCompleto} />
                <div>
                  <p className="text-base font-semibold text-ink">{resultado.nombreCompleto}</p>
                  <p className="text-xs text-muted"><span className="font-mono">{resultado.documento}</span></p>
                </div>
              </div>
              <div className="text-right">
                <span className={`badge ${tono.badge} text-sm`}>{resultado.categoria}</span>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-ink">{resultado.puntajeTotal.toFixed(2)}</p>
                <p className="text-xs text-muted">puntaje total</p>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <p className="eyebrow mb-3">Factores evaluados</p>
              <ul className="space-y-3">
                {resultado.factores.map((f, i) => {
                  const parte = pesoTotal > 0 ? Math.max(0, Math.min(100, (Number(f.peso || 0) / pesoTotal) * 100)) : 0;
                  return (
                    <li key={i} className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{f.nombre}</p>
                        <p className="text-xs text-muted">{f.valor} · peso {f.peso}%</p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
                          <div className={`h-full rounded-full ${tono.barra}`} style={{ width: `${parte}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-ink sm:pl-6">{f.puntaje}</span>
                    </li>
                  );
                })}
              </ul>
              <Boton variante="secundario" icono={RotateCcw} onClick={reiniciar} className="mt-6 w-full">Evaluar otro cliente</Boton>
            </div>
          </Panel>
        )}
      </div>
    </PageShell>
  );
}
