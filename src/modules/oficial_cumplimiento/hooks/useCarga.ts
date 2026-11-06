'use client';

import { useCallback, useEffect, useState } from 'react';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { oficialService, type CatalogosOficial, type EstadoOficial } from '../services/oficialService';

interface Respuesta<T> {
  leer: () => Promise<T>;
  version: number;
  datos: T | null;
  error: string | null;
}

export interface Carga<T> {
  datos: T | null;
  /** Mensaje del servidor (o el de respaldo) si la última lectura falló. */
  error: string | null;
  /** true mientras se espera la respuesta (con datos viejos a la vista, si los hay). */
  cargando: boolean;
  recargar: () => void;
}

/**
 * Lee un dato del servidor al montar y cada vez que cambie `leer` (envuélvelo en useCallback con lo que lo hace distinto).
 * El estado solo cambia dentro de las respuestas, nunca de forma directa en el efecto.
 */
export function useCarga<T>(leer: () => Promise<T>, mensajeError: string): Carga<T> {
  const [version, setVersion] = useState(0);
  const [respuesta, setRespuesta] = useState<Respuesta<T> | null>(null);

  useEffect(() => {
    let vigente = true;
    leer()
      .then((datos) => { if (vigente) setRespuesta({ leer, version, datos, error: null }); })
      .catch((err: unknown) => {
        if (vigente) setRespuesta((anterior) => ({ leer, version, datos: anterior?.leer === leer ? anterior.datos : null, error: mensajeDe(err, mensajeError) }));
      });
    return () => { vigente = false; };
  }, [leer, version, mensajeError]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const vigente = respuesta?.leer === leer;
  const alDia = vigente && respuesta.version === version;
  return { datos: vigente ? respuesta.datos : null, error: alDia ? respuesta.error : null, cargando: !alDia, recargar };
}

const leerEstado = () => oficialService.estado();
const leerCatalogos = () => oficialService.catalogos();

/** Estado de la empresa: decide qué pantalla es la raíz y qué acciones hay. */
export const useEstadoOficial = (): Carga<EstadoOficial> => useCarga(leerEstado, 'No se pudo cargar el estado del oficial de cumplimiento.');

/** Opciones de los desplegables, reglas y textos que sirve el backend. */
export const useCatalogosOficial = (): Carga<CatalogosOficial> => useCarga(leerCatalogos, 'No se pudieron cargar las opciones y reglas del módulo.');
