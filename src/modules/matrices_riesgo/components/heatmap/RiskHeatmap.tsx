'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { matrizRiesgoService } from '../../services/matrizRiesgo.service';

import type {
  HeatmapMatrizResponse,
  HeatmapSeleccion,
  NivelImpacto,
  NivelProbabilidad,
  NivelRiesgo,
} from '../../types/matrizRiesgo.types';

interface RiskHeatmapProps {
  seleccion?: HeatmapSeleccion | null;
}

const RIESGO_ESTILOS: Record<
  NivelRiesgo,
  {
    fondo: string;
    texto: string;
    etiqueta: string;
  }
> = {
  MINIMO: {
    fondo: '#00B0F0',
    texto: '#111111',
    etiqueta: 'Mínimo',
  },

  LEVE: {
    fondo: '#92D050',
    texto: '#111111',
    etiqueta: 'Leve',
  },

  MODERADO: {
    fondo: '#FFFF00',
    texto: '#111111',
    etiqueta: 'Moderado',
  },

  ALTO: {
    fondo: '#E26B0A',
    texto: '#111111',
    etiqueta: 'Alto',
  },

  MUY_ALTO: {
    fondo: '#FF0000',
    texto: '#111111',
    etiqueta: 'Muy alto',
  },
};

function formatearTexto(valor: string) {
  return valor
    .toLowerCase()
    .split('_')
    .map(
      (parte) =>
        parte.charAt(0).toUpperCase() +
        parte.slice(1)
    )
    .join(' ');
}

function coincidePosicion(
  probabilidad: NivelProbabilidad,
  impacto: NivelImpacto,
  posicion?: {
    probabilidad: NivelProbabilidad;
    impacto: NivelImpacto;
  } | null
) {
  if (!posicion) {
    return false;
  }

  return (
    posicion.probabilidad === probabilidad &&
    posicion.impacto === impacto
  );
}

