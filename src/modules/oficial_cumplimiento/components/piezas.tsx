'use client';

import type { ComponentType, ReactNode, SVGProps } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
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

/** Tarjeta del diseño: título, bajada, etiqueta a la derecha y contenido. */
export function Tarjeta({ titulo, descripcion, derecha, children, className = '', id }: { titulo?: ReactNode; descripcion?: ReactNode; derecha?: ReactNode; children?: ReactNode; className?: string; id?: string }) {
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

/** Dato de solo lectura: rótulo en mono y valor. */
export function Dato({ rotulo, children, className = '' }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="rotulo">{rotulo}</p>
      <p className="mt-1 break-words text-[15px] font-medium leading-[22px] text-ink">{children}</p>
    </div>
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
