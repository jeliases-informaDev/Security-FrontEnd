'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import { Etiqueta } from '@/shared/ui/kit';
import { textoDeFalla } from '../lib/errores';
import { descripcionArchivo, extensionDe, tamanoLegible } from '../lib/formato';
import { oficialService, type Adjunto, type CatalogosOficial } from '../services/oficialService';

type Reglas = CatalogosOficial['adjuntos'];

/** «PDF, DOC o DOCX» (los formatos salen del catálogo del servidor). */
export function formatosTexto(extensiones: string[]): string {
  const mayusculas = extensiones.map((e) => e.toUpperCase());
  return mayusculas.length <= 1 ? mayusculas.join('') : `${mayusculas.slice(0, -1).join(', ')} o ${mayusculas[mayusculas.length - 1]}`;
}

/** Revisa el archivo antes de subirlo (el servidor vuelve a revisar el tipo y el contenido y manda la última palabra). */
function problemaDelArchivo(archivo: File, reglas: Reglas): string | null {
  if (archivo.size === 0) return 'El archivo está vacío.';
  if (!reglas.extensiones.includes(extensionDe(archivo.name))) return `El archivo debe ser ${formatosTexto(reglas.extensiones)}.`;
  if (archivo.size > reglas.tamanoMaximoBytes) return `El archivo pesa más de ${tamanoLegible(reglas.tamanoMaximoBytes)}.`;
  return null;
}

interface Props {
  id: string;
  /** Ámbito del contrato (`ACTA_DESIGNACION`, `CONSTANCIA_UIF`…): el servidor rechaza un archivo en un ámbito que no le toca. */
  ambito: string;
  /** Qué archivo es («Acta o documento de designación»). */
  rotulo: string;
  valor: Adjunto | null;
  onCambiar: (adjunto: Adjunto | null) => void;
  reglas: Reglas;
  /** Error de validación del formulario (falta el archivo). */
  error?: string;
  deshabilitado?: boolean;
}

/**
 * Fila de un archivo adjunto: elegir, subir al servidor, ver el nombre y el tamaño, y quitar. El archivo se sube apenas se elige y queda
 * «suelto» en el servidor hasta que se guarda lo que lo usa; si se quita o se cambia, se pide borrar el anterior (si ya estaba ligado, el
 * servidor lo conserva y el aviso se ignora).
 */
export function FilaArchivo({ id, ambito, rotulo, valor, onCambiar, reglas, error, deshabilitado = false }: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const mensaje = falla ?? error;

  const elegir = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    const problema = problemaDelArchivo(archivo, reglas);
    if (problema) {
      setFalla(problema);
      return;
    }
    setFalla(null);
    setSubiendo(true);
    try {
      const nuevo = await oficialService.subirAdjunto(ambito, archivo);
      const anterior = valor;
      onCambiar(nuevo);
      if (anterior) void oficialService.borrarAdjunto(anterior.id).catch(() => undefined);
    } catch (err) {
      setFalla(textoDeFalla(err, 'No se pudo subir el archivo. Inténtalo de nuevo.'));
    } finally {
      setSubiendo(false);
    }
  };

  const quitar = () => {
    if (!valor) return;
    const { id: idArchivo } = valor;
    setFalla(null);
    onCambiar(null);
    void oficialService.borrarAdjunto(idArchivo).catch(() => undefined);
  };

  return (
    <div>
      <input
        ref={entrada}
        type="file"
        tabIndex={-1}
        hidden
        accept={reglas.extensiones.map((x) => `.${x}`).join(',')}
        onChange={(e) => void elegir(e)}
      />

      {subiendo ? (
        <div role="status" className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3.5">
          <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin text-muted" aria-hidden="true" />
          <p className="text-[15px] font-medium text-ink">Subiendo el archivo…</p>
        </div>
      ) : valor ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3.5">
          <FileText className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-ink">{valor.nombre}</p>
            <p className="font-mono text-[11px] tracking-[0.02em] text-muted">{descripcionArchivo(valor)}</p>
          </div>
          <Etiqueta tono="ok">Adjunto</Etiqueta>
          {!deshabilitado && (
            <button
              type="button"
              onClick={quitar}
              aria-label={`Quitar el archivo ${valor.nombre}`}
              className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-bad-soft hover:text-bad"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <div className={`flex flex-wrap items-center gap-3 rounded-xl border border-dashed bg-paper px-4 py-3.5 ${error ? 'border-bad' : 'border-line-strong'}`}>
          <Upload className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />
          <div className="min-w-0 flex-1 basis-48">
            <p className="text-[15px] font-medium text-ink">{rotulo}</p>
            <p className="font-mono text-[11px] tracking-[0.02em] text-muted">{formatosTexto(reglas.extensiones)} · hasta {tamanoLegible(reglas.tamanoMaximoBytes)}</p>
          </div>
          <button
            id={id}
            type="button"
            onClick={() => entrada.current?.click()}
            disabled={deshabilitado}
            data-invalido={error ? 'true' : undefined}
            aria-describedby={mensaje ? `${id}-error` : undefined}
            aria-label={`Elegir archivo: ${rotulo}`}
            className="btn btn-secondary btn-sm"
          >
            Elegir archivo
          </button>
        </div>
      )}

      {mensaje && <p id={`${id}-error`} role="alert" className="error-text">{mensaje}</p>}
    </div>
  );
}
