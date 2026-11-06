'use client';

import { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { textoDeFalla } from '../lib/errores';
import { descripcionArchivo, guardarArchivo } from '../lib/formato';
import { oficialService, type Adjunto } from '../services/oficialService';

/** Baja un archivo del servidor al equipo de la persona. Si falla, deja el mensaje en `falla` para mostrarlo junto al botón. */
export function useDescarga(obtener: () => Promise<{ archivo: Blob; nombre: string }>, respaldo = 'No se pudo descargar el archivo. Inténtalo de nuevo.') {
  const [bajando, setBajando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);

  const bajar = async () => {
    if (bajando) return;
    setBajando(true);
    setFalla(null);
    try {
      const { archivo, nombre } = await obtener();
      guardarArchivo(archivo, nombre);
    } catch (error) {
      setFalla(textoDeFalla(error, respaldo));
    } finally {
      setBajando(false);
    }
  };

  return { bajando, falla, bajar };
}

/** Botón «Descargar» de un archivo adjunto (ya subido a un registro del módulo). */
export function BotonDescargar({ adjunto, children = 'Descargar', className = 'btn btn-secondary btn-sm' }: { adjunto: Pick<Adjunto, 'id' | 'nombre'>; children?: string; className?: string }) {
  const { bajando, falla, bajar } = useDescarga(() => oficialService.descargarAdjunto(adjunto));
  return (
    <>
      <button type="button" onClick={() => void bajar()} disabled={bajando} className={className} aria-label={`${children}: ${adjunto.nombre}`}>
        {bajando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
        {children}
      </button>
      {falla && <p role="alert" className="error-text basis-full">{falla}</p>}
    </>
  );
}

/** Fila de un archivo guardado: qué es, cómo se llama, tipo y tamaño, y el botón para descargarlo. El nombre largo pasa a otra línea. */
export function FilaAdjunto({ rotulo, adjunto }: { rotulo: string; adjunto: Adjunto }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-paper px-4 py-3">
      <FileText className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0 flex-1 basis-52">
        <p className="text-[15px] font-semibold leading-5 text-ink">{rotulo}</p>
        <p className="text-sm text-muted [overflow-wrap:anywhere]">{adjunto.nombre}</p>
        <p className="font-mono text-[11px] tracking-[0.02em] text-muted">{descripcionArchivo(adjunto)}</p>
      </div>
      <BotonDescargar adjunto={adjunto} />
    </div>
  );
}
