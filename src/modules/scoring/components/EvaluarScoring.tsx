'use client';

import { useEffect, useState } from 'react';
import { Search, ShieldQuestion, User, MapPin, IdCard, Landmark } from 'lucide-react';
import {
  listasNegativasService,
  ResultadoBusquedaResponse,
} from '@/modules/listas_negativas/services/listasNegativasService';
import { scoringService, CatalogosScoring, ScoringResult } from '@/modules/scoring/services/scoringService';

const CATEGORIA_STYLES: Record<string, string> = {
  'Riesgo Muy Bajo': 'bg-green-50 text-green-700 border-green-200',
  'Riesgo Bajo': 'bg-green-50 text-green-700 border-green-200',
  'Riesgo Medio': 'bg-amber-50 text-amber-700 border-amber-200',
  'Riesgo Alto': 'bg-red-50 text-red-700 border-red-200',
  'Riesgo Muy Alto': 'bg-red-50 text-red-700 border-red-200',
};

const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 transition';

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

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
      .then((data) => {
        if (!cancelado) setCatalogos(data);
      })
      .catch(() => {
        if (!cancelado) setError('No se pudieron cargar los catálogos de scoring.');
      });
    return () => {
      cancelado = true;
    };
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
      const mensaje =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo completar la evaluación.';
      setError(mensaje);
    } finally {
      setEvaluando(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-ink tracking-tight">Scoring de Riesgo</h1>
        <p className="text-brand-muted text-sm mt-1">
          Evaluación de riesgo LA/FT por ocupación, zona geográfica y volumen transaccional.
        </p>
      </div>

      {!entidadSeleccionada && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
          <label className="block text-xs font-medium text-brand-muted mb-1.5">
            Buscar cliente por documento
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 transition"
                placeholder="DNI / RUC / Pasaporte"
                value={documentoBusqueda}
                onChange={(e) => setDocumentoBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarEntidad()}
              />
            </div>
            <button
              onClick={buscarEntidad}
              disabled={buscando}
              className="px-5 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy-2 transition disabled:opacity-60 shrink-0"
            >
              {buscando ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
          <p className="text-xs text-brand-muted mt-2">
            Busca primero en Listas Negativas si el cliente es nuevo — acá solo se evalúan entidades ya
            registradas.
          </p>

          {candidatos !== null && (
            <div className="mt-4 space-y-2">
              {candidatos.length === 0 ? (
                <p className="text-sm text-brand-muted">No se encontró ninguna entidad con ese documento.</p>
              ) : (
                candidatos.map((c) => (
                  <button
                    key={c.entidadId}
                    onClick={() => seleccionarEntidad(c)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-left"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-navy text-white text-xs font-semibold flex items-center justify-center shrink-0">
                      {iniciales(c.nombreCompleto) || '·'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-brand-ink">{c.nombreCompleto}</p>
                      <p className="text-xs text-brand-muted">
                        {c.tipoDocumento}: {c.documento}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {entidadSeleccionada && !resultado && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-navy text-white text-sm font-semibold flex items-center justify-center shrink-0">
                {iniciales(entidadSeleccionada.nombreCompleto) || '·'}
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-ink">{entidadSeleccionada.nombreCompleto}</p>
                <p className="text-xs text-brand-muted">
                  {entidadSeleccionada.tipoDocumento}: {entidadSeleccionada.documento}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEntidadSeleccionada(null)}
              className="text-xs text-brand-navy hover:underline"
            >
              Cambiar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">
                Ocupación / Profesión
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <select
                  className={`${inputClass} pl-10 appearance-none`}
                  value={idOcupacion}
                  onChange={(e) => setIdOcupacion(e.target.value)}
                >
                  <option value="">Selecciona…</option>
                  {catalogos?.ocupaciones.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-muted mb-1.5">
                Departamento (residencia)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <select
                  className={`${inputClass} pl-10 appearance-none`}
                  value={idDepartamento}
                  onChange={(e) => setIdDepartamento(e.target.value)}
                >
                  <option value="">Selecciona…</option>
                  {catalogos?.departamentos.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-brand-muted mb-1.5">
                Volumen transaccional mensual estimado (S/.)
              </label>
              <div className="relative">
                <Landmark className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="number"
                  min="0"
                  className={`${inputClass} pl-10`}
                  placeholder="Ej. 15000"
                  value={volumenTransaccional}
                  onChange={(e) => setVolumenTransaccional(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={evaluar}
            disabled={evaluando || !idOcupacion || !idDepartamento || !volumenTransaccional}
            className="mt-5 w-full px-6 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy-2 transition disabled:opacity-50"
          >
            {evaluando ? 'Evaluando…' : 'Evaluar riesgo'}
          </button>
        </div>
      )}

      {resultado && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-ink">{resultado.nombreCompleto}</p>
              <p className="text-xs text-brand-muted">{resultado.documento}</p>
            </div>
            <span
              className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${
                CATEGORIA_STYLES[resultado.categoria] ?? 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {resultado.categoria} · {resultado.puntajeTotal.toFixed(2)}
            </span>
          </div>

          <div className="space-y-2 mb-5">
            {resultado.factores.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm border-b border-slate-100 pb-2 last:border-0"
              >
                <div>
                  <p className="text-brand-ink font-medium">{f.nombre}</p>
                  <p className="text-xs text-brand-muted">
                    {f.valor} · peso {f.peso}%
                  </p>
                </div>
                <span className="text-brand-ink font-semibold">{f.puntaje}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setEntidadSeleccionada(null);
              setResultado(null);
              setIdOcupacion('');
              setIdDepartamento('');
              setVolumenTransaccional('');
              setDocumentoBusqueda('');
            }}
            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-brand-navy text-sm font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 transition"
          >
            <ShieldQuestion className="w-4 h-4" />
            Evaluar otro cliente
          </button>
        </div>
      )}

      {!entidadSeleccionada && !catalogos && !error && (
        <div className="text-center text-sm text-brand-muted flex items-center justify-center gap-2 mt-4">
          <Search className="w-4 h-4" />
          Cargando catálogos…
        </div>
      )}
    </main>
  );
}
