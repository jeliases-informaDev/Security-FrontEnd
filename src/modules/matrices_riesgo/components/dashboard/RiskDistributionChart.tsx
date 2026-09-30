"use client";

import {
  useMemo,
} from "react";

import type {
  MatrizRiesgoResumen,
  NivelRiesgo,
} from "../../types/matrizRiesgo.types";


// ============================================================
// PROPS
// ============================================================

interface RiskDistributionChartProps {
  analisis:
    MatrizRiesgoResumen[];

  tipoVista:
    "residual" | "inherente";
}


// ============================================================
// CONFIGURACIÓN
// ============================================================

const NIVELES: Array<{
  codigo: NivelRiesgo;
  etiqueta: string;
  color: string;
}> = [

  {
    codigo: "MINIMO",
    etiqueta: "Mínimo",
    color: "#00B0F0",
  },

  {
    codigo: "LEVE",
    etiqueta: "Leve",
    color: "#92D050",
  },

  {
    codigo: "MODERADO",
    etiqueta: "Moderado",
    color: "#FFFF00",
  },

  {
    codigo: "ALTO",
    etiqueta: "Alto",
    color: "#E26B0A",
  },

  {
    codigo: "MUY_ALTO",
    etiqueta: "Muy alto",
    color: "#FF0000",
  },
];


// ============================================================
// COMPONENTE
// ============================================================

export function RiskDistributionChart({
  analisis,
  tipoVista,
}: RiskDistributionChartProps) {

  // ==========================================================
  // REGISTRADAS
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
  // CON RIESGO CALCULADO
  // ==========================================================

  const evaluacionesValidas =
    useMemo(
      () =>
        evaluacionesRegistradas.filter(
          (item) => {

            if (
              tipoVista ===
              "residual"
            ) {
              return (
                item.riesgoResidual !==
                null
              );
            }


            return (
              item.riesgoInherente !==
              null
            );
          }
        ),
      [
        evaluacionesRegistradas,
        tipoVista,
      ]
    );


  // ==========================================================
  // DISTRIBUCIÓN
  // ==========================================================

  const distribucion =
    useMemo(() => {

      const total =
        evaluacionesValidas.length;


      return NIVELES.map(
        (nivel) => {

          const cantidad =
            evaluacionesValidas.filter(
              (item) => {

                const riesgo =
                  tipoVista ===
                  "residual"
                    ? item.riesgoResidual
                    : item.riesgoInherente;


                return (
                  riesgo ===
                  nivel.codigo
                );
              }
            ).length;


          const porcentaje =
            total > 0
              ? (
                  cantidad /
                  total
                ) *
                100
              : 0;


          return {
            ...nivel,
            cantidad,
            porcentaje,
          };

        }
      );

    }, [
      evaluacionesValidas,
      tipoVista,
    ]);


  const total =
    evaluacionesValidas.length;


  // ==========================================================
  // DONUT
  // ==========================================================

  const gradient =
    useMemo(() => {

      if (total === 0) {
        return "#E8ECF3";
      }


      let acumulado =
        0;


      const segmentos:
        string[] = [];


      distribucion.forEach(
        (item) => {

          if (
            item.cantidad === 0
          ) {
            return;
          }


          const inicio =
            acumulado;


          const fin =
            acumulado +
            item.porcentaje;


          segmentos.push(
            `${item.color} ${inicio}% ${fin}%`
          );


          acumulado =
            fin;

        }
      );


      if (
        segmentos.length === 0
      ) {
        return "#E8ECF3";
      }


      return `conic-gradient(${segmentos.join(
        ", "
      )})`;

    }, [
      distribucion,
      total,
    ]);


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <section className="h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      {/* HEADER */}

      <div>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B4589]">
          Distribución
        </p>

        <h2 className="mt-1 text-xl font-bold tracking-tight text-[#231F20]">
          Distribución por nivel
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Distribución del riesgo{" "}

          <span className="font-semibold text-[#1B4589]">
            {tipoVista ===
            "residual"
              ? "residual"
              : "inherente"}
          </span>

          {" "}de las evaluaciones registradas.
        </p>

      </div>


      {/* DONUT */}

      <div className="mt-7 flex justify-center">

        <div
          className="relative flex h-[220px] w-[220px] items-center justify-center rounded-full"
          style={{
            background:
              gradient,
          }}
        >

          <div className="flex h-[142px] w-[142px] flex-col items-center justify-center rounded-full bg-white shadow-inner">

            <span className="text-4xl font-black text-[#231F20]">
              {total}
            </span>

            <span className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
              Evaluaciones
            </span>

            <span className="mt-1 text-[11px] font-semibold text-[#1B4589]">
              {tipoVista ===
              "residual"
                ? "Residual"
                : "Inherente"}
            </span>

          </div>

        </div>

      </div>


      {/* DETALLE */}

      <div className="mt-7 space-y-2">

        {distribucion.map(
          (item) => (

            <div
              key={
                item.codigo
              }
              className="flex items-center justify-between rounded-xl px-3 py-2.5"
            >

              <div className="flex items-center gap-3">

                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                  style={{
                    backgroundColor:
                      item.color,
                  }}
                />

                <span className="text-sm font-semibold text-slate-700">
                  {item.etiqueta}
                </span>

              </div>


              <div className="flex items-center gap-4">

                <span className="min-w-6 text-right text-sm font-bold text-[#231F20]">
                  {item.cantidad}
                </span>

                <span className="min-w-[52px] text-right text-xs font-medium text-slate-400">
                  {item.porcentaje.toFixed(
                    1
                  )}
                  %
                </span>

              </div>

            </div>

          )
        )}

      </div>


      {total === 0 && (

        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">

          <p className="text-center text-sm text-slate-400">

            No existen evaluaciones registradas
            con riesgo{" "}

            {tipoVista ===
            "residual"
              ? "residual"
              : "inherente"}

            {" "}calculado.

          </p>

        </div>

      )}

    </section>
  );
}