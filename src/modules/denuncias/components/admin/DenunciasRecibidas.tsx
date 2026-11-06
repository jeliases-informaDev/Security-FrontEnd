"use client";

import {
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Boton,
} from "@/shared/ui/kit";

import {
  useCatalogoDenuncias,
} from "../../hooks/useCatalogoDenuncias";

import {
  conCamposNuevos,
  esLineaDerivacion,
  fechaDia,
  nombreDe,
  puedeVerReservado,
} from "../../lib/denuncias";

import {
  denunciaService,
} from "../../services/denuncia.service";

import type {
  DenunciaArchivo,
  DenunciaDetalle,
  DenunciaResumen,
  EstadoDenuncia,
} from "../../types/denuncia.types";

import {
  CerrarDenunciaModal,
} from "./CerrarDenunciaModal";

import {
  DerivarOficialModal,
} from "./DerivarOficialModal";

import {
  Chip,
  ChipDerivada,
  ChipEstado,
  ChipPlazo,
  ChipResultado,
} from "./chips";


type FiltroEstado =
  | "TODOS"
  | EstadoDenuncia;


const ESTADOS: Array<{
  value: FiltroEstado;
  label: string;
}> = [
  {
    value: "TODOS",
    label: "Todas",
  },
  {
    value: "RECIBIDO",
    label: "Recibidas",
  },
  {
    value: "EN_PROCESO",
    label: "En proceso",
  },
  {
    value: "CERRADO",
    label: "Cerradas",
  },
];


function siguienteEstado(
  estado: EstadoDenuncia
): EstadoDenuncia | null {

  switch (estado) {

    case "RECIBIDO":
      return "EN_PROCESO";

    case "EN_PROCESO":
      return "CERRADO";

    case "CERRADO":
      return null;
  }
}


function formatearFecha(
  fecha: string | null
): string {

  if (!fecha) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(
    new Date(fecha)
  );
}


