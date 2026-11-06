'use client';

import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Paperclip } from 'lucide-react';
import { ACEPTA_ADJUNTOS, errorDeAdjunto } from '../lib/archivos';

// Piezas de las pantallas de la entrega B (sector y umbrales, inusual, ROS y exportación). Lo que ya existe (Tarjeta, Dato,
// FilaValor, Interruptor, Pronto…) se toma de piezas.tsx.

/**
 * Los campos de la entrega B son los mismos del formulario de alta (`CAMPO` y `CAMPO_BORDE` de piezas.tsx: 46 px de alto,
 * esquinas de 10 px, texto de 15 px). Las áreas de texto usan el mismo molde, con alto libre y renglones de 22 px.
 */
export const AREA_B = 'h-auto rounded-[10px] py-3 text-[15px] leading-[22px]';

/** Contenido y columna lateral de las pantallas de la entrega B: la misma rejilla del detalle y del alta (aside de 340 a 460 px). */
export const REJILLA_B = 'grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(21.25rem,24vw,28.75rem)]';

/** Campo del diseño: rótulo de 14 px en seminegrita, el control, una ayuda opcional y el error (con `role="alert"`). */
export function CampoB({ id, texto, opcional = false, ayuda, error, children, className = '' }: { id: string; texto: ReactNode; opcional?: boolean; ayuda?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold leading-[normal] text-ink">
        {texto}
        {opcional && <span className="font-normal text-muted"> (opcional)</span>}
      </label>
      {children}
      {ayuda && !error && <p id={`${id}-ayuda`} className="hint">{ayuda}</p>}
      {error && <p id={`${id}-error`} role="alert" className="error-text">{error}</p>}
    </div>
  );
}

/** Opción de una lista de radio del diseño (RO 12 · Decisión): tarjeta con título y texto; la elegida va en lavanda con borde marino. */
export function OpcionRadio({ nombre, valor, marcada, onElegir, titulo, texto, deshabilitada = false }: { nombre: string; valor: string; marcada: boolean; onElegir: (valor: string) => void; titulo: string; texto: string; deshabilitada?: boolean }) {
  return (
    <label
      className={`flex items-start gap-3.5 rounded-xl px-4 py-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${marcada ? 'border-[1.5px] border-brand bg-brand-soft' : 'border border-line bg-white'} ${deshabilitada ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
    >
      <input type="radio" name={nombre} value={valor} checked={marcada} disabled={deshabilitada} onChange={() => onElegir(valor)} className="sr-only" />
      <span className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${marcada ? 'border-[1.5px] border-brand bg-white' : 'border border-line-strong bg-white'}`} aria-hidden="true">
        {marcada && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-[normal] text-ink">{titulo}</span>
        <span className="mt-[3px] block text-sm leading-[21px] text-muted">{texto}</span>
      </span>
    </label>
  );
}

/** Rótulo con el nombre de un archivo (mono, en mayúsculas, como las etiquetas del diseño). */
export function ChipArchivo({ nombre, onClick, onQuitar, titulo, pendiente = false }: { nombre: string; onClick?: () => void; onQuitar?: () => void; titulo?: string; pendiente?: boolean }) {
  const texto = <span className="max-w-[16rem] truncate">{nombre}</span>;
  return (
    <span className={`badge ${pendiente ? 'badge-brand' : 'badge-neutral'} gap-1`}>
      {onClick ? <button type="button" onClick={onClick} title={titulo} className="inline-flex items-center rounded-full hover:text-ink">{texto}</button> : texto}
      {onQuitar && (
        <button type="button" onClick={onQuitar} aria-label={`Quitar ${nombre}`} className="-mr-1.5 ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-muted transition-colors hover:bg-ink/10 hover:text-ink">
          <span aria-hidden="true" className="text-sm leading-none">×</span>
        </button>
      )}
    </span>
  );
}

/**
 * Botón «Adjuntar archivo»: abre el selector, comprueba el tipo y el tamaño ANTES de enviar (PDF, DOC o DOCX, hasta 10 MB) y
 * entrega los archivos buenos a `onArchivos`. Si alguno no sirve, avisa con `onError` y no agrega ninguno.
 */
export function BotonAdjuntar({ onArchivos, onError, deshabilitado = false, multiple = false, children }: { onArchivos: (archivos: File[]) => void; onError: (mensaje: string) => void; deshabilitado?: boolean; multiple?: boolean; children: ReactNode }) {
  const entrada = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={entrada}
        type="file"
        accept={ACEPTA_ADJUNTOS}
        multiple={multiple}
        tabIndex={-1}
        className="hidden"
        onChange={(e) => {
          const archivos = Array.from(e.target.files ?? []);
          e.target.value = '';
          for (const archivo of archivos) {
            const problema = errorDeAdjunto(archivo);
            if (problema) { onError(problema); return; }
          }
          if (archivos.length > 0) onArchivos(archivos);
        }}
      />
      <button type="button" onClick={() => entrada.current?.click()} disabled={deshabilitado} className="btn btn-secondary btn-sm">
        <Paperclip className="h-4 w-4" aria-hidden="true" />
        {children}
      </button>
    </>
  );
}
