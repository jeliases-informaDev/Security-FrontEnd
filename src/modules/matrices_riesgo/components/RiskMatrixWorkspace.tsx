'use client';

import { useState } from 'react';

import {
  ClipboardList,
  Grid3X3,
  Plus,
} from 'lucide-react';

import { RiskEvaluationForm } from './form/RiskEvaluationForm';
import { RiskHeatmap } from './heatmap/RiskHeatmap';

import type {
  HeatmapResultadoRiesgo,
} from '../types/matrizRiesgo.types';

type VistaMatriz =
  | 'evaluacion'
  | 'heatmap';

export function RiskMatrixWorkspace() {
  const [vista, setVista] =
    useState<VistaMatriz>('evaluacion');

  const [
    riesgoInherente,
    setRiesgoInherente,
  ] = useState<HeatmapResultadoRiesgo | null>(
    null
  );

  const [
    riesgoResidual,
    setRiesgoResidual,
  ] = useState<HeatmapResultadoRiesgo | null>(
    null
  );

  const [
    analisisRegistradoId,
    setAnalisisRegistradoId,
  ] = useState<number | null>(
    null
  );

  /*
   * Permite reiniciar completamente
   * el formulario de evaluación.
   */
  const [
    evaluacionKey,
    setEvaluacionKey,
  ] = useState(0);

  /* ============================================================
     NUEVA EVALUACIÓN
     ============================================================ */

  function nuevaEvaluacion() {
    const confirmar =
      window.confirm(
        'Se iniciará una nueva evaluación. Si tienes cambios sin guardar, se perderán. ¿Deseas continuar?'
      );

    if (!confirmar) {
      return;
    }

    /*
     * Limpiar resultados compartidos
     * con el Heatmap.
     */
    setRiesgoInherente(null);
    setRiesgoResidual(null);

    /*
     * Ya no existe una evaluación
     * registrada activa.
     */
    setAnalisisRegistradoId(null);

    /*
     * Forzar una nueva instancia
     * del formulario.
     */
    setEvaluacionKey(
      (prev) => prev + 1
    );

    /*
     * Regresar al formulario.
     */
    setVista('evaluacion');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER GENERAL
         ===================================================== */}

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4589]">
            Matrices de Riesgo
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Gestión y evaluación de riesgos
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Registra evaluaciones y consulta la
            matriz de probabilidad e impacto.
          </p>
        </div>

        {/* =================================================
            ACCIONES
           ================================================= */}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* ===============================================
              CAMBIO DE VISTA
             =============================================== */}

          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() =>
                setVista('evaluacion')
              }
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                vista === 'evaluacion'
                  ? 'bg-white text-[#1B4589] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="h-4 w-4" />

              Evaluación
            </button>

            <button
              type="button"
              onClick={() =>
                setVista('heatmap')
              }
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                vista === 'heatmap'
                  ? 'bg-white text-[#1B4589] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />

              Heatmap
            </button>
          </div>

          {/* ===============================================
              NUEVA EVALUACIÓN
             =============================================== */}

          <button
            type="button"
            onClick={nuevaEvaluacion}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4589] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#163A74]"
          >
            <Plus className="h-4 w-4" />

            Nueva evaluación
          </button>
        </div>
      </div>

      {/* =====================================================
          EVALUACIÓN

          No se desmonta al visitar el Heatmap.
          Solo se oculta.

          De esta manera conserva:
          - formulario
          - paso actual
          - resultados
          - tratamiento
          - IDs
         ===================================================== */}

      <div
        className={
          vista === 'evaluacion'
            ? 'block'
            : 'hidden'
        }
      >
        <RiskEvaluationForm
          key={evaluacionKey}
          onRiesgoInherenteChange={
            setRiesgoInherente
          }
          onRiesgoResidualChange={
            setRiesgoResidual
          }
          onAnalisisRegistrado={
            setAnalisisRegistradoId
          }
        />
      </div>

      {/* =====================================================
          HEATMAP

          También permanece montado mientras
          cambiamos entre las dos vistas.
         ===================================================== */}

      <div
        className={
          vista === 'heatmap'
            ? 'block'
            : 'hidden'
        }
      >
        <RiskHeatmap
          key={`heatmap-${evaluacionKey}`}
          seleccion={{
            inherente:
              riesgoInherente,

            residual:
              riesgoResidual,
          }}
          analisisId={
            analisisRegistradoId
          }
        />
      </div>
    </div>
  );
}