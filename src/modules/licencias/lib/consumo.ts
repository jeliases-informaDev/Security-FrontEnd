import { esBolsaAgotada, esErrorDeLicencia, mensajeDe } from './errores';

/**
 * Acciones que descuentan tokens: después de ejecutarlas (bien o con error) se pide al
 * LicenciaProvider que vuelva a leer la licencia. Es el mismo evento que ya dispara apiClient
 * ante un 403 de licencia, así que funciona desde cualquier componente del panel.
 */
export function actualizarLicencia(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('licencia:actualizar'));
}

/**
 * Mensaje para mostrar cuando una acción falla.
 * - Bolsa agotada (402): devuelve null, porque el aviso global de tokens agotados ya se abre solo.
 * - Otro error de licencia (solo lectura, suspendida…): el mensaje que escribió el servidor.
 * - Cualquier otro error: el texto de respaldo.
 */
export function mensajeDeFalla(error: unknown, respaldo: string): string | null {
  if (esBolsaAgotada(error)) return null;
  if (esErrorDeLicencia(error)) return mensajeDe(error, respaldo);
  return respaldo;
}

/** Ejecuta una acción que descuenta tokens y, salga bien o mal, pide poner al día el medidor. */
export async function conConsumo<T>(accion: () => Promise<T>): Promise<T> {
  try {
    return await accion();
  } finally {
    actualizarLicencia();
  }
}
