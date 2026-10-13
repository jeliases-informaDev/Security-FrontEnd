"use client";

import {
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  FormEvent,
  useState,
} from "react";

import {
  denunciaService,
} from "../../services/denuncia.service";

import type {
  CausaDenuncia,
  ConsultarDenunciaRequest,
  ConsultarDenunciaResponse,
  EstadoDenuncia,
  RelacionEmpresa,
} from "../../types/denuncia.types";


// ============================================================
// ESTILOS
// ============================================================

const inputClass =
  "w-full rounded-2xl border border-[#C6D0E2] bg-white px-4 py-3 text-sm text-[#231F20] outline-none transition placeholder:text-slate-400 focus:border-[#1B4589] focus:ring-4 focus:ring-[#E8ECF3] disabled:cursor-not-allowed disabled:bg-slate-50";

const labelClass =
  "mb-2 block text-sm font-semibold text-[#231F20]";


// ============================================================
// LABELS
// ============================================================

const causaLabels:
  Record<CausaDenuncia, string> = {
    SOBORNO: "Soborno",
    CONFLICTO: "Conflicto",
    ACOSO: "Acoso",
  };

const relacionLabels:
  Record<RelacionEmpresa, string> = {
    TRABAJADOR: "Trabajador",
    CLIENTE: "Cliente",
    PROVEEDOR: "Proveedor",
  };

const estadoLabels:
  Record<EstadoDenuncia, string> = {
    RECIBIDO: "Recibido",
    EN_PROCESO: "En proceso",
    CERRADO: "Cerrado",
  };


// ============================================================
// UTILIDADES
// ============================================================

function formatearFecha(
  fecha: string | null
): string {

  if (!fecha) {
    return "-";
  }

  const date =
    new Date(fecha);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return fecha;
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}


