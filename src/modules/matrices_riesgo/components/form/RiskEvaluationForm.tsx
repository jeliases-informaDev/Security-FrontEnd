"use client";

import {
  ArrowRight,
  Building2,
  Calculator,
  Loader2,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import { matrizRiesgoService } from "../../services/matrizRiesgo.service";

import type {
  CatalogoMatriz,
  FactorRiesgo,
  NivelImpacto,
  NivelProbabilidad,
  NivelRiesgo,
  TipoEmpresa,
} from "../../types/matrizRiesgo.types";

import { RiskExposurePanel } from "./RiskExposurePanel";
import { RiskFormStepper } from "./RiskFormStepper";

type FormState = {
  tipoEmpresa: TipoEmpresa | "";
  titulo: string;
  areaId: number | "";
  procesoId: number | "";
  detalleRiesgo: string;
  factor: FactorRiesgo | "";
  probabilidad: NivelProbabilidad | "";
  impactoEstimado: string;
};

const initialForm: FormState = {
  tipoEmpresa: "",
  titulo: "",
  areaId: "",
  procesoId: "",
  detalleRiesgo: "",
  factor: "",
  probabilidad: "",
  impactoEstimado: "",
};

export function RiskEvaluationForm() {
  const [form, setForm] =
    useState<FormState>(initialForm);

  const [areas, setAreas] =
    useState<CatalogoMatriz[]>([]);

  const [procesos, setProcesos] =
    useState<CatalogoMatriz[]>([]);

  const [cargandoAreas, setCargandoAreas] =
    useState(true);

  const [cargandoProcesos, setCargandoProcesos] =
    useState(false);

  const [calculando, setCalculando] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [impactoInherente, setImpactoInherente] =
    useState<NivelImpacto | null>(null);

  const [riesgoInherente, setRiesgoInherente] =
    useState<NivelRiesgo | null>(null);

  useEffect(() => {
    cargarAreas();
  }, []);

  async function cargarAreas() {
    try {
      setCargandoAreas(true);

      const data =
        await matrizRiesgoService.listarAreas();

      setAreas(data);
    } catch {
      setError(
        "No se pudieron cargar las áreas."
      );
    } finally {
      setCargandoAreas(false);
    }
  }

  async function seleccionarArea(
    areaId: string
  ) {
    const id =
      areaId
        ? Number(areaId)
        : "";

    setForm((prev) => ({
      ...prev,
      areaId: id,
      procesoId: "",
    }));

    setProcesos([]);

    if (!id) {
      return;
    }

    try {
      setCargandoProcesos(true);

      const data =
        await matrizRiesgoService
          .listarProcesosPorArea(id);

      setProcesos(data);
    } catch {
      setError(
        "No se pudieron cargar los procesos del área."
      );
    } finally {
      setCargandoProcesos(false);
    }
  }

  async function calcularInherente() {
    setError(null);

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
      Number(form.impactoEstimado);

    if (
      Number.isNaN(impacto) ||
      impacto < 0
    ) {
      setError(
        "El impacto estimado debe ser un número válido."
      );
      return;
    }

    try {
      setCalculando(true);

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
        resultado.riesgoInherente
      );
    } catch {
      setError(
        "No fue posible calcular el riesgo inherente."
      );
    } finally {
      setCalculando(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] px-5 py-7 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ED1C24]" />

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#547AA7]">
                Matriz de riesgo
              </p>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#231F20] lg:text-4xl">
              Nueva evaluación
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Identifica la exposición,
              evalúa los controles y define
              el tratamiento del riesgo.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#C6D0E2] bg-white px-5 py-3 text-sm font-semibold text-[#1B4589] transition hover:border-[#1B4589]"
          >
            <Save size={17} />
            Guardar borrador
          </button>
        </header>

        <div className="mb-7 rounded-[24px] border border-[#E8ECF3] bg-white p-5">
          <RiskFormStepper
            currentStep={1}
          />
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[28px] border border-[#E8ECF3] bg-white p-6 lg:p-8">
            <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
                01 · Identificación
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#231F20]">
                Riesgo inherente
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Describe el evento antes de
                considerar controles o medidas
                de mitigación.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Tipo de empresa">
                <select
                  value={form.tipoEmpresa}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      tipoEmpresa:
                        e.target.value as TipoEmpresa,
                    }))
                  }
                  className={inputClass}
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

              <Field label="Título del riesgo">
                <input
                  value={form.titulo}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      titulo:
                        e.target.value,
                    }))
                  }
                  placeholder="Ej. Acceso no autorizado al sistema"
                  className={inputClass}
                />
              </Field>

              <Field
                label="Área"
                icon={<Building2 size={15} />}
              >
                <select
                  value={form.areaId}
                  disabled={cargandoAreas}
                  onChange={(e) =>
                    seleccionarArea(
                      e.target.value
                    )
                  }
                  className={inputClass}
                >
                  <option value="">
                    {cargandoAreas
                      ? "Cargando..."
                      : "Seleccionar área"}
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
              </Field>

              <Field label="Proceso">
                <select
                  value={form.procesoId}
                  disabled={
                    !form.areaId ||
                    cargandoProcesos
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      procesoId:
                        e.target.value
                          ? Number(
                              e.target.value
                            )
                          : "",
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">
                    {cargandoProcesos
                      ? "Cargando..."
                      : "Seleccionar proceso"}
                  </option>

                  {procesos.map(
                    (proceso) => (
                      <option
                        key={proceso.id}
                        value={proceso.id}
                      >
                        {proceso.nombre}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <div className="lg:col-span-2">
                <Field label="Detalle del riesgo">
                  <textarea
                    rows={4}
                    value={form.detalleRiesgo}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        detalleRiesgo:
                          e.target.value,
                      }))
                    }
                    placeholder="Describe qué puede ocurrir, cómo y cuál sería la consecuencia."
                    className={`${inputClass} resize-none`}
                  />
                </Field>
              </div>

              <Field label="Factor de riesgo">
                <select
                  value={form.factor}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      factor:
                        e.target.value as FactorRiesgo,
                    }))
                  }
                  className={inputClass}
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

              <Field label="Probabilidad">
                <select
                  value={form.probabilidad}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      probabilidad:
                        e.target.value as NivelProbabilidad,
                    }))
                  }
                  className={inputClass}
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
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        impactoEstimado:
                          e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </Field>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={calcularInherente}
                  disabled={calculando}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4589] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#163a74] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {calculando ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Calculator size={17} />
                  )}

                  Calcular riesgo inherente
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-[#E8ECF3] pt-6">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-[#231F20] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-black"
              >
                Continuar a controles
                <ArrowRight size={17} />
              </button>
            </div>
          </section>

          <RiskExposurePanel
            probabilidad={
              form.probabilidad || null
            }
            impacto={impactoInherente}
            riesgoInherente={
              riesgoInherente
            }
          />
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-[#C6D0E2] bg-white px-4 py-3 text-sm text-[#231F20] outline-none transition placeholder:text-slate-400 focus:border-[#1B4589] focus:ring-4 focus:ring-[#E8ECF3] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
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