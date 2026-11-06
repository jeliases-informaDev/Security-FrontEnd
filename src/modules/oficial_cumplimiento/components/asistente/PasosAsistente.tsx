import { Fragment } from 'react';
import { Check } from 'lucide-react';

/**
 * Franja de pasos del asistente (los cuatro círculos del diseño): el paso actual en azul marino, los hechos con una marca verde
 * y los que faltan en blanco. En pantallas angostas solo se escribe el nombre del paso actual.
 */
export function PasosAsistente({ pasos, actual }: { pasos: string[]; actual: number }) {
  return (
    <nav aria-label="Pasos de la designación" className="rounded-[18px] border border-line bg-white px-4 py-3.5 sm:px-[22px] sm:py-4">
      <ol className="flex items-center gap-2 sm:gap-3">
        {pasos.map((titulo, i) => {
          const hecho = i < actual;
          const esActual = i === actual;
          return (
            <Fragment key={titulo}>
              {i > 0 && <li aria-hidden="true" className={`h-0.5 min-w-3 flex-1 rounded-full ${i <= actual ? 'bg-ok' : 'bg-line-strong'}`} />}
              <li aria-current={esActual ? 'step' : undefined} className="flex shrink-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-sm font-semibold ${esActual ? 'bg-brand text-paper' : hecho ? 'bg-ok text-white' : 'border border-line-strong bg-white text-ink/50'}`}
                >
                  {hecho ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={`min-w-0 ${esActual ? 'block' : 'hidden lg:block'}`}>
                  <span className="rotulo block">Paso {i + 1}</span>
                  <span className={`block text-[15px] font-semibold leading-5 ${esActual || hecho ? 'text-ink' : 'text-ink/50'}`}>
                    {titulo}
                    <span className="sr-only">{hecho ? ' (completado)' : esActual ? ' (paso actual)' : ' (pendiente)'}</span>
                  </span>
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
