import { Check } from 'lucide-react';

const PASOS = ['Cliente', 'Datos', 'Resultado'] as const;

/** Franja de pasos: hecho (círculo oscuro con visto), actual (círculo crema con aro) y pendiente (círculo blanco). */
export function PasosScoring({ paso }: { paso: 0 | 1 | 2 }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-sm sm:gap-3" aria-label="Pasos de la evaluación">
      {PASOS.map((nombre, i) => {
        const hecho = i < paso;
        const actual = i === paso;
        return (
          <li key={nombre} className="flex items-center gap-2 sm:gap-3" aria-current={actual ? 'step' : undefined}>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                hecho ? 'bg-brand text-paper' : actual ? 'bg-crema text-ink ring-1 ring-ink' : 'border border-line bg-white text-muted'
              }`}
            >
              {hecho ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span className={`${actual || hecho ? 'text-ink' : 'text-muted'} ${actual ? 'font-medium' : ''}`}>{nombre}</span>
            {i < PASOS.length - 1 && <span className="h-px w-6 bg-line-strong sm:w-14" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
