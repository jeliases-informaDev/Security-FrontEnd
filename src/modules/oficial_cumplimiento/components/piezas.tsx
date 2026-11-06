'use client';

import type { ComponentType, ReactNode, SVGProps } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Download, FileText } from 'lucide-react';
import { Esqueleto, EstadoVacio, Etiqueta } from '@/shared/ui/kit';
import type { EtiquetaOficial, TonoOficial } from '../services/oficialService';

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

export const RUTA_OFICIAL = '/oficial-cumplimiento';

/** Alto y tamaño de los botones de la cabecera (como en Listas Negativas y Operaciones). */
export const BTN = 'h-[46px] text-[15px]';

/** Enlace externo de la solicitud en SISDEL (el texto «plaft.sbs.gob.pe/sisdel» sale del diseño). Se abre fuera de PLAFT. */
export const URL_SISDEL = 'https://plaft.sbs.gob.pe/sisdel';

/** Insignia «Pronto»: lo que el producto todavía no puede hacer de verdad. */
export const Pronto = () => <Etiqueta>Pronto</Etiqueta>;

/** Botón apagado con insignia «Pronto». Usa aria-disabled (y no disabled) para que se pueda enfocar y leer con teclado. */
export function BotonPronto({ icono: IconoBoton, children, className = '' }: { icono?: Icono; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-disabled="true" title="Próximamente" onClick={(e) => e.preventDefault()} className={`btn btn-secondary cursor-not-allowed opacity-60 ${className}`}>
      {IconoBoton && <IconoBoton className="h-4 w-4" aria-hidden="true" />}
      {children}
      <Pronto />
    </button>
  );
}

const TONO_ETIQUETA: Record<TonoOficial, 'ok' | 'warn' | 'bad' | 'brand' | 'neutral'> = {
  verde: 'ok',
  ambar: 'warn',
  rojo: 'bad',
  lila: 'brand',
  gris: 'neutral',
};

/** Etiqueta que manda el servidor (texto y tono): el front solo la pinta. */
export function EtiquetaServidor({ etiqueta, className = '' }: { etiqueta: Pick<EtiquetaOficial, 'texto' | 'tono'>; className?: string }) {
  return <Etiqueta tono={TONO_ETIQUETA[etiqueta.tono] ?? 'neutral'} className={className}>{etiqueta.texto}</Etiqueta>;
}

/**
 * Tarjeta del diseño: título, bajada, etiqueta a la derecha y contenido.
 * `centrada` alinea el título con el botón de la derecha (las tarjetas de revisión, con su botón «Editar» de 44 px).
 */
export function Tarjeta({ titulo, descripcion, derecha, children, className = '', id, centrada = false }: { titulo?: ReactNode; descripcion?: ReactNode; derecha?: ReactNode; children?: ReactNode; className?: string; id?: string; centrada?: boolean }) {
  return (
    <section id={id} className={`card flex flex-col gap-4 p-5 sm:p-6 ${className}`}>
      {(titulo || derecha) && (
        <div className={`flex justify-between gap-3 ${centrada ? 'items-center' : 'items-start'}`}>
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

/** Dato de solo lectura: rótulo en mono (11 px, como en el diseño de las fichas) y valor de 16 px. */
export function Dato({ rotulo, children, className = '' }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="rotulo !tracking-[0.04em]">{rotulo}</p>
      <p className="mt-1 break-words text-base font-medium leading-[21px] text-ink">{children}</p>
    </div>
  );
}

/** Fila con la marca de «hecho»: círculo lila con un visto y el texto al lado («Qué pasará al guardar», declaraciones firmadas). */
export function FilaCheck({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <p className="min-w-0 flex-1 text-[15px] font-medium text-ink">{children}</p>
    </div>
  );
}

/**
 * Barra «Requisitos y plazos del oficial de cumplimiento» (guía descargable del diseño). La guía todavía no existe (no hay contenido
 * entregado), así que el botón queda apagado con «Pronto» y no se anuncia el número de páginas.
 */
export function BarraGuia() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-brand/25 bg-white px-[18px] py-4 shadow-[0_10px_30px_-14px_rgb(14_17_22/0.12)]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-ink" aria-hidden="true">
        <FileText className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-[17px] font-semibold leading-6 text-ink">Requisitos y plazos del oficial de cumplimiento</p>
        <p className="text-[13px] leading-5 text-muted">Guía en PDF con quién puede serlo, qué se envía a la UIF y todos los plazos · Res. SBS 789-2018, art. 5 a 13 y 26</p>
      </div>
      <BotonPronto icono={Download}>Descargar PDF</BotonPronto>
    </div>
  );
}

/** Nota de la columna derecha: rótulo en mono y un texto corto («Reserva», «Importante»). */
export function NotaLateral({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-2 !rounded-[22px] px-5 py-[18px]">
      <p className="rotulo">{rotulo}</p>
      <p className="text-sm leading-[21px] text-ink/80">{children}</p>
    </section>
  );
}

/** Aviso para quienes solo pueden ver: el servidor ya les niega las acciones; aquí se explica por qué no aparecen. */
export function NotaSoloLectura({ className = '' }: { className?: string }) {
  return (
    <p className={`rounded-2xl bg-brand-soft px-5 py-3.5 text-sm text-muted ${className}`}>
      Tu cuenta puede ver esta información, pero no cambiarla. Eso lo hace el administrador de tu empresa.
    </p>
  );
}

/** Esqueleto de una pantalla con dos columnas de tarjetas. */
export function EsqueletoPagina() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,33%,28.75rem)]" role="status" aria-live="polite" aria-label="Cargando…">
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
export function ErrorPagina({ mensaje, onReintentar, volverHref = RUTA_OFICIAL, volverTexto = 'Volver al oficial de cumplimiento' }: { mensaje: string; onReintentar?: () => void; volverHref?: string; volverTexto?: string }) {
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