function formatearTamano(
  bytes: number | null
): string {

  if (
    bytes === null ||
    bytes === undefined
  ) {
    return "Tamaño no disponible";
  }

  if (
    bytes < 1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes < 1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(2)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
}


export function DenunciasRecibidas() {

  // Nombres de estados, situaciones y resultados (del servidor; si aún no tiene el catálogo, la lista local).
  const catalogo =
    useCatalogoDenuncias();

  function etiquetaEstado(
    estado: EstadoDenuncia
  ): string {

    return nombreDe(
      catalogo.estados,
      estado
    );
  }

  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = useState<FiltroEstado>(
    "TODOS"
  );

  const [
    denuncias,
    setDenuncias,
  ] = useState<DenunciaResumen[]>(
    []
  );

  const [
    detalle,
    setDetalle,
  ] = useState<DenunciaDetalle | null>(
    null
  );

  const [
    cargandoListado,
    setCargandoListado,
  ] = useState(
    true
  );

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] = useState(
    false
  );

  const [
    actualizandoEstado,
    setActualizandoEstado,
  ] = useState(
    false
  );

  const [
    descargandoArchivoId,
    setDescargandoArchivoId,
  ] = useState<number | null>(
    null
  );

  const [
    comentario,
    setComentario,
  ] = useState(
    ""
  );

  // Ventanas: cerrar con resultado y derivar al oficial (reservado).
  const [
    cerrando,
    setCerrando,
  ] = useState(
    false
  );

  const [
    derivando,
    setDerivando,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  // ==========================================================
  // LISTAR
  // ==========================================================

  const cargarDenuncias =
    useCallback(
      async () => {

        try {

          setCargandoListado(
            true
          );

          setError(
            null
          );


          const resultado =
            await denunciaService
              .listarDenuncias(
                estadoFiltro === "TODOS"
                  ? undefined
                  : estadoFiltro
              );


          setDenuncias(
            resultado
          );

        } catch {

          setError(
            "No se pudo cargar la lista de denuncias."
          );

        } finally {

          setCargandoListado(
            false
          );
        }
      },
      [
        estadoFiltro,
      ]
    );


  useEffect(
    () => {

      void cargarDenuncias();

    },
    [
      cargarDenuncias,
    ]
  );


  // ==========================================================
  // DETALLE
  // ==========================================================

  async function abrirDenuncia(
    id: number
  ) {

    try {

      setCargandoDetalle(
        true
      );

      setError(
        null
      );

      setComentario(
        ""
      );


      const resultado =
        await denunciaService
          .obtenerDenuncia(
            id
          );


      setDetalle(
        resultado
      );

    } catch {

      setError(
        "No se pudo obtener el detalle de la denuncia."
      );

    } finally {

      setCargandoDetalle(
        false
      );
    }
  }


  // ==========================================================
  // ACTUALIZAR ESTADO
  // ==========================================================

  async function cambiarEstado() {

    if (
      !detalle
    ) {
      return;
    }


    const nuevoEstado =
      siguienteEstado(
        detalle.estado
      );


    if (
      !nuevoEstado
    ) {
      return;
    }


    // Cerrar pide el resultado (y el motivo si se archiva): lo hace una ventana. Con el servidor anterior, como antes.
    if (
      nuevoEstado === "CERRADO" &&
      conCamposNuevos(
        detalle
      )
    ) {

      setCerrando(
        true
      );

      return;
    }


    try {

      setActualizandoEstado(
        true
      );

      setError(
        null
      );


      const resultado =
        await denunciaService
          .actualizarEstado(
            detalle.id,
            {
              estado:
                nuevoEstado,

              comentario:
                comentario
                  .trim() ||
                null,
            }
          );


      setDetalle(
        resultado
      );

      setComentario(
        ""
      );


      await cargarDenuncias();

    } catch {

      setError(
        "No se pudo actualizar el estado de la denuncia."
      );

    } finally {

      setActualizandoEstado(
        false
      );
    }
  }


  // ==========================================================
  // CERRAR CON RESULTADO / DERIVAR (las dos ventanas devuelven el detalle)
  // ==========================================================

  async function alCerrar(
    resultado: DenunciaDetalle
  ) {

    setCerrando(
      false
    );

    setDetalle(
      resultado
    );

    setComentario(
      ""
    );

    await cargarDenuncias();
  }


  async function alDerivar(
    resultado: DenunciaDetalle
  ) {

    setDerivando(
      false
    );

    setDetalle(
      resultado
    );

    await cargarDenuncias();
  }


  // ==========================================================
  // DESCARGAR
  // ==========================================================

  async function descargar(
    archivo: DenunciaArchivo
  ) {

    if (
      !detalle
    ) {
      return;
    }


    try {

      setDescargandoArchivoId(
        archivo.id
      );

      setError(
        null
      );


      await denunciaService
        .descargarDocumento(
          detalle.id,
          archivo
        );

    } catch {

      setError(
        "No se pudo descargar el documento."
      );

    } finally {

      setDescargandoArchivoId(
        null
      );
    }
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="space-y-6">

      {/* =====================================================
          CABECERA
      ===================================================== */}

      <section className="rounded-xl border border-line bg-white p-6 lg:p-7">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="eyebrow">
              Gestión
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Denuncias recibidas
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Revisa las denuncias asignadas, consulta su información,
              descarga documentación y registra los avances de atención.
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              void cargarDenuncias()
            }
            disabled={
              cargandoListado
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              border border-line
              bg-white
              px-4 py-3
              text-sm
              font-semibold
              text-brand
              transition
              hover:bg-surface-2
              disabled:opacity-60
            "
          >

            <RefreshCw
              size={17}
              className={
                cargandoListado
                  ? "animate-spin"
                  : ""
              }
            />

            Actualizar

          </button>

        </div>

      </section>


      {/* =====================================================
          FILTROS
      ===================================================== */}

      <section className="rounded-xl border border-line bg-white p-4">

        <div className="flex flex-wrap gap-2">

          {ESTADOS.map(
            (item) => (

              <button
                key={
                  item.value
                }
                type="button"
                onClick={() => {

                  setEstadoFiltro(
                    item.value
                  );

                  setDetalle(
                    null
                  );

                }}
                className={`
                  rounded-xl
                  px-4 py-2.5
                  text-sm
                  font-semibold
                  transition
                  ${
                    estadoFiltro ===
                    item.value
                      ? "bg-brand text-white"
                      : "bg-surface-2 text-muted hover:bg-line hover:text-brand"
                  }
                `}
              >

                {item.label}

              </button>

            )
          )}

        </div>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="rounded-xl border border-bad/20 bg-bad-soft px-5 py-4 text-sm text-bad">
          {error}
        </div>

      )}


      {/* =====================================================
          CONTENIDO
      ===================================================== */}

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">

        {/* ===================================================
            LISTA
        =================================================== */}

        <section className="overflow-hidden rounded-xl border border-line bg-white">

          <div className="border-b border-line px-5 py-4">

            <p className="font-bold text-ink">
              Denuncias
            </p>

            <p className="mt-1 text-xs text-muted">
              {denuncias.length} resultado(s)
            </p>

          </div>


          {cargandoListado ? (

            <div className="flex min-h-[300px] items-center justify-center">

              <Loader2
                size={28}
                className="animate-spin text-brand"
              />

            </div>

          ) : denuncias.length === 0 ? (

            <div className="px-6 py-16 text-center">

              <ShieldCheck
                size={34}
                className="mx-auto text-faint"
              />

              <p className="mt-4 text-sm font-semibold text-ink">
                No hay denuncias
              </p>

              <p className="mt-2 text-xs text-muted">
                No existen registros para el filtro seleccionado.
              </p>

            </div>

          ) : (

            <div className="max-h-[760px] overflow-y-auto">

              {denuncias.map(
                (denuncia) => {

                  const seleccionada =
                    detalle?.id ===
                    denuncia.id;


                  return (

                    <button
                      key={
                        denuncia.id
                      }
                      type="button"
                      onClick={() =>
                        void abrirDenuncia(
                          denuncia.id
                        )
                      }
                      className={`
                        w-full
                        border-b
                        border-surface-2
                        px-5 py-5
                        text-left
                        transition
                        last:border-b-0
                        ${
                          seleccionada
                            ? "bg-surface-2"
                            : "hover:bg-surface-2"
                        }
                      `}
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="text-xs font-black text-brand">
                              #{denuncia.id}
                            </span>

                            <ChipEstado
                              estado={
                                denuncia.estado
                              }
                              etiqueta={
                                denuncia.estadoEtiqueta
                              }
                              estados={
                                catalogo.estados
                              }
                            />

                            <ChipPlazo
                              denuncia={
                                denuncia
                              }
                            />

                            {denuncia.estado ===
                              "CERRADO" &&
                              denuncia.resultadoCierre && (
                                <ChipResultado
                                  resultado={
                                    denuncia.resultadoCierre
                                  }
                                  etiqueta={
                                    denuncia.resultadoCierreEtiqueta
                                  }
                                />
                              )}

                            {denuncia.derivadaAlOficial ===
                              true && (
                              <ChipDerivada />
                            )}

                          </div>


                          <p className="mt-3 break-words font-bold text-ink">
                            {denuncia.causaEtiqueta ||
                              nombreDe(
                                catalogo.situaciones,
                                denuncia.causa
                              )}
                          </p>


                          <p className="mt-1 break-words text-xs leading-5 text-muted">
                            {denuncia.descripcion}
                          </p>


                          <div className="mt-3 flex items-center gap-2 text-[11px] text-faint">

                            <Clock3
                              size={13}
                            />

                            {formatearFecha(
                              denuncia.fechaCreacion
                            )}

                          </div>

                        </div>


                        <ChevronRight
                          size={19}
                          className="mt-1 shrink-0 text-faint"
                        />

                      </div>

                    </button>

                  );
                }
              )}

            </div>

          )}

        </section>


        {/* ===================================================
            DETALLE
        =================================================== */}

        <section className="min-h-[500px] rounded-xl border border-line bg-white p-6 lg:p-7">

          {cargandoDetalle ? (

            <div className="flex min-h-[430px] items-center justify-center">

              <Loader2
                size={30}
                className="animate-spin text-brand"
              />

            </div>

          ) : !detalle ? (

            <div className="flex min-h-[430px] flex-col items-center justify-center text-center">

              <FileText
                size={42}
                className="text-faint"
              />

              <p className="mt-4 font-bold text-ink">
                Selecciona una denuncia
              </p>

              <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                Elige un registro del listado para consultar su información completa.
              </p>

            </div>

          ) : (

            <div className="space-y-7">

              {/* CABECERA */}

              <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-start md:justify-between">

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="text-sm font-black text-brand">
                      Denuncia #{detalle.id}
                    </span>

                    <ChipEstado
                      grande
                      estado={
                        detalle.estado
                      }
                      etiqueta={
                        detalle.estadoEtiqueta
                      }
                      estados={
                        catalogo.estados
                      }
                    />

                    <ChipPlazo
                      grande
                      denuncia={
                        detalle
                      }
                    />

                    {detalle.derivadaAlOficial ===
                      true && (
                      <ChipDerivada
                        grande
                      />
                    )}

                  </div>


                  <h3 className="mt-3 break-words text-2xl font-bold text-ink">
                    {detalle.causaEtiqueta ||
                      nombreDe(
                        catalogo.situaciones,
                        detalle.causa
                      )}
                  </h3>


                  <p className="mt-1 break-words text-sm text-muted">
                    Relación: {detalle.relacionEmpresa}
                  </p>

                </div>


                <div className="text-left md:text-right">

                  <p className="text-xs text-faint">
                    Registrada
                  </p>

                  <p className="mt-1 text-sm font-semibold text-ink">
                    {formatearFecha(
                      detalle.fechaCreacion
                    )}
                  </p>

                  {detalle.fechaLimiteAtencion && (

                    <>

                      <p className="mt-3 text-xs text-faint">
                        Plazo de atención hasta el
                      </p>

                      <p className="mt-1 text-sm font-semibold text-ink">
                        {fechaDia(
                          detalle.fechaLimiteAtencion
                        )}
                      </p>

                    </>

                  )}

                </div>

              </div>


              {/* DESCRIPCIÓN */}

              <div>

                <p className="eyebrow">
                  Descripción
                </p>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-muted">
                  {detalle.descripcion}
                </p>

              </div>


              {/* RESULTADO DEL CIERRE */}

              {detalle.estado ===
                "CERRADO" &&
                conCamposNuevos(
                  detalle
                ) && (

                <div className="rounded-xl border border-line bg-surface-2 p-5">

                  <p className="eyebrow">
                    Resultado del cierre
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">

                    {detalle.resultadoCierre ? (

                      <ChipResultado
                        grande
                        resultado={
                          detalle.resultadoCierre
                        }
                        etiqueta={
                          detalle.resultadoCierreEtiqueta
                        }
                      />

                    ) : (

                      <Chip
                        grande
                        tono="neutral"
                      >
                        Sin dato
                      </Chip>

                    )}

                  </div>

                  {detalle.motivoCierre && (

                    <div className="mt-4">

                      <p className="text-xs font-semibold text-muted">
                        Motivo
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
                        {detalle.motivoCierre}
                      </p>

                    </div>

                  )}

                </div>

              )}


              {/* RECEPTOR / DENUNCIANTE */}

              <div className="grid gap-4 md:grid-cols-2">

                <div className="min-w-0 rounded-xl bg-surface-2 p-5">

                  <p className="eyebrow">
                    Receptor
                  </p>

                  <p className="mt-3 break-words text-sm font-bold text-ink">
                    {detalle.receptor ||
                      detalle.receptorPropuesto ||
                      "Sin receptor"}
                  </p>

                </div>


                <div className="min-w-0 rounded-xl bg-surface-2 p-5">

                  <div className="flex items-center gap-2">

                    <UserRound
                      size={17}
                      className="text-brand"
                    />

                    <p className="eyebrow">
                      Denunciante
                    </p>

                  </div>


                  {detalle.anonima ? (

                    <p className="mt-3 text-sm font-bold text-ink">
                      Denuncia anónima
                    </p>

                  ) : (

                    <div className="mt-3 space-y-1 break-words text-sm text-muted">

                      <p>
                        {detalle.nombreDenunciante ||
                          "Sin nombre"}
                      </p>

                      {detalle.documentoDenunciante && (
                        <p>
                          Documento: {detalle.documentoDenunciante}
                        </p>
                      )}

                      {detalle.correoDenunciante && (
                        <p>
                          {detalle.correoDenunciante}
                        </p>
                      )}

                      {detalle.telefonoDenunciante && (
                        <p>
                          {detalle.telefonoDenunciante}
                        </p>
                      )}

                    </div>

                  )}

                </div>

              </div>


              {/* INVOLUCRADOS */}

              <div>

                <p className="eyebrow">
                  Involucrados
                </p>


                {detalle.involucrados.length === 0 ? (

                  <p className="mt-3 text-sm text-faint">
                    No se registraron involucrados.
                  </p>

                ) : (

                  <div className="mt-3 grid gap-3 md:grid-cols-2">

                    {detalle.involucrados.map(
                      (persona) => (

                        <div
                          key={
                            persona.id
                          }
                          className="min-w-0 rounded-xl border border-line p-4"
                        >

                          <p className="break-words font-semibold text-ink">
                            {persona.nombreRazonSocial}
                          </p>

                          <p className="mt-1 text-xs text-muted">
                            {persona.tipoPersona}
                            {" · "}
                            {persona.rolIncidente}
                          </p>

                          {persona.documento && (
                            <p className="mt-2 break-words text-xs text-muted">
                              Documento: {persona.documento}
                            </p>
                          )}

                          {persona.cargo && (
                            <p className="mt-1 break-words text-xs text-muted">
                              Cargo: {persona.cargo}
                            </p>
                          )}

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* DOCUMENTOS */}

              <div>

                <p className="eyebrow">
                  Documentación adjunta
                </p>


                {detalle.archivos.length === 0 ? (

                  <p className="mt-3 text-sm text-faint">
                    La denuncia no tiene documentos adjuntos.
                  </p>

                ) : (

                  <div className="mt-3 space-y-3">

                    {detalle.archivos.map(
                      (archivo) => (

                        <div
                          key={
                            archivo.id
                          }
                          className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand">

                              <FileText
                                size={18}
                              />

                            </div>


                            <div className="min-w-0">

                              <p className="text-sm font-semibold text-ink [overflow-wrap:anywhere]">
                                {archivo.nombreOriginal}
                              </p>

                              <p className="mt-1 text-xs text-faint">
                                {formatearTamano(
                                  archivo.tamanoBytes
                                )}
                              </p>

                            </div>

                          </div>


                          <button
                            type="button"
                            onClick={() =>
                              void descargar(
                                archivo
                              )
                            }
                            disabled={
                              descargandoArchivoId ===
                              archivo.id
                            }
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-2
                              rounded-xl
                              bg-brand
                              px-4 py-2.5
                              text-xs
                              font-bold
                              text-white
                              transition
                              hover:bg-brand-hover
                              disabled:opacity-60
                            "
                          >

                            {descargandoArchivoId ===
                            archivo.id ? (

                              <Loader2
                                size={15}
                                className="animate-spin"
                              />

                            ) : (

                              <Download
                                size={15}
                              />

                            )}

                            Descargar

                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* HISTORIAL */}

              <div>

                <p className="eyebrow">
                  Historial
                </p>


                <div className="mt-4 space-y-3">

                  {/* La línea neutra de la derivación es reservada: solo la ve quien el servidor deja ver lo reservado. */}

                  {detalle.historial
                    .filter(
                      (evento) =>
                        puedeVerReservado(
                          detalle
                        ) ||
                        !esLineaDerivacion(
                          evento.comentario
                        )
                    )
                    .map(
                    (evento) => {

                      const reservado =
                        esLineaDerivacion(
                          evento.comentario
                        );

                      return (

                      <div
                        key={
                          evento.id
                        }
                        className="rounded-xl bg-surface-2 p-4"
                      >

                        <div className="flex flex-wrap items-center justify-between gap-2">

                          <p className="min-w-0 break-words text-sm font-bold text-ink">
                            {evento.estadoAnterior &&
                            evento.estadoAnterior !==
                              evento.estadoNuevo
                              ? `${etiquetaEstado(
                                  evento.estadoAnterior
                                )} → `
                              : ""}
                            {etiquetaEstado(
                              evento.estadoNuevo
                            )}
                          </p>

                          <p className="text-xs text-faint">
                            {formatearFecha(
                              evento.fechaCreacion
                            )}
                          </p>

                        </div>


                        {evento.comentario && (

                          <p className="mt-2 flex items-start gap-1.5 break-words text-sm leading-6 text-muted">

                            {reservado && (
                              <Lock
                                size={14}
                                className="mt-1.5 shrink-0 text-ink"
                                aria-hidden="true"
                              />
                            )}

                            <span className="min-w-0 flex-1">
                              {evento.comentario}
                            </span>

                          </p>

                        )}


                        {evento.usuario && (

                          <p className="mt-2 break-words text-xs font-semibold text-muted">
                            {evento.usuario}
                          </p>

                        )}

                      </div>

                      );
                    }
                  )}

                </div>

              </div>


              {/* CAMBIO DE ESTADO */}

              {siguienteEstado(
                detalle.estado
              ) && (

                <div className="rounded-xl border border-line bg-surface-2 p-5">

                  <p className="text-sm font-bold text-ink">
                    Actualizar estado
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    El siguiente estado será{" "}
                    <strong>
                      {etiquetaEstado(
                        siguienteEstado(
                          detalle.estado
                        ) as EstadoDenuncia
                      )}
                    </strong>.
                  </p>


                  <textarea
                    value={
                      comentario
                    }
                    onChange={
                      (event) =>
                        setComentario(
                          event.target.value
                        )
                    }
                    rows={4}
                    maxLength={1000}
                    placeholder="Comentario de gestión (opcional)"
                    className="
                      mt-4
                      w-full
                      resize-none
                      rounded-xl
                      border border-line
                      bg-white
                      px-4 py-3
                      text-sm
                      text-ink
                      outline-none
                      transition
                      placeholder:text-faint
                      focus:border-muted
                      focus:ring-2
                      focus:ring-muted/10
                    "
                  />


                  <div className="mt-4 flex justify-end">

                    <button
                      type="button"
                      onClick={() =>
                        void cambiarEstado()
                      }
                      disabled={
                        actualizandoEstado
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-brand
                        px-5 py-3
                        text-sm
                        font-bold
                        text-white
                        transition
                        hover:bg-brand-hover
                        disabled:opacity-60
                      "
                    >

                      {actualizandoEstado && (

                        <Loader2
                          size={16}
                          className="animate-spin"
                        />

                      )}

                      {siguienteEstado(
                        detalle.estado
                      ) === "CERRADO" &&
                      conCamposNuevos(
                        detalle
                      ) ? (
                        "Cerrar la denuncia"
                      ) : (
                        <>
                          Pasar a{" "}
                          {etiquetaEstado(
                            siguienteEstado(
                              detalle.estado
                            ) as EstadoDenuncia
                          )}
                        </>
                      )}

                    </button>

                  </div>

                </div>

              )}


              {/* DERIVACIÓN AL OFICIAL DE CUMPLIMIENTO (RESERVADA) */}

              {puedeVerReservado(
                detalle
              ) && (

                <div className="rounded-xl border border-line bg-white p-5">

                  <div className="flex items-start gap-3">

                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-paper"
                      aria-hidden="true"
                    >
                      <Lock
                        size={16}
                      />
                    </span>

                    <div className="min-w-0 flex-1">

                      <p className="text-sm font-bold text-ink">
                        Derivación al oficial de cumplimiento
                      </p>

                      {detalle.derivadaAlOficial ? (

                        <>

                          <p className="mt-1 text-xs leading-5 text-muted">
                            Esta denuncia está derivada y en reserva.
                          </p>

                          {detalle.derivacion && (

                            <dl className="mt-4 grid gap-4 sm:grid-cols-2">

                              <div className="min-w-0">

                                <dt className="text-xs font-semibold text-muted">
                                  Fecha
                                </dt>

                                <dd className="mt-1 break-words text-sm text-ink">
                                  {formatearFecha(
                                    detalle.derivacion.fechaDerivacion
                                  )}
                                </dd>

                              </div>

                              <div className="min-w-0">

                                <dt className="text-xs font-semibold text-muted">
                                  Derivada por
                                </dt>

                                <dd className="mt-1 break-words text-sm text-ink">
                                  {detalle.derivacion.derivadaPor ||
                                    "—"}
                                </dd>

                              </div>

                              <div className="min-w-0 sm:col-span-2">

                                <dt className="text-xs font-semibold text-muted">
                                  Motivo
                                </dt>

                                <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
                                  {detalle.derivacion.motivo ||
                                    "Sin motivo registrado."}
                                </dd>

                              </div>

                            </dl>

                          )}

                        </>

                      ) : (

                        <>

                          <p className="mt-1 text-xs leading-5 text-muted">
                            Envía esta denuncia en reserva al oficial de cumplimiento.
                            Solo quienes pueden ver lo reservado sabrán que se derivó.
                          </p>

                          <div className="mt-4">

                            <Boton
                              variante="secundario"
                              icono={Lock}
                              onClick={() =>
                                setDerivando(
                                  true
                                )
                              }
                              className="h-auto min-h-10 whitespace-normal py-2 text-center"
                            >
                              Derivar al oficial de cumplimiento
                            </Boton>

                          </div>

                        </>

                      )}

                    </div>

                  </div>

                </div>

              )}

            </div>

          )}

        </section>

      </div>


      {/* =====================================================
          VENTANAS: CERRAR CON RESULTADO / DERIVAR
      ===================================================== */}

      {detalle &&
        cerrando && (

        <CerrarDenunciaModal
          id={detalle.id}
          resultados={
            catalogo.resultadosCierre
          }
          comentario={
            comentario
          }
          onCerrar={() =>
            setCerrando(
              false
            )
          }
          onCerrada={(resultado) =>
            void alCerrar(
              resultado
            )
          }
        />

      )}

      {detalle &&
        derivando && (

        <DerivarOficialModal
          id={detalle.id}
          onCerrar={() =>
            setDerivando(
              false
            )
          }
          onDerivada={(resultado) =>
            void alDerivar(
              resultado
            )
          }
        />

      )}

    </div>
  );
}