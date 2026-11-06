// Ayudas de pantalla del módulo: desplazamiento y foco al cambiar de paso o al fallar la validación.
// El que se desplaza es el panel principal (no la ventana), así que se usa scrollIntoView sobre un elemento de arriba.

const sinMovimiento = (): boolean => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Lleva el panel principal hasta el inicio del elemento (sin animación si la persona pidió menos movimiento). */
export function subirAlInicio(elemento: HTMLElement | null): void {
  elemento?.scrollIntoView({ block: 'start', behavior: sinMovimiento() ? 'auto' : 'smooth' });
}

/** Enfoca y centra el primer campo marcado con error (se espera un instante a que el error ya esté pintado). */
export function enfocarPrimerError(): void {
  setTimeout(() => {
    const campo = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!campo) return;
    campo.scrollIntoView({ block: 'center', behavior: sinMovimiento() ? 'auto' : 'smooth' });
    campo.focus({ preventScroll: true });
  }, 80);
}
