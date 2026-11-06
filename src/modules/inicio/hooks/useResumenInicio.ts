'use client';

import { useCallback, useEffect, useState } from 'react';
import { inicioService, type ResumenInicio } from '../services/inicioService';

interface Resultado {
  /** A qué pedido corresponde: si no coincide con el actual, todavía se está cargando. */
  pedido: number;
  datos: ResumenInicio | null;
  fallo: boolean;
}

export type EstadoResumen = 'cargando' | 'error' | 'listo';

/**
 * Pide el resumen de Inicio al abrir la pantalla y cada vez que se llama a `recargar`.
 * Si ya había datos, se siguen mostrando mientras llegan los nuevos (y si el nuevo pedido falla, no se pierden).
 * `version` sube con cada respuesta buena: sirve para que las tarjetas con error se vuelvan a armar con los datos nuevos.
 */
export function useResumenInicio() {
  const [pedido, setPedido] = useState(0);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    inicioService
      .resumen()
      .then((datos) => {
        if (!vigente) return;
        setResultado({ pedido, datos, fallo: false });
        setVersion((v) => v + 1);
      })
      .catch(() => {
        if (vigente) setResultado((previo) => ({ pedido, datos: previo?.datos ?? null, fallo: true }));
      });
    return () => {
      vigente = false;
    };
  }, [pedido]);

  const recargar = useCallback(() => setPedido((actual) => actual + 1), []);

  const cargando = resultado?.pedido !== pedido;
  const datos = resultado?.datos ?? null;
  const estado: EstadoResumen = datos ? 'listo' : cargando ? 'cargando' : resultado?.fallo ? 'error' : 'cargando';
  return { datos, estado, version, recargar };
}
