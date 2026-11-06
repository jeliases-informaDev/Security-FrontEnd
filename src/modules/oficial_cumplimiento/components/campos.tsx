'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Controller, get, useFormContext } from 'react-hook-form';
import { CalendarDays } from 'lucide-react';
import { StyledSelect, type StyledSelectOption } from '@/shared/ui/StyledSelect';
import { fechaCorta } from '../lib/formato';
import type { Adjunto, CatalogosOficial } from '../services/oficialService';
import { FilaArchivo } from './FilaArchivo';
import { Pronto } from './piezas';

// Campos de formulario del módulo (react-hook-form). Sirven para todos los formularios del módulo: el asistente de designación,
// el cambio de datos, la comunicación a la UIF y la remoción. Los mensajes de error salen de la validación o del servidor.

/** Id estable de un campo a partir de su ruta («persona.nombres» → «oc-persona-nombres»). */
export const idDeRuta = (ruta: string): string => `oc-${ruta.replace(/[^A-Za-z0-9]+/g, '-')}`;

const mensajeDeError = (errors: object, ruta: string): string | undefined => get(errors, ruta)?.message as string | undefined;

/** Rótulo, campo, ayuda y error (el error reemplaza a la ayuda). */
export function Campo({ id, texto, opcional = false, error, ayuda, children, className = '' }: { id: string; texto: string; opcional?: boolean; error?: string; ayuda?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="label">
        {texto}
        {opcional && <span className="font-normal text-muted"> (opcional)</span>}
      </label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className="error-text">{error}</p> : ayuda ? <p id={`${id}-ayuda`} className="hint">{ayuda}</p> : null}
    </div>
  );
}

const descritoPor = (id: string, error?: string, ayuda?: ReactNode): string | undefined => (error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined);

interface PropsTexto {
  ruta: string;
  texto: string;
  opcional?: boolean;
  placeholder?: string;
  tipo?: 'text' | 'email' | 'tel';
  maxLength?: number;
  ayuda?: ReactNode;
  autoComplete?: string;
  deshabilitado?: boolean;
  className?: string;
}

/** Campo de texto de una línea. */
export function CampoTexto({ ruta, texto, opcional, placeholder, tipo = 'text', maxLength, ayuda, autoComplete = 'off', deshabilitado, className }: PropsTexto) {
  const { register, formState: { errors } } = useFormContext();
  const id = idDeRuta(ruta);
  const error = mensajeDeError(errors, ruta);
  return (
    <Campo id={id} texto={texto} opcional={opcional} error={error} ayuda={ayuda} className={className}>
      <input
        id={id}
        type={tipo}
        inputMode={tipo === 'tel' ? 'tel' : tipo === 'email' ? 'email' : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={deshabilitado}
        aria-invalid={error ? true : undefined}
        aria-describedby={descritoPor(id, error, ayuda)}
        className={`input ${error ? 'input-error' : ''}`}
        {...register(ruta)}
      />
    </Campo>
  );
}

/** Campo de texto de varias líneas, con contador de caracteres. */
export function CampoTextoLargo({ ruta, texto, opcional, placeholder, maxLength, filas = 3, ayuda, className }: { ruta: string; texto: string; opcional?: boolean; placeholder?: string; maxLength: number; filas?: number; ayuda?: ReactNode; className?: string }) {
  const { register, watch, formState: { errors } } = useFormContext();
  const id = idDeRuta(ruta);
  const error = mensajeDeError(errors, ruta);
  const largo = String(watch(ruta) ?? '').length;
  return (
    <Campo id={id} texto={texto} opcional={opcional} error={error} ayuda={ayuda} className={className}>
      <textarea
        id={id}
        rows={filas}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={[descritoPor(id, error, ayuda), `${id}-contador`].filter(Boolean).join(' ')}
        className={`input h-auto min-h-[96px] py-3 ${error ? 'input-error' : ''}`}
        {...register(ruta)}
      />
      <p id={`${id}-contador`} className="mt-1.5 font-mono text-[11px] text-muted">{largo} de {maxLength} caracteres</p>
    </Campo>
  );
}

/** Desplegable (las opciones salen del catálogo del servidor). */
export function CampoSeleccion({ ruta, texto, opciones, placeholder = 'Elige una opción', opcional, ayuda, deshabilitado, alCambiar, className }: { ruta: string; texto: string; opciones: StyledSelectOption[]; placeholder?: string; opcional?: boolean; ayuda?: ReactNode; deshabilitado?: boolean; alCambiar?: (valor: string) => void; className?: string }) {
  const { control, formState: { errors } } = useFormContext();
  const id = idDeRuta(ruta);
  const error = mensajeDeError(errors, ruta);
  return (
    <Controller
      control={control}
      name={ruta}
      render={({ field }) => (
        <Campo id={id} texto={texto} opcional={opcional} error={error} ayuda={ayuda} className={className}>
          <StyledSelect
            id={id}
            value={String(field.value ?? '')}
            options={opciones}
            placeholder={placeholder}
            disabled={deshabilitado}
            error={!!error}
            onChange={(valor) => { field.onChange(valor); alCambiar?.(valor); }}
          />
        </Campo>
      )}
    />
  );
}

// ============================================================
// Fecha: se escribe como dd/mm/aaaa (las barras se ponen solas) o se elige en el calendario del navegador.
// El valor del formulario es «AAAA-MM-DD» cuando la fecha es real; mientras se escribe es el texto tal cual (la validación lo detecta).
// ============================================================

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Deja solo dígitos y pone las barras: «12051990» → «12/05/1990». */
function mascaraFecha(texto: string): string {
  const d = texto.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** «dd/mm/aaaa» completo y real → «AAAA-MM-DD»; si no existe ese día, null. */
function aIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);
  if (!m) return null;
  const [, dia, mes, anio] = m;
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia));
  const real = fecha.getFullYear() === Number(anio) && fecha.getMonth() === Number(mes) - 1 && fecha.getDate() === Number(dia);
  return real ? `${anio}-${mes}-${dia}` : null;
}

