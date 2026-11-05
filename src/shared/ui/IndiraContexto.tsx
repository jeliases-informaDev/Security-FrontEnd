'use client';

import { createContext, useContext } from 'react';

interface IndiraContextoValor {
  /** ¿Está abierto el chat con Indira? */
  abierta: boolean;
  /** Abre el chat si está cerrado y lo cierra si está abierto. */
  alternar: () => void;
}

const IndiraContexto = createContext<IndiraContextoValor>({ abierta: false, alternar: () => {} });

/** Lo da el marco del panel: así cualquier pantalla puede abrir el chat de Indira sin depender de un botón concreto. */
export const IndiraProveedor = IndiraContexto.Provider;

export function useIndira(): IndiraContextoValor {
  return useContext(IndiraContexto);
}
