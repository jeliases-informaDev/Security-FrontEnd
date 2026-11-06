'use client';

import type { ComponentType, ReactNode, SVGProps } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, Esqueleto, EstadoVacio, Etiqueta } from '@/shared/ui/kit';
import { nombreCorto } from '../lib/formato';
import type { ResponsableOperacion } from '../services/operacionesService';

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

/** Alto y tamaño de los botones de la cabecera (como en Listas Negativas). */
export const BTN = 'h-[46px] text-[15px]';

/** Insignia «Pronto»: lo que el producto todavía no puede hacer de verdad. */
export const Pronto = () => <Etiqueta>Pronto</Etiqueta>;

/** Botón apagado con insignia «Pronto». Usa aria-disabled (y no disabled) para que se pueda enfocar y leer con teclado. */
export function BotonPronto({ icono: Icono, children, className = '' }: { icono?: Icono; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-disabled="true" title="Próximamente" onClick={(e) => e.preventDefault()} className={`btn btn-secondary cursor-not-allowed opacity-60 ${className}`}>
      {Icono && <Icono className="h-4 w-4" aria-hidden="true" />}
      {children}
      <Pronto />
    </button>
  );
}

/** Estado del registro: en esta entrega solo existe «Pendiente» (los demás llegan después y se muestran tal cual). */
export function InsigniaEstado({ estado, largo = false }: { estado: string; largo?: boolean }) {
  if (estado === 'PENDIENTE') return <span className="badge badge-warn">{largo ? 'Pendiente de envío' : 'Pendiente'}</span>;
  return <span className="badge badge-neutral">{estado}</span>;
}

/** Dato de solo lectura: rótulo en mono y valor. */
export function Dato({ rotulo, children, className = '' }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="rotulo">{rotulo}</p>
      <p className="mt-1 break-words text-[15px] font-medium leading-[22px] text-ink">{children}</p>
    </div>
  );
}

/** Fila «etiqueta … valor» de las tarjetas laterales. */
export function FilaValor({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-muted">{etiqueta}</span>
      <span className="text-right font-medium tabular-nums text-ink">{children}</span>
    </div>
  );
}

/** Tarjeta del diseño: título, bajada, etiqueta a la derecha y contenido. */
export function Tarjeta({ titulo, descripcion, derecha, children, className = '', id }: { titulo?: ReactNode; descripcion?: ReactNode; derecha?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`card flex flex-col gap-4 p-5 sm:p-6 ${className}`}>
      {(titulo || derecha) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-[17px] font-semibold leading-[25px] tracking-[-0.01em] text-ink">{titulo}</h2>}
            {descripcion && <p className="mt-0.5 text-sm text-muted">{descripcion}</p>}
          </div>
          {derecha}
        </div>
      )}
      {children}
    </section>
  );
}

/** Responsable en la lista: avatar con iniciales y primer nombre, o «Sin asignar» en ámbar. */
export function CeldaResponsable({ responsable }: { responsable: ResponsableOperacion | null }) {
  if (!responsable) return <span className="text-sm font-medium text-warn">Sin asignar</span>;
  return (
    <span className="flex items-center gap-2" title={responsable.nombreCompleto}>
      <Avatar nombre={responsable.nombreCompleto} tamano="sm" className="!h-7 !w-7 !text-[10px]" />
      <span className="truncate text-sm text-ink">{nombreCorto(responsable.nombreCompleto)}</span>
    </span>
  );
}

