"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  matrizRiesgoService,
} from "../../services/matrizRiesgo.service";

import type {
  HeatmapMatrizResponse,
  MatrizRiesgoResumen,
  NivelImpacto,
  NivelProbabilidad,
  NivelRiesgo,
} from "../../types/matrizRiesgo.types";


// ============================================================
// TYPES
// ============================================================

type TipoVistaRiesgo =
  | "residual"
  | "inherente";


interface RiskAggregateHeatmapProps {
  analisis:
    MatrizRiesgoResumen[];

  tipoVista:
    TipoVistaRiesgo;

  onTipoVistaChange: (
    tipo: TipoVistaRiesgo
  ) => void;
}


// ============================================================
// ESTILOS
// ============================================================

const RIESGO_ESTILOS:
  Record<
    NivelRiesgo,
    {
      fondo: string;
      etiqueta: string;
    }
  > = {

    MINIMO: {
      fondo: "#00B0F0",
      etiqueta: "Mínimo",
    },

    LEVE: {
      fondo: "#92D050",
      etiqueta: "Leve",
    },

    MODERADO: {
      fondo: "#FFFF00",
      etiqueta: "Moderado",
    },

    ALTO: {
      fondo: "#E26B0A",
      etiqueta: "Alto",
    },

    MUY_ALTO: {
      fondo: "#FF0000",
      etiqueta: "Muy alto",
    },
  };


// ============================================================
// UTILIDADES
// ============================================================

function formatearTexto(
  valor: string
) {
  return valor
    .toLowerCase()
    .split("_")
    .map(
      (parte) =>
        parte
          .charAt(0)
          .toUpperCase() +
        parte.slice(1)
    )
    .join(" ");
}


function construirClave(
  probabilidad:
    NivelProbabilidad,
  impacto:
    NivelImpacto
) {
  return `${probabilidad}-${impacto}`;
}


// ============================================================
// COMPONENTE
// ============================================================

