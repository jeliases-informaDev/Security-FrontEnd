'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Lo que se muestra en lugar de la tarjeta si al dibujarla algo falla (por ejemplo, un dato con una forma que no se esperaba). */
  respaldo: ReactNode;
}

/**
 * Cada tarjeta de Inicio va dentro de uno: si una se cae al dibujarse, solo esa muestra su error y las otras tres siguen.
 * Se vuelve a armar cuando cambia su `key` (el tablero la cambia con cada respuesta nueva del servidor).
 */
export class LimiteError extends Component<Props, { fallo: boolean }> {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Inicio: una tarjeta no se pudo dibujar', error);
  }

  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children;
  }
}
