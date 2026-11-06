'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Ancho, en píxeles, de un elemento: se mide al aparecer y se vuelve a medir cada vez que cambia de tamaño. Vale 0 mientras no se ha
 * medido. Sirve para los gráficos que se dibujan en píxeles reales (así sus textos conservan su tamaño en cualquier pantalla).
 */
export function useAncho<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const observador = new ResizeObserver((entradas) => {
      setAncho(Math.round(entradas[0]?.contentRect.width ?? 0));
    });
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return { ref, ancho };
}