function estadoBadgeClass(
  estado: EstadoDenuncia
): string {

  switch (estado) {

    case "RECIBIDO":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "EN_PROCESO":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "CERRADO":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}


// ============================================================
// COMPONENTE
// ============================================================

export function ConsultaDenuncia() {

  const [
    codigoSeguimiento,
    setCodigoSeguimiento,
  ] = useState("");

  const [
    pin,
    setPin,
  ] = useState("");

  const [
    consultando,
    setConsultando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    resultado,
    setResultado,
  ] = useState<
    ConsultarDenunciaResponse | null
  >(null);


  // ==========================================================
  // CONSULTAR
  // ==========================================================

  async function consultar(
    event: FormEvent<HTMLFormElement>
  ) {

    event.preventDefault();

    setError(null);
    setResultado(null);

    const codigo =
      codigoSeguimiento
        .trim()
        .toUpperCase();

    const pinNormalizado =
      pin
        .trim()
        .toUpperCase();

    if (!codigo) {

      setError(
        "Ingresa el identificador de la denuncia."
      );

      return;
    }

    if (!pinNormalizado) {

      setError(
        "Ingresa el PIN de seguimiento."
      );

      return;
    }

    const request:
      ConsultarDenunciaRequest = {

        codigoSeguimiento:
          codigo,

        pin:
          pinNormalizado,
      };

    try {

      setConsultando(true);

      const data =
        await denunciaService
          .consultarSeguimiento(
            request
          );

      setResultado(
        data
      );

      setCodigoSeguimiento(
        data.codigoSeguimiento
      );

    } catch (error) {

      console.error(
        "Error consultando denuncia:",
        error
      );

      setError(
        "No fue posible consultar la denuncia. Verifica el identificador y el PIN ingresados."
      );

    } finally {

      setConsultando(false);
    }
  }


  // ==========================================================
  // NUEVA CONSULTA
  // ==========================================================

  function nuevaConsulta() {

    setCodigoSeguimiento("");
    setPin("");
    setResultado(null);
    setError(null);
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="space-y-7">

      {/* ======================================================
          FORMULARIO DE CONSULTA
      ====================================================== */}

      <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
            <Search size={22} />
          </div>

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
              Seguimiento
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
              Consultar denuncia
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ingresa el identificador y el PIN que recibiste al
              registrar tu denuncia.
            </p>

          </div>

        </div>


        <form
          onSubmit={consultar}
          className="mt-8"
        >

          {error && (

            <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
              {error}
            </div>

          )}


          <div className="grid gap-5 lg:grid-cols-2">

            {/* IDENTIFICADOR */}

            <div>

              <label className={labelClass}>
                Identificador
              </label>

              <input
                type="text"
                value={codigoSeguimiento}
                onChange={(event) =>
                  setCodigoSeguimiento(
                    event.target.value
                      .toUpperCase()
                  )
                }
                disabled={consultando}
                placeholder="Ej. DEN-RYM3X8CP"
                autoComplete="off"
                className={inputClass}
              />

            </div>


            {/* PIN */}

            <div>

              <label className={labelClass}>
                PIN
              </label>

              <input
                type="password"
                value={pin}
                onChange={(event) =>
                  setPin(
                    event.target.value
                      .toUpperCase()
                  )
                }
                disabled={consultando}
                placeholder="Ej. WYG5-S7S7-XQAG"
                autoComplete="off"
                className={inputClass}
              />

            </div>

          </div>


          <div className="mt-7 flex justify-end">

            <button
              type="submit"
              disabled={consultando}
              className="
                inline-flex
                min-w-44
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-[#1B4589]
                px-6 py-3.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-[#163a74]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >

              {consultando ? (

                <Loader2
                  size={17}
                  className="animate-spin"
                />

              ) : (

                <Search size={17} />

              )}

              {consultando
                ? "Consultando..."
                : "Consultar denuncia"}

            </button>

          </div>

        </form>

      </section>


      {/* ======================================================
          RESULTADO
      ====================================================== */}

      {resultado && (

        <>
          {/* RESUMEN */}

          <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={22} />
                </div>

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                    Denuncia encontrada
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                    {resultado.codigoSeguimiento}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Registrada el{" "}
                    {formatearFecha(
                      resultado.fechaCreacion
                    )}
                  </p>

                </div>

              </div>


              <span
                className={`
                  inline-flex
                  w-fit
                  items-center
                  rounded-full
                  border
                  px-4 py-2
                  text-xs
                  font-bold
                  uppercase
                  tracking-wide
                  ${estadoBadgeClass(
                    resultado.estado
                  )}
                `}
              >
                {estadoLabels[
                  resultado.estado
                ]}
              </span>

            </div>


            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {/* CAUSA */}

              <div className="rounded-2xl border border-[#E8ECF3] bg-[#F7F9FC] p-5">

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#547AA7]">
                  Causa
                </p>

                <p className="mt-2 text-sm font-bold text-[#231F20]">
                  {causaLabels[
                    resultado.causa
                  ]}
                </p>

              </div>


              {/* RELACIÓN */}

              <div className="rounded-2xl border border-[#E8ECF3] bg-[#F7F9FC] p-5">

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#547AA7]">
                  Relación
                </p>

                <p className="mt-2 text-sm font-bold text-[#231F20]">
                  {relacionLabels[
                    resultado.relacionEmpresa
                  ]}
                </p>

              </div>


              {/* ACTUALIZACIÓN */}

              <div className="rounded-2xl border border-[#E8ECF3] bg-[#F7F9FC] p-5">

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#547AA7]">
                  Última actualización
                </p>

                <p className="mt-2 text-sm font-bold text-[#231F20]">
                  {formatearFecha(
                    resultado.fechaActualizacion
                  )}
                </p>

              </div>

            </div>


            {/* DESCRIPCIÓN */}

            <div className="mt-5 rounded-2xl border border-[#E8ECF3] bg-white p-5">

              <div className="flex items-start gap-3">

                <FileText
                  size={19}
                  className="mt-0.5 shrink-0 text-[#547AA7]"
                />

                <div>

                  <p className="text-sm font-bold text-[#231F20]">
                    Descripción
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {resultado.descripcion}
                  </p>

                </div>

              </div>

            </div>

          </section>


          {/* ==================================================
              HISTORIAL
          ================================================== */}

          <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
                <Clock3 size={22} />
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  Seguimiento
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                  Historial de la denuncia
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Aquí puedes revisar los cambios de estado de tu
                  denuncia.
                </p>

              </div>

            </div>


            <div className="mt-8">

              {resultado.historial.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-[#C6D0E2] bg-[#F7F9FC] px-6 py-8 text-center">

                  <Clock3
                    size={25}
                    className="mx-auto text-slate-400"
                  />

                  <p className="mt-3 text-sm font-semibold text-[#231F20]">
                    No hay movimientos registrados
                  </p>

                </div>

              ) : (

                <div className="space-y-0">

                  {resultado.historial.map(
                    (
                      registro,
                      index
                    ) => {

                      const ultimo =
                        index ===
                        resultado.historial.length - 1;

                      return (

                        <div
                          key={`${registro.estadoNuevo}-${registro.fechaCreacion}-${index}`}
                          className="relative flex gap-4"
                        >

                          {/* LÍNEA */}

                          {!ultimo && (

                            <div className="absolute left-[15px] top-8 h-[calc(100%-8px)] w-px bg-[#DCE4EF]" />

                          )}


                          {/* ICONO */}

                          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">

                            <CheckCircle2
                              size={17}
                            />

                          </div>


                          {/* CONTENIDO */}

                          <div className={`flex-1 ${ultimo ? "" : "pb-7"}`}>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                              <p className="text-sm font-bold text-[#231F20]">
                                {estadoLabels[
                                  registro.estadoNuevo
                                ]}
                              </p>

                              <p className="text-xs text-slate-400">
                                {formatearFecha(
                                  registro.fechaCreacion
                                )}
                              </p>

                            </div>

                            {registro.comentario && (

                              <p className="mt-1.5 text-sm leading-6 text-slate-500">
                                {registro.comentario}
                              </p>

                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </div>

          </section>


          {/* NUEVA CONSULTA */}

          <div className="flex justify-end">

            <button
              type="button"
              onClick={nuevaConsulta}
              className="rounded-2xl border border-[#C6D0E2] bg-white px-5 py-3 text-sm font-semibold text-[#1B4589] transition hover:bg-[#E8ECF3]"
            >
              Realizar otra consulta
            </button>

          </div>

        </>

      )}

    </div>
  );
}