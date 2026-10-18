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
  "w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-faint focus:border-brand focus:ring-4 focus:ring-line disabled:cursor-not-allowed disabled:bg-surface-2";

const labelClass =
  "mb-2 block text-sm font-semibold text-ink";


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
      return "border-warn/20 bg-warn-soft text-warn";

    case "CERRADO":
      return "border-ok/20 bg-ok-soft text-ok";

    default:
      return "border-line bg-surface-2 text-muted";
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

      <section className="card p-6 lg:p-8">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
            <Search size={22} />
          </div>

          <div>

            <p className="eyebrow">
              Seguimiento
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Consultar denuncia
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
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

            <div className="mb-6 rounded-xl border border-bad/20 bg-bad-soft px-5 py-4 text-sm text-bad">
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
                rounded-xl
                bg-brand
                px-6 py-3.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-brand-hover
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

          <section className="card p-6 lg:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ok-soft text-ok">
                  <ShieldCheck size={22} />
                </div>

                <div>

                  <p className="eyebrow">
                    Denuncia encontrada
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                    {resultado.codigoSeguimiento}
                  </h2>

                  <p className="mt-2 text-sm text-muted">
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

              <div className="rounded-xl border border-line bg-surface-2 p-5">

                <p className="eyebrow">
                  Causa
                </p>

                <p className="mt-2 text-sm font-bold text-ink">
                  {causaLabels[
                    resultado.causa
                  ]}
                </p>

              </div>


              {/* RELACIÓN */}

              <div className="rounded-xl border border-line bg-surface-2 p-5">

                <p className="eyebrow">
                  Relación
                </p>

                <p className="mt-2 text-sm font-bold text-ink">
                  {relacionLabels[
                    resultado.relacionEmpresa
                  ]}
                </p>

              </div>


              {/* ACTUALIZACIÓN */}

              <div className="rounded-xl border border-line bg-surface-2 p-5">

                <p className="eyebrow">
                  Última actualización
                </p>

                <p className="mt-2 text-sm font-bold text-ink">
                  {formatearFecha(
                    resultado.fechaActualizacion
                  )}
                </p>

              </div>

            </div>


            {/* DESCRIPCIÓN */}

            <div className="mt-5 rounded-xl border border-line bg-white p-5">

              <div className="flex items-start gap-3">

                <FileText
                  size={19}
                  className="mt-0.5 shrink-0 text-muted"
                />

                <div>

                  <p className="text-sm font-bold text-ink">
                    Descripción
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                    {resultado.descripcion}
                  </p>

                </div>

              </div>

            </div>

          </section>


          {/* ==================================================
              HISTORIAL
          ================================================== */}

          <section className="card p-6 lg:p-8">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
                <Clock3 size={22} />
              </div>

              <div>

                <p className="eyebrow">
                  Seguimiento
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                  Historial de la denuncia
                </h2>

                <p className="mt-2 text-sm leading-6 text-muted">
                  Aquí puedes revisar los cambios de estado de tu
                  denuncia.
                </p>

              </div>

            </div>


            <div className="mt-8">

              {resultado.historial.length === 0 ? (

                <div className="rounded-xl border border-dashed border-line-strong bg-surface-2 px-6 py-8 text-center">

                  <Clock3
                    size={25}
                    className="mx-auto text-faint"
                  />

                  <p className="mt-3 text-sm font-semibold text-ink">
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

                          <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ok/20 bg-ok-soft text-ok">

                            <CheckCircle2
                              size={17}
                            />

                          </div>


                          {/* CONTENIDO */}

                          <div className={`flex-1 ${ultimo ? "" : "pb-7"}`}>

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">

                              <p className="text-sm font-bold text-ink">
                                {estadoLabels[
                                  registro.estadoNuevo
                                ]}
                              </p>

                              <p className="text-xs text-faint">
                                {formatearFecha(
                                  registro.fechaCreacion
                                )}
                              </p>

                            </div>

                            {registro.comentario && (

                              <p className="mt-1.5 text-sm leading-6 text-muted">
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
              className="rounded-xl border border-line-strong bg-white px-5 py-3 text-sm font-semibold text-brand transition hover:bg-line"
            >
              Realizar otra consulta
            </button>

          </div>

        </>

      )}

    </div>
  );
}