export function RiskAggregateHeatmap({
  analisis,
  tipoVista,
  onTipoVistaChange,
}: RiskAggregateHeatmapProps) {

  const [
    heatmap,
    setHeatmap,
  ] =
    useState<HeatmapMatrizResponse | null>(
      null
    );


  const [
    cargando,
    setCargando,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );


  // ==========================================================
  // CARGAR MATRIZ
  // ==========================================================

  async function cargarHeatmap() {

    try {
      setCargando(true);
      setError(null);

      const data =
        await matrizRiesgoService
          .obtenerHeatmap();

      setHeatmap(data);

    } catch (error) {

      console.error(
        "Error cargando heatmap general:",
        error
      );

      setError(
        "No se pudo cargar la matriz de probabilidad e impacto."
      );

    } finally {
      setCargando(false);
    }
  }


  useEffect(() => {
    void cargarHeatmap();
  }, []);


  // ==========================================================
  // EVALUACIONES REGISTRADAS
  // ==========================================================

  const evaluacionesRegistradas =
    useMemo(
      () =>
        analisis.filter(
          (item) =>
            item.estado !==
            "EDITANDO"
        ),
      [analisis]
    );


  // ==========================================================
  // EJES
  // ==========================================================

  const probabilidades =
    useMemo(() => {

      if (!heatmap) {
        return [];
      }

      return [
        ...heatmap.probabilidades,
      ].sort(
        (a, b) =>
          b.nivel -
          a.nivel
      );

    }, [heatmap]);


  const impactos =
    useMemo(() => {

      if (!heatmap) {
        return [];
      }

      return [
        ...heatmap.impactos,
      ].sort(
        (a, b) =>
          a.nivel -
          b.nivel
      );

    }, [heatmap]);


  // ==========================================================
  // MAPA DE RIESGOS
  // ==========================================================

  const mapaCeldas =
    useMemo(() => {

      const mapa =
        new Map<
          string,
          NivelRiesgo
        >();


      heatmap?.celdas.forEach(
        (celda) => {

          mapa.set(
            construirClave(
              celda.probabilidad,
              celda.impacto
            ),
            celda.riesgo
          );

        }
      );


      return mapa;

    }, [heatmap]);


  // ==========================================================
  // CONTADORES
  // ==========================================================

  const conteoCeldas =
    useMemo(() => {

      const mapa =
        new Map<
          string,
          number
        >();


      evaluacionesRegistradas.forEach(
        (item) => {

          const probabilidad =
            tipoVista ===
            "residual"
              ? item.probabilidadResidual
              : item.probabilidad;


          const impacto =
            tipoVista ===
            "residual"
              ? item.impactoResidual
              : item.impactoInherente;


          if (
            !probabilidad ||
            !impacto
          ) {
            return;
          }


          const clave =
            construirClave(
              probabilidad,
              impacto
            );


          mapa.set(
            clave,
            (
              mapa.get(
                clave
              ) ?? 0
            ) + 1
          );

        }
      );


      return mapa;

    }, [
      evaluacionesRegistradas,
      tipoVista,
    ]);


  const totalConsiderado =
    useMemo(() => {

      return Array
        .from(
          conteoCeldas.values()
        )
        .reduce(
          (
            total,
            valor
          ) =>
            total +
            valor,
          0
        );

    }, [
      conteoCeldas,
    ]);


  // ==========================================================
  // LOADING
  // ==========================================================

  if (cargando) {

    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white">

        <div className="flex flex-col items-center gap-3 text-slate-500">

          <Loader2 className="h-6 w-6 animate-spin" />

          <span className="text-sm">
            Cargando matriz de riesgos...
          </span>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error ||
    !heatmap
  ) {

    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8">

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
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4" />

              Reintentar
            </button>

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      {/* =====================================================
          CABECERA
         ===================================================== */}

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div>

          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B4589]">
            Resumen de exposición
          </p>

          <h2 className="mt-1 text-xl font-bold tracking-tight text-[#231F20]">
            Matriz general de riesgos
          </h2>

          <p className="mt-1.5 text-sm text-slate-500">
            Distribución de las evaluaciones registradas
            según su probabilidad e impacto.
          </p>

        </div>


        {/* ===================================================
            SELECTOR COMPARTIDO
           =================================================== */}

        <div className="inline-flex shrink-0 self-start rounded-xl bg-slate-100 p-1">

          <button
            type="button"
            onClick={() =>
              onTipoVistaChange(
                "residual"
              )
            }
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              tipoVista ===
              "residual"
                ? "bg-white text-[#1B4589] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Residual
          </button>


          <button
            type="button"
            onClick={() =>
              onTipoVistaChange(
                "inherente"
              )
            }
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
              tipoVista ===
              "inherente"
                ? "bg-white text-[#1B4589] shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Inherente
          </button>

        </div>

      </div>


      {/* =====================================================
          MATRIZ COMPACTA
         ===================================================== */}

      <div className="overflow-x-auto pb-1">

        <div className="mx-auto min-w-[680px] max-w-[880px]">

          <div
            className="grid"
            style={{
              gridTemplateColumns:
                "42px 110px repeat(5, minmax(92px, 1fr))",

              gridTemplateRows:
                "repeat(5, 70px) 42px 34px",
            }}
          >

            {/* =================================================
                PROBABILIDAD
               ================================================= */}

            <div
              style={{
                gridColumn: 1,
                gridRow:
                  "1 / span 5",
              }}
              className="flex items-center justify-center border border-[#C6D0E2] bg-[#E8ECF3]"
            >

              <span
                className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#1B4589]"
                style={{
                  writingMode:
                    "vertical-rl",

                  transform:
                    "rotate(180deg)",
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
                    key={
                      probabilidad.codigo
                    }
                    className="contents"
                  >

                    {/* ETIQUETA */}

                    <div
                      style={{
                        gridColumn: 2,
                        gridRow:
                          fila,
                      }}
                      title={
                        probabilidad.descripcion
                      }
                      className="flex items-center justify-center border border-[#D7DEE9] bg-[#F7F9FC] px-2 text-center"
                    >

                      <span className="text-xs font-bold text-[#231F20]">
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

                        const clave =
                          construirClave(
                            probabilidad.codigo,
                            impacto.codigo
                          );


                        const riesgo =
                          mapaCeldas.get(
                            clave
                          );


                        const cantidad =
                          conteoCeldas.get(
                            clave
                          ) ?? 0;


                        if (!riesgo) {

                          return (
                            <div
                              key={
                                clave
                              }
                              style={{
                                gridColumn:
                                  columnIndex +
                                  3,

                                gridRow:
                                  fila,
                              }}
                              className="border border-white bg-slate-100"
                            />
                          );
                        }


                        const estilo =
                          RIESGO_ESTILOS[
                            riesgo
                          ];


                        return (
                          <div
                            key={
                              clave
                            }
                            style={{
                              gridColumn:
                                columnIndex +
                                3,

                              gridRow:
                                fila,

                              backgroundColor:
                                estilo.fondo,
                            }}
                            title={`${formatearTexto(
                              probabilidad.codigo
                            )} × ${formatearTexto(
                              impacto.codigo
                            )}`}
                            className="flex items-center justify-center border border-white text-center"
                          >

                            {cantidad > 0 && (

                              <span className="text-xl font-black text-[#111111]">
                                {cantidad}
                              </span>

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
                IMPACTOS
               ================================================= */}

            {impactos.map(
              (
                impacto,
                index
              ) => (

                <div
                  key={
                    impacto.codigo
                  }
                  style={{
                    gridColumn:
                      index + 3,

                    gridRow: 6,
                  }}
                  className="flex items-center justify-center border border-[#D7DEE9] bg-[#F7F9FC] px-1 text-center"
                >

                  <span className="text-[11px] font-bold text-[#231F20]">
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
                  "3 / span 5",

                gridRow: 7,
              }}
              className="mt-1.5 flex items-center justify-center bg-[#6B7C96]"
            >

              <span className="text-xs font-bold uppercase tracking-[0.12em] text-white">
                Impacto
              </span>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          FOOTER
         ===================================================== */}

      <div className="mx-auto mt-4 flex max-w-[880px] flex-col gap-3 border-t border-[#E8ECF3] pt-3 lg:flex-row lg:items-center lg:justify-between">

        <p className="text-xs text-slate-500">

          Evaluaciones consideradas:{" "}

          <span className="font-bold text-slate-700">
            {totalConsiderado}
          </span>

        </p>


        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

          {(
            Object.entries(
              RIESGO_ESTILOS
            ) as [
              NivelRiesgo,
              (
                typeof RIESGO_ESTILOS
              )[NivelRiesgo]
            ][]
          ).map(
            ([
              riesgo,
              estilo,
            ]) => (

              <div
                key={
                  riesgo
                }
                className="flex items-center gap-1.5"
              >

                <span
                  className="h-3 w-3 border border-black/10"
                  style={{
                    backgroundColor:
                      estilo.fondo,
                  }}
                />

                <span className="text-[11px] font-medium text-slate-600">
                  {
                    estilo.etiqueta
                  }
                </span>

              </div>

            )
          )}

        </div>

      </div>

    </section>
  );
}