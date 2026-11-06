// Archivos de Registro de Operaciones: validación de adjuntos y descarga de lo que manda el servidor (solo presentación).

/** Adjuntos del análisis y de la constancia: PDF, DOC o DOCX de hasta 10 MB (el servidor valida lo mismo). */
export const MAX_ADJUNTO = 10 * 1024 * 1024;
export const ACEPTA_ADJUNTOS = '.pdf,.doc,.docx';
const EXTENSIONES = ['pdf', 'doc', 'docx'];

/** Mensaje claro si el archivo no sirve como adjunto; `null` si está bien. Se usa antes de enviar nada. */
export function errorDeAdjunto(archivo: File): string | null {
  const extension = archivo.name.includes('.') ? (archivo.name.split('.').pop() ?? '').toLowerCase() : '';
  if (!EXTENSIONES.includes(extension)) return `El archivo «${archivo.name}» no es válido. Solo se permiten PDF, DOC y DOCX.`;
  if (archivo.size === 0) return `El archivo «${archivo.name}» está vacío.`;
  if (archivo.size > MAX_ADJUNTO) return `El archivo «${archivo.name}» supera el límite de 10 MB.`;
  return null;
}

/** «18 KB», «2.4 MB». */
export function tamanoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Guarda en el equipo un archivo que llegó del servidor (el mismo patrón con el que el módulo descarga el PDF). */
export function descargarBlob(archivo: Blob, nombre: string): void {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // El navegador necesita un instante para empezar la descarga antes de soltar la dirección.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
