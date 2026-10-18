'use client';

import { useState } from 'react';
import { AlertTriangle, Grid3X3, Plus } from 'lucide-react';

import { Modal } from '@/shared/ui/Modal';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Boton, Pestanas } from '@/shared/ui/kit';
import { RiskDashboard } from './dashboard/RiskDashboard';
import { RiskEvaluationForm } from './form/RiskEvaluationForm';
import { RiskHeatmap } from './heatmap/RiskHeatmap';

import type { HeatmapResultadoRiesgo, MatrizRiesgoResumen } from '../types/matrizRiesgo.types';

type VistaMatriz = 'resumen' | 'evaluacion' | 'heatmap';
type EstadoEvaluacionActiva = 'nueva' | 'borrador' | 'registrada';

const PESTANAS: { valor: VistaMatriz; etiqueta: string }[] = [
  { valor: 'resumen', etiqueta: 'Resumen' },
  { valor: 'evaluacion', etiqueta: 'Evaluación' },
  { valor: 'heatmap', etiqueta: 'Heatmap' },
];

const subirArriba = () => window.scrollTo({ top: 0, behavior: 'smooth' });

export function RiskMatrixWorkspace() {
  const [vista, setVista] = useState<VistaMatriz>('resumen');
  const [riesgoInherente, setRiesgoInherente] = useState<HeatmapResultadoRiesgo | null>(null);
  const [riesgoResidual, setRiesgoResidual] = useState<HeatmapResultadoRiesgo | null>(null);
  // ID que usa el Heatmap para habilitar el PDF cuando corresponde a una evaluación registrada.
  const [heatmapAnalisisId, setHeatmapAnalisisId] = useState<number | null>(null);
  // Solo se usa al «Continuar» un borrador desde el historial. Guardar un borrador nuevo NO lo cambia,
  // para que el formulario no se vuelva a cargar justo después de guardarlo.
  const [analisisInicialId, setAnalisisInicialId] = useState<number | null>(null);
  // Si la evaluación del formulario todavía es nueva, ya es un borrador guardado o ya fue registrada.
  const [estadoEvaluacionActiva, setEstadoEvaluacionActiva] = useState<EstadoEvaluacionActiva>('nueva');
  // Cambiarla reinicia por completo RiskEvaluationForm.
  const [evaluacionKey, setEvaluacionKey] = useState(0);
  const [modalNuevaEvaluacionAbierto, setModalNuevaEvaluacionAbierto] = useState(false);

  // Solo aparece después de registrar una evaluación.
  const mostrarNuevaEvaluacion = estadoEvaluacionActiva === 'registrada';

  function confirmarNuevaEvaluacion() {
    setModalNuevaEvaluacionAbierto(false);
    setRiesgoInherente(null);
    setRiesgoResidual(null);
    setHeatmapAnalisisId(null);
    setAnalisisInicialId(null);
    setEstadoEvaluacionActiva('nueva');
    setEvaluacionKey((prev) => prev + 1);
    setVista('evaluacion');
    subirArriba();
  }

  function continuarBorrador(id: number) {
    setRiesgoInherente(null);
    setRiesgoResidual(null);
    setHeatmapAnalisisId(null);
    // Este ID hace que RiskEvaluationForm consulte GET /analisis/{id}.
    setAnalisisInicialId(id);
    setEstadoEvaluacionActiva('borrador');
    // Instancia nueva del formulario para no mezclar datos con otra evaluación.
    setEvaluacionKey((prev) => prev + 1);
    setVista('evaluacion');
    subirArriba();
  }

  function verMatrizHistorial(analisis: MatrizRiesgoResumen) {
    if (analisis.probabilidad && analisis.impactoInherente && analisis.riesgoInherente) {
      setRiesgoInherente({ probabilidad: analisis.probabilidad, impacto: analisis.impactoInherente, riesgo: analisis.riesgoInherente });
    } else {
      setRiesgoInherente(null);
    }

    if (analisis.probabilidadResidual && analisis.impactoResidual && analisis.riesgoResidual) {
      setRiesgoResidual({ probabilidad: analisis.probabilidadResidual, impacto: analisis.impactoResidual, riesgo: analisis.riesgoResidual });
    } else {
      setRiesgoResidual(null);
    }

    // Las matrices del historial son evaluaciones registradas: este ID habilita el PDF en el Heatmap.
    setHeatmapAnalisisId(analisis.estado === 'EDITANDO' ? null : analisis.id);
    // Ver una matriz histórica no cambia el estado del formulario que el usuario estaba trabajando.
    setVista('heatmap');
    subirArriba();
  }

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Gestión de riesgos"
        icono={Grid3X3}
        titulo="Matrices de riesgo"
        descripcion="Consulta, registra y analiza las evaluaciones de riesgo de la organización."
        sinLinea
        acciones={mostrarNuevaEvaluacion ? <Boton icono={Plus} onClick={() => setModalNuevaEvaluacionAbierto(true)}>Nueva evaluación</Boton> : null}
      />

      <Pestanas ariaLabel="Vistas de matrices de riesgo" valor={vista} onCambiar={setVista} opciones={PESTANAS} />

      <div className="space-y-6">
        {vista === 'resumen' && <RiskDashboard onContinuar={continuarBorrador} onVerMatriz={verMatrizHistorial} />}

        {/* La evaluación permanece montada para conservar los datos al cambiar de pestaña. */}
        <div className={vista === 'evaluacion' ? 'block' : 'hidden'}>
          <RiskEvaluationForm
            key={evaluacionKey}
            analisisInicialId={analisisInicialId}
            onRiesgoInherenteChange={setRiesgoInherente}
            onRiesgoResidualChange={setRiesgoResidual}
            onAnalisisGuardado={() => {
              // Ya existe como borrador; un borrador todavía no habilita PDF en el Heatmap.
              setEstadoEvaluacionActiva('borrador');
              setHeatmapAnalisisId(null);
              // Al guardar el borrador se vuelve al Resumen, que consulta de nuevo el historial.
              setVista('resumen');
              subirArriba();
            }}
            onAnalisisRegistrado={(id) => {
              setEstadoEvaluacionActiva('registrada');
              setAnalisisInicialId(null);
              setHeatmapAnalisisId(id);
            }}
          />
        </div>

        <div className={vista === 'heatmap' ? 'block' : 'hidden'}>
          <RiskHeatmap key={`heatmap-${evaluacionKey}`} seleccion={{ inherente: riesgoInherente, residual: riesgoResidual }} analisisId={heatmapAnalisisId} />
        </div>
      </div>

      {modalNuevaEvaluacionAbierto && (
        <Modal
          titulo="Iniciar nueva evaluación"
          subtitulo="Matrices de riesgo"
          onCerrar={() => setModalNuevaEvaluacionAbierto(false)}
          pie={
            <>
              <Boton variante="secundario" onClick={() => setModalNuevaEvaluacionAbierto(false)}>Cancelar</Boton>
              <Boton icono={Plus} onClick={confirmarNuevaEvaluacion}>Iniciar nueva evaluación</Boton>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-ink">
            {estadoEvaluacionActiva === 'registrada'
              ? 'La evaluación actual ya fue registrada. Puedes iniciar una nueva sin afectar el registro anterior.'
              : 'El borrador actual ya está guardado. Puedes iniciar una nueva evaluación y continuar este borrador después desde el historial.'}
          </p>
          <div className="flex items-start gap-3 rounded-xl border border-warn/20 bg-warn-soft px-4 py-3 text-sm text-warn">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>Al continuar, el formulario actual se limpia y la evaluación empieza desde cero.</p>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}
