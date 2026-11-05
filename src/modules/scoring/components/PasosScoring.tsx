import { Check } from 'lucide-react';

const PASOS = ['Cliente', 'Datos', 'Resultado'] as const;

/** Franja de pasos: hecho (círculo oscuro con visto), actual (círculo crema con aro lavanda) y pendiente (círculo blanco). */
export function PasosScoring({ paso }: { paso: 0 | 1 | 2 }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-3.5 gap-y-2" aria-label="Pasos de la evaluación">
      {PASOS.map((nombre, i) => {
        const hecho = i < paso;
        const actual = i === paso;
        return (
          <li key={nombre} className="flex items-center gap-3.5" aria-current={actual ? 'step' : undefined}>
            <span className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  hecho ? 'bg-ink text-paper' : actual ? 'border border-accent bg-crema text-ink' : 'border border-line bg-white text-muted'
                }`}
              >
                {hecho ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
              </span>
              <span className={`text-[15px] font-medium leading-[22px] ${actual || hecho ? 'text-ink' : 'text-muted'}`}>{nombre}</span>
            </span>
            {i < PASOS.length - 1 && <span className="h-px w-8 bg-line sm:w-14" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
