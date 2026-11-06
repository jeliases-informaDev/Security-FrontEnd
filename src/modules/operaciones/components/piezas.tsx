'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, Esqueleto, EstadoVacio, Etiqueta } from '@/shared/ui/kit';
import { nombreCorto } from '../lib/formato';
import type { ResponsableOperacion } from '../services/operacionesService';

/**
 * Alto y tamaño de los botones del diseño (RO 0 a RO 11): el secundario mide 46 px (44 + el borde de 1 px por lado) y el
 * primario 44 px, porque no lleva borde.
 */
export const BTN = 'h-[46px] text-[15px]';
export const BTN_P = 'h-11 text-[15px]';

/**
 * Campos de formulario del diseño (RO 2): 46 px de alto, esquinas de 10 px, borde suave y texto de 15 px. Se suman a `.input`;
 * el borde claro y sus estados (hover, foco, deshabilitado) van aparte porque en un campo con error manda el borde rojo.
 */
export const CAMPO = 'h-[46px] rounded-[10px] text-[15px]';
export const CAMPO_BORDE = 'border-line hover:border-ink/30 focus:border-brand disabled:bg-paper';
/** Rótulo de un campo (14 px, seminegrita, 8 px de separación con el campo). */
export const ETIQUETA = 'mb-2 flex items-center gap-2 text-sm font-semibold leading-[normal] text-ink';

/** Insignia «Pronto»: lo que el producto todavía no puede hacer de verdad (hoy, solo los formatos de exportación sin estructura). */
export const Pronto = ({ compacto = false }: { compacto?: boolean }) => <Etiqueta className={compacto ? '!px-2 !py-px !leading-[normal]' : ''}>Pronto</Etiqueta>;

/**
 * Estado del registro (chip de la lista, RO 1): en la entrega A solo llega «Pendiente»; «Enviado» e «Inusual» ya tienen su
 * aspecto del diseño para cuando la entrega B los encienda. Cualquier otro valor se muestra tal cual.
 */
export function InsigniaEstado({ estado, largo = false }: { estado: string; largo?: boolean }) {
  const base = '!leading-[normal]';
  if (estado === 'PENDIENTE') return <span className={`badge badge-warn ${base}`}>{largo ? 'Pendiente de envío' : 'Pendiente'}</span>;
  if (estado === 'ENVIADO') return <span className={`badge badge-ok ${base}`}>Enviado</span>;
  if (estado === 'INUSUAL') return <span className={`badge badge-critica ${base}`}>Inusual</span>;
  return <span className={`badge badge-neutral ${base}`}>{estado}</span>;
}

/** Dato de solo lectura: rótulo en mono (11 px, interletraje de 0,04 em) y valor de 16 px, como el diseño (RO 4 y RO 5). */
export function Dato({ rotulo, children, className = '' }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="rotulo leading-[normal] tracking-[0.04em]">{rotulo}</p>
      <p className="mt-1 break-words text-base font-medium leading-[normal] text-ink">{children}</p>
    </div>
  );
}

/** Fila «etiqueta … valor» de las tarjetas laterales (el valor va en semibold, como el diseño). */
export function FilaValor({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm leading-[normal]">
      <span className="min-w-0 text-muted">{etiqueta}</span>
      <span className="min-w-0 text-right font-semibold text-ink [overflow-wrap:anywhere]">{children}</span>
    </div>
  );
}