export function RiskHeatmap({
  seleccion,
}: RiskHeatmapProps) {
  const [heatmap, setHeatmap] =
    useState<HeatmapMatrizResponse | null>(null);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  async function cargarHeatmap() {
    try {
      setCargando(true);
      setError(null);

      const data =
        await matrizRiesgoService.obtenerHeatmap();

      setHeatmap(data);
    } catch (err) {
      console.error(
        'Error cargando heatmap:',
        err
      );

      setError(
        'No se pudo cargar la matriz de probabilidad e impacto.'
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargarHeatmap();
  }, []);

  function obtenerCelda(
    probabilidad: NivelProbabilidad,
    impacto: NivelImpacto
  ) {
    return heatmap?.celdas.find(
      (celda) =>
        celda.probabilidad === probabilidad &&
        celda.impacto === impacto
    );
  }

  if (cargando) {
    return (
      <div className="flex min-h-[420px] items-center justify-center border border-slate-200 bg-white">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />

          <span className="text-sm">
            Cargando matriz de riesgos...
          </span>
        </div>
      </div>
    );
  }

  if (error || !heatmap) {
    return (
      <div className="border border-red-200 bg-red-50 p-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />

          <div>
            <p className="font-semibold text-red-900">
              No se pudo cargar el heatmap
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void cargarHeatmap()
              }
              className="mt-4 inline-flex items-center gap-2 border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const probabilidades = [
    ...heatmap.probabilidades,
  ].sort(
    (a, b) =>
      b.nivel - a.nivel
  );

  const impactos = [
    ...heatmap.impactos,
  ].sort(
    (a, b) =>
      a.nivel - b.nivel
  );

  return (
    <section className="mx-auto w-full max-w-[1280px] bg-white px-5 py-6 lg:px-8">

      {/* =====================================================
          HEADER
         ===================================================== */}

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B4589]">
          Mapa de exposición
        </p>

        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#231F20]">
          Matriz de probabilidad e impacto
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Identifica la posición del riesgo según
          su probabilidad e impacto.
        </p>
      </div>

      {/* =====================================================
          RESULTADOS
         ===================================================== */}

      {(seleccion?.inherente ||
        seleccion?.residual) && (
        <div className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-[#E8ECF3] py-4">

          {seleccion?.inherente && (
            <div className="flex items-center gap-3">

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B4589] text-xs font-bold text-white">
                I
              </span>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#547AA7]">
                  Riesgo inherente
                </p>

                <p className="text-sm font-semibold text-[#231F20]">
                  {formatearTexto(
                    seleccion.inherente.probabilidad
                  )}

                  {' · '}

                  {formatearTexto(
                    seleccion.inherente.impacto
                  )}

                  {' · '}

                  {
                    RIESGO_ESTILOS[
                      seleccion.inherente.riesgo
                    ].etiqueta
                  }
                </p>
              </div>
            </div>
          )}

          {seleccion?.residual && (
            <div className="flex items-center gap-3">

              <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#1B4589] bg-white text-xs font-bold text-[#1B4589]">
                R
              </span>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#547AA7]">
                  Riesgo residual
                </p>

                <p className="text-sm font-semibold text-[#231F20]">
                  {formatearTexto(
                    seleccion.residual.probabilidad
                  )}

                  {' · '}

                  {formatearTexto(
                    seleccion.residual.impacto
                  )}

                  {' · '}

                  {
                    RIESGO_ESTILOS[
                      seleccion.residual.riesgo
                    ].etiqueta
                  }
                </p>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =====================================================
          MATRIZ
         ===================================================== */}

      <div className="overflow-x-auto pb-2">

        <div className="mx-auto min-w-[820px] max-w-[1050px]">

          <div
            className="grid"
            style={{
              gridTemplateColumns:
                '44px 110px repeat(5, minmax(120px, 1fr))',

              gridTemplateRows:
                'repeat(5, 98px) 52px 42px',
            }}
          >

            {/* =================================================
                EJE PROBABILIDAD
               ================================================= */}

            <div
              style={{
                gridColumn: 1,
                gridRow: '1 / span 5',
              }}
              className="flex items-center justify-center border border-[#C6D0E2] bg-[#E8ECF3]"
            >
              <span
                className="text-sm font-bold uppercase tracking-[0.12em] text-[#1B4589]"
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                Probabilidad
              </span>
            </div>

            {/* =================================================
                FILAS
               ================================================= */}

            {probabilidades.map(
              (
                probabilidad,
                rowIndex
              ) => {
                const fila =
                  rowIndex + 1;

                return (
                  <div
                    key={probabilidad.codigo}
                    className="contents"
                  >

                    {/* CABECERA PROBABILIDAD */}

                    <div
                      style={{
                        gridColumn: 2,
                        gridRow: fila,
                      }}
                      title={
                        probabilidad.descripcion
                      }
                      className="flex items-center justify-center border border-[#D7DEE9] bg-[#F7F9FC] px-2 text-center"
                    >
                      <span className="text-[13px] font-bold text-[#231F20]">
                        {formatearTexto(
                          probabilidad.codigo
                        )}
                      </span>
                    </div>

                    {/* CELDAS */}

                    {impactos.map(
                      (
                        impacto,
                        columnIndex
                      ) => {
                        const celda =
                        obtenerCelda(
                          probabilidad.codigo,
                          impacto.codigo
                        );

                      if (!celda) {
                        return (
                          <div
                            key={`${probabilidad.codigo}-${impacto.codigo}`}
                            style={{
                              gridColumn: columnIndex + 3,
                              gridRow: fila,
                            }}
                            className="border border-white bg-slate-100"
                          />
                        );
                      }

                      const estilo =
                        RIESGO_ESTILOS[celda.riesgo];

                      const esInherente =
                        coincidePosicion(
                          probabilidad.codigo,
                          impacto.codigo,
                          seleccion?.inherente
                        );

                      const esResidual =
                        coincidePosicion(
                          probabilidad.codigo,
                          impacto.codigo,
                          seleccion?.residual
                        );

                      return (
                        <div
                          key={`${probabilidad.codigo}-${impacto.codigo}`}
                          style={{
                            gridColumn: columnIndex + 3,
                            gridRow: fila,
                            backgroundColor: estilo.fondo,
                          }}
                          className="relative flex items-center justify-center border border-white text-center"
                        >
                          {(esInherente || esResidual) && (
                            <div className="absolute flex gap-1.5">
                              {esInherente && (
                                <span
                                  title="Riesgo inherente"
                                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#1B4589] text-[10px] font-bold text-white shadow"
                                >
                                  I
                                </span>
                              )}

                              {esResidual && (
                                <span
                                  title="Riesgo residual"
                                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#1B4589] bg-white text-[10px] font-bold text-[#1B4589] shadow"
                                >
                                  R
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                      }
                    )}

                  </div>
                );
              }
            )}

            {/* =================================================
                CABECERAS DE IMPACTO
               ================================================= */}

            {impactos.map(
              (
                impacto,
                index
              ) => (
                <div
                  key={impacto.codigo}
                  style={{
                    gridColumn:
                      index + 3,

                    gridRow: 6,
                  }}
                  className="flex items-center justify-center border border-[#D7DEE9] bg-[#F7F9FC] px-2 text-center"
                >
                  <span className="text-[13px] font-bold text-[#231F20]">
                    {formatearTexto(
                      impacto.codigo
                    )}
                  </span>
                </div>
              )
            )}

            {/* =================================================
                EJE IMPACTO
               ================================================= */}

            <div
              style={{
                gridColumn:
                  '3 / span 5',

                gridRow: 7,
              }}
              className="flex items-center justify-center border border-[#C6D0E2] bg-[#E8ECF3]"
            >
              <span className="text-sm font-bold uppercase tracking-[0.12em] text-[#1B4589]">
                Impacto
              </span>
            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          LEYENDA
         ===================================================== */}

      <div className="mx-auto mt-6 flex max-w-[1050px] flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-[#E8ECF3] pt-4">

        {(
          Object.entries(
            RIESGO_ESTILOS
          ) as [
            NivelRiesgo,
            (typeof RIESGO_ESTILOS)[NivelRiesgo]
          ][]
        ).map(
          ([
            riesgo,
            estilo,
          ]) => (
            <div
              key={riesgo}
              className="flex items-center gap-2"
            >
              <span
                className="inline-block h-4 w-4 border border-slate-300"
                style={{
                  backgroundColor:
                    estilo.fondo,
                }}
              />

              <span className="text-sm text-slate-700">
                {
                  estilo.etiqueta
                }
              </span>
            </div>
          )
        )}

        <div className="ml-2 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4589] text-[9px] font-bold text-white">
            I
          </span>

          <span className="text-xs font-medium text-slate-600">
            Riesgo inherente
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1B4589] bg-white text-[9px] font-bold text-[#1B4589]">
            R
          </span>

          <span className="text-xs font-medium text-slate-600">
            Riesgo residual
          </span>
        </div>

      </div>

    </section>
  );
}