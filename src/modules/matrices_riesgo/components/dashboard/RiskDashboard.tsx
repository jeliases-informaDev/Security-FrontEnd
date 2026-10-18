"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  RiskDistributionChart,
} from "./RiskDistributionChart";

import {
  RiskAggregateHeatmap,
} from "./RiskAggregateHeatmap";

import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileCheck2,
  Grid3X3,
  Loader2,
  PencilLine,
  PlayCircle,
  RefreshCw,
  X,
} from "lucide-react";

import { matrizRiesgoService } from "../../services/matrizRiesgo.service";

import type {
  MatrizRiesgoDetalle,
  MatrizRiesgoResumen,
  NivelRiesgo,
} from "../../types/matrizRiesgo.types";


// ============================================================
// PROPS
// ============================================================

interface RiskDashboardProps {
  onVerMatriz?: (
    analisis: MatrizRiesgoResumen
  ) => void;

  onContinuar?: (
    id: number
  ) => void;
}


// ============================================================
// UTILIDADES
// ============================================================

function formatearFecha(
  fecha: string | null | undefined
): string {
  if (!fecha) {
    return "—";
  }

  /*
   * LocalDate del backend:
   * 2026-10-30
   *
   * Evitamos new Date() porque puede
   * desplazar el día por zona horaria.
   */
  if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [anio, mes, dia] =
      fecha.split("-");

    return `${dia}/${mes}/${anio}`;
  }

  /*
   * LocalDateTime:
   * 2026-09-30T13:02:49.808475
   */
  const date =
    new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(date);
}


function formatearNivelRiesgo(
  riesgo: NivelRiesgo | null | undefined
): string {
  if (!riesgo) {
    return "Sin calcular";
  }

  const etiquetas:
    Record<NivelRiesgo, string> = {
      MINIMO: "Mínimo",
      LEVE: "Leve",
      MODERADO: "Moderado",
      ALTO: "Alto",
      MUY_ALTO: "Muy alto",
    };

  return etiquetas[riesgo];
}


function obtenerColorRiesgo(
  riesgo: NivelRiesgo | null | undefined
): string {
  if (!riesgo) {
    return "#94A3B8";
  }

  const colores:
    Record<NivelRiesgo, string> = {
      MINIMO: "#00B0F0",
      LEVE: "#92D050",
      MODERADO: "#FFFF00",
      ALTO: "#E26B0A",
      MUY_ALTO: "#FF0000",
    };

  return colores[riesgo];
}


function formatearTextoEnum(
  valor: string | null | undefined
): string {
  if (!valor) {
    return "—";
  }

  return valor
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (letra) =>
      letra.toUpperCase()
    );
}


// ============================================================
// BADGE DE RIESGO
// ============================================================

function RiskBadge({
  riesgo,
}: {
  riesgo:
    | NivelRiesgo
    | null
    | undefined;
}) {
  const color =
    obtenerColorRiesgo(riesgo);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: color,
        }}
      />

      {formatearNivelRiesgo(riesgo)}
    </div>
  );
}


// ============================================================
// TARJETA DE INDICADOR
// ============================================================

interface StatCardProps {
  titulo: string;
  valor: number;
  descripcion: string;
  icono: ReactNode;
}

