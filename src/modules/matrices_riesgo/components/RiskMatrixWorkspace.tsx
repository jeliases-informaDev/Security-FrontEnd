'use client';

import { useState } from 'react';

import {
  AlertTriangle,
  ClipboardList,
  Grid3X3,
  LayoutDashboard,
  Plus,
  X,
} from 'lucide-react';

import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { RiskDashboard } from './dashboard/RiskDashboard';
import { RiskEvaluationForm } from './form/RiskEvaluationForm';
import { RiskHeatmap } from './heatmap/RiskHeatmap';

import type {
  HeatmapResultadoRiesgo,
  MatrizRiesgoResumen,
} from '../types/matrizRiesgo.types';


type VistaMatriz =
  | 'resumen'
  | 'evaluacion'
  | 'heatmap';

type EstadoEvaluacionActiva =
  | 'nueva'
  | 'borrador'
  | 'registrada';


export function RiskMatrixWorkspace() {
  const [
    vista,
    setVista,
  ] = useState<VistaMatriz>(
    'resumen'
  );

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

  /*
   * ID utilizado únicamente por el Heatmap
   * para habilitar la descarga PDF cuando
   * corresponde a una evaluación registrada.
   */
  const [
    heatmapAnalisisId,
    setHeatmapAnalisisId,
  ] = useState<number | null>(
    null
  );

  /*
   * Solo se utiliza cuando se selecciona
   * "Continuar" desde el historial.
   *
   * Guardar un borrador nuevo NO modifica
   * este estado. De esa manera evitamos
   * que el formulario se vuelva a cargar
   * inmediatamente después de guardarlo.
   */
  const [
    analisisInicialId,
    setAnalisisInicialId,
  ] = useState<number | null>(
    null
  );

  /*
   * Controla si la evaluación que está
   * actualmente en el formulario todavía
   * es nueva, ya es un borrador guardado
   * o ya fue registrada.
   */
  const [
    estadoEvaluacionActiva,
    setEstadoEvaluacionActiva,
  ] = useState<EstadoEvaluacionActiva>(
    'nueva'
  );

  /*
   * Permite reiniciar completamente
   * RiskEvaluationForm.
   */
  const [
    evaluacionKey,
    setEvaluacionKey,
  ] = useState(0);

  /*
   * Modal propio para confirmar que se
   * iniciará otra evaluación.
   */
  const [
    modalNuevaEvaluacionAbierto,
    setModalNuevaEvaluacionAbierto,
  ] = useState(false);


  const mostrarNuevaEvaluacion =
    estadoEvaluacionActiva ===
    'registrada';


  /* ============================================================
     INICIAR NUEVA EVALUACIÓN
     ============================================================ */

  function confirmarNuevaEvaluacion() {
    /*
     * Cerrar modal.
     */
    setModalNuevaEvaluacionAbierto(
      false
    );

    /*
     * Limpiar la selección compartida
     * con el Heatmap.
     */
    setRiesgoInherente(
      null
    );

    setRiesgoResidual(
      null
    );

    /*
     * Ya no hay un análisis registrado
     * seleccionado en el Heatmap.
     */
    setHeatmapAnalisisId(
      null
    );

    /*
     * Ya no estamos continuando
     * ningún borrador del historial.
     */
    setAnalisisInicialId(
      null
    );

    /*
     * La nueva evaluación empieza
     * sin persistir.
     */
    setEstadoEvaluacionActiva(
      'nueva'
    );

    /*
     * Crear una nueva instancia limpia
     * del formulario.
     */
    setEvaluacionKey(
      (prev) =>
        prev + 1
    );

    /*
     * Mostrar el formulario.
     */
    setVista(
      'evaluacion'
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }


  /* ============================================================
     CONTINUAR BORRADOR
     ============================================================ */

  function continuarBorrador(
    id: number
  ) {
    /*
     * Limpiar resultados de cualquier
     * evaluación anterior.
     */
    setRiesgoInherente(
      null
    );

    setRiesgoResidual(
      null
    );

    setHeatmapAnalisisId(
      null
    );

    /*
     * Este ID hará que RiskEvaluationForm
     * consulte GET /analisis/{id}.
     */
    setAnalisisInicialId(
      id
    );

    /*
     * Ya existe un registro persistido,
     * por lo tanto se habilita
     * "Nueva evaluación".
     */
    setEstadoEvaluacionActiva(
      'borrador'
    );

    /*
     * Forzar una instancia nueva
     * del formulario para evitar mezclar
     * información con otra evaluación.
     */
    setEvaluacionKey(
      (prev) =>
        prev + 1
    );

    setVista(
      'evaluacion'
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }


  /* ============================================================
     VER MATRIZ DESDE EL HISTORIAL
     ============================================================ */

  function verMatrizHistorial(
    analisis: MatrizRiesgoResumen
  ) {
    if (
      analisis.probabilidad &&
      analisis.impactoInherente &&
      analisis.riesgoInherente
    ) {
      setRiesgoInherente({
        probabilidad:
          analisis.probabilidad,

        impacto:
          analisis.impactoInherente,

        riesgo:
          analisis.riesgoInherente,
      });
    } else {
      setRiesgoInherente(
        null
      );
    }

    if (
      analisis.probabilidadResidual &&
      analisis.impactoResidual &&
      analisis.riesgoResidual
    ) {
      setRiesgoResidual({
        probabilidad:
          analisis.probabilidadResidual,

        impacto:
          analisis.impactoResidual,

        riesgo:
          analisis.riesgoResidual,
      });
    } else {
      setRiesgoResidual(
        null
      );
    }

    /*
     * Las acciones de matriz del historial
     * corresponden a evaluaciones registradas.
     * Este ID habilita el PDF en RiskHeatmap.
     */
    setHeatmapAnalisisId(
      analisis.estado === 'EDITANDO'
        ? null
        : analisis.id
    );

    /*
     * Importante:
     * no modificamos estadoEvaluacionActiva.
     *
     * Ver una matriz histórica no debe cambiar
     * el estado del formulario que el usuario
     * estaba trabajando.
     */
    setVista(
      'heatmap'
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }


  const pestanas = [
    { vista: 'resumen' as const, nombre: 'Resumen', Icono: LayoutDashboard },
    { vista: 'evaluacion' as const, nombre: 'Evaluación', Icono: ClipboardList },
    { vista: 'heatmap' as const, nombre: 'Heatmap', Icono: Grid3X3 },
  ];

  return (
    <PageShell>
      <PageHeader
        titulo="Matrices de riesgo"
        descripcion="Consulta, registra y analiza las evaluaciones de riesgo de la organización."
        sinLinea
        acciones={
          // Solo aparece después de guardar un borrador, continuar uno guardado o registrar una evaluación.
          mostrarNuevaEvaluacion ? (
            <button
              type="button"
              onClick={() => setModalNuevaEvaluacionAbierto(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              <Plus className="h-4 w-4" />
              Nueva evaluación
            </button>
          ) : null
        }
      />

      <nav aria-label="Vistas de matrices de riesgo" className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-300/70">
        {pestanas.map(({ vista: destino, nombre, Icono }) => {
          const activa = vista === destino;
          return (
            <button
              key={destino}
              type="button"
              onClick={() => setVista(destino)}
              aria-current={activa ? 'page' : undefined}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm transition ${
                activa
                  ? 'border-brand-navy font-medium text-brand-navy'
                  : 'border-transparent text-brand-muted hover:border-slate-400 hover:text-brand-ink'
              }`}
            >
              <Icono className="h-4 w-4" aria-hidden="true" />
              {nombre}
            </button>
          );
        })}
      </nav>

      <div className="space-y-6">

      {/* =====================================================
          RESUMEN
         ===================================================== */}

      {vista ===
        'resumen' && (

        <RiskDashboard
          onContinuar={
            continuarBorrador
          }
          onVerMatriz={
            verMatrizHistorial
          }
        />

      )}


      {/* =====================================================
          EVALUACIÓN

          Permanece montada para conservar
          los datos al cambiar de pestaña.
         ===================================================== */}

      <div
        className={
          vista ===
          'evaluacion'
            ? 'block'
            : 'hidden'
        }
      >

        <RiskEvaluationForm
          key={
            evaluacionKey
          }

          analisisInicialId={
            analisisInicialId
          }

          onRiesgoInherenteChange={
            setRiesgoInherente
          }

          onRiesgoResidualChange={
            setRiesgoResidual
          }

          onAnalisisGuardado={(
            id
          ) => {

            /*
            * La evaluación ya existe como
            * borrador.
            */
            setEstadoEvaluacionActiva(
              'borrador'
            );


            /*
            * Un borrador todavía no habilita
            * PDF en el Heatmap.
            */
            setHeatmapAnalisisId(
              null
            );


            /*
            * Al guardar el borrador regresamos
            * automáticamente al Resumen.
            *
            * RiskDashboard se vuelve a montar
            * y consulta nuevamente el historial,
            * por lo que el borrador aparecerá allí.
            */
            setVista(
              'resumen'
            );


            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }}

          onAnalisisRegistrado={(
            id
          ) => {
            setEstadoEvaluacionActiva(
              'registrada'
            );

            /*
             * Si veníamos de un borrador del
             * historial, ya no necesitamos
             * mantenerlo como ID inicial.
             */
            setAnalisisInicialId(
              null
            );

            /*
             * La evaluación registrada sí puede
             * descargar PDF desde el Heatmap.
             */
            setHeatmapAnalisisId(
              id
            );
          }}
        />

      </div>


      {/* =====================================================
          HEATMAP
         ===================================================== */}

      <div
        className={
          vista ===
          'heatmap'
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
            heatmapAnalisisId
          }
        />

      </div>


      {/* =====================================================
          MODAL NUEVA EVALUACIÓN
         ===================================================== */}

      {modalNuevaEvaluacionAbierto && (

        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]">

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-nueva-evaluacion"
            className="w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          >

            {/* HEADER */}

            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-bold text-muted">
                    Matrices de riesgo
                  </p>

                  <h2
                    id="titulo-nueva-evaluacion"
                    className="mt-1 text-xl font-bold text-slate-950"
                  >
                    Iniciar nueva evaluación
                  </h2>
                </div>

              </div>


              <button
                type="button"
                onClick={() =>
                  setModalNuevaEvaluacionAbierto(
                    false
                  )
                }
                aria-label="Cerrar"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>

            </div>


            {/* CONTENIDO */}

            <div className="px-6 py-6">

              {estadoEvaluacionActiva ===
              'registrada' ? (

                <p className="text-sm leading-6 text-slate-600">
                  La evaluación actual ya fue registrada.
                  Puedes iniciar una nueva evaluación sin
                  afectar el registro anterior.
                </p>

              ) : (

                <p className="text-sm leading-6 text-slate-600">
                  El borrador actual ya se encuentra guardado.
                  Puedes iniciar una nueva evaluación y continuar
                  este borrador posteriormente desde el historial.
                </p>

              )}


              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

                <p className="text-sm text-slate-600">
                  Al continuar, el formulario actual se
                  limpiará y comenzará una evaluación desde cero.
                </p>

              </div>

            </div>


            {/* FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() =>
                  setModalNuevaEvaluacionAbierto(
                    false
                  )
                }
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancelar
              </button>


              <button
                type="button"
                onClick={
                  confirmarNuevaEvaluacion
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                <Plus className="h-4 w-4" />

                Iniciar nueva evaluación
              </button>

            </div>

          </div>

        </div>

      )}

      </div>
    </PageShell>
  );
}
