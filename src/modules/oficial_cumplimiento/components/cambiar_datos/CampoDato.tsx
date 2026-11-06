'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { cambioDe, type CampoDato as Clave, type FormularioCambioDatos } from '../../lib/cambioDatos';
import { idDeRuta } from '../campos';

/**
 * Campo de texto de un dato que se puede cambiar: si la persona lo modifica aparece la marca «Cambiado» junto al rótulo y,
 * debajo, el valor de antes (el valor anterior se conserva en el historial). El error, si hay, reemplaza a esa línea.
 */
export function CampoDato({ campo, texto, actuales, opcional = false, tipo = 'text', maxLength, autoComplete = 'off', className = '' }: {
  campo: Clave;
  texto: string;
  /** Lo que tiene hoy el oficial en cada dato. */
  actuales: Record<Clave, string>;
  opcional?: boolean;
  tipo?: 'text' | 'email' | 'tel';
  maxLength: number;
  autoComplete?: string;
  className?: string;
}) {
  const { register, control, formState: { errors } } = useFormContext<FormularioCambioDatos>();
  const valor = useWatch({ control, name: campo }) ?? '';
  const id = idDeRuta(campo);
  const error = errors[campo]?.message;
  const cambiado = cambioDe(campo, valor, actuales);
  const antes = actuales[campo].trim() || '(vacío)';
  const descritoPor = error ? `${id}-error` : cambiado ? `${id}-antes` : undefined;

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {texto}
          {opcional && <span className="font-normal text-muted"> (opcional)</span>}
        </label>
        {cambiado && <span className="badge badge-brand">Cambiado</span>}
      </div>
      <input
        id={id}
        type={tipo}
        inputMode={tipo === 'tel' ? 'tel' : tipo === 'email' ? 'email' : undefined}
        autoComplete={autoComplete}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={descritoPor}
        className={`input ${error ? 'input-error' : ''}`}
        {...register(campo)}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="error-text">{error}</p>
      ) : cambiado ? (
        <p id={`${id}-antes`} className="mt-1 break-words font-mono text-[11px] leading-4 text-muted [overflow-wrap:anywhere]">Antes: {antes}</p>
      ) : null}
    </div>
  );
}