function StatCard({
  titulo,
  valor,
  descripcion,
  icono,
}: StatCardProps) {
  return (
    <div className="card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-muted">
            {titulo}
          </p>

          <p className="mt-2 text-3xl font-bold text-ink">
            {valor}
          </p>

          <p className="mt-1 text-sm text-muted">
            {descripcion}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-ink">
          {icono}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export function RiskDashboard({
  onVerMatriz,
  onContinuar,
}: RiskDashboardProps) {

  const [
    analisis,
    setAnalisis,
  ] =
    useState<MatrizRiesgoResumen[]>([]);

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
        error,
        setError,
    ] =
        useState<string | null>(null);


    const [
        tipoVistaRiesgo,
        setTipoVistaRiesgo,
        ] = useState<
        "residual" | "inherente"
        >("residual");


  // ==========================================================
  // PAGINADO
  // ==========================================================

  const [
    paginaActual,
    setPaginaActual,
  ] =
    useState(1);

  const [
    registrosPorPagina,
    setRegistrosPorPagina,
  ] =
    useState(5);


  // ==========================================================
  // DETALLE
  // ==========================================================

  const [
    detalleId,
    setDetalleId,
  ] =
    useState<number | null>(null);

  const [
    detalle,
    setDetalle,
  ] =
    useState<MatrizRiesgoDetalle | null>(
      null
    );

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] =
    useState(false);


  // ==========================================================
  // PDF
  // ==========================================================

  const [
    descargandoPdfId,
    setDescargandoPdfId,
  ] =
    useState<number | null>(null);


  // ==========================================================
  // CARGA
  // ==========================================================

  async function cargarAnalisis() {
    try {
      setCargando(true);
      setError(null);

      const data =
        await matrizRiesgoService
          .listarAnalisis();

      setAnalisis(data);

    } catch (error) {
      console.error(
        "Error cargando análisis:",
        error
      );

      setError(
        "No fue posible cargar las evaluaciones de riesgo."
      );

    } finally {
      setCargando(false);
    }
  }


  useEffect(() => {
    void cargarAnalisis();
  }, []);


  // ==========================================================
  // INDICADORES
  // ==========================================================

  const indicadores =
    useMemo(() => {

      const total =
        analisis.length;

      const borradores =
        analisis.filter(
          (item) =>
            item.estado === "EDITANDO"
        ).length;

      const registradas =
        analisis.filter(
          (item) =>
            item.estado !== "EDITANDO"
        ).length;

      const riesgoAlto =
        analisis.filter(
          (item) =>
            item.riesgoResidual === "ALTO" ||
            item.riesgoResidual === "MUY_ALTO"
        ).length;

      return {
        total,
        borradores,
        registradas,
        riesgoAlto,
      };

    }, [analisis]);


  // ==========================================================
  // PAGINACIÓN
  // ==========================================================

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        analisis.length /
          registrosPorPagina
      )
    );

  const indiceInicio =
    (paginaActual - 1) *
    registrosPorPagina;

  const indiceFin =
    Math.min(
      indiceInicio +
        registrosPorPagina,
      analisis.length
    );

  const analisisPaginados =
    analisis.slice(
      indiceInicio,
      indiceFin
    );


  useEffect(() => {
    if (
      paginaActual >
      totalPaginas
    ) {
      setPaginaActual(
        totalPaginas
      );
    }
  }, [
    paginaActual,
    totalPaginas,
  ]);


  function cambiarRegistrosPorPagina(
    cantidad: number
  ) {
    setRegistrosPorPagina(
      cantidad
    );

    setPaginaActual(1);
  }


  // ==========================================================
  // VER DETALLE
  // ==========================================================

  async function verAnalisis(
    id: number
  ) {
    try {
      setDetalleId(id);
      setDetalle(null);
      setCargandoDetalle(true);

      const data =
        await matrizRiesgoService
          .obtenerAnalisis(id);

      setDetalle(data);

    } catch (error) {
      console.error(
        "Error obteniendo análisis:",
        error
      );

      setDetalleId(null);

      window.alert(
        "No fue posible consultar la evaluación."
      );

    } finally {
      setCargandoDetalle(false);
    }
  }


  function cerrarDetalle() {
    setDetalle(null);
    setDetalleId(null);
  }


  // ==========================================================
  // PDF
  // ==========================================================

  async function descargarPdf(
    item: MatrizRiesgoResumen
  ) {
    try {
      setDescargandoPdfId(
        item.id
      );

      const blob =
        await matrizRiesgoService
          .descargarPdf(
            item.id
          );

      const url =
        URL.createObjectURL(
          blob
        );

      const enlace =
        document.createElement(
          "a"
        );

      enlace.href = url;

      enlace.download =
        `matriz-riesgo-${item.id}.pdf`;

      document.body.appendChild(
        enlace
      );

      enlace.click();

      enlace.remove();

      URL.revokeObjectURL(
        url
      );

    } catch (error) {
      console.error(
        "Error descargando PDF:",
        error
      );

      window.alert(
        "No fue posible descargar el PDF."
      );

    } finally {
      setDescargandoPdfId(
        null
      );
    }
  }


  // ==========================================================
  // LOADING
  // ==========================================================

  if (cargando) {
    return (
      <div className="flex min-h-[420px] items-center justify-center card">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Loader2 className="h-7 w-7 animate-spin" />

          <span className="text-sm font-medium">
            Cargando matrices de riesgo...
          </span>
        </div>
      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />

          <div className="flex-1">
            <p className="font-semibold text-red-800">
              No se pudo cargar el dashboard
            </p>

            <p className="mt-1 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void cargarAnalisis()
              }
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
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
  // RENDER
  // ==========================================================

  return (
    <>
      <div className="space-y-6">

        {/* ====================================================
            INDICADORES
           ==================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            titulo="Total"
            valor={
              indicadores.total
            }
            descripcion="Evaluaciones registradas"
            icono={
              <ClipboardList className="h-5 w-5" />
            }
          />

          <StatCard
            titulo="Registradas"
            valor={
              indicadores.registradas
            }
            descripcion="Evaluaciones formalizadas"
            icono={
              <FileCheck2 className="h-5 w-5" />
            }
          />

          <StatCard
            titulo="Borradores"
            valor={
              indicadores.borradores
            }
            descripcion="Pendientes de completar"
            icono={
              <PencilLine className="h-5 w-5" />
            }
          />

          <StatCard
            titulo="Riesgo alto"
            valor={
              indicadores.riesgoAlto
            }
            descripcion="Residual alto o muy alto"
            icono={
              <AlertTriangle className="h-5 w-5" />
            }
          />

        </section>


       {/* ====================================================
                GRÁFICOS
           ==================================================== */}

            <section className="grid gap-6 xl:grid-cols-[1.55fr_0.45fr]">

            <RiskAggregateHeatmap
                analisis={analisis}
                tipoVista={tipoVistaRiesgo}
                onTipoVistaChange={
                setTipoVistaRiesgo
                }
            />


            <RiskDistributionChart
                analisis={analisis}
                tipoVista={tipoVistaRiesgo}
            />

            </section>


        {/* ====================================================
            HISTORIAL
           ==================================================== */}

        <section className="overflow-hidden card shadow-sm">

          {/* HEADER HISTORIAL */}

          <div className="border-b border-line px-6 py-5">

            <h2 className="text-base font-bold text-ink">
              Historial de evaluaciones
            </h2>

            <p className="mt-1 text-sm text-muted">
              Revisa los análisis creados y su nivel
              de riesgo actual.
            </p>

          </div>


          {/* SIN REGISTROS */}

          {analisis.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <ClipboardList className="mx-auto h-10 w-10 text-faint" />

              <p className="mt-4 font-semibold text-ink">
                No existen evaluaciones
              </p>

              <p className="mt-1 text-sm text-muted">
                Crea una nueva evaluación de riesgo para comenzar.
              </p>

            </div>

          ) : (

            <>
              {/* TABLA */}

              <div className="overflow-x-auto">

                <table className="min-w-full">

                  <thead className="bg-surface-2">

                    <tr className="border-b border-line">

                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted">
                        Evaluación
                      </th>

                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted">
                        Área / Proceso
                      </th>

                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted">
                        Creación
                      </th>

                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted">
                        Riesgo inherente
                      </th>

                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted">
                        Riesgo residual
                      </th>

                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted">
                        Estado
                      </th>

                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-muted">
                        Acciones
                      </th>

                    </tr>

                  </thead>


                  <tbody className="divide-y divide-line">

                    {analisisPaginados.map(
                      (item) => (

                        <tr
                          key={item.id}
                          className="transition hover:bg-surface-2/70"
                        >

                          {/* EVALUACIÓN */}

                          <td className="px-6 py-4 align-top">

                            <p className="max-w-[260px] font-semibold text-ink">
                              {item.titulo?.trim()
                                ? item.titulo
                                : "Sin título"}
                            </p>

                            <p className="mt-1 text-xs text-faint">
                              Cierre:{" "}
                              {formatearFecha(
                                item.fechaCierre
                              )}
                            </p>

                          </td>


                          {/* ÁREA / PROCESO */}

                          <td className="px-6 py-4 align-top">

                            <p className="text-sm font-medium text-ink">
                              {item.area ||
                                "Sin área"}
                            </p>

                            <p className="mt-1 text-xs text-muted">
                              {item.proceso ||
                                "Sin proceso"}
                            </p>

                          </td>


                          {/* FECHA CREACIÓN */}

                          <td className="whitespace-nowrap px-6 py-4 align-top text-sm text-muted">

                            {formatearFecha(
                              item.fechaCreacion
                            )}

                          </td>


                          {/* RIESGO INHERENTE */}

                          <td className="px-6 py-4 align-top">

                            <RiskBadge
                              riesgo={
                                item.riesgoInherente
                              }
                            />

                          </td>


                          {/* RIESGO RESIDUAL */}

                          <td className="px-6 py-4 align-top">

                            <RiskBadge
                              riesgo={
                                item.riesgoResidual
                              }
                            />

                          </td>


                          {/* ESTADO */}

                          <td className="px-6 py-4 align-top">

                            {item.estado ===
                            "EDITANDO" ? (

                              <span className="inline-flex rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
                                Borrador
                              </span>

                            ) : item.estado ===
                              "CERRADO" ? (

                              <span className="inline-flex rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted ring-1 ring-inset ring-line">
                                Cerrada
                              </span>

                            ) : (

                              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                Registrada
                              </span>

                            )}

                          </td>


                          {/* ACCIONES */}

                          <td className="px-6 py-4 align-top">

                            <div className="flex items-center justify-end gap-2">

                              {item.estado ===
                              "EDITANDO" ? (

                                <button
                                  type="button"
                                  onClick={() =>
                                    onContinuar?.(
                                      item.id
                                    )
                                  }
                                  disabled={
                                    !onContinuar
                                  }
                                  title="Continuar evaluación"
                                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <PlayCircle className="h-4 w-4" />

                                  Continuar
                                </button>

                              ) : (

                                <>
                                  {/* VER */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void verAnalisis(
                                        item.id
                                      )
                                    }
                                    title="Ver evaluación"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted transition hover:border-brand hover:bg-blue-50 hover:text-brand"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>


                                  {/* MATRIZ */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      onVerMatriz?.(
                                        item
                                      )
                                    }
                                    disabled={
                                      !onVerMatriz
                                    }
                                    title="Ver matriz"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted transition hover:border-brand hover:bg-blue-50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Grid3X3 className="h-4 w-4" />
                                  </button>


                                  {/* PDF */}

                                  <button
                                    type="button"
                                    onClick={() =>
                                      void descargarPdf(
                                        item
                                      )
                                    }
                                    disabled={
                                      descargandoPdfId ===
                                      item.id
                                    }
                                    title="Descargar PDF"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted transition hover:border-brand hover:bg-blue-50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {descargandoPdfId ===
                                    item.id ? (

                                      <Loader2 className="h-4 w-4 animate-spin" />

                                    ) : (

                                      <Download className="h-4 w-4" />

                                    )}
                                  </button>
                                </>

                              )}

                            </div>

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>


              {/* ==================================================
                  PAGINACIÓN
                 ================================================== */}

              <div className="flex flex-col gap-4 border-t border-line px-6 py-4 lg:flex-row lg:items-center lg:justify-between">

                {/* REGISTROS POR PÁGINA */}

                <div className="flex items-center gap-3">

                  <span className="text-sm text-muted">
                    Mostrar
                  </span>

                  <select
                    value={
                      registrosPorPagina
                    }
                    onChange={(event) =>
                      cambiarRegistrosPorPagina(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-brand"
                  >
                    <option value={5}>
                      5
                    </option>

                    <option value={10}>
                      10
                    </option>

                    <option value={15}>
                      15
                    </option>
                  </select>

                  <span className="text-sm text-muted">
                    registros
                  </span>

                </div>


                {/* INFO + BOTONES */}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                  <p className="text-sm text-muted">
                    Mostrando{" "}

                    <span className="font-semibold text-ink">
                      {analisis.length ===
                      0
                        ? 0
                        : indiceInicio +
                          1}
                    </span>

                    {" - "}

                    <span className="font-semibold text-ink">
                      {indiceFin}
                    </span>

                    {" de "}

                    <span className="font-semibold text-ink">
                      {analisis.length}
                    </span>
                  </p>


                  <div className="flex items-center gap-1">

                    {/* ANTERIOR */}

                    <button
                      type="button"
                      onClick={() =>
                        setPaginaActual(
                          (prev) =>
                            Math.max(
                              1,
                              prev - 1
                            )
                        )
                      }
                      disabled={
                        paginaActual === 1
                      }
                      title="Página anterior"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>


                    {/* NÚMEROS */}

                    {Array.from(
                      {
                        length:
                          totalPaginas,
                      },
                      (_, index) =>
                        index + 1
                    ).map(
                      (pagina) => (

                        <button
                          key={
                            pagina
                          }
                          type="button"
                          onClick={() =>
                            setPaginaActual(
                              pagina
                            )
                          }
                          className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                            paginaActual ===
                            pagina
                              ? "bg-brand text-white"
                              : "border border-line bg-white text-muted hover:bg-surface-2"
                          }`}
                        >
                          {pagina}
                        </button>

                      )
                    )}


                    {/* SIGUIENTE */}

                    <button
                      type="button"
                      onClick={() =>
                        setPaginaActual(
                          (prev) =>
                            Math.min(
                              totalPaginas,
                              prev + 1
                            )
                        )
                      }
                      disabled={
                        paginaActual ===
                        totalPaginas
                      }
                      title="Página siguiente"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-muted transition hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                  </div>

                </div>

              </div>

            </>

          )}

        </section>

      </div>


      {/* ======================================================
          MODAL DETALLE
         ====================================================== */}

      {detalleId !== null && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">

          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white shadow-2xl">

            {/* HEADER MODAL */}

            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white px-6 py-5">

              <div>
                <p className="text-xs font-bold text-brand">
                  Detalle de evaluación
                </p>

                <h2 className="mt-1 text-xl font-bold text-ink">
                  {detalle?.titulo ||
                    "Evaluación de riesgo"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  cerrarDetalle
                }
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            {/* CARGANDO */}

            {cargandoDetalle ? (

              <div className="flex min-h-[350px] items-center justify-center">

                <div className="flex flex-col items-center gap-3 text-muted">

                  <Loader2 className="h-7 w-7 animate-spin" />

                  <p className="text-sm font-medium">
                    Cargando evaluación...
                  </p>

                </div>

              </div>

            ) : detalle ? (

              <div className="space-y-6 p-6">

                {/* INFORMACIÓN GENERAL */}

                <section className="card p-5">

                  <h3 className="font-bold text-ink">
                    Información general
                  </h3>

                  <div className="mt-4 grid gap-5 sm:grid-cols-2">

                    <div>
                      <p className="eyebrow">
                        Área
                      </p>

                      <p className="mt-1 text-sm font-medium text-ink">
                        {detalle.area ||
                          "—"}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Proceso
                      </p>

                      <p className="mt-1 text-sm font-medium text-ink">
                        {detalle.proceso ||
                          "—"}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Factor
                      </p>

                      <p className="mt-1 text-sm font-medium text-ink">
                        {formatearTextoEnum(
                          detalle.factor
                        )}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Tipo de empresa
                      </p>

                      <p className="mt-1 text-sm font-medium text-ink">
                        {formatearTextoEnum(
                          detalle.tipoEmpresa
                        )}
                      </p>
                    </div>


                    <div className="sm:col-span-2">
                      <p className="eyebrow">
                        Detalle del riesgo
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                        {detalle.detalleRiesgo ||
                          "—"}
                      </p>
                    </div>

                  </div>

                </section>


                {/* EXPOSICIÓN */}

                <section className="card p-5">

                  <h3 className="font-bold text-ink">
                    Evaluación del riesgo
                  </h3>

                  <div className="mt-4 grid gap-5 sm:grid-cols-2">

                    <div className="rounded-xl bg-surface-2 p-4">

                      <p className="eyebrow">
                        Riesgo inherente
                      </p>

                      <div className="mt-3">
                        <RiskBadge
                          riesgo={
                            detalle.riesgoInherente
                          }
                        />
                      </div>

                      <p className="mt-3 text-sm text-muted">
                        Probabilidad:{" "}
                        <strong>
                          {formatearTextoEnum(
                            detalle.probabilidad
                          )}
                        </strong>
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        Impacto:{" "}
                        <strong>
                          {formatearTextoEnum(
                            detalle.impactoInherente
                          )}
                        </strong>
                      </p>

                    </div>


                    <div className="rounded-xl bg-surface-2 p-4">

                      <p className="eyebrow">
                        Riesgo residual
                      </p>

                      <div className="mt-3">
                        <RiskBadge
                          riesgo={
                            detalle.riesgoResidual
                          }
                        />
                      </div>

                      <p className="mt-3 text-sm text-muted">
                        Probabilidad:{" "}
                        <strong>
                          {formatearTextoEnum(
                            detalle.probabilidadResidual
                          )}
                        </strong>
                      </p>

                      <p className="mt-1 text-sm text-muted">
                        Impacto:{" "}
                        <strong>
                          {formatearTextoEnum(
                            detalle.impactoResidual
                          )}
                        </strong>
                      </p>

                    </div>

                  </div>

                </section>


                {/* CONTROL */}

                <section className="card p-5">

                  <h3 className="font-bold text-ink">
                    Control
                  </h3>

                  <div className="mt-4 grid gap-5 sm:grid-cols-2">

                    <div>
                      <p className="eyebrow">
                        Descripción
                      </p>

                      <p className="mt-1 text-sm text-ink">
                        {detalle.controlDescripcion ||
                          "—"}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Documento
                      </p>

                      <p className="mt-1 text-sm text-ink">
                        {detalle.controlDocumento ||
                          "—"}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Área de control
                      </p>

                      <p className="mt-1 text-sm text-ink">
                        {detalle.controlArea ||
                          "—"}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Mitigación
                      </p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {detalle.mitigacion !=
                        null
                          ? `${(
                              detalle.mitigacion *
                              100
                            ).toFixed(
                              1
                            )}%`
                          : "—"}
                      </p>
                    </div>

                  </div>

                </section>


                {/* TRATAMIENTO */}

                <section className="card p-5">

                  <h3 className="font-bold text-ink">
                    Tratamiento
                  </h3>

                  <div className="mt-4 grid gap-5 sm:grid-cols-2">

                    <div className="sm:col-span-2">
                      <p className="eyebrow">
                        Plan de acción
                      </p>

                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                        {detalle.planAccion ||
                          "—"}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Área responsable
                      </p>

                      <p className="mt-1 text-sm text-ink">
                        {detalle.areaResponsable ||
                          "—"}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Estado
                      </p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {detalle.estado ===
                        "EDITANDO"
                          ? "Borrador"
                          : detalle.estado ===
                              "CERRADO"
                            ? "Cerrada"
                            : "Registrada"}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Fecha inicio
                      </p>

                      <p className="mt-1 text-sm text-ink">
                        {formatearFecha(
                          detalle.fechaInicio
                        )}
                      </p>
                    </div>


                    <div>
                      <p className="eyebrow">
                        Fecha cierre
                      </p>

                      <p className="mt-1 text-sm text-ink">
                        {formatearFecha(
                          detalle.fechaCierre
                        )}
                      </p>
                    </div>

                  </div>

                </section>


                {/* BOTONES MODAL */}

                <div className="flex justify-end gap-3">

                  <button
                    type="button"
                    onClick={
                      cerrarDetalle
                    }
                    className="card px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-2"
                  >
                    Cerrar
                  </button>

                  {detalle.estado !==
                    "EDITANDO" && (

                    <button
                      type="button"
                      onClick={() => {
                        const item =
                          analisis.find(
                            (registro) =>
                              registro.id ===
                              detalle.id
                          );

                        if (item) {
                          void descargarPdf(
                            item
                          );
                        }
                      }}
                      className="inline-flex items-center gap-2 btn btn-primary"
                    >
                      <Download className="h-4 w-4" />

                      Descargar PDF
                    </button>

                  )}

                </div>

              </div>

            ) : null}

          </div>

        </div>

      )}

    </>
  );
}