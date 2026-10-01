"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calculator,
  Download,
  Loader2,
  Plus,
  Save,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

import {
  matrizRiesgoService,
} from "../../services/matrizRiesgo.service";

import type {
  CatalogoMatriz,
  FactorRiesgo,
  GuardarMatrizRiesgoRequest,
  HeatmapResultadoRiesgo,
  NivelImpacto,
  NivelProbabilidad,
  NivelRiesgo,
  NivelSupervision,
  OperatividadControl,
  PeriodicidadControl,
  RespuestaControl,
  TipoControl,
  TipoEmpresa,
} from "../../types/matrizRiesgo.types";

import {
  CatalogManagerModal,
} from "../catalog/CatalogManagerModal";

import {
  RiskExposurePanel,
} from "./RiskExposurePanel";

import {
  RiskFormStepper,
} from "./RiskFormStepper";


/* ============================================================
   TYPES
   ============================================================ */

type Step =
  | 1
  | 2
  | 3
  | 4;


type FormState = {
  tipoEmpresa:
    | TipoEmpresa
    | "";

  titulo: string;

  areaId:
    | number
    | "";

  procesoId:
    | number
    | "";

  detalleRiesgo: string;

  factor:
    | FactorRiesgo
    | "";

  probabilidad:
    | NivelProbabilidad
    | "";

  impactoEstimado: string;
};


type ControlState = {
  controlDescripcion: string;

  controlDocumento: string;

  controlAreaId:
    | number
    | "";

  supervision:
    | NivelSupervision
    | "";

  tipoControl:
    | TipoControl
    | "";

  operatividad:
    | OperatividadControl
    | "";

  periodicidad:
    | PeriodicidadControl
    | "";

  frecuenciaOportuna:
    | RespuestaControl
    | "";

  seguimientoAdecuado:
    | RespuestaControl
    | "";
};


type TratamientoState = {
  planAccion: string;

  areaResponsableId:
    | number
    | "";

  fechaInicio: string;

  fechaCierre: string;
};


/* ============================================================
   INITIAL STATE
   ============================================================ */

const initialForm:
  FormState = {

    tipoEmpresa: "",

    titulo: "",

    areaId: "",

    procesoId: "",

    detalleRiesgo: "",

    factor: "",

    probabilidad: "",

    impactoEstimado: "",
  };


const initialControl:
  ControlState = {

    controlDescripcion: "",

    controlDocumento: "",

    controlAreaId: "",

    supervision: "",

    tipoControl: "",

    operatividad: "",

    periodicidad: "",

    frecuenciaOportuna: "",

    seguimientoAdecuado: "",
  };


const initialTratamiento:
  TratamientoState = {

    planAccion: "",

    areaResponsableId: "",

    fechaInicio: "",

    fechaCierre: "",
  };


/* ============================================================
   PROPS
   ============================================================ */

interface RiskEvaluationFormProps {

  analisisInicialId?:
    | number
    | null;


  onRiesgoInherenteChange?: (
    resultado:
      | HeatmapResultadoRiesgo
      | null
  ) => void;


  onRiesgoResidualChange?: (
    resultado:
      | HeatmapResultadoRiesgo
      | null
  ) => void;


  onAnalisisGuardado?: (
    id: number
  ) => void;


  onAnalisisRegistrado?: (
    id: number
  ) => void;


  onNuevaEvaluacion?: () => void;
}


/* ============================================================
   COMPONENT
   ============================================================ */

