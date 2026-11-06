'use client';

import { Controller, get, useFormContext } from 'react-hook-form';
import { idDeRuta } from './campos';
import { Pronto } from './piezas';

export interface OpcionTarjeta {
  valor: string;
  titulo: string;
  ayuda?: string;
  /** Todavía no se puede elegir: queda apagada y con la insignia «Pronto». */
  pronto?: boolean;
}

/**
 * Grupo de opciones en tarjetas (una sola elección), unido al formulario. Cada tarjeta es un botón de opción nativo, así que el teclado
 * (flechas) y los lectores de pantalla funcionan solos. `etiquetadoPor` es el id del título que describe al grupo.
 */
export function CampoOpciones({ ruta, opciones, etiquetadoPor }: { ruta: string; opciones: OpcionTarjeta[]; etiquetadoPor: string }) {
  const { control, formState: { errors } } = useFormContext();
  const id = idDeRuta(ruta);
  const error = get(errors, ruta)?.message as string | undefined;

  return (
    <Controller
      control={control}
      name={ruta}
      render={({ field }) => (
        <div>
          <div
            role="radiogroup"
            aria-labelledby={etiquetadoPor}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            tabIndex={error ? -1 : undefined}
            className="flex flex-col gap-3 outline-none"
          >
            {opciones.map((o) => {
              const marcada = field.value === o.valor;
              return (
                <label
                  key={o.valor}
                  className={`flex items-start gap-3.5 rounded-xl border-[1.5px] px-4 py-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${marcada ? 'border-brand-ink bg-brand-soft' : 'border-line bg-white'} ${o.pronto ? 'cursor-not-allowed' : marcada ? 'cursor-pointer' : 'cursor-pointer hover:bg-paper'}`}
                >
                  <input
                    type="radio"
                    name={id}
                    value={o.valor}
                    checked={marcada}
                    disabled={o.pronto}
                    onChange={() => field.onChange(o.valor)}
                    onBlur={field.onBlur}
                    ref={marcada ? field.ref : undefined}
                    className="sr-only"
                  />
                  <span
                    className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${marcada ? 'bg-brand-ink' : 'border border-line-strong bg-white'}`}
                    aria-hidden="true"
                  >
                    {marcada && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-semibold leading-5 ${o.pronto ? 'text-muted' : 'text-ink'}`}>
                      <span className="min-w-0 break-words">{o.titulo}</span>
                      {o.pronto && <Pronto />}
                    </span>
                    {o.ayuda && <span className="mt-[3px] block break-words text-sm leading-[21px] text-muted">{o.ayuda}</span>}
                  </span>
                </label>
              );
            })}
          </div>
          {error && <p id={`${id}-error`} role="alert" className="error-text">{error}</p>}
        </div>
      )}
    />
  );
}
