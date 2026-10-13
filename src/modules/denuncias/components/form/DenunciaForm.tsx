"use client";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  denunciaService,
} from "../../services/denuncia.service";
import type {
  CausaDenuncia,
  CrearDenunciaRequest,
  CrearDenunciaResponse,
  CrearInvolucradoRequest,
  ReceptorDenuncia,
  RelacionEmpresa,
  RolIncidente,
  TipoPersonaInvolucrada,
} from "../../types/denuncia.types";
import { StyledSelect } from "@/shared/ui/StyledSelect";
/* ============================================================
   UI
   ============================================================ */
const inputClass =
  "w-full rounded-2xl border border-[#C6D0E2] bg-white px-4 py-3 text-sm text-[#231F20] outline-none transition placeholder:text-slate-400 focus:border-[#1B4589] focus:ring-4 focus:ring-[#E8ECF3] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";
const labelClass =
  "mb-2 block text-sm font-semibold text-[#231F20]";
const MAX_DOCUMENTOS = 5;
const MAX_TAMANO_DOCUMENTO =
  10 * 1024 * 1024;
const EXTENSIONES_DOCUMENTOS =
  new Set([
    "pdf",
    "doc",
    "docx",
  ]);
function formatearTamanoArchivo(
  bytes: number
) {
  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }
  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
}
const causaOptions = [
  {
    value: "SOBORNO",
    label: "Soborno",
  },
  {
    value: "CONFLICTO",
    label: "Conflicto",
  },
  {
    value: "ACOSO",
    label: "Acoso",
  },
];
const relacionEmpresaOptions = [
  {
    value: "TRABAJADOR",
    label: "Trabajador",
  },
  {
    value: "CLIENTE",
    label: "Cliente",
  },
  {
    value: "PROVEEDOR",
    label: "Proveedor",
  },
];
const tipoPersonaOptions = [
  {
    value: "PERSONA_NATURAL",
    label: "Persona natural",
  },
  {
    value: "PERSONA_JURIDICA",
    label: "Persona jurídica",
  },
];
const rolIncidenteOptions = [
  {
    value: "TESTIGO",
    label: "Testigo",
  },
  {
    value: "ENCARGADO",
    label: "Encargado",
  },
];
/* ============================================================
   COMPONENT
   ============================================================ */