export function RiskEvaluationForm({

  analisisInicialId,

  onRiesgoInherenteChange,

  onRiesgoResidualChange,

  onAnalisisGuardado,

  onAnalisisRegistrado,

  onNuevaEvaluacion,

}: RiskEvaluationFormProps) {


  /* ==========================================================
     NAVEGACIÓN
     ========================================================== */

  const [
    currentStep,
    setCurrentStep,
  ] =
    useState<Step>(1);


  const [
    forzarNuevaEvaluacion,
    setForzarNuevaEvaluacion,
  ] =
    useState(false);


  /* ==========================================================
     FORMULARIOS
     ========================================================== */

  const [
    form,
    setForm,
  ] =
    useState<FormState>(
      initialForm
    );


  const [
    controles,
    setControles,
  ] =
    useState<ControlState>(
      initialControl
    );


  const [
    tratamiento,
    setTratamiento,
  ] =
    useState<TratamientoState>(
      initialTratamiento
    );


  /* ==========================================================
     CATÁLOGOS
     ========================================================== */

  const [
    areas,
    setAreas,
  ] =
    useState<
      CatalogoMatriz[]
    >([]);


  const [
    procesos,
    setProcesos,
  ] =
    useState<
      CatalogoMatriz[]
    >([]);


  const [
    cargandoAreas,
    setCargandoAreas,
  ] =
    useState(true);


  const [
    cargandoProcesos,
    setCargandoProcesos,
  ] =
    useState(false);


  const [
    cargandoAnalisisInicial,
    setCargandoAnalisisInicial,
  ] =
    useState(false);


  /* ==========================================================
     ESTADOS DE PROCESO
     ========================================================== */

  const [
    calculando,
    setCalculando,
  ] =
    useState(false);


  const [
    calculandoResidual,
    setCalculandoResidual,
  ] =
    useState(false);


  const [
    guardando,
    setGuardando,
  ] =
    useState(false);


  const [
    registrando,
    setRegistrando,
  ] =
    useState(false);


  const [
    descargandoPdf,
    setDescargandoPdf,
  ] =
    useState(false);


  /* ==========================================================
     MENSAJES
     ========================================================== */

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);


  const [
    mensajeExito,
    setMensajeExito,
  ] =
    useState<
      string | null
    >(null);


  /* ==========================================================
     ANÁLISIS
     ========================================================== */

  const [
    analisisId,
    setAnalisisId,
  ] =
    useState<
      number | null
    >(null);


  const [
    analisisRegistradoId,
    setAnalisisRegistradoId,
  ] =
    useState<
      number | null
    >(null);


  /* ==========================================================
     RESULTADO INHERENTE
     ========================================================== */

  const [
    impactoInherente,
    setImpactoInherente,
  ] =
    useState<
      NivelImpacto | null
    >(null);


  const [
    riesgoInherente,
    setRiesgoInherente,
  ] =
    useState<
      NivelRiesgo | null
    >(null);


  /* ==========================================================
     RESULTADO RESIDUAL
     ========================================================== */

  const [
    mitigacion,
    setMitigacion,
  ] =
    useState<
      number | null
    >(null);


  const [
    probabilidadResidual,
    setProbabilidadResidual,
  ] =
    useState<
      NivelProbabilidad | null
    >(null);


  const [
    impactoResidual,
    setImpactoResidual,
  ] =
    useState<
      NivelImpacto | null
    >(null);


  const [
    riesgoResidual,
    setRiesgoResidual,
  ] =
    useState<
      NivelRiesgo | null
    >(null);


  /* ==========================================================
     MODAL CATÁLOGOS
     ========================================================== */

  const [
    catalogManagerOpen,
    setCatalogManagerOpen,
  ] =
    useState(false);


  /* ==========================================================
     MODO ACTUAL
     ========================================================== */

  const continuandoBorrador =
    Boolean(
      analisisInicialId &&
      !forzarNuevaEvaluacion
    );


  /* ============================================================
     LOAD
     ============================================================ */

  useEffect(() => {

    void cargarAreas();

  }, []);


  useEffect(() => {

    if (!analisisInicialId) {
      return;
    }


    setForzarNuevaEvaluacion(
      false
    );


    void cargarAnalisisInicial(
      analisisInicialId
    );

  }, [
    analisisInicialId,
  ]);


  /* ============================================================
     CARGAR ÁREAS
     ============================================================ */

  async function cargarAreas() {

    try {

      setCargandoAreas(
        true
      );


      const data =
        await matrizRiesgoService
          .listarAreas();


      setAreas(
        data
      );

    } catch {

      setError(
        "No se pudieron cargar las áreas."
      );

    } finally {

      setCargandoAreas(
        false
      );
    }
  }


  /* ============================================================
     CARGAR BORRADOR
     ============================================================ */

  async function cargarAnalisisInicial(
    id: number
  ) {

    try {

      setCargandoAnalisisInicial(
        true
      );

      setError(
        null
      );

      setMensajeExito(
        null
      );


      const detalle =
        await matrizRiesgoService
          .obtenerAnalisis(
            id
          );


      /*
       * Solo permitimos continuar
       * evaluaciones en edición.
       */
      if (
        detalle.estado !==
        "EDITANDO"
      ) {

        setError(
          "La evaluación seleccionada ya no se encuentra en estado borrador."
        );

        return;
      }


      /* ========================================================
         CARGAR PROCESOS DEL ÁREA
         ======================================================== */

      if (
        detalle.areaId
      ) {

        try {

          setCargandoProcesos(
            true
          );


          const procesosArea =
            await matrizRiesgoService
              .listarProcesosPorArea(
                detalle.areaId
              );


          setProcesos(
            procesosArea
          );

        } catch {

          setProcesos(
            []
          );

        } finally {

          setCargandoProcesos(
            false
          );
        }

      } else {

        setProcesos(
          []
        );
      }


      /* ========================================================
         PASO 01
         ======================================================== */

      setForm({

        tipoEmpresa:
          detalle.tipoEmpresa ??
          "",

        titulo:
          detalle.titulo ??
          "",

        areaId:
          detalle.areaId ??
          "",

        procesoId:
          detalle.procesoId ??
          "",

        detalleRiesgo:
          detalle.detalleRiesgo ??
          "",

        factor:
          detalle.factor ??
          "",

        probabilidad:
          detalle.probabilidad ??
          "",

        impactoEstimado:
          detalle.impactoEstimado !=
          null
            ? String(
                detalle
                  .impactoEstimado
              )
            : "",
      });


      /* ========================================================
         PASO 02
         ======================================================== */

      setControles({

        controlDescripcion:
          detalle
            .controlDescripcion ??
          "",

        controlDocumento:
          detalle
            .controlDocumento ??
          "",

        controlAreaId:
          detalle
            .controlAreaId ??
          "",

        supervision:
          detalle
            .supervision ??
          "",

        tipoControl:
          detalle
            .tipoControl ??
          "",

        operatividad:
          detalle
            .operatividad ??
          "",

        periodicidad:
          detalle
            .periodicidad ??
          "",

        frecuenciaOportuna:
          detalle
            .frecuenciaOportuna ==
          null
            ? ""
            : detalle
                .frecuenciaOportuna
              ? "SI"
              : "NO",

        seguimientoAdecuado:
          detalle
            .seguimientoAdecuado ==
          null
            ? ""
            : detalle
                .seguimientoAdecuado
              ? "SI"
              : "NO",
      });


      /* ========================================================
         PASO 04
         ======================================================== */

      setTratamiento({

        planAccion:
          detalle.planAccion ??
          "",

        areaResponsableId:
          detalle
            .areaResponsableId ??
          "",

        fechaInicio:
          detalle.fechaInicio ??
          "",

        fechaCierre:
          detalle.fechaCierre ??
          "",
      });


      /* ========================================================
         ID
         ======================================================== */

      setAnalisisId(
        detalle.id
      );


      /*
       * Sigue siendo borrador.
       */
      setAnalisisRegistradoId(
        null
      );


      /* ========================================================
         RESULTADO INHERENTE
         ======================================================== */

      setImpactoInherente(
        detalle
          .impactoInherente ??
        null
      );


      setRiesgoInherente(
        detalle
          .riesgoInherente ??
        null
      );


      if (
        detalle.probabilidad &&
        detalle.impactoInherente &&
        detalle.riesgoInherente
      ) {

        onRiesgoInherenteChange?.({

          probabilidad:
            detalle.probabilidad,

          impacto:
            detalle
              .impactoInherente,

          riesgo:
            detalle
              .riesgoInherente,
        });

      } else {

        onRiesgoInherenteChange?.(
          null
        );
      }


      /* ========================================================
         RESULTADO RESIDUAL
         ======================================================== */

      setMitigacion(
        detalle.mitigacion ??
        null
      );


      setProbabilidadResidual(
        detalle
          .probabilidadResidual ??
        null
      );


      setImpactoResidual(
        detalle
          .impactoResidual ??
        null
      );


      setRiesgoResidual(
        detalle
          .riesgoResidual ??
        null
      );


      if (
        detalle
          .probabilidadResidual &&
        detalle
          .impactoResidual &&
        detalle
          .riesgoResidual
      ) {

        onRiesgoResidualChange?.({

          probabilidad:
            detalle
              .probabilidadResidual,

          impacto:
            detalle
              .impactoResidual,

          riesgo:
            detalle
              .riesgoResidual,
        });

      } else {

        onRiesgoResidualChange?.(
          null
        );
      }


      /* ========================================================
         DETERMINAR PASO
         ======================================================== */

      if (
        detalle.planAccion ||
        detalle
          .areaResponsableId ||
        detalle.fechaInicio ||
        detalle.fechaCierre
      ) {

        setCurrentStep(
          4
        );

      } else if (
        detalle.riesgoResidual
      ) {

        setCurrentStep(
          3
        );

      } else if (
        detalle.riesgoInherente
      ) {

        setCurrentStep(
          2
        );

      } else {

        setCurrentStep(
          1
        );
      }


      setMensajeExito(
        "Borrador cargado correctamente. Puedes continuar la evaluación."
      );

    } catch (error) {

      console.error(
        "Error cargando borrador:",
        error
      );


      setError(
        "No fue posible cargar el borrador seleccionado."
      );

    } finally {

      setCargandoAnalisisInicial(
        false
      );
    }
  }


  /* ============================================================
     ACTUALIZAR CATÁLOGOS
     ============================================================ */

  async function actualizarCatalogos() {

    await cargarAreas();


    if (
      !form.areaId
    ) {
      return;
    }


    try {

      const data =
        await matrizRiesgoService
          .listarProcesosPorArea(
            Number(
              form.areaId
            )
          );


      setProcesos(
        data
      );

    } catch {

      // No bloqueamos el formulario.
    }
  }


  /* ============================================================
     AREA / PROCESO
     ============================================================ */

  async function seleccionarArea(
    areaId: string
  ) {

    const id =
      areaId
        ? Number(
            areaId
          )
        : "";


    setForm(
      (prev) => ({

        ...prev,

        areaId:
          id,

        procesoId:
          "",
      })
    );


    setProcesos(
      []
    );


    if (
      !id
    ) {
      return;
    }


    try {

      setError(
        null
      );

      setCargandoProcesos(
        true
      );


      const data =
        await matrizRiesgoService
          .listarProcesosPorArea(
            id
          );


      setProcesos(
        data
      );

    } catch {

      setError(
        "No se pudieron cargar los procesos del área."
      );

    } finally {

      setCargandoProcesos(
        false
      );
    }
  }


  /* ============================================================
     RESET RESULTADOS
     ============================================================ */

  function limpiarResidual() {

    setMitigacion(
      null
    );

    setProbabilidadResidual(
      null
    );

    setImpactoResidual(
      null
    );

    setRiesgoResidual(
      null
    );

    onRiesgoResidualChange?.(
      null
    );
  }


  function limpiarInherente() {

    setImpactoInherente(
      null
    );

    setRiesgoInherente(
      null
    );

    onRiesgoInherenteChange?.(
      null
    );

    limpiarResidual();
  }


  /* ============================================================
     STEP 01 - INHERENTE
     ============================================================ */

  async function calcularInherente() {

    setError(
      null
    );

    setMensajeExito(
      null
    );


    if (
      !form.probabilidad ||
      !form.impactoEstimado
    ) {

      setError(
        "Selecciona la probabilidad e ingresa el impacto estimado."
      );

      return;
    }


    const impacto =
      Number(
        form.impactoEstimado
      );


    if (
      Number.isNaN(
        impacto
      ) ||
      impacto < 0
    ) {

      setError(
        "El impacto estimado debe ser un número válido."
      );

      return;
    }


    try {

      setCalculando(
        true
      );


      const resultado =
        await matrizRiesgoService
          .calcularRiesgoInherente({

            probabilidad:
              form.probabilidad,

            impactoEstimado:
              impacto,
          });


      setImpactoInherente(
        resultado.impacto
      );


      setRiesgoInherente(
        resultado
          .riesgoInherente
      );


      onRiesgoInherenteChange?.({

        probabilidad:
          resultado
            .probabilidad,

        impacto:
          resultado
            .impacto,

        riesgo:
          resultado
            .riesgoInherente,
      });


      /*
       * Al recalcular el inherente,
       * el residual anterior deja
       * de ser válido.
       */
      limpiarResidual();

    } catch {

      setError(
        "No fue posible calcular el riesgo inherente."
      );

    } finally {

      setCalculando(
        false
      );
    }
  }


  function continuarAControles() {

    setError(
      null
    );

    setMensajeExito(
      null
    );


    if (
      !form.tipoEmpresa
    ) {

      setError(
        "Selecciona el tipo de empresa."
      );

      return;
    }


    if (
      !form.titulo.trim()
    ) {

      setError(
        "Ingresa el título del riesgo."
      );

      return;
    }


    if (
      !form.areaId
    ) {

      setError(
        "Selecciona un área."
      );

      return;
    }


    if (
      !form.procesoId
    ) {

      setError(
        "Selecciona un proceso."
      );

      return;
    }


    if (
      !form
        .detalleRiesgo
        .trim()
    ) {

      setError(
        "Ingresa el detalle del riesgo."
      );

      return;
    }


    if (
      !form.factor
    ) {

      setError(
        "Selecciona el factor de riesgo."
      );

      return;
    }


    if (
      !form.probabilidad ||
      !form.impactoEstimado
    ) {

      setError(
        "Completa la probabilidad y el impacto estimado."
      );

      return;
    }


    if (
      !impactoInherente ||
      !riesgoInherente
    ) {

      setError(
        "Primero debes calcular el riesgo inherente."
      );

      return;
    }


    setCurrentStep(
      2
    );


    scrollTop();
  }


  /* ============================================================
     STEP 02 - CONTROLES
     ============================================================ */

  function actualizarControl<
    K extends keyof ControlState
  >(
    campo: K,
    valor: ControlState[K]
  ) {

    setControles(
      (prev) => ({

        ...prev,

        [campo]:
          valor,
      })
    );


    const camposCalculo:
      Array<
        keyof ControlState
      > = [

        "supervision",

        "tipoControl",

        "operatividad",

        "periodicidad",

        "frecuenciaOportuna",

        "seguimientoAdecuado",
      ];


    if (
      camposCalculo.includes(
        campo
      )
    ) {

      limpiarResidual();
    }
  }


  async function calcularResidual() {

    setError(
      null
    );

    setMensajeExito(
      null
    );


    if (
      !controles.supervision ||
      !controles.tipoControl ||
      !controles.operatividad ||
      !controles.periodicidad ||
      !controles.frecuenciaOportuna ||
      !controles.seguimientoAdecuado
    ) {

      setError(
        "Completa todos los datos de diseño y ejecución del control."
      );

      return;
    }


    if (
      !form.tipoEmpresa ||
      !form.probabilidad ||
      !form.impactoEstimado
    ) {

      setError(
        "Faltan datos del riesgo inherente."
      );

      return;
    }


    const impacto =
      Number(
        form.impactoEstimado
      );


    try {

      setCalculandoResidual(
        true
      );


      const resultado =
        await matrizRiesgoService
          .calcularRiesgoResidual({

            probabilidadInherente:
              form.probabilidad,

            impactoEstimado:
              impacto,

            tipoEmpresa:
              form.tipoEmpresa,

            supervision:
              controles
                .supervision,

            tipoControl:
              controles
                .tipoControl,

            operatividad:
              controles
                .operatividad,

            periodicidad:
              controles
                .periodicidad,

            frecuenciaOportuna:
              controles
                .frecuenciaOportuna,

            seguimientoAdecuado:
              controles
                .seguimientoAdecuado,
          });


      setMitigacion(
        resultado
          .mitigacion
      );


      setProbabilidadResidual(
        resultado
          .probabilidadResidual
      );


      setImpactoResidual(
        resultado
          .impactoResidual
      );


      setRiesgoResidual(
        resultado
          .riesgoResidual
      );


      onRiesgoResidualChange?.({

        probabilidad:
          resultado
            .probabilidadResidual,

        impacto:
          resultado
            .impactoResidual,

        riesgo:
          resultado
            .riesgoResidual,
      });

    } catch {

      setError(
        "No fue posible calcular el riesgo residual."
      );

    } finally {

      setCalculandoResidual(
        false
      );
    }
  }


  function continuarAResidual() {

    if (
      !riesgoResidual
    ) {

      setError(
        "Primero debes calcular el riesgo residual."
      );

      return;
    }


    setError(
      null
    );


    setCurrentStep(
      3
    );


    scrollTop();
  }


  /* ============================================================
     REQUEST
     ============================================================ */

  function construirRequest():
    GuardarMatrizRiesgoRequest {

    return {

      id:
        analisisId ??
        undefined,


      tipoEmpresa:
        form.tipoEmpresa ||
        undefined,


      titulo:
        form.titulo.trim() ||
        undefined,


      areaId:
        form.areaId ||
        undefined,


      procesoId:
        form.procesoId ||
        undefined,


      detalleRiesgo:
        form
          .detalleRiesgo
          .trim() ||
        undefined,


      factor:
        form.factor ||
        undefined,


      probabilidad:
        form.probabilidad ||
        undefined,


      impactoEstimado:
        form.impactoEstimado
          ? Number(
              form
                .impactoEstimado
            )
          : undefined,


      controlDescripcion:
        controles
          .controlDescripcion
          .trim() ||
        undefined,


      controlDocumento:
        controles
          .controlDocumento
          .trim() ||
        undefined,


      controlAreaId:
        controles
          .controlAreaId ||
        undefined,


      supervision:
        controles
          .supervision ||
        undefined,


      tipoControl:
        controles
          .tipoControl ||
        undefined,


      operatividad:
        controles
          .operatividad ||
        undefined,


      periodicidad:
        controles
          .periodicidad ||
        undefined,


      frecuenciaOportuna:
        controles
          .frecuenciaOportuna ||
        undefined,


      seguimientoAdecuado:
        controles
          .seguimientoAdecuado ||
        undefined,


      planAccion:
        tratamiento
          .planAccion
          .trim() ||
        undefined,


      areaResponsableId:
        tratamiento
          .areaResponsableId ||
        undefined,


      fechaInicio:
        tratamiento
          .fechaInicio ||
        undefined,


      fechaCierre:
        tratamiento
          .fechaCierre ||
        undefined,
    };
  }


  /* ============================================================
     GUARDAR BORRADOR
     ============================================================ */

  async function guardarBorrador() {

    if (
      analisisRegistradoId !==
      null
    ) {
      return;
    }


    try {

      setGuardando(
        true
      );

      setError(
        null
      );

      setMensajeExito(
        null
      );


      const request =
        construirRequest();


      const resultado =
        analisisId
          ? await matrizRiesgoService
              .actualizarAnalisis(
                analisisId,
                request
              )
          : await matrizRiesgoService
              .guardarBorrador(
                request
              );


      setAnalisisId(
        resultado.id
      );


      onAnalisisGuardado?.(
        resultado.id
      );


      setMensajeExito(
        analisisId
          ? "Borrador actualizado correctamente."
          : "Borrador guardado correctamente."
      );

    } catch {

      setError(
        "No fue posible guardar el borrador."
      );

    } finally {

      setGuardando(
        false
      );
    }
  }


  /* ============================================================
     VALIDAR REGISTRO
     ============================================================ */

  function validarRegistroCompleto() {

    if (
      !form.tipoEmpresa ||
      !form.titulo.trim() ||
      !form.areaId ||
      !form.procesoId ||
      !form.detalleRiesgo.trim() ||
      !form.factor ||
      !form.probabilidad ||
      !form.impactoEstimado
    ) {

      setError(
        "Faltan datos obligatorios del riesgo inherente."
      );

      return false;
    }


    if (
      !controles.periodicidad ||
      !controles.operatividad ||
      !controles.tipoControl ||
      !controles.supervision ||
      !controles.frecuenciaOportuna ||
      !controles.seguimientoAdecuado
    ) {

      setError(
        "Faltan datos obligatorios de diseño y ejecución del control."
      );

      return false;
    }


    if (
      !riesgoResidual
    ) {

      setError(
        "Primero debes calcular el riesgo residual."
      );

      return false;
    }


    if (
      tratamiento.fechaInicio &&
      tratamiento.fechaCierre &&
      tratamiento.fechaCierre <
        tratamiento.fechaInicio
    ) {

      setError(
        "La fecha de cierre no puede ser anterior a la fecha de inicio."
      );

      return false;
    }


    return true;
  }


  /* ============================================================
     REGISTRAR
     ============================================================ */

  async function registrarEvaluacion() {

    if (
      analisisRegistradoId !==
      null
    ) {
      return;
    }


    setError(
      null
    );

    setMensajeExito(
      null
    );


    if (
      !validarRegistroCompleto()
    ) {
      return;
    }


    try {

      setRegistrando(
        true
      );


      const resultado =
        await matrizRiesgoService
          .registrarAnalisis(
            construirRequest()
          );


      setAnalisisId(
        resultado.id
      );


      setAnalisisRegistradoId(
        resultado.id
      );


      onAnalisisRegistrado?.(
        resultado.id
      );


      setMensajeExito(
        "Evaluación registrada correctamente. Ya puedes descargar el PDF o iniciar una nueva evaluación."
      );

      /*
       * No hacemos scrollTop().
       *
       * El usuario permanece abajo
       * y los botones cambian a:
       *
       * Descargar PDF
       * Nueva evaluación
       */

    } catch {

      setError(
        "No fue posible registrar la evaluación. Verifica los campos obligatorios."
      );

    } finally {

      setRegistrando(
        false
      );
    }
  }


  /* ============================================================
     DESCARGAR PDF
     ============================================================ */

  async function descargarPdfEvaluacion() {

    if (
      !analisisRegistradoId
    ) {

      setError(
        "Primero debes registrar la evaluación antes de descargar el PDF."
      );

      return;
    }


    try {

      setDescargandoPdf(
        true
      );

      setError(
        null
      );


      const pdf =
        await matrizRiesgoService
          .descargarPdf(
            analisisRegistradoId
          );


      const url =
        window.URL
          .createObjectURL(
            pdf
          );


      const enlace =
        document
          .createElement(
            "a"
          );


      enlace.href =
        url;


      enlace.download =
        `matriz-riesgo-${analisisRegistradoId}.pdf`;


      document.body
        .appendChild(
          enlace
        );


      enlace.click();


      enlace.remove();


      window.setTimeout(
        () => {

          window.URL
            .revokeObjectURL(
              url
            );

        },
        1000
      );

    } catch {

      setError(
        "No fue posible descargar el PDF de la evaluación."
      );

    } finally {

      setDescargandoPdf(
        false
      );
    }
  }


  /* ============================================================
     NUEVA EVALUACIÓN
     ============================================================ */

  function iniciarNuevaEvaluacion() {

    /*
     * Evita que visualmente siga apareciendo
     * "Continuar evaluación" cuando venimos
     * de un borrador.
     */
    setForzarNuevaEvaluacion(
      true
    );


    /* PASO */

    setCurrentStep(
      1
    );


    /* FORMULARIOS */

    setForm(
      initialForm
    );


    setControles(
      initialControl
    );


    setTratamiento(
      initialTratamiento
    );


    /* PROCESOS */

    setProcesos(
      []
    );


    /* IDS */

    setAnalisisId(
      null
    );


    setAnalisisRegistradoId(
      null
    );


    /* INHERENTE */

    setImpactoInherente(
      null
    );


    setRiesgoInherente(
      null
    );


    /* RESIDUAL */

    setMitigacion(
      null
    );


    setProbabilidadResidual(
      null
    );


    setImpactoResidual(
      null
    );


    setRiesgoResidual(
      null
    );


    /* MENSAJES */

    setError(
      null
    );


    setMensajeExito(
      null
    );


    /* HEATMAP */

    onRiesgoInherenteChange?.(
      null
    );


    onRiesgoResidualChange?.(
      null
    );


    /*
     * Avisamos al Workspace para que
     * también elimine el ID anterior.
     */
    onNuevaEvaluacion?.();


    scrollTop();
  }


  /* ============================================================
     LOADING BORRADOR
     ============================================================ */

  if (
    cargandoAnalisisInicial
  ) {

    return (

      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">

        <div className="flex flex-col items-center gap-3 text-slate-500">

          <Loader2
            className="h-7 w-7 animate-spin"
          />


          <p className="text-sm font-medium">
            Cargando borrador...
          </p>

        </div>

      </div>
    );
  }


  /* ============================================================
     UI
     ============================================================ */

  return (

    <div className="min-h-screen bg-[#F7F9FC] px-5 py-7 lg:px-8">

      <div className="mx-auto max-w-[1500px]">


        {/* ======================================================
            HEADER
           ====================================================== */}

        <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-2">

              <span className="h-2 w-2 rounded-full bg-[#ED1C24]" />


              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#547AA7]">
                Matriz de riesgo
              </p>

            </div>


            <h1 className="text-3xl font-bold tracking-tight text-[#231F20] lg:text-4xl">

              {continuandoBorrador
                ? "Continuar evaluación"
                : "Nueva evaluación"}

            </h1>


            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">

              {continuandoBorrador
                ? "Continúa completando el borrador guardado hasta registrar la evaluación."
                : "Identifica la exposición, evalúa los controles y define el tratamiento del riesgo."}

            </p>

          </div>


          <div className="flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={() =>
                setCatalogManagerOpen(
                  true
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#C6D0E2] bg-white px-5 py-3 text-sm font-semibold text-[#1B4589] transition hover:bg-[#E8ECF3]"
            >

              <Settings2
                size={18}
              />

              Gestionar áreas y procesos

            </button>

          </div>

        </header>


        {/* ======================================================
            STEPPER
           ====================================================== */}

        <div className="mb-7 rounded-[24px] border border-[#E8ECF3] bg-white p-5">

          <RiskFormStepper
            currentStep={
              currentStep
            }
          />

        </div>


        {/* ======================================================
            MENSAJES
           ====================================================== */}

        {error && (

          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">

            <ShieldAlert
              size={18}
            />

            {error}

          </div>

        )}


        {mensajeExito && (

          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">

            <ShieldCheck
              size={18}
            />

            {mensajeExito}

          </div>

        )}


        {/* ======================================================
            CONTENIDO
           ====================================================== */}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">


          {/* =====================================================
              STEP 01
             ===================================================== */}

          {currentStep === 1 && (

            <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">

              <div className="mb-8">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  01 · Identificación
                </p>


                <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                  Riesgo inherente
                </h2>


                <p className="mt-2 text-sm text-slate-500">
                  Describe el evento antes de considerar controles o medidas de mitigación.
                </p>

              </div>


              <div className="grid gap-5 lg:grid-cols-2">


                {/* TIPO EMPRESA */}

                <Field label="Tipo de empresa">

                  <select
                    value={
                      form.tipoEmpresa
                    }
                    onChange={(e) => {

                      setForm(
                        (prev) => ({

                          ...prev,

                          tipoEmpresa:
                            e.target
                              .value as TipoEmpresa,
                        })
                      );


                      limpiarResidual();
                    }}
                    className={
                      inputClass
                    }
                  >

                    <option value="">
                      Seleccionar
                    </option>

                    <option value="GRAN_EMPRESA">
                      Gran Empresa
                    </option>

                    <option value="MEDIANA_EMPRESA">
                      Mediana Empresa
                    </option>

                    <option value="PEQUENA_EMPRESA">
                      Pequeña Empresa
                    </option>

                    <option value="MICROEMPRESA">
                      Microempresa
                    </option>

                  </select>

                </Field>


                {/* TÍTULO */}

                <Field label="Título del riesgo">

                  <input
                    value={
                      form.titulo
                    }
                    onChange={(e) =>

                      setForm(
                        (prev) => ({

                          ...prev,

                          titulo:
                            e.target
                              .value,
                        })
                      )
                    }
                    placeholder="Ej. Acceso no autorizado al sistema"
                    className={
                      inputClass
                    }
                  />

                </Field>


                {/* ÁREA */}

                <Field
                  label="Área"
                  icon={
                    <Building2
                      size={15}
                    />
                  }
                >

                  <select
                    value={
                      form.areaId
                    }
                    disabled={
                      cargandoAreas
                    }
                    onChange={(e) =>
                      void seleccionarArea(
                        e.target.value
                      )
                    }
                    className={
                      inputClass
                    }
                  >

                    <option value="">

                      {cargandoAreas
                        ? "Cargando..."
                        : "Seleccionar área"}

                    </option>


                    {areas.map(
                      (area) => (

                        <option
                          key={
                            area.id
                          }
                          value={
                            area.id
                          }
                        >
                          {area.nombre}
                        </option>

                      )
                    )}

                  </select>

                </Field>


                {/* PROCESO */}

                <Field label="Proceso">

                  <select
                    value={
                      form.procesoId
                    }
                    disabled={
                      !form.areaId ||
                      cargandoProcesos
                    }
                    onChange={(e) =>

                      setForm(
                        (prev) => ({

                          ...prev,

                          procesoId:
                            e.target.value
                              ? Number(
                                  e.target.value
                                )
                              : "",
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  >

                    <option value="">

                      {cargandoProcesos
                        ? "Cargando..."
                        : form.areaId
                          ? "Seleccionar proceso"
                          : "Primero selecciona un área"}

                    </option>


                    {procesos.map(
                      (proceso) => (

                        <option
                          key={
                            proceso.id
                          }
                          value={
                            proceso.id
                          }
                        >
                          {proceso.nombre}
                        </option>

                      )
                    )}

                  </select>

                </Field>


                {/* DETALLE */}

                <div className="lg:col-span-2">

                  <Field label="Detalle del riesgo">

                    <textarea
                      rows={4}
                      value={
                        form.detalleRiesgo
                      }
                      onChange={(e) =>

                        setForm(
                          (prev) => ({

                            ...prev,

                            detalleRiesgo:
                              e.target.value,
                          })
                        )
                      }
                      placeholder="Describe qué puede ocurrir, cómo y cuál sería la consecuencia."
                      className={`${inputClass} resize-none`}
                    />

                  </Field>

                </div>


                {/* FACTOR */}

                <Field label="Factor de riesgo">

                  <select
                    value={
                      form.factor
                    }
                    onChange={(e) =>

                      setForm(
                        (prev) => ({

                          ...prev,

                          factor:
                            e.target
                              .value as FactorRiesgo,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  >

                    <option value="">
                      Seleccionar
                    </option>

                    <option value="EVENTOS_EXTERNOS">
                      Eventos externos
                    </option>

                    <option value="PERSONAS">
                      Personas
                    </option>

                    <option value="TECNOLOGIA">
                      Tecnología
                    </option>

                    <option value="PROCESOS">
                      Procesos
                    </option>

                  </select>

                </Field>


                {/* PROBABILIDAD */}

                <Field label="Probabilidad">

                  <select
                    value={
                      form.probabilidad
                    }
                    onChange={(e) => {

                      setForm(
                        (prev) => ({

                          ...prev,

                          probabilidad:
                            e.target
                              .value as NivelProbabilidad,
                        })
                      );


                      limpiarInherente();
                    }}
                    className={
                      inputClass
                    }
                  >

                    <option value="">
                      Seleccionar
                    </option>

                    <option value="MUY_ALTA">
                      Muy Alta · 5 o más veces al año
                    </option>

                    <option value="ALTA">
                      Alta · 2 a 4 veces al año
                    </option>

                    <option value="MEDIA">
                      Media · 1 vez al año
                    </option>

                    <option value="BAJA">
                      Baja · 1 vez cada 3 años
                    </option>

                    <option value="MUY_BAJA">
                      Muy Baja · cada 5 o más años
                    </option>

                  </select>

                </Field>


                {/* IMPACTO */}

                <Field label="Impacto estimado">

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#547AA7]">
                      S/
                    </span>


                    <input
                      type="number"
                      min="0"
                      value={
                        form.impactoEstimado
                      }
                      onChange={(e) => {

                        setForm(
                          (prev) => ({

                            ...prev,

                            impactoEstimado:
                              e.target.value,
                          })
                        );


                        limpiarInherente();
                      }}
                      placeholder="0.00"
                      className={`${inputClass} pl-11`}
                    />

                  </div>

                </Field>


                {/* CALCULAR */}

                <div className="flex items-end">

                  <button
                    type="button"
                    onClick={
                      calcularInherente
                    }
                    disabled={
                      calculando
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4589] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#163a74] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {calculando ? (

                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                    ) : (

                      <Calculator
                        size={17}
                      />

                    )}


                    Calcular riesgo inherente

                  </button>

                </div>

              </div>


              {/* NAVEGACIÓN */}

              <div className="mt-8 flex justify-end border-t border-[#E8ECF3] pt-6">

                <button
                  type="button"
                  onClick={
                    continuarAControles
                  }
                  disabled={
                    !riesgoInherente
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#231F20] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                >

                  Continuar a controles

                  <ArrowRight
                    size={17}
                  />

                </button>

              </div>

            </section>
          )}


          {/* =====================================================
              STEP 02
             ===================================================== */}

          {currentStep === 2 && (

            <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">

              <div className="mb-8 flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">

                  <SlidersHorizontal
                    size={22}
                  />

                </div>


                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                    02 · Evaluación
                  </p>


                  <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                    Controles del riesgo
                  </h2>


                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Evalúa la naturaleza, operación y seguimiento de los controles aplicados al riesgo identificado.
                  </p>

                </div>

              </div>


              {/* RESUMEN */}

              <div className="mb-7 rounded-3xl border border-[#C6D0E2] bg-[#E8ECF3]/40 p-5">

                <div className="flex items-center gap-3">

                  <ShieldCheck
                    size={20}
                    className="text-[#1B4589]"
                  />


                  <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-[#547AA7]">
                      Riesgo identificado
                    </p>


                    <p className="mt-1 font-bold text-[#231F20]">
                      {form.titulo}
                    </p>

                  </div>

                </div>


                <div className="mt-4 grid gap-3 sm:grid-cols-3">

                  <MiniSummary
                    label="Probabilidad"
                    value={
                      form.probabilidad
                    }
                  />


                  <MiniSummary
                    label="Impacto"
                    value={
                      impactoInherente ??
                      "-"
                    }
                  />


                  <MiniSummary
                    label="Riesgo"
                    value={
                      riesgoInherente ??
                      "-"
                    }
                  />

                </div>

              </div>


              {/* IDENTIFICACIÓN DEL CONTROL */}

              <div className="mb-7">

                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  Identificación del control
                </p>


                <div className="grid gap-5 lg:grid-cols-2">


                  <div className="lg:col-span-2">

                    <Field label="Descripción del control">

                      <textarea
                        rows={3}
                        value={
                          controles
                            .controlDescripcion
                        }
                        onChange={(e) =>
                          actualizarControl(
                            "controlDescripcion",
                            e.target.value
                          )
                        }
                        placeholder="Describe el control aplicado al riesgo."
                        className={`${inputClass} resize-none`}
                      />

                    </Field>

                  </div>


                  <Field label="Documento o evidencia">

                    <input
                      value={
                        controles
                          .controlDocumento
                      }
                      onChange={(e) =>
                        actualizarControl(
                          "controlDocumento",
                          e.target.value
                        )
                      }
                      placeholder="Ej. Política de seguridad TI-001"
                      className={
                        inputClass
                      }
                    />

                  </Field>


                  <Field label="Área responsable del control">

                    <select
                      value={
                        controles
                          .controlAreaId
                      }
                      onChange={(e) =>
                        actualizarControl(
                          "controlAreaId",

                          e.target.value
                            ? Number(
                                e.target.value
                              )
                            : ""
                        )
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Seleccionar área
                      </option>


                      {areas.map(
                        (area) => (

                          <option
                            key={
                              area.id
                            }
                            value={
                              area.id
                            }
                          >
                            {area.nombre}
                          </option>

                        )
                      )}

                    </select>

                  </Field>

                </div>

              </div>


              {/* DISEÑO Y EJECUCIÓN */}

              <div>

                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  Diseño y ejecución
                </p>


                <div className="grid gap-5 lg:grid-cols-2">


                  <Field label="Nivel de supervisión">

                    <select
                      value={
                        controles
                          .supervision
                      }
                      onChange={(e) =>
                        actualizarControl(
                          "supervision",

                          e.target
                            .value as NivelSupervision
                        )
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Seleccionar
                      </option>

                      <option value="DIRECTIVO_AUTOMATICO">
                        Directivo / Automático
                      </option>

                      <option value="ANALISTA_COORDINADOR">
                        Analista / Coordinador
                      </option>

                      <option value="OPERATIVO">
                        Operativo
                      </option>

                    </select>

                  </Field>


                  <Field label="Tipo de control">

                    <select
                      value={
                        controles
                          .tipoControl
                      }
                      onChange={(e) =>
                        actualizarControl(
                          "tipoControl",

                          e.target
                            .value as TipoControl
                        )
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Seleccionar
                      </option>

                      <option value="PREVENTIVO">
                        Preventivo
                      </option>

                      <option value="DETECTIVO">
                        Detectivo
                      </option>

                    </select>

                  </Field>


                  <Field label="Operatividad">

                    <select
                      value={
                        controles
                          .operatividad
                      }
                      onChange={(e) =>
                        actualizarControl(
                          "operatividad",

                          e.target
                            .value as OperatividadControl
                        )
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Seleccionar
                      </option>

                      <option value="AUTOMATICO">
                        Automático
                      </option>

                      <option value="SEMI_AUTOMATICO">
                        Semi automático
                      </option>

                      <option value="MANUAL">
                        Manual
                      </option>

                    </select>

                  </Field>


                  <Field label="Periodicidad">

                    <select
                      value={
                        controles
                          .periodicidad
                      }
                      onChange={(e) =>
                        actualizarControl(
                          "periodicidad",

                          e.target
                            .value as PeriodicidadControl
                        )
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Seleccionar
                      </option>

                      <option value="PERMANENTE">
                        Permanente
                      </option>

                      <option value="PERIODICO">
                        Periódico
                      </option>

                      <option value="EVENTUAL">
                        Eventual
                      </option>

                    </select>

                  </Field>


                  <Field label="¿La frecuencia es oportuna?">

                    <select
                      value={
                        controles
                          .frecuenciaOportuna
                      }
                      onChange={(e) =>
                        actualizarControl(
                          "frecuenciaOportuna",

                          e.target
                            .value as RespuestaControl
                        )
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Seleccionar
                      </option>

                      <option value="SI">
                        Sí
                      </option>

                      <option value="NO">
                        No
                      </option>

                    </select>

                  </Field>


                  <Field label="¿El seguimiento es adecuado?">

                    <select
                      value={
                        controles
                          .seguimientoAdecuado
                      }
                      onChange={(e) =>
                        actualizarControl(
                          "seguimientoAdecuado",

                          e.target
                            .value as RespuestaControl
                        )
                      }
                      className={
                        inputClass
                      }
                    >

                      <option value="">
                        Seleccionar
                      </option>

                      <option value="SI">
                        Sí
                      </option>

                      <option value="NO">
                        No
                      </option>

                    </select>

                  </Field>

                </div>

              </div>


              {/* CALCULO RESIDUAL */}

              <div className="mt-7 rounded-3xl border border-[#E8ECF3] bg-[#F7F9FC] p-5">

                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div>

                    <p className="font-bold text-[#231F20]">
                      Calcular exposición residual
                    </p>


                    <p className="mt-1 text-sm text-slate-500">
                      El motor de riesgo calculará la mitigación y la exposición residual.
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={
                      calcularResidual
                    }
                    disabled={
                      calculandoResidual
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4589] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#163a74] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {calculandoResidual ? (

                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                    ) : (

                      <Calculator
                        size={17}
                      />

                    )}


                    Calcular riesgo residual

                  </button>

                </div>

              </div>


              {/* NAVEGACIÓN */}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#E8ECF3] pt-6 sm:flex-row sm:items-center sm:justify-between">

                <button
                  type="button"
                  onClick={() => {

                    setError(
                      null
                    );


                    setCurrentStep(
                      1
                    );


                    scrollTop();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#C6D0E2] bg-white px-5 py-3.5 text-sm font-bold text-[#1B4589] transition hover:bg-[#E8ECF3]"
                >

                  <ArrowLeft
                    size={17}
                  />

                  Volver

                </button>


                <button
                  type="button"
                  onClick={
                    continuarAResidual
                  }
                  disabled={
                    !riesgoResidual
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#231F20] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"
                >

                  Continuar a riesgo residual

                  <ArrowRight
                    size={17}
                  />

                </button>

              </div>

            </section>
          )}


          {/* =====================================================
              STEP 03
             ===================================================== */}

          {currentStep === 3 && (

            <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">

              <div className="mb-8">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  03 · Resultado
                </p>


                <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                  Riesgo residual
                </h2>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Revisa cómo cambia la exposición después de aplicar los controles evaluados.
                </p>

              </div>


              <div className="grid gap-5 md:grid-cols-2">


                {/* INHERENTE */}

                <div className="rounded-3xl border border-[#E8ECF3] bg-[#F7F9FC] p-6">

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                    Antes de controles
                  </p>


                  <h3 className="mt-2 text-lg font-bold text-[#231F20]">
                    Riesgo inherente
                  </h3>


                  <div className="mt-6 grid gap-3">

                    <ResultItem
                      label="Probabilidad"
                      value={
                        form.probabilidad
                      }
                    />


                    <ResultItem
                      label="Impacto"
                      value={
                        impactoInherente ??
                        "-"
                      }
                    />


                    <ResultItem
                      label="Nivel de riesgo"
                      value={
                        riesgoInherente ??
                        "-"
                      }
                    />

                  </div>

                </div>


                {/* RESIDUAL */}

                <div className="rounded-3xl border border-[#C6D0E2] bg-[#E8ECF3]/40 p-6">

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B4589]">
                    Después de controles
                  </p>


                  <h3 className="mt-2 text-lg font-bold text-[#231F20]">
                    Riesgo residual
                  </h3>


                  <div className="mt-6 grid gap-3">

                    <ResultItem
                      label="Probabilidad"
                      value={
                        probabilidadResidual ??
                        "-"
                      }
                    />


                    <ResultItem
                      label="Impacto"
                      value={
                        impactoResidual ??
                        "-"
                      }
                    />


                    <ResultItem
                      label="Nivel de riesgo"
                      value={
                        riesgoResidual ??
                        "-"
                      }
                    />

                  </div>

                </div>

              </div>


              {/* MITIGACIÓN */}

              <div className="mt-6 rounded-3xl border border-[#E8ECF3] p-6">

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                      Efectividad de controles
                    </p>


                    <h3 className="mt-2 text-lg font-bold text-[#231F20]">
                      Mitigación obtenida
                    </h3>


                    <p className="mt-1 text-sm text-slate-500">
                      Resultado calculado por el motor de riesgo.
                    </p>

                  </div>


                  <div className="rounded-2xl bg-[#1B4589] px-6 py-4 text-center text-white">

                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      Mitigación
                    </p>


                    <p className="mt-1 text-3xl font-bold">

                      {mitigacion !==
                      null
                        ? `${(
                            mitigacion *
                            100
                          ).toFixed(
                            1
                          )}%`
                        : "--"}

                    </p>

                  </div>

                </div>

              </div>


              {/* COMPARACIÓN */}

              <div className="mt-6 overflow-hidden rounded-3xl border border-[#E8ECF3]">

                <div className="border-b border-[#E8ECF3] bg-[#F7F9FC] px-5 py-4">

                  <p className="font-bold text-[#231F20]">
                    Comparación de exposición
                  </p>

                </div>


                <div className="grid grid-cols-3">

                  <ComparisonCell
                    value="Variable"
                    header
                  />

                  <ComparisonCell
                    value="Inherente"
                    header
                  />

                  <ComparisonCell
                    value="Residual"
                    header
                  />


                  <ComparisonCell
                    value="Probabilidad"
                  />

                  <ComparisonCell
                    value={formatEnum(
                      form.probabilidad
                    )}
                  />

                  <ComparisonCell
                    value={formatEnum(
                      probabilidadResidual ??
                        "-"
                    )}
                  />


                  <ComparisonCell
                    value="Impacto"
                  />

                  <ComparisonCell
                    value={formatEnum(
                      impactoInherente ??
                        "-"
                    )}
                  />

                  <ComparisonCell
                    value={formatEnum(
                      impactoResidual ??
                        "-"
                    )}
                  />


                  <ComparisonCell
                    value="Riesgo"
                  />

                  <ComparisonCell
                    value={formatEnum(
                      riesgoInherente ??
                        "-"
                    )}
                  />

                  <ComparisonCell
                    value={formatEnum(
                      riesgoResidual ??
                        "-"
                    )}
                  />

                </div>

              </div>


              {/* NAVEGACIÓN */}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#E8ECF3] pt-6 sm:flex-row sm:items-center sm:justify-between">

                <button
                  type="button"
                  onClick={() => {

                    setError(
                      null
                    );


                    setCurrentStep(
                      2
                    );


                    scrollTop();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#C6D0E2] bg-white px-5 py-3.5 text-sm font-bold text-[#1B4589] transition hover:bg-[#E8ECF3]"
                >

                  <ArrowLeft
                    size={17}
                  />

                  Volver a controles

                </button>


                <button
                  type="button"
                  onClick={() => {

                    setError(
                      null
                    );


                    setCurrentStep(
                      4
                    );


                    scrollTop();
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#231F20] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black"
                >

                  Continuar a tratamiento

                  <ArrowRight
                    size={17}
                  />

                </button>

              </div>

            </section>
          )}


          {/* =====================================================
              STEP 04
             ===================================================== */}

          {currentStep === 4 && (

            <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">

              <div className="mb-8">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  04 · Tratamiento
                </p>


                <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                  Plan de tratamiento
                </h2>


                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Define las acciones posteriores a la evaluación del riesgo residual.
                </p>

              </div>


              {/* RESULTADO */}

              <div className="mb-7 rounded-3xl border border-[#C6D0E2] bg-[#E8ECF3]/40 p-5">

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#547AA7]">
                  Resultado actual
                </p>


                <div className="mt-4 grid gap-3 sm:grid-cols-3">

                  <MiniSummary
                    label="Riesgo residual"
                    value={
                      riesgoResidual ??
                      "-"
                    }
                  />


                  <MiniSummary
                    label="Probabilidad"
                    value={
                      probabilidadResidual ??
                      "-"
                    }
                  />


                  <MiniSummary
                    label="Impacto"
                    value={
                      impactoResidual ??
                      "-"
                    }
                  />

                </div>

              </div>


              {/* TRATAMIENTO */}

              <div className="grid gap-5 lg:grid-cols-2">


                <div className="lg:col-span-2">

                  <Field label="Plan de acción">

                    <textarea
                      rows={5}
                      value={
                        tratamiento
                          .planAccion
                      }
                      onChange={(e) =>

                        setTratamiento(
                          (prev) => ({

                            ...prev,

                            planAccion:
                              e.target.value,
                          })
                        )
                      }
                      placeholder="Describe las acciones que se ejecutarán para tratar el riesgo."
                      className={`${inputClass} resize-none`}
                    />

                  </Field>

                </div>


                <Field label="Área responsable">

                  <select
                    value={
                      tratamiento
                        .areaResponsableId
                    }
                    onChange={(e) =>

                      setTratamiento(
                        (prev) => ({

                          ...prev,

                          areaResponsableId:
                            e.target.value
                              ? Number(
                                  e.target.value
                                )
                              : "",
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  >

                    <option value="">
                      Seleccionar área
                    </option>


                    {areas.map(
                      (area) => (

                        <option
                          key={
                            area.id
                          }
                          value={
                            area.id
                          }
                        >
                          {area.nombre}
                        </option>

                      )
                    )}

                  </select>

                </Field>


                <div />


                <Field label="Fecha de inicio">

                  <input
                    type="date"
                    value={
                      tratamiento
                        .fechaInicio
                    }
                    onChange={(e) =>

                      setTratamiento(
                        (prev) => ({

                          ...prev,

                          fechaInicio:
                            e.target.value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  />

                </Field>


                <Field label="Fecha de cierre">

                  <input
                    type="date"
                    value={
                      tratamiento
                        .fechaCierre
                    }
                    min={
                      tratamiento
                        .fechaInicio ||
                      undefined
                    }
                    onChange={(e) =>

                      setTratamiento(
                        (prev) => ({

                          ...prev,

                          fechaCierre:
                            e.target.value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  />

                </Field>

              </div>


              {/* VOLVER
                  SOLO MIENTRAS NO ESTÉ REGISTRADA */}

              {analisisRegistradoId ===
                null && (

                <div className="mt-8 flex border-t border-[#E8ECF3] pt-6">

                  <button
                    type="button"
                    onClick={() => {

                      setError(
                        null
                      );


                      setCurrentStep(
                        3
                      );


                      scrollTop();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#C6D0E2] bg-white px-5 py-3.5 text-sm font-bold text-[#1B4589] transition hover:bg-[#E8ECF3]"
                  >

                    <ArrowLeft
                      size={17}
                    />

                    Volver a riesgo residual

                  </button>

                </div>

              )}

            </section>
          )}


          {/* =====================================================
              PANEL DERECHO
             ===================================================== */}

          <RiskExposurePanel

            probabilidad={
              form.probabilidad ||
              null
            }

            impacto={
              impactoInherente
            }

            riesgoInherente={
              riesgoInherente
            }

            mitigacion={
              mitigacion
            }

            probabilidadResidual={
              probabilidadResidual
            }

            impactoResidual={
              impactoResidual
            }

            riesgoResidual={
              riesgoResidual
            }

          />

        </div>


        {/* ======================================================
            ACCIONES DE LA EVALUACIÓN
           ====================================================== */}

        <div className="mt-6 rounded-[24px] border border-[#E8ECF3] bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">


            {/* INFORMACIÓN */}

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                Acciones de evaluación
              </p>


              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">

                {analisisRegistradoId ===
                null
                  ? "Guarda el avance como borrador o registra la evaluación cuando hayas completado todos los pasos."
                  : "La evaluación fue registrada correctamente. Puedes descargar el reporte o iniciar una nueva evaluación."}

              </p>

            </div>


            {/* ==================================================
                SIN REGISTRAR
               ================================================== */}

            {analisisRegistradoId ===
            null ? (

              <div className="flex flex-col gap-3 sm:flex-row">


                {/* GUARDAR BORRADOR */}

                <button
                  type="button"
                  onClick={() =>
                    void guardarBorrador()
                  }
                  disabled={
                    guardando ||
                    registrando
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#C6D0E2] bg-white px-6 py-3.5 text-sm font-bold text-[#1B4589] transition hover:border-[#1B4589] hover:bg-[#E8ECF3] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {guardando ? (

                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                  ) : (

                    <Save
                      size={17}
                    />

                  )}


                  {guardando
                    ? "Guardando..."
                    : "Guardar borrador"}

                </button>


                {/* REGISTRAR */}

                <button
                  type="button"
                  onClick={() =>
                    void registrarEvaluacion()
                  }
                  disabled={
                    registrando ||
                    guardando ||
                    currentStep !== 4
                  }
                  title={
                    currentStep !== 4
                      ? "Completa primero los pasos de la evaluación"
                      : "Registrar evaluación"
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4589] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#163a74] disabled:cursor-not-allowed disabled:opacity-40"
                >

                  {registrando ? (

                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                  ) : (

                    <ShieldCheck
                      size={17}
                    />

                  )}


                  {registrando
                    ? "Registrando..."
                    : "Registrar evaluación"}

                </button>

              </div>

            ) : (

              /* =================================================
                 REGISTRADA
                 ================================================= */

              <div className="flex flex-col gap-3 sm:flex-row">


                {/* DESCARGAR PDF */}

                <button
                  type="button"
                  onClick={() =>
                    void descargarPdfEvaluacion()
                  }
                  disabled={
                    descargandoPdf
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#C6D0E2] bg-white px-6 py-3.5 text-sm font-bold text-[#1B4589] transition hover:border-[#1B4589] hover:bg-[#E8ECF3] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {descargandoPdf ? (

                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                  ) : (

                    <Download
                      size={17}
                    />

                  )}


                  {descargandoPdf
                    ? "Descargando..."
                    : "Descargar PDF"}

                </button>


                {/* NUEVA EVALUACIÓN */}

                <button
                  type="button"
                  onClick={
                    iniciarNuevaEvaluacion
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4589] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#163a74]"
                >

                  <Plus
                    size={18}
                  />

                  Nueva evaluación

                </button>

              </div>

            )}

          </div>

        </div>

      </div>


      {/* ========================================================
          MODAL CATÁLOGOS
         ======================================================== */}

      <CatalogManagerModal

        open={
          catalogManagerOpen
        }

        onClose={() =>
          setCatalogManagerOpen(
            false
          )
        }

        onCatalogUpdated={() => {
          void actualizarCatalogos();
        }}

      />

    </div>
  );
}


/* ============================================================
   UI HELPERS
   ============================================================ */

const inputClass =
  "w-full rounded-2xl border border-[#C6D0E2] bg-white px-4 py-3 text-sm text-[#231F20] outline-none transition placeholder:text-slate-400 focus:border-[#1B4589] focus:ring-4 focus:ring-[#E8ECF3] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";


function Field({

  label,

  icon,

  children,

}: {

  label: string;

  icon?:
    React.ReactNode;

  children:
    React.ReactNode;

}) {

  return (

    <label className="block">

      <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#231F20]">

        {icon}

        {label}

      </span>


      {children}

    </label>
  );
}


function MiniSummary({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div className="rounded-2xl bg-white px-4 py-3">

      <p className="text-[11px] font-bold uppercase tracking-wider text-[#547AA7]">
        {label}
      </p>


      <p className="mt-1 text-sm font-bold text-[#231F20]">

        {formatEnum(
          value
        )}

      </p>

    </div>
  );
}


function ResultItem({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>


      <span className="text-right text-sm font-bold text-[#231F20]">

        {formatEnum(
          value
        )}

      </span>

    </div>
  );
}


function ComparisonCell({

  value,

  header = false,

}: {

  value: string;

  header?: boolean;

}) {

  return (

    <div
      className={`border-b border-r border-[#E8ECF3] px-4 py-4 last:border-r-0 ${
        header
          ? "bg-[#F7F9FC]"
          : "bg-white"
      }`}
    >

      <p
        className={`text-sm ${
          header
            ? "font-bold text-[#1B4589]"
            : "font-semibold text-[#231F20]"
        }`}
      >
        {value}
      </p>

    </div>
  );
}


function formatEnum(
  value: string
) {

  if (
    !value ||
    value === "-"
  ) {

    return "-";
  }


  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,

      (letter) =>
        letter.toUpperCase()
    );
}


function scrollTop() {

  window.scrollTo({

    top: 0,

    behavior:
      "smooth",
  });
}