/** Selector segmentado del diseño; las opciones con `pronto` quedan apagadas con su insignia. */
export function Segmentado<T extends string>({ valor, opciones, onCambiar, ariaLabel }: { valor: T; opciones: { valor: T; etiqueta: string; pronto?: boolean }[]; onCambiar: (valor: T) => void; ariaLabel: string }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex max-w-full gap-1 overflow-x-auto rounded-[10px] border border-line bg-paper p-1">
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activa}
            aria-disabled={o.pronto || undefined}
            title={o.pronto ? 'Próximamente' : undefined}
            onClick={() => { if (!o.pronto) onCambiar(o.valor); }}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[14px] font-semibold leading-5 transition-colors ${activa ? 'bg-ink text-paper' : o.pronto ? 'cursor-not-allowed text-faint' : 'text-muted hover:text-ink'}`}
          >
            {o.etiqueta}
            {o.pronto && <Pronto />}
          </button>
        );
      })}
    </div>
  );
}

/** Interruptor accesible (role="switch"). */
export function Interruptor({ activo, onCambiar, etiqueta, id }: { activo: boolean; onCambiar: (activo: boolean) => void; etiqueta: string; id: string }) {
  return (
    <div className="flex items-center gap-3">
      <span id={`${id}-texto`} className="text-sm text-ink">{etiqueta}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={activo}
        aria-labelledby={`${id}-texto`}
        onClick={() => onCambiar(!activo)}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${activo ? 'bg-brand' : 'bg-ink/15'}`}
      >
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${activo ? 'translate-x-4' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
}

/** Esqueleto de una página de detalle: cabecera y dos columnas de tarjetas. */
export function EsqueletoPagina() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]" role="status" aria-live="polite" aria-label="Cargando…">
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map((i) => <div key={i} className="card p-6"><Esqueleto lineas={4} /></div>)}
      </div>
      <div className="flex flex-col gap-5">
        {[0, 1].map((i) => <div key={i} className="card p-6"><Esqueleto lineas={3} /></div>)}
      </div>
    </div>
  );
}

/** Error al cargar una pantalla, con el mensaje del servidor y salidas claras. */
export function ErrorPagina({ mensaje, onReintentar, volverHref = '/operaciones', volverTexto = 'Volver a la lista' }: { mensaje: string; onReintentar?: () => void; volverHref?: string; volverTexto?: string }) {
  return (
    <div className="card">
      <EstadoVacio
        icono={AlertCircle}
        titulo="No se pudo abrir esta pantalla"
        texto={mensaje}
        accion={
          <div className="flex flex-wrap justify-center gap-2">
            {onReintentar && <button type="button" onClick={onReintentar} className="btn btn-primary">Reintentar</button>}
            <Link href={volverHref} className="btn btn-secondary">{volverTexto}</Link>
          </div>
        }
      />
    </div>
  );
}

/** Páginas que se muestran en el pie: hasta cinco alrededor de la actual. */
function paginasVisibles(actual: number, total: number): number[] {
  const inicio = Math.max(0, Math.min(actual - 2, total - 5));
  return Array.from({ length: Math.min(5, total) }, (_, i) => inicio + i);
}

/** Pie de la lista: «Mostrando 1–8 de 10 registros» y botones de página. */
export function PiePaginas({ desde, hasta, total, pagina, totalPaginas, cargando, onCambiar }: { desde: number; hasta: number; total: number; pagina: number; totalPaginas: number; cargando: boolean; onCambiar: (pagina: number) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4 sm:px-6">
      <p aria-live="polite" className="min-w-0 flex-1 font-mono text-xs tracking-[0.02em] text-muted">
        Mostrando {desde}–{hasta} de {total} {total === 1 ? 'registro' : 'registros'}
      </p>
      {totalPaginas > 1 && (
        <nav aria-label="Páginas" className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => onCambiar(Math.max(0, pagina - 1))} disabled={pagina === 0 || cargando} className="btn btn-secondary h-auto px-3.5 py-2 text-sm">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
          </button>
          {paginasVisibles(pagina, totalPaginas).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onCambiar(n)}
              disabled={cargando}
              aria-current={n === pagina ? 'page' : undefined}
              aria-label={`Página ${n + 1}`}
              className={`h-9 w-9 rounded-[9px] text-sm font-semibold tabular-nums transition-colors ${n === pagina ? 'bg-ink text-paper' : 'border border-line bg-white text-ink hover:bg-paper'}`}
            >
              {n + 1}
            </button>
          ))}
          <button type="button" onClick={() => onCambiar(Math.min(totalPaginas - 1, pagina + 1))} disabled={pagina + 1 >= totalPaginas || cargando} className="btn btn-secondary h-auto px-3.5 py-2 text-sm">
            Siguiente <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
}