export function DenunciaForm() {
  /* ==========================================================
     DENUNCIA
     ========================================================== */
  const [
    causa,
    setCausa,
  ] = useState<
    CausaDenuncia | ""
  >("");
  const [
    relacionEmpresa,
    setRelacionEmpresa,
  ] = useState<
    RelacionEmpresa | ""
  >("");
  const [
    descripcion,
    setDescripcion,
  ] = useState("");
  /* ==========================================================
     RECEPTOR
     ========================================================== */
  const [
    receptores,
    setReceptores,
  ] = useState<
    ReceptorDenuncia[]
  >([]);
  const [
    cargandoReceptores,
    setCargandoReceptores,
  ] = useState(true);
  const [
    receptorUsuarioId,
    setReceptorUsuarioId,
  ] = useState("");
  const [
    proponerOtroReceptor,
    setProponerOtroReceptor,
  ] = useState(false);
  const [
    receptorPropuesto,
    setReceptorPropuesto,
  ] = useState("");
  /* ==========================================================
     INVOLUCRADOS
     ========================================================== */
  const [
    involucrados,
    setInvolucrados,
  ] = useState<
    CrearInvolucradoRequest[]
  >([]);
  const [
    modalInvolucradoAbierto,
    setModalInvolucradoAbierto,
  ] = useState(false);
  const [
    tipoPersona,
    setTipoPersona,
  ] = useState<
    TipoPersonaInvolucrada
  >("PERSONA_NATURAL");
  const [
    rolIncidente,
    setRolIncidente,
  ] = useState<
    RolIncidente
  >("TESTIGO");
  const [
    documentoInvolucrado,
    setDocumentoInvolucrado,
  ] = useState("");
  const [
    nombreRazonSocial,
    setNombreRazonSocial,
  ] = useState("");
  const [
    cargoInvolucrado,
    setCargoInvolucrado,
  ] = useState("");
  /* ==========================================================
     DENUNCIANTE
     ========================================================== */
  const [
    anonima,
    setAnonima,
  ] = useState(false);
  const [
    nombreDenunciante,
    setNombreDenunciante,
  ] = useState("");
  const [
    documentoDenunciante,
    setDocumentoDenunciante,
  ] = useState("");
  const [
    telefonoDenunciante,
    setTelefonoDenunciante,
  ] = useState("");
  const [
    correoDenunciante,
    setCorreoDenunciante,
  ] = useState("");
  /* ==========================================================
     TÉRMINOS / ESTADO
     ========================================================== */
  const [
    aceptaTerminos,
    setAceptaTerminos,
  ] = useState(false);
  const [
    enviando,
    setEnviando,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);
  const [
    denunciaRegistrada,
    setDenunciaRegistrada,
  ] = useState<
    CrearDenunciaResponse | null
  >(null);
  /* ==========================================================
     DOCUMENTOS
     ========================================================== */
  const [
    documentos,
    setDocumentos,
  ] = useState<File[]>([]);
  const [
    errorDocumentos,
    setErrorDocumentos,
  ] = useState<
    string | null
  >(null);
  const [
    advertenciaDocumentos,
    setAdvertenciaDocumentos,
  ] = useState<
    string | null
  >(null);
  const [
    documentosSubidos,
    setDocumentosSubidos,
  ] = useState(false);
  /* ============================================================
     RECEPTORES
     ============================================================ */
  useEffect(() => {
    async function cargarReceptores() {
      try {
        setCargandoReceptores(
          true
        );
        setError(
          null
        );
        const data =
          await denunciaService
            .listarReceptores();
        setReceptores(
          data
        );
      } catch {
        setError(
          "No se pudieron cargar los receptores disponibles."
        );
      } finally {
        setCargandoReceptores(
          false
        );
      }
    }
    void cargarReceptores();
  }, []);
  /* ============================================================
     MODAL INVOLUCRADO
     ============================================================ */
  function abrirModalInvolucrado() {
    setTipoPersona(
      "PERSONA_NATURAL"
    );
    setRolIncidente(
      "TESTIGO"
    );
    setDocumentoInvolucrado(
      ""
    );
    setNombreRazonSocial(
      ""
    );
    setCargoInvolucrado(
      ""
    );
    setModalInvolucradoAbierto(
      true
    );
  }
  function cerrarModalInvolucrado() {
    setModalInvolucradoAbierto(
      false
    );
  }
  function agregarInvolucrado() {
    if (
      !nombreRazonSocial.trim() ||
      !cargoInvolucrado.trim()
    ) {
      return;
    }
    const nuevo:
      CrearInvolucradoRequest = {
      tipoPersona,
      rolIncidente,
      documento:
        documentoInvolucrado.trim()
          ? documentoInvolucrado.trim()
          : null,
      nombreRazonSocial:
        nombreRazonSocial.trim(),
      cargo:
        cargoInvolucrado.trim(),
    };
    setInvolucrados(
      (actuales) => [
        ...actuales,
        nuevo,
      ]
    );
    cerrarModalInvolucrado();
  }
  function eliminarInvolucrado(
    index: number
  ) {
    setInvolucrados(
      (actuales) =>
        actuales.filter(
          (_, actualIndex) =>
            actualIndex !== index
        )
    );
  }
  /* ============================================================
     RECEPTOR PROPUESTO
     ============================================================ */
  function cambiarReceptorPropuesto(
    checked: boolean
  ) {
    setProponerOtroReceptor(
      checked
    );
    if (checked) {
      setReceptorUsuarioId(
        ""
      );
    } else {
      setReceptorPropuesto(
        ""
      );
    }
  }
  /* ============================================================
     ANÓNIMA
     ============================================================ */
  function cambiarAnonima(
    checked: boolean
  ) {
    setAnonima(
      checked
    );
    if (checked) {
      setNombreDenunciante(
        ""
      );
      setDocumentoDenunciante(
        ""
      );
      setTelefonoDenunciante(
        ""
      );
      setCorreoDenunciante(
        ""
      );
    }
  }
  /* ============================================================
     DOCUMENTOS
     ============================================================ */
  function obtenerExtension(
    nombreArchivo: string
  ) {
    return nombreArchivo
      .split(".")
      .pop()
      ?.toLowerCase() ?? "";
  }
  function seleccionarDocumentos(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const nuevos =
      Array.from(
        event.target.files ?? []
      );
    /*
     * Permite seleccionar nuevamente el mismo archivo
     * después de haberlo eliminado.
     */
    event.target.value = "";
    if (nuevos.length === 0) {
      return;
    }
    setErrorDocumentos(
      null
    );
    for (
      const archivo
      of nuevos
    ) {
      const extension =
        obtenerExtension(
          archivo.name
        );
      if (
        !EXTENSIONES_DOCUMENTOS.has(
          extension
        )
      ) {
        setErrorDocumentos(
          `El archivo "${archivo.name}" no es válido. Solo se permiten PDF, DOC y DOCX.`
        );
        return;
      }
      if (
        archivo.size >
        MAX_TAMANO_DOCUMENTO
      ) {
        setErrorDocumentos(
          `El archivo "${archivo.name}" supera el límite de 10 MB.`
        );
        return;
      }
    }
    const combinados = [
      ...documentos,
      ...nuevos,
    ];
    const claves =
      new Set<string>();
    const unicos =
      combinados.filter(
        (archivo) => {
          const clave =
            [
              archivo.name,
              archivo.size,
              archivo.lastModified,
            ].join("-");
          if (
            claves.has(
              clave
            )
          ) {
            return false;
          }
          claves.add(
            clave
          );
          return true;
        }
      );
    if (
      unicos.length >
      MAX_DOCUMENTOS
    ) {
      setErrorDocumentos(
        "Puedes adjuntar como máximo 5 documentos."
      );
      return;
    }
    setDocumentos(
      unicos
    );
    setDocumentosSubidos(
      false
    );
    setAdvertenciaDocumentos(
      null
    );
  }
  function eliminarDocumento(
    index: number
  ) {
    setDocumentos(
      (actuales) =>
        actuales.filter(
          (
            _,
            actualIndex
          ) =>
            actualIndex !== index
        )
    );
    setErrorDocumentos(
      null
    );
    setDocumentosSubidos(
      false
    );
    setAdvertenciaDocumentos(
      null
    );
  }
  /* ============================================================
     VALIDAR
     ============================================================ */
  function validar():
    string | null {
    if (!causa) {
      return "Selecciona la causa de la denuncia.";
    }
    if (!relacionEmpresa) {
      return "Selecciona la relación con la empresa.";
    }
    if (!descripcion.trim()) {
      return "Ingresa la descripción de la denuncia.";
    }
    if (
      proponerOtroReceptor
    ) {
      if (
        !receptorPropuesto.trim()
      ) {
        return "Ingresa el receptor propuesto.";
      }
    } else {
      if (
        !receptorUsuarioId
      ) {
        return "Selecciona un receptor.";
      }
    }
    if (
      involucrados.length === 0
    ) {
      return "Registra al menos una persona o empresa involucrada.";
    }
    if (
      !aceptaTerminos
    ) {
      return "Debes aceptar los términos y condiciones.";
    }
    return null;
  }
  /* ============================================================
     ENVIAR
     ============================================================ */
  async function enviarDenuncia(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError(
      null
    );
    const mensajeValidacion =
      validar();
    if (
      mensajeValidacion
    ) {
      setError(
        mensajeValidacion
      );
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }
    const request:
      CrearDenunciaRequest = {
      causa:
        causa as CausaDenuncia,
      relacionEmpresa:
        relacionEmpresa as RelacionEmpresa,
      descripcion:
        descripcion.trim(),
      receptorUsuarioId:
        proponerOtroReceptor
          ? null
          : Number(
              receptorUsuarioId
            ),
      receptorPropuesto:
        proponerOtroReceptor
          ? receptorPropuesto.trim()
          : null,
      involucrados,
      anonima,
      nombreDenunciante:
        anonima
          ? null
          : nombreDenunciante.trim() ||
            null,
      documentoDenunciante:
        anonima
          ? null
          : documentoDenunciante.trim() ||
            null,
      telefonoDenunciante:
        anonima
          ? null
          : telefonoDenunciante.trim() ||
            null,
      correoDenunciante:
        anonima
          ? null
          : correoDenunciante.trim() ||
            null,
      aceptaTerminos,
    };
    try {
      setEnviando(
        true
      );
      /*
       * 1. Primero registramos la denuncia.
       */
      const resultado =
        await denunciaService
          .registrarDenuncia(
            request
          );
      setAdvertenciaDocumentos(
        null
      );
      setDocumentosSubidos(
        false
      );
      /*
       * 2. Si el usuario seleccionó documentos,
       *    los enviamos automáticamente usando
       *    el código y PIN recién generados.
       *
       *    El usuario NO escribe el PIN.
       */
      if (
        documentos.length > 0
      ) {
        try {
          await denunciaService
            .subirDocumentos(
              resultado.codigoSeguimiento,
              resultado.pin,
              documentos
            );
          setDocumentosSubidos(
            true
          );
        } catch (
          errorSubidaDocumentos
        ) {
          console.error(
            "La denuncia fue registrada, pero ocurrió un error subiendo los documentos:",
            errorSubidaDocumentos
          );
          /*
           * La denuncia ya existe. Por eso no mostramos
           * el mensaje genérico de error de registro.
           */
          setAdvertenciaDocumentos(
            "La denuncia fue registrada correctamente, pero no fue posible cargar uno o más documentos."
          );
        }
      }
      /*
       * 3. Mostramos código + PIN aunque
       *    la documentación haya fallado.
       */
      setDenunciaRegistrada(
        resultado
      );
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      /*
       * Solo llegamos aquí si falló
       * la creación de la denuncia.
       */
      console.error(
        "Error registrando denuncia:",
        error
      );
      setError(
        "No fue posible registrar la denuncia. Revisa la información e inténtalo nuevamente."
      );
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setEnviando(
        false
      );
    }
  }
  /* ============================================================
     NUEVA DENUNCIA
     ============================================================ */
  function nuevaDenuncia() {
    setCausa("");
    setRelacionEmpresa("");
    setDescripcion("");
    setReceptorUsuarioId("");
    setProponerOtroReceptor(false);
    setReceptorPropuesto("");
    setInvolucrados([]);
    setAnonima(false);
    setNombreDenunciante("");
    setDocumentoDenunciante("");
    setTelefonoDenunciante("");
    setCorreoDenunciante("");
    setAceptaTerminos(false);
    setDocumentos([]);
    setErrorDocumentos(null);
    setAdvertenciaDocumentos(null);
    setDocumentosSubidos(false);
    setError(null);
    setDenunciaRegistrada(null);
  }
  /* ============================================================
     FORMULARIO
     ============================================================ */
  return (
    <>
      <form
        onSubmit={enviarDenuncia}
        className="space-y-7"
      >
        {/* ======================================================
            MENSAJE DE ERROR
        ====================================================== */}
        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {/* ======================================================
            INFORMACIÓN DE LA DENUNCIA
        ====================================================== */}
        <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
              <FileText
                size={22}
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                Información principal
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                Información de la denuncia
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Indica el motivo y describe detalladamente
                los hechos que deseas reportar.
              </p>
            </div>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <label className={labelClass}>
                Causa de la denuncia *
              </label>
              <StyledSelect
                value={causa}
                options={causaOptions}
                placeholder="Seleccionar causa"
                onChange={(value) =>
                  setCausa(
                    value as CausaDenuncia
                  )
                }
              />
            </div>
            <div>
              <label className={labelClass}>
                Relación con la empresa *
              </label>
              <StyledSelect
                value={relacionEmpresa}
                options={relacionEmpresaOptions}
                placeholder="Seleccionar relación"
                onChange={(value) =>
                  setRelacionEmpresa(
                    value as RelacionEmpresa
                  )
                }
              />
            </div>
            <div className="lg:col-span-2">
              <label className={labelClass}>
                Descripción *
              </label>
              <textarea
                rows={6}
                value={descripcion}
                onChange={(event) =>
                  setDescripcion(
                    event.target.value
                  )
                }
                placeholder="Describe los hechos, fechas, lugares o cualquier información relevante..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        </section>
        {/* ======================================================
            RECEPTOR
        ====================================================== */}
        <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
              <UserRound
                size={22}
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                Receptor
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                Receptor de la denuncia
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Selecciona quién deberá recibir la denuncia
                o propón otro receptor.
              </p>
            </div>
          </div>
          {!proponerOtroReceptor ? (
            <div>
              <label className={labelClass}>
                Receptor *
              </label>
              <StyledSelect
                value={receptorUsuarioId}
                options={receptores.map(
                  (receptor) => ({
                    value: String(receptor.id),
                    label: receptor.cargo
                      ? `${receptor.nombreCompleto} - ${receptor.cargo}`
                      : receptor.nombreCompleto,
                  })
                )}
                placeholder={
                  cargandoReceptores
                    ? "Cargando receptores..."
                    : "Seleccionar receptor"
                }
                disabled={cargandoReceptores}
                onChange={(value) =>
                  setReceptorUsuarioId(value)
                }
              />
            </div>
          ) : (
            <div>
              <label className={labelClass}>
                Receptor propuesto *
              </label>
              <input
                type="text"
                value={receptorPropuesto}
                onChange={(event) =>
                  setReceptorPropuesto(
                    event.target.value
                  )
                }
                placeholder="Nombre, cargo o área del receptor"
                className={inputClass}
              />
            </div>
          )}
          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-[#E8ECF3] bg-[#F7F9FC] px-4 py-4">
            <input
              type="checkbox"
              checked={proponerOtroReceptor}
              onChange={(event) =>
                cambiarReceptorPropuesto(
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-slate-300 accent-[#1B4589]"
            />
            <div>
              <p className="text-sm font-semibold text-[#231F20]">
                Proponer otro receptor
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Utiliza esta opción si deseas proponer
                un receptor distinto a los disponibles.
              </p>
            </div>
          </label>
        </section>
        {/* ======================================================
            DOCUMENTACIÓN
        ====================================================== */}
        <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
              <FileText
                size={22}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                Evidencias
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                Documentación
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Puedes adjuntar documentos relacionados
                con la denuncia.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                PDF, DOC o DOCX · máximo 5 archivos ·
                máximo 10 MB por archivo.
              </p>
              {/* SELECTOR */}
              <label
                className={`
                  mt-6
                  flex cursor-pointer
                  flex-col
                  items-center
                  justify-center
                  rounded-3xl
                  border border-dashed
                  border-[#C6D0E2]
                  bg-[#F7F9FC]
                  px-6 py-7
                  text-center
                  transition
                  hover:border-[#1B4589]
                  hover:bg-[#F2F6FC]
                  ${
                    enviando
                      ? "pointer-events-none opacity-60"
                      : ""
                  }
                `}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={
                    seleccionarDocumentos
                  }
                  disabled={
                    enviando
                  }
                  className="hidden"
                />
                <FileText
                  size={28}
                  className="text-[#547AA7]"
                />
                <p className="mt-3 text-sm font-bold text-[#231F20]">
                  Seleccionar documentos
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Haz clic para seleccionar
                  uno o varios archivos.
                </p>
              </label>
              {/* ERROR */}
              {errorDocumentos && (
                <div className="mt-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">
                    {errorDocumentos}
                  </p>
                </div>
              )}
              {/* DOCUMENTOS SELECCIONADOS */}
              {documentos.length > 0 && (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-[#231F20]">
                      Documentos seleccionados
                    </p>
                    <p className="text-xs font-semibold text-[#547AA7]">
                      {documentos.length} / {MAX_DOCUMENTOS}
                    </p>
                  </div>
                  {documentos.map(
                    (
                      archivo,
                      index
                    ) => (
                      <div
                        key={`${archivo.name}-${archivo.size}-${archivo.lastModified}`}
                        className="flex items-center gap-3 rounded-2xl border border-[#E8ECF3] bg-white px-4 py-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8ECF3] text-[#1B4589]">
                          <FileText
                            size={18}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#231F20]">
                            {archivo.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatearTamanoArchivo(
                              archivo.size
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            eliminarDocumento(
                              index
                            )
                          }
                          disabled={
                            enviando
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Eliminar ${archivo.name}`}
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
        {/* ======================================================
            INVOLUCRADOS
        ====================================================== */}
        <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">
          <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
                <Users
                  size={22}
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                  Involucrados
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                  Personas y/o empresas involucradas
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Registra al menos una persona o empresa
                  relacionada con los hechos denunciados.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={abrirModalInvolucrado}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#1B4589] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#163a74]"
            >
              <Plus
                size={17}
              />
              Nueva persona
            </button>
          </div>
          {involucrados.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#C6D0E2] bg-[#F7F9FC] px-6 py-10 text-center">
              <Users
                size={27}
                className="mx-auto text-slate-400"
              />
              <p className="mt-3 text-sm font-semibold text-[#231F20]">
                No hay involucrados registrados
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Utiliza el botón “Nueva persona” para agregar uno.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-[#E8ECF3]">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#F7F9FC]">
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-[#547AA7]">
                      <th className="px-5 py-4">
                        Tipo
                      </th>
                      <th className="px-5 py-4">
                        Nombre / Razón Social
                      </th>
                      <th className="px-5 py-4">
                        Documento
                      </th>
                      <th className="px-5 py-4">
                        Rol
                      </th>
                      <th className="px-5 py-4">
                        Cargo
                      </th>
                      <th className="px-5 py-4 text-right">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8ECF3] bg-white">
                    {involucrados.map(
                      (
                        involucrado,
                        index
                      ) => (
                        <tr
                          key={`${involucrado.nombreRazonSocial}-${index}`}
                          className="text-slate-600"
                        >
                          <td className="px-5 py-4">
                            {involucrado.tipoPersona ===
                            "PERSONA_NATURAL"
                              ? "Persona natural"
                              : "Persona jurídica"}
                          </td>
                          <td className="px-5 py-4 font-semibold text-[#231F20]">
                            {involucrado.nombreRazonSocial}
                          </td>
                          <td className="px-5 py-4">
                            {involucrado.documento ||
                              "-"}
                          </td>
                          <td className="px-5 py-4">
                            {involucrado.rolIncidente ===
                            "TESTIGO"
                              ? "Testigo"
                              : "Encargado"}
                          </td>
                          <td className="px-5 py-4">
                            {involucrado.cargo}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                eliminarInvolucrado(
                                  index
                                )
                              }
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-50"
                              aria-label="Eliminar involucrado"
                            >
                              <Trash2
                                size={17}
                              />
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
        {/* ======================================================
            DENUNCIANTE
        ====================================================== */}
        <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">
          <div className="mb-7 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
              <ShieldCheck
                size={22}
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                Confidencialidad
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                Datos del denunciante
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Puedes identificarte o realizar la denuncia
                de manera anónima.
              </p>
            </div>
          </div>
          <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#C6D0E2] bg-[#F7F9FC] px-5 py-4">
            <input
              type="checkbox"
              checked={anonima}
              onChange={(event) =>
                cambiarAnonima(
                  event.target.checked
                )
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#1B4589]"
            />
            <div>
              <p className="text-sm font-bold text-[#231F20]">
                Realizar denuncia anónima
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Si activas esta opción, tus datos personales
                no serán enviados ni almacenados.
              </p>
            </div>
          </label>
          {!anonima && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={nombreDenunciante}
                  onChange={(event) =>
                    setNombreDenunciante(
                      event.target.value
                    )
                  }
                  placeholder="Nombres y apellidos"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Documento
                </label>
                <input
                  type="text"
                  value={documentoDenunciante}
                  onChange={(event) =>
                    setDocumentoDenunciante(
                      event.target.value
                    )
                  }
                  placeholder="Número de documento"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Teléfono / móvil
                </label>
                <input
                  type="text"
                  value={telefonoDenunciante}
                  onChange={(event) =>
                    setTelefonoDenunciante(
                      event.target.value
                    )
                  }
                  placeholder="Número de contacto"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={correoDenunciante}
                  onChange={(event) =>
                    setCorreoDenunciante(
                      event.target.value
                    )
                  }
                  placeholder="correo@ejemplo.com"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </section>
        {/* ======================================================
            TÉRMINOS Y ENVÍO
        ====================================================== */}
        <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(event) =>
                setAceptaTerminos(
                  event.target.checked
                )
              }
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#1B4589]"
            />
            <div>
              <p className="text-sm font-semibold text-[#231F20]">
                Acepto los términos y condiciones *
              </p>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
                Declaro que la información proporcionada es veraz
                y autorizo su tratamiento para la gestión de la denuncia.
              </p>
            </div>
          </label>
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex min-w-40 items-center justify-center gap-2 rounded-2xl bg-[#1B4589] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#163a74] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={17}
                />
              )}
              {enviando
                ? "Enviando..."
                : "Denunciar"}
            </button>
          </div>
        </section>
      </form>
      {/* ========================================================
            MODAL DENUNCIA REGISTRADA
        ======================================================== */}
        {denunciaRegistrada && (
          <div
            className="
              fixed inset-0 z-[120]
              flex items-center justify-center
              bg-slate-950/40
              p-3 sm:p-4
              backdrop-blur-sm
            "
          >
            <div
              className="
                flex
                max-h-[calc(100dvh-24px)]
                w-full
                max-w-xl
                flex-col
                overflow-hidden
                rounded-[28px]
                border border-[#E8ECF3]
                bg-white
                shadow-2xl
                sm:max-h-[calc(100dvh-32px)]
              "
            >
              {/* CONTENIDO CON SCROLL */}
              <div className="overflow-y-auto px-5 py-5 text-center sm:px-7 sm:py-6">
                {/* ICONO */}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={27} />
                </div>
                {/* CABECERA */}
                <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#547AA7]">
                  Canal de denuncias
                </p>
                <h2 className="mt-1.5 text-2xl font-bold text-[#231F20] sm:text-3xl">
                  Denuncia registrada
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-5 text-slate-500">
                  Tu denuncia fue registrada correctamente. Guarda el identificador y
                  el PIN para consultar posteriormente su estado.
                </p>
                {/* IDENTIFICADOR */}
                <div className="mt-5 rounded-2xl border border-[#C6D0E2] bg-[#F7F9FC] px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#547AA7]">
                    Identificador
                  </p>
                  <p className="mt-1.5 break-all text-xl font-bold tracking-wide text-[#1B4589] sm:text-2xl">
                    {denunciaRegistrada.codigoSeguimiento}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        denunciaRegistrada.codigoSeguimiento
                      )
                    }
                    className="
                      mt-2.5
                      text-sm
                      font-semibold
                      text-[#1B4589]
                      transition
                      hover:underline
                    "
                  >
                    Copiar identificador
                  </button>
                </div>
                {/* PIN */}
                <div className="mt-3 rounded-2xl border border-[#C6D0E2] bg-[#F7F9FC] px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#547AA7]">
                    PIN
                  </p>
                  <p className="mt-1.5 break-all text-xl font-bold tracking-wide text-[#1B4589] sm:text-2xl">
                    {denunciaRegistrada.pin}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(
                        denunciaRegistrada.pin
                      )
                    }
                    className="
                      mt-2.5
                      text-sm
                      font-semibold
                      text-[#1B4589]
                      transition
                      hover:underline
                    "
                  >
                    Copiar PIN
                  </button>
                </div>
                {/* DOCUMENTACIÓN */}
                {documentos.length > 0 && (
                  <div className="mt-4">
                    {documentosSubidos ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left">
                        <p className="text-sm font-bold text-emerald-900">
                          Documentación cargada
                        </p>
                        <p className="mt-1 text-xs leading-5 text-emerald-700">
                          Se cargaron correctamente{" "}
                          {documentos.length}{" "}
                          {documentos.length === 1
                            ? "documento"
                            : "documentos"}.
                        </p>
                      </div>
                    ) : advertenciaDocumentos ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                        <p className="text-sm font-bold text-amber-900">
                          Denuncia registrada
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          {advertenciaDocumentos}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Guarda tu identificador y PIN.
                          La denuncia no se ha perdido.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )}
                {/* ADVERTENCIA */}
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                  <p className="text-sm font-bold text-amber-900">
                    Guarda estos datos
                  </p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    El PIN solo se muestra en este momento. Lo necesitarás junto con el
                    identificador para consultar el seguimiento de tu denuncia.
                  </p>
                </div>
                {/* COPIAR TODO */}
                <button
                  type="button"
                  onClick={() =>
                    void navigator.clipboard.writeText(
                      `Identificador: ${denunciaRegistrada.codigoSeguimiento}\nPIN: ${denunciaRegistrada.pin}`
                    )
                  }
                  className="
                    mt-4
                    inline-flex
                    items-center
                    justify-center
                    rounded-2xl
                    border border-[#C6D0E2]
                    bg-white
                    px-5 py-2.5
                    text-sm
                    font-semibold
                    text-[#1B4589]
                    transition
                    hover:bg-[#E8ECF3]
                  "
                >
                  Copiar identificador y PIN
                </button>
              </div>
              {/* FOOTER SIEMPRE VISIBLE */}
              <div className="shrink-0 border-t border-[#E8ECF3] bg-white px-5 py-4 sm:px-7">
                <button
                  type="button"
                  onClick={nuevaDenuncia}
                  className="
                    flex w-full
                    items-center
                    justify-center
                    rounded-2xl
                    bg-[#1B4589]
                    px-6 py-3
                    text-sm
                    font-bold
                    text-white
                    transition
                    hover:bg-[#163a74]
                  "
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      {/* ========================================================
          MODAL INVOLUCRADO
      ======================================================== */}
      {modalInvolucradoAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[#E8ECF3] bg-white shadow-2xl">
            {/* HEADER */}
            <header className="flex items-start justify-between border-b border-[#E8ECF3] px-6 py-6 md:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
                  {tipoPersona ===
                  "PERSONA_JURIDICA" ? (
                    <Building2
                      size={20}
                    />
                  ) : (
                    <UserRound
                      size={20}
                    />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#547AA7]">
                    Involucrados
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                    Nueva persona o empresa
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Registra la información del involucrado.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrarModalInvolucrado}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#231F20]"
                aria-label="Cerrar"
              >
                <X
                  size={20}
                />
              </button>
            </header>
            {/* CONTENIDO */}
            <div className="space-y-5 p-6 md:p-8">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Tipo de persona *
                  </label>
                  <StyledSelect
                    value={tipoPersona}
                    options={tipoPersonaOptions}
                    onChange={(value) =>
                      setTipoPersona(
                        value as TipoPersonaInvolucrada
                      )
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Rol en el incidente *
                  </label>
                  <StyledSelect
                    value={rolIncidente}
                    options={rolIncidenteOptions}
                    onChange={(value) =>
                      setRolIncidente(
                        value as RolIncidente
                      )
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Identificación / RUC
                  </label>
                  <input
                    type="text"
                    value={documentoInvolucrado}
                    onChange={(event) =>
                      setDocumentoInvolucrado(
                        event.target.value
                      )
                    }
                    placeholder="Opcional"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Cargo *
                  </label>
                  <input
                    type="text"
                    value={cargoInvolucrado}
                    onChange={(event) =>
                      setCargoInvolucrado(
                        event.target.value
                      )
                    }
                    placeholder="Cargo o relación"
                    className={inputClass}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Nombre / Razón Social *
                  </label>
                  <input
                    type="text"
                    value={nombreRazonSocial}
                    onChange={(event) =>
                      setNombreRazonSocial(
                        event.target.value
                      )
                    }
                    placeholder={
                      tipoPersona ===
                      "PERSONA_JURIDICA"
                        ? "Razón social"
                        : "Nombre completo"
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#E8ECF3] px-6 py-5 sm:flex-row sm:justify-end md:px-8">
              <button
                type="button"
                onClick={cerrarModalInvolucrado}
                className="inline-flex items-center justify-center rounded-2xl border border-[#C6D0E2] bg-white px-5 py-3 text-sm font-semibold text-[#1B4589] transition hover:bg-[#E8ECF3]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={agregarInvolucrado}
                disabled={
                  !nombreRazonSocial.trim() ||
                  !cargoInvolucrado.trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1B4589] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#163a74] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus
                  size={17}
                />
                Agregar involucrado
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
