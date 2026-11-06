'use client';

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import type { ComponentType, SVGProps } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface StyledSelectOption {
  value: string;
  label: string;
}

interface StyledSelectProps {
  value: string;
  options: StyledSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  /** Alto del campo: el normal de los formularios (40 px) o el grande de las pantallas con pasos (52 px). */
  tamano?: 'md' | 'lg';
  /** Icono opcional a la izquierda del valor (como en los formularios con pasos del diseño). */
  icono?: ComponentType<SVGProps<SVGSVGElement>>;
  /** Id del botón: permite enlazarlo con su <label htmlFor>. */
  id?: string;
  /** Clases extra para el botón (por ejemplo, el alto y las esquinas de un formulario concreto). */
  className?: string;
}

/** Selector con la misma apariencia que los campos de texto (input) del sistema visual. */
export function StyledSelect({ value, options, onChange, placeholder = 'Seleccionar opción', disabled = false, error = false, tamano = 'md', icono: Icono, id, className = '' }: StyledSelectProps) {
  const seleccionada = options.find((option) => option.value === value) ?? null;

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative">
        <ListboxButton
          id={id}
          aria-invalid={error || undefined}
          className={`input relative flex items-center pr-10 text-left ${Icono ? 'pl-11' : ''} ${tamano === 'lg' ? 'h-[52px] px-4' : ''} ${error ? 'input-error' : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        >
          {Icono && <Icono className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />}
          <span className={`block truncate ${seleccionada ? 'text-ink' : 'text-faint'}`}>{seleccionada ? seleccionada.label : placeholder}</span>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted" aria-hidden="true">
            <ChevronDown className="h-4 w-4" strokeWidth={2} />
          </span>
        </ListboxButton>

        <ListboxOptions
          anchor="bottom"
          transition
          className="z-[100] mt-1.5 max-h-60 w-[var(--button-width)] overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-lg outline-none transition duration-100 ease-out data-[closed]:scale-[0.98] data-[closed]:opacity-0"
        >
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className="group relative flex cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2 text-sm text-ink outline-none transition-colors data-[focus]:bg-brand-soft data-[focus]:text-brand-ink data-[selected]:font-semibold data-[selected]:text-brand-ink"
            >
              <span className="truncate">{option.label}</span>
              <Check className="hidden h-4 w-4 shrink-0 text-brand group-data-[selected]:block" strokeWidth={2.5} aria-hidden="true" />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
