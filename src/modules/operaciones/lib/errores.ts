import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import { mensajeDe } from '@/modules/licencias/lib/errores';

/**
 * Texto para mostrar cuando una acción falla: el mensaje que escribió el servidor (por ejemplo «solo un administrador puede…»)
 * o, si no hay, el de respaldo. Con la bolsa de tokens agotada devuelve `null`, porque el aviso global de Sulotec ya se abre solo.
 */
export const textoDeFalla = (error: unknown, respaldo: string): string | null => mensajeDeFalla(error, mensajeDe(error, respaldo));
