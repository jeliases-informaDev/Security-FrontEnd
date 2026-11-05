import type { Licencia } from '../types/licencia.types';

/**
 * Por qué no se pueden crear ni reactivar cuentas ahora, o null si sí se puede.
 * Son los mismos textos que da el servidor, para que la persona vea lo mismo antes y después de intentarlo.
 */
export function motivoSinCrear(licencia: Licencia | null, soloLectura: boolean, puedeCrear: boolean): string | null {
  if (soloLectura && licencia) return licencia.mensaje;
  if (!puedeCrear) {
    const activos = licencia?.usuarios_activos;
    const maximo = licencia?.usuarios_max;
    return activos != null && maximo != null
      ? `Tu plan llegó al máximo de usuarios activos (${activos} de ${maximo}). Desactiva un usuario o amplía tu licencia en Sulotec.`
      : 'Tu plan llegó al máximo de usuarios activos. Desactiva un usuario o amplía tu licencia en Sulotec.';
  }
  return null;
}
