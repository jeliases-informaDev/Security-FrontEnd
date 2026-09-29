'use client';

import { useState } from 'react';
import { ClipboardList, Grid3X3 } from 'lucide-react';

import { RiskEvaluationForm } from './form/RiskEvaluationForm';
import { RiskHeatmap } from './heatmap/RiskHeatmap';

import type {
  HeatmapResultadoRiesgo,
} from '../types/matrizRiesgo.types';

type VistaMatriz = 'evaluacion' | 'heatmap';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B4589]">
            Matrices de Riesgo
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            Gestión y evaluación de riesgos
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Registra evaluaciones y consulta la matriz de
            probabilidad e impacto.
          </p>
        </div>

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
      </div>

      {vista === 'evaluacion' ? (
        <RiskEvaluationForm
          onRiesgoInherenteChange={
            setRiesgoInherente
          }
          onRiesgoResidualChange={
            setRiesgoResidual
          }
        />
      ) : (
        <RiskHeatmap
          seleccion={{
            inherente: riesgoInherente,
            residual: riesgoResidual,
          }}
        />
      )}
    </div>
  );
}