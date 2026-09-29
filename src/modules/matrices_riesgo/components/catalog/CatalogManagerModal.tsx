"use client";

import { useEffect, useState } from "react";
import {
  Layers3,
  Link2,
  Loader2,
  Plus,
  Workflow,
  X,
} from "lucide-react";

import { matrizRiesgoService } from "../../services/matrizRiesgo.service";

import type {
  CatalogoMatriz,
} from "../../types/matrizRiesgo.types";

type CatalogManagerModalProps = {
  open: boolean;
  onClose: () => void;
  onCatalogUpdated?: () => void;
};

type Accion =
  | "AREA"
  | "PROCESO"
  | "VINCULO"
  | null;

export function CatalogManagerModal({
  open,
  onClose,
  onCatalogUpdated,
}: CatalogManagerModalProps) {
  const [areas, setAreas] =
    useState<CatalogoMatriz[]>([]);

  const [procesos, setProcesos] =
    useState<CatalogoMatriz[]>([]);

  const [nombreArea, setNombreArea] =
    useState("");

  const [nombreProceso, setNombreProceso] =
    useState("");

  const [areaId, setAreaId] =
    useState("");

  const [procesoId, setProcesoId] =
    useState("");

  const [
    cargandoCatalogos,
    setCargandoCatalogos,
  ] = useState(false);

  const [accion, setAccion] =
    useState<Accion>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  useEffect(() => {
    if (open) {
      void cargarCatalogos();
    }
  }, [open]);

  async function cargarCatalogos() {
    try {
      setCargandoCatalogos(true);
      setError(null);

      const [
        areasResponse,
        procesosResponse,
      ] = await Promise.all([
        matrizRiesgoService.listarAreas(),
        matrizRiesgoService.listarProcesos(),
      ]);

      setAreas(areasResponse);
      setProcesos(procesosResponse);
    } catch {
      setError(
        "No se pudieron cargar las áreas y procesos."
      );
    } finally {
      setCargandoCatalogos(false);
    }
  }

  function limpiarMensajes() {
    setError(null);
    setSuccess(null);
  }

  async function crearArea() {
    const nombre =
      nombreArea.trim();

    if (!nombre) {
      setError(
        "Ingresa el nombre del área."
      );
      return;
    }

    try {
      limpiarMensajes();
      setAccion("AREA");

      await matrizRiesgoService
        .crearArea({
          nombre,
        });

      setNombreArea("");

      setSuccess(
        "Área creada correctamente."
      );

      await cargarCatalogos();

      onCatalogUpdated?.();
    } catch {
      setError(
        "No se pudo crear el área."
      );
    } finally {
      setAccion(null);
    }
  }

  async function crearProceso() {
    const nombre =
      nombreProceso.trim();

    if (!nombre) {
      setError(
        "Ingresa el nombre del proceso."
      );
      return;
    }

    try {
      limpiarMensajes();
      setAccion("PROCESO");

      await matrizRiesgoService
        .crearProceso({
          nombre,
        });

      setNombreProceso("");

      setSuccess(
        "Proceso creado correctamente."
      );

      await cargarCatalogos();

      onCatalogUpdated?.();
    } catch {
      setError(
        "No se pudo crear el proceso."
      );
    } finally {
      setAccion(null);
    }
  }

  async function vincularProceso() {
    if (!areaId || !procesoId) {
      setError(
        "Selecciona un área y un proceso."
      );
      return;
    }

    try {
      limpiarMensajes();
      setAccion("VINCULO");

      await matrizRiesgoService
        .vincularProcesoArea(
          Number(areaId),
          Number(procesoId)
        );

      setSuccess(
        "Proceso vinculado al área correctamente."
      );

      onCatalogUpdated?.();
    } catch {
      setError(
        "No se pudo vincular el proceso al área."
      );
    } finally {
      setAccion(null);
    }
  }

  function cerrarModal() {
    setError(null);
    setSuccess(null);

    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-[#E8ECF3] bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#E8ECF3] px-6 py-6 md:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#547AA7]">
              Configuración
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
              Áreas y procesos
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Crea las áreas, registra sus
              procesos y define la relación
              entre ambos.
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#231F20]"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </header>

        <div className="space-y-6 p-6 md:p-8">
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-3xl border border-[#E8ECF3] bg-white p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
                  <Layers3 size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-[#231F20]">
                    Crear área
                  </h3>

                  <p className="text-xs text-slate-500">
                    Área responsable del riesgo
                  </p>
                </div>
              </div>

              <label className="mb-2 block text-sm font-semibold text-[#231F20]">
                Nombre del área
              </label>

              <div className="flex gap-2">
                <input
                  value={nombreArea}
                  onChange={(e) =>
                    setNombreArea(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      e.preventDefault();
                      void crearArea();
                    }
                  }}
                  placeholder="Ej. Tecnología"
                  className="min-w-0 flex-1 rounded-2xl border border-[#C6D0E2] px-4 py-3 text-sm text-[#231F20] outline-none transition focus:border-[#1B4589] focus:ring-4 focus:ring-[#E8ECF3]"
                />

                <button
                  type="button"
                  onClick={() =>
                    void crearArea()
                  }
                  disabled={
                    accion !== null
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1B4589] text-white transition hover:bg-[#163a74] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Crear área"
                >
                  {accion === "AREA" ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={18} />
                  )}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-[#E8ECF3] bg-white p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E8ECF3] text-[#1B4589]">
                  <Workflow size={20} />
                </div>

                <div>
                  <h3 className="font-bold text-[#231F20]">
                    Crear proceso
                  </h3>

                  <p className="text-xs text-slate-500">
                    Proceso que será evaluado
                  </p>
                </div>
              </div>

              <label className="mb-2 block text-sm font-semibold text-[#231F20]">
                Nombre del proceso
              </label>

              <div className="flex gap-2">
                <input
                  value={nombreProceso}
                  onChange={(e) =>
                    setNombreProceso(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter"
                    ) {
                      e.preventDefault();
                      void crearProceso();
                    }
                  }}
                  placeholder="Ej. Gestión de accesos"
                  className="min-w-0 flex-1 rounded-2xl border border-[#C6D0E2] px-4 py-3 text-sm text-[#231F20] outline-none transition focus:border-[#1B4589] focus:ring-4 focus:ring-[#E8ECF3]"
                />

                <button
                  type="button"
                  onClick={() =>
                    void crearProceso()
                  }
                  disabled={
                    accion !== null
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1B4589] text-white transition hover:bg-[#163a74] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Crear proceso"
                >
                  {accion ===
                  "PROCESO" ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={18} />
                  )}
                </button>
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-[#C6D0E2] bg-[#E8ECF3]/50 p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1B4589] shadow-sm">
                <Link2 size={19} />
              </div>

              <div>
                <h3 className="font-bold text-[#231F20]">
                  Vincular área y proceso
                </h3>

                <p className="text-xs text-slate-500">
                  Define qué procesos pertenecen
                  a cada área.
                </p>
              </div>
            </div>

            {cargandoCatalogos ? (
              <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                <Loader2
                  size={18}
                  className="mr-2 animate-spin"
                />

                Cargando catálogos...
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#231F20]">
                      Área
                    </label>

                    <select
                      value={areaId}
                      onChange={(e) =>
                        setAreaId(
                          e.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-[#C6D0E2] bg-white px-4 py-3 text-sm text-[#231F20] outline-none transition focus:border-[#1B4589] focus:ring-4 focus:ring-[#E8ECF3]"
                    >
                      <option value="">
                        Seleccionar área
                      </option>

                      {areas.map((area) => (
                        <option
                          key={area.id}
                          value={area.id}
                        >
                          {area.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#231F20]">
                      Proceso
                    </label>

                    <select
                      value={procesoId}
                      onChange={(e) =>
                        setProcesoId(
                          e.target.value
                        )
                      }
                      className="w-full rounded-2xl border border-[#C6D0E2] bg-white px-4 py-3 text-sm text-[#231F20] outline-none transition focus:border-[#1B4589] focus:ring-4 focus:ring-[#E8ECF3]"
                    >
                      <option value="">
                        Seleccionar proceso
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
                            {
                              proceso.nombre
                            }
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      void vincularProceso()
                    }
                    disabled={
                      accion !== null ||
                      !areaId ||
                      !procesoId
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#1B4589] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#163a74] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {accion ===
                    "VINCULO" ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Link2 size={17} />
                    )}

                    Vincular proceso
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}