/** Tarjeta del diseño: título, bajada, etiqueta a la derecha y contenido. `espacio` cambia la separación interior (16 px por defecto). */
export function Tarjeta({ titulo, descripcion, derecha, children, className = '', id, espacio = 'gap-4' }: { titulo?: ReactNode; descripcion?: ReactNode; derecha?: ReactNode; children: ReactNode; className?: string; id?: string; espacio?: string }) {
  return (
    <section id={id} className={`card flex flex-col p-5 sm:p-6 ${espacio} ${className}`}>
      {(titulo || derecha) && (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-[17px] font-semibold leading-[normal] tracking-[-0.01em] text-ink">{titulo}</h2>}
            {descripcion && <p className="mt-1 text-sm leading-[normal] text-muted">{descripcion}</p>}
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
  if (!responsable) return <span className="text-[13px] font-medium leading-[normal] text-warn">Sin asignar</span>;
  return (
    <span className="flex min-w-0 items-center gap-2" title={responsable.nombreCompleto}>
      <Avatar nombre={responsable.nombreCompleto} tamano="sm" className="!h-7 !w-7 !text-[11px]" />
      <span className="min-w-0 break-words text-[13px] leading-[normal] text-ink/80">{nombreCorto(responsable.nombreCompleto)}</span>
    </span>
  );
}

/** Botón cuadrado de 36 px de las filas de la lista (ver, PDF, responsable). Es un enlace si trae `href` y un botón si no. */
export function AccionFila({ href, onClick, etiqueta, children }: { href?: string; onClick?: () => void; etiqueta: string; children: ReactNode }) {
  const clase = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-line bg-white text-ink/80 transition-colors hover:border-line-strong hover:bg-paper hover:text-ink';
  if (href) return <Link href={href} aria-label={etiqueta} title={etiqueta} className={clase}>{children}</Link>;
  return <button type="button" onClick={onClick} aria-label={etiqueta} title={etiqueta} className={clase}>{children}</button>;
}

/** Selector segmentado del diseño; las opciones con `pronto` quedan apagadas con su insignia. `grande` es el del panel de filtros (opciones de 32 px). */
export function Segmentado<T extends string>({ valor, opciones, onCambiar, ariaLabel, grande = false }: { valor: T; opciones: { valor: T; etiqueta: string; pronto?: boolean }[]; onCambiar: (valor: T) => void; ariaLabel: string; grande?: boolean }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] border border-line bg-paper p-1">
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
            className={`flex shrink-0 items-center gap-1.5 rounded-lg ${grande ? 'px-4 py-[7px]' : 'px-3.5 py-1.5'} text-[14px] font-semibold leading-[normal] transition-colors ${activa ? 'bg-ink text-paper' : o.pronto ? 'cursor-not-allowed text-faint' : 'text-muted hover:text-ink'}`}
          >
            {o.etiqueta}
            {o.pronto && <Pronto compacto />}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Interruptor accesible (role="switch"). Con `fila` el rótulo ocupa el ancho y el interruptor queda a la derecha (panel de filtros).
 * Con `descripcion` el rótulo va en seminegrita con su explicación debajo (sector y umbrales, RO 16).
 */
export function Interruptor({ activo, onCambiar, etiqueta, id, fila = false, descripcion, deshabilitado = false }: { activo: boolean; onCambiar: (activo: boolean) => void; etiqueta: string; id: string; fila?: boolean; descripcion?: ReactNode; deshabilitado?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {descripcion ? (
        <span className="min-w-0 flex-1">
          <span id={`${id}-texto`} className="block text-[15px] font-semibold leading-[normal] text-ink">{etiqueta}</span>
          <span id={`${id}-descripcion`} className="mt-0.5 block text-sm leading-[normal] text-muted">{descripcion}</span>
        </span>
      ) : (
        <span id={`${id}-texto`} className={fila ? 'min-w-0 flex-1 text-[15px] font-medium leading-[normal] text-ink' : 'text-sm font-medium leading-[normal] text-ink/80'}>{etiqueta}</span>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={activo}
        aria-labelledby={`${id}-texto`}
        aria-describedby={descripcion ? `${id}-descripcion` : undefined}
        disabled={deshabilitado}
        onClick={() => onCambiar(!activo)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${activo ? 'bg-brand' : 'bg-ink/15'}`}
      >
        <span className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform ${activo ? 'translate-x-5' : ''}`} aria-hidden="true" />
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
