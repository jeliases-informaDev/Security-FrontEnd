import { isAxiosError } from 'axios';

// Enlace por defecto cuando el servidor no manda uno.
export const ENLACE_LICENCIA = 'https://sulotec.com/mi-licencia';

interface CuerpoError {
  message?: string;
  mensaje?: string;
  code?: string;
  enlace?: string;
  activos?: number;
  usuarios_max?: number;
}

function cuerpo(error: unknown): CuerpoError | undefined {
  return isAxiosError(error) ? (error.response?.data as CuerpoError | undefined) : undefined;
}

function estado(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

/** 402: la empresa gastó todos los tokens del mes (con tolerancia incluida). */
export function esBolsaAgotada(error: unknown): boolean {
  return estado(error) === 402 && cuerpo(error)?.code === 'LICENCIA_BOLSA_AGOTADA';
}

/** 403 por licencia: solo lectura, suspendida o cancelada. */
export function esLicenciaBloqueada(error: unknown): boolean {
  const code = cuerpo(error)?.code;
  return estado(error) === 403 && typeof code === 'string' && code.startsWith('LICENCIA_');
}

/** 409: el plan ya no tiene usuarios activos libres. */
export function esSinCupo(error: unknown): boolean {
  return estado(error) === 409 && cuerpo(error)?.code === 'LICENCIA_SIN_CUPO';
}

/** Cualquiera de los tres casos de licencia. */
export function esErrorDeLicencia(error: unknown): boolean {
  return esBolsaAgotada(error) || esLicenciaBloqueada(error) || esSinCupo(error);
}

export function enlaceDe(error: unknown): string {
  return cuerpo(error)?.enlace || ENLACE_LICENCIA;
}

/** Mensaje que escribió el servidor, o el de respaldo si no hay. */
export function mensajeDe(error: unknown, respaldo: string): string {
  const datos = cuerpo(error);
  return datos?.message || datos?.mensaje || respaldo;
}