/** ¿El valor del formulario ya es una fecha completa y real? */
export const esFechaCompleta = (valor: string): boolean => ISO.test(valor);

/** Campo de fecha con calendario. `min` y `max` (AAAA-MM-DD) solo limitan el calendario; la validación va aparte. */
export function CampoFecha({ ruta, texto, opcional, ayuda, min, max, deshabilitado, className }: { ruta: string; texto: string; opcional?: boolean; ayuda?: ReactNode; min?: string; max?: string; deshabilitado?: boolean; className?: string }) {
  const { control, formState: { errors } } = useFormContext();
  const selector = useRef<HTMLInputElement>(null);
  const id = idDeRuta(ruta);
  const error = mensajeDeError(errors, ruta);

  const abrirCalendario = () => {
    const el = selector.current;
    if (!el) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  };

  return (
    <Controller
      control={control}
      name={ruta}
      render={({ field }) => {
        const valor = String(field.value ?? '');
        return (
          <Campo id={id} texto={texto} opcional={opcional} error={error} ayuda={ayuda} className={className}>
            <div className="relative">
              <input
                id={id}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="dd/mm/aaaa"
                maxLength={10}
                disabled={deshabilitado}
                value={ISO.test(valor) ? fechaCorta(valor) : valor}
                onChange={(e) => { const escrito = mascaraFecha(e.target.value); field.onChange(aIso(escrito) ?? escrito); }}
                onBlur={field.onBlur}
                ref={field.ref}
                aria-invalid={error ? true : undefined}
                aria-describedby={descritoPor(id, error, ayuda)}
                className={`input pr-11 tabular-nums ${error ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={abrirCalendario}
                disabled={deshabilitado}
                aria-label={`Elegir ${texto.toLowerCase()} en el calendario`}
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </button>
              {/* El calendario del navegador: invisible, solo se abre desde el botón. */}
              <input
                ref={selector}
                type="date"
                tabIndex={-1}
                aria-hidden="true"
                min={min}
                max={max}
                value={ISO.test(valor) ? valor : ''}
                onChange={(e) => { if (e.target.value) field.onChange(e.target.value); }}
                className="pointer-events-none absolute bottom-0 right-0 h-0 w-0 opacity-0"
              />
            </div>
          </Campo>
        );
      }}
    />
  );
}

// ============================================================
// Selector segmentado (una opción entre pocas). Las opciones «Pronto» quedan apagadas y no se pueden elegir.
// ============================================================

export interface OpcionSegmentada<T extends string> {
  valor: T;
  etiqueta: string;
  pronto?: boolean;
}

export function Segmentado<T extends string>({ valor, opciones, onCambiar, etiquetadoPor, ariaLabel, className = '' }: { valor: T | ''; opciones: OpcionSegmentada<T>[]; onCambiar: (valor: T) => void; etiquetadoPor?: string; ariaLabel?: string; className?: string }) {
  const botones = useRef<Record<string, HTMLButtonElement | null>>({});
  const activas = opciones.filter((o) => !o.pronto);
  const haySeleccion = activas.some((o) => o.valor === valor);

  const moverConTeclas = (e: KeyboardEvent<HTMLDivElement>) => {
    const sentido = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (sentido === 0 || activas.length === 0) return;
    e.preventDefault();
    const actual = activas.findIndex((o) => o.valor === valor);
    const siguiente = activas[(actual + sentido + activas.length) % activas.length];
    onCambiar(siguiente.valor);
    botones.current[siguiente.valor]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={etiquetadoPor}
      aria-label={etiquetadoPor ? undefined : ariaLabel}
      onKeyDown={moverConTeclas}
      className={`flex max-w-full gap-1 overflow-x-auto rounded-[10px] border border-line bg-paper p-1 ${className}`}
    >
      {opciones.map((o) => {
        const marcada = o.valor === valor;
        const primeraActiva = !haySeleccion && activas[0]?.valor === o.valor;
        return (
          <button
            key={o.valor}
            ref={(el) => { botones.current[o.valor] = el; }}
            type="button"
            role="radio"
            aria-checked={marcada}
            aria-disabled={o.pronto || undefined}
            tabIndex={marcada || primeraActiva ? 0 : -1}
            title={o.pronto ? 'Próximamente' : undefined}
            onClick={() => { if (!o.pronto) onCambiar(o.valor); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-[7px] text-sm font-semibold leading-5 transition-colors ${marcada ? 'bg-ink text-paper' : o.pronto ? 'cursor-not-allowed text-faint' : 'text-muted hover:text-ink'}`}
          >
            {o.etiqueta}
            {o.pronto && <Pronto />}
          </button>
        );
      })}
    </div>
  );
}

