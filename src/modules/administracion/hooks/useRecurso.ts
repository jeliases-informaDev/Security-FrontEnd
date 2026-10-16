'use client';

import { useCallback, useEffect, useState } from 'react';
import { mensajeDeError } from '@/modules/administracion/services/administracionService';

interface Resultado<T> {
  /** A qué pedido corresponde: si no coincide con el actual, todavía se está cargando. */
  pedido: number;
  datos: T | null;
  error: string | null;
}

/**
 * Pide un dato a la API al abrir la pantalla y cada vez que se llama a `recargar`.
 * Mientras llega la respuesta nueva se siguen mostrando los datos anteriores.
 * `cargar` debe ser una función estable (las del servicio lo son).
 */
export function useRecurso<T>(cargar: () => Promise<T>, mensajeError: string) {
  const [pedido, setPedido] = useState(0);
  const [resultado, setResultado] = useState<Resultado<T> | null>(null);

  useEffect(() => {
    let vigente = true;
    cargar()
      .then((datos) => {
        if (vigente) setResultado({ pedido, datos, error: null });
      })
      .catch((err) => {
        if (vigente) setResultado({ pedido, datos: null, error: mensajeDeError(err, mensajeError) });
      });
    return () => {
      vigente = false;
    };
  }, [cargar, mensajeError, pedido]);

  const recargar = useCallback(() => setPedido((actual) => actual + 1), []);

  const cargando = resultado?.pedido !== pedido;
  return {
    datos: resultado?.datos ?? null,
    error: cargando ? null : (resultado?.error ?? null),
    cargando,
    recargar,
  };
}
