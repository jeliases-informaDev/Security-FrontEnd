'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { esNoEncontrada } from '../services/operacionesService';

export const NO_ENCONTRADA = 'No encontramos ese registro. Puede que no exista o que no sea de tu empresa.';

export interface EstadoCarga<T> {
  /** Lo último que llegó bien (se conserva mientras se pide de nuevo). */
  datos: T | null;
  error: string | null;
  /** 404: no existe o es de otra empresa (no tiene sentido reintentar). */
  noEncontrada: boolean;
  /** `true` mientras no llegue la respuesta de la `clave` actual. */
  cargando: boolean;
  recargar: () => void;
}

/**
 * Pide los datos de una pantalla: una vez por `clave` y otra cada vez que se llame `recargar`.
 * La respuesta de una `clave` vieja se descarta, y con un error se conservan los datos anteriores.
 */
export function useCarga<T>(clave: string, cargar: () => Promise<T>, respaldoError: string): EstadoCarga<T> {
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; datos: T | null; error: string | null; noEncontrada: boolean } | null>(null);
  const pedir = useEffectEvent(cargar);
  const claveActual = `${clave}|${intento}`;

  useEffect(() => {
    let vigente = true;
    pedir()
      .then((datos) => { if (vigente) setRespuesta({ clave: claveActual, datos, error: null, noEncontrada: false }); })
      .catch((err: unknown) => {
        if (!vigente) return;
        const noEncontrada = esNoEncontrada(err);
        setRespuesta((anterior) => ({ clave: claveActual, datos: anterior?.datos ?? null, noEncontrada, error: noEncontrada ? NO_ENCONTRADA : mensajeDe(err, respaldoError) }));
      });
    return () => { vigente = false; };
  }, [claveActual, respaldoError]);

  const actual = respuesta?.clave === claveActual ? respuesta : null;
  return {
    datos: respuesta?.datos ?? null,
    error: actual?.error ?? null,
    noEncontrada: actual?.noEncontrada ?? false,
    cargando: actual === null,
    recargar: () => setIntento((n) => n + 1),
  };
}
