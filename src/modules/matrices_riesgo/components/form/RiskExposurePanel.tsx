import {
  Activity,
  ArrowDown,
  ShieldCheck,
} from "lucide-react";

import type {
  NivelImpacto,
  NivelProbabilidad,
  NivelRiesgo,
} from "../../types/matrizRiesgo.types";

type Props = {
  probabilidad?: NivelProbabilidad | null;
  impacto?: NivelImpacto | null;
  riesgoInherente?: NivelRiesgo | null;

  mitigacion?: number | null;
  probabilidadResidual?: NivelProbabilidad | null;
  impactoResidual?: NivelImpacto | null;
  riesgoResidual?: NivelRiesgo | null;
};

function etiqueta(valor?: string | null) {
  if (!valor) return "Pendiente";

  return valor
    .toLowerCase()
    .split("_")
    .map(
      (item) =>
        item.charAt(0).toUpperCase() +
        item.slice(1)
    )
    .join(" ");
}

function riesgoClass(riesgo?: NivelRiesgo | null) {
  switch (riesgo) {
    case "MINIMO":
      return "bg-sky-50 text-sky-700 border-sky-200";

    case "LEVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "MODERADO":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "ALTO":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "MUY_ALTO":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

export function RiskExposurePanel({
  probabilidad,
  impacto,
  riesgoInherente,
  mitigacion,
  probabilidadResidual,
  impactoResidual,
  riesgoResidual,
}: Props) {
  return (
    <aside className="relative overflow-hidden rounded-[28px] border border-[#C6D0E2] bg-white p-6">
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full bg-[#E8ECF3]" />

      <div className="relative">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1B4589] text-white">
            <Activity size={20} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#547AA7]">
              Exposición actual
            </p>
            <h3 className="text-lg font-bold text-[#231F20]">
              Lectura del riesgo
            </h3>
          </div>
        </div>

        <div className="rounded-2xl bg-[#E8ECF3]/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#547AA7]">
            Riesgo inherente
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span
              className={[
                "rounded-full border px-4 py-2 text-sm font-bold",
                riesgoClass(riesgoInherente),
              ].join(" ")}
            >
              {etiqueta(riesgoInherente)}
            </span>

            <ShieldCheck
              size={23}
              className="text-[#1B4589]"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-3">
              <p className="text-[11px] uppercase text-slate-400">
                Probabilidad
              </p>
              <p className="mt-1 text-sm font-semibold text-[#231F20]">
                {etiqueta(probabilidad)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-3">
              <p className="text-[11px] uppercase text-slate-400">
                Impacto
              </p>
              <p className="mt-1 text-sm font-semibold text-[#231F20]">
                {etiqueta(impacto)}
              </p>
            </div>
          </div>
        </div>

        <div className="my-4 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C6D0E2] bg-white text-[#1B4589]">
            <ArrowDown size={18} />
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-[#C6D0E2] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#547AA7]">
              Mitigación
            </p>

            <span className="text-xl font-bold text-[#1B4589]">
              {mitigacion != null
                ? `${Math.round(mitigacion * 100)} %`
                : "--"}
            </span>
          </div>

          <div className="mt-4 border-t border-[#E8ECF3] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#547AA7]">
              Riesgo residual
            </p>

            <span
              className={[
                "mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-bold",
                riesgoClass(riesgoResidual),
              ].join(" ")}
            >
              {etiqueta(riesgoResidual)}
            </span>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] uppercase text-slate-400">
                  Probabilidad
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {etiqueta(probabilidadResidual)}
                </p>
              </div>

              <div>
                <p className="text-[11px] uppercase text-slate-400">
                  Impacto
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {etiqueta(impactoResidual)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}