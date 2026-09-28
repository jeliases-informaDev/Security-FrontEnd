type Props = {
  currentStep: number;
};

const steps = [
  { number: 1, label: "Riesgo inherente" },
  { number: 2, label: "Controles" },
  { number: 3, label: "Riesgo residual" },
  { number: 4, label: "Tratamiento" },
];

export function RiskFormStepper({ currentStep }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {steps.map((step) => {
        const active = currentStep === step.number;
        const completed = currentStep > step.number;

        return (
          <div key={step.number} className="flex items-center gap-3">
            <div
              className={[
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition",
                active
                  ? "bg-[#1B4589] text-white"
                  : completed
                    ? "bg-[#E8ECF3] text-[#1B4589]"
                    : "bg-slate-100 text-slate-400",
              ].join(" ")}
            >
              {step.number.toString().padStart(2, "0")}
            </div>

            <div className="hidden min-w-0 lg:block">
              <p
                className={[
                  "truncate text-xs font-semibold",
                  active || completed
                    ? "text-[#231F20]"
                    : "text-slate-400",
                ].join(" ")}
              >
                {step.label}
              </p>

              <div
                className={[
                  "mt-1 h-1 w-full rounded-full",
                  completed || active
                    ? "bg-[#1B4589]"
                    : "bg-slate-200",
                ].join(" ")}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}