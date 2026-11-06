import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import { mensajeDe } from '@/modules/licencias/lib/errores';

/**
 * Texto para mostrar cuando falla una acción del módulo: el mensaje que escribió el servidor (el rol no puede, licencia en solo
 * lectura, archivo no válido…) o, si no hay, el de respaldo. Devuelve null cuando el aviso global de licencia ya cubre el caso.
 * Los mensajes del servidor nunca repiten documento, correo, teléfono ni códigos del oficial.
 */
export const textoDeFalla = (error: unknown, respaldo: string): string | null => mensajeDeFalla(error, mensajeDe(error, respaldo));