/** Grupo con rótulo, selector segmentado y error, unido al formulario. */
export function CampoSegmentado<T extends string>({ ruta, texto, opciones, className }: { ruta: string; texto: string; opciones: OpcionSegmentada<T>[]; className?: string }) {
  const { control, formState: { errors } } = useFormContext();
  const id = idDeRuta(ruta);
  const error = mensajeDeError(errors, ruta);
  return (
    <Controller
      control={control}
      name={ruta}
      render={({ field }) => (
        <div className={className}>
          <p id={`${id}-rotulo`} className="label">{texto}</p>
          <Segmentado valor={String(field.value ?? '') as T | ''} opciones={opciones} onCambiar={field.onChange} etiquetadoPor={`${id}-rotulo`} />
          {error && <p role="alert" className="error-text">{error}</p>}
        </div>
      )}
    />
  );
}

// ============================================================
// Interruptor (sí / no) y archivo adjunto
// ============================================================

/** Interruptor accesible (role="switch"), de 44 × 24 como en el diseño. Apagado y con «Pronto» cuando todavía no se puede usar. */
export function Interruptor({ id, activo, onCambiar, deshabilitado = false, etiquetadoPor, descritoPor }: { id: string; activo: boolean; onCambiar: (activo: boolean) => void; deshabilitado?: boolean; etiquetadoPor: string; descritoPor?: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={activo}
      aria-disabled={deshabilitado || undefined}
      aria-labelledby={etiquetadoPor}
      aria-describedby={descritoPor}
      title={deshabilitado ? 'Próximamente' : undefined}
      onClick={() => { if (!deshabilitado) onCambiar(!activo); }}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${activo ? 'bg-brand' : 'bg-ink/15'} ${deshabilitado ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span aria-hidden="true" className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${activo ? 'translate-x-5' : ''}`} />
    </button>
  );
}

/** Fila «pregunta + explicación + interruptor» (Situación del cargo). */
export function FilaInterruptor({ id, titulo, descripcion, activo, onCambiar, deshabilitado = false, pronto = false }: { id: string; titulo: string; descripcion: string; activo: boolean; onCambiar: (activo: boolean) => void; deshabilitado?: boolean; pronto?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p id={`${id}-titulo`} className="text-[15px] font-semibold leading-5 text-ink">{titulo}</p>
        <p id={`${id}-descripcion`} className="mt-0.5 text-sm text-muted">{descripcion}</p>
      </div>
      {pronto && <Pronto />}
      <Interruptor id={id} activo={activo} onCambiar={onCambiar} deshabilitado={deshabilitado} etiquetadoPor={`${id}-titulo`} descritoPor={`${id}-descripcion`} />
    </div>
  );
}

/** Fila con interruptor unida al formulario. */
export function CampoInterruptor({ ruta, titulo, descripcion }: { ruta: string; titulo: string; descripcion: string }) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={ruta}
      render={({ field }) => <FilaInterruptor id={idDeRuta(ruta)} titulo={titulo} descripcion={descripcion} activo={field.value === true} onCambiar={field.onChange} />}
    />
  );
}

/** Archivo adjunto unido al formulario: el valor es el adjunto ya subido al servidor (o nada). */
export function CampoArchivo({ ruta, ambito, rotulo, reglas, deshabilitado }: { ruta: string; ambito: string; rotulo: string; reglas: CatalogosOficial['adjuntos']; deshabilitado?: boolean }) {
  const { control, formState: { errors } } = useFormContext();
  return (
    <Controller
      control={control}
      name={ruta}
      render={({ field }) => (
        <FilaArchivo
          id={idDeRuta(ruta)}
          ambito={ambito}
          rotulo={rotulo}
          valor={(field.value as Adjunto | null | undefined) ?? null}
          onCambiar={field.onChange}
          reglas={reglas}
          error={mensajeDeError(errors, ruta)}
          deshabilitado={deshabilitado}
        />
      )}
    />
  );
}
