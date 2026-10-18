'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { isAxiosError } from 'axios';
import { Send, Sparkles, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { indiraService, type FeedbackIndira } from '@/modules/indira/services/indiraService';

interface Mensaje {
  id: string;
  rol: 'usuario' | 'indira';
  texto: string;
  esError?: boolean;
  // Id del mensaje en el servicio de ML; solo existe en respuestas reales y permite dar feedback.
  mensajeId?: string;
  feedback?: FeedbackIndira;
}

const MAX_CARACTERES = 2000;
const ALTURA_MAX_ENTRADA_PX = 112;

const SALUDO: Mensaje = {
  id: 'saludo',
  rol: 'indira',
  texto:
    'Hola, soy Indira. Puedo consultar personas y los casos registrados sobre ellas, y crear tickets de soporte. ¿En qué te ayudo?',
};

const SUGERENCIAS = [
  '¿Qué puedes hacer?',
  'Consulta a una persona por su DNI: ',
  'Quiero crear un ticket de soporte: ',
];

function mensajeDeError(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'Indira tardó demasiado en responder. Prueba con una pregunta más corta o inténtalo de nuevo.';
    }
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
    }
    switch (error.response.status) {
      case 400:
        return 'No pude procesar ese mensaje. Revisa que no esté vacío ni sea demasiado largo.';
      case 503:
        return 'Indira no está disponible en este momento. Inténtalo de nuevo en unos minutos.';
      case 502:
        return 'Indira no pudo procesar tu mensaje. Inténtalo de nuevo.';
    }
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}

interface IndiraPanelProps {
  abierto: boolean;
  onCerrar: () => void;
  /** Distancia desde arriba (la altura de la barra superior): el panel queda debajo de ella. */
  top?: number;
}

/**
 * Chat con Indira acoplado al borde derecho, debajo de la barra superior. En pantallas anchas el contenido se corre para dejarle
 * sitio (no tapa nada); en pantallas chicas se abre encima con un fondo atenuado.
 */
export function IndiraPanel({ abierto, onCerrar, top }: IndiraPanelProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
  const [entrada, setEntrada] = useState('');
  const [enviando, setEnviando] = useState(false);

  // La conversación vive solo en memoria: no se guarda contenido del chat en el navegador.
  const conversacionId = useRef<string | null>(null);
  const contadorIds = useRef(0);
  const listaRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLTextAreaElement>(null);

  // Mantiene visible el último mensaje.
  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [mensajes, enviando, abierto]);

  useEffect(() => {
    if (abierto) entradaRef.current?.focus();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      onCerrar();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [abierto, onCerrar]);

  const nuevoId = () => {
    contadorIds.current += 1;
    return `m${contadorIds.current}`;
  };

  const ajustarAltura = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    // Con box-sizing: border-box hay que sumar los bordes; si no, sobra 1-2 px y aparece una barra de scroll.
    const bordes = el.offsetHeight - el.clientHeight;
    el.style.height = `${Math.min(el.scrollHeight + bordes, ALTURA_MAX_ENTRADA_PX)}px`;
  };

  const enviar = async () => {
    const texto = entrada.trim();
    if (!texto || enviando) return;

    setMensajes((prev) => [...prev, { id: nuevoId(), rol: 'usuario', texto }]);
    setEntrada('');
    if (entradaRef.current) entradaRef.current.style.height = 'auto';
    setEnviando(true);

    try {
      const respuesta = await indiraService.enviarMensaje({
        mensaje: texto,
        conversacionId: conversacionId.current,
      });
      conversacionId.current = respuesta.conversacionId;
      setMensajes((prev) => [
        ...prev,
        { id: nuevoId(), rol: 'indira', texto: respuesta.respuesta, mensajeId: respuesta.mensajeId },
      ]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        { id: nuevoId(), rol: 'indira', texto: mensajeDeError(error), esError: true },
      ]);
    } finally {
      setEnviando(false);
    }
  };

  const darFeedback = async (id: string, mensajeId: string, feedback: FeedbackIndira) => {
    const marcar = (valor?: FeedbackIndira) =>
      setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, feedback: valor } : m)));

    marcar(feedback);
    try {
      await indiraService.enviarFeedback(mensajeId, feedback);
    } catch {
      marcar(undefined);
    }
  };

  const alEnviarFormulario = (e: FormEvent) => {
    e.preventDefault();
    void enviar();
  };

  const alPresionarTecla = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter envía; Shift+Enter agrega un salto de línea. No interfiere con la composición (IME).
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void enviar();
    }
  };

  const usarSugerencia = (texto: string) => {
    setEntrada(texto);
    entradaRef.current?.focus();
  };

  const soloSaludo = mensajes.length === 1;
  const quedanPocos = entrada.length > MAX_CARACTERES * 0.8;

  if (!abierto) return null;

  const botonFeedback = (m: Mensaje, valor: FeedbackIndira, Icono: typeof ThumbsUp, etiqueta: string, activo: string) => (
    <button
      type="button"
      disabled={m.feedback !== undefined}
      onClick={() => void darFeedback(m.id, m.mensajeId!, valor)}
      aria-label={etiqueta}
      aria-pressed={m.feedback === valor}
      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
        m.feedback === valor ? activo : 'text-faint hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent'
      }`}
    >
      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );

  return (
    <>
      <div className="fixed inset-0 z-30 bg-ink/30 xl:hidden" aria-hidden="true" onClick={onCerrar} />
      <aside
        role="dialog"
        aria-label="Chat con Indira"
        style={{ top, overscrollBehavior: 'contain' }}
        className="fixed bottom-0 right-0 z-40 flex w-full animate-[panel-entra_180ms_ease-out] flex-col border-l border-line bg-surface shadow-lg sm:w-[26rem] xl:shadow-none"
      >
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-amber-500 text-white" aria-hidden="true">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold text-ink">Indira</p>
            <p className="truncate text-xs text-muted">Asistente de cumplimiento</p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar chat" className="btn btn-ghost btn-icon ml-auto text-muted">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div ref={listaRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-canvas px-4 py-4">
          {mensajes.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.rol === 'usuario' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.rol === 'usuario'
                    ? 'rounded-2xl rounded-br-md bg-brand text-white'
                    : m.esError
                      ? 'rounded-2xl rounded-bl-md border border-bad/20 bg-bad-soft text-bad'
                      : 'rounded-2xl rounded-bl-md border border-line bg-surface text-ink shadow-sm'
                }`}
              >
                {m.texto}
              </div>

              {m.rol === 'indira' && m.mensajeId && (
                <div className="mt-1 flex items-center gap-1 pl-1">
                  {botonFeedback(m, 'positivo', ThumbsUp, 'Respuesta útil', 'bg-ok-soft text-ok')}
                  {botonFeedback(m, 'negativo', ThumbsDown, 'Respuesta no útil', 'bg-bad-soft text-bad')}
                </div>
              )}
            </div>
          ))}

          {soloSaludo && !enviando && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => usarSugerencia(s)}
                  className="rounded-full border border-brand/25 bg-surface px-3 py-1.5 text-xs font-medium text-brand-ink transition-colors hover:border-brand hover:bg-brand-soft"
                >
                  {s.trim().replace(/:$/, '')}
                </button>
              ))}
            </div>
          )}

          {enviando && (
            <div role="status" className="flex items-start">
              <span className="sr-only">Indira está escribiendo</span>
              <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-3">
                {[0, 150, 300].map((retraso) => (
                  <span key={retraso} className="h-1.5 w-1.5 animate-bounce rounded-full bg-faint" style={{ animationDelay: `${retraso}ms` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={alEnviarFormulario} className="shrink-0 border-t border-line bg-surface px-3 pb-1 pt-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={entradaRef}
              value={entrada}
              rows={1}
              maxLength={MAX_CARACTERES}
              placeholder="Escribe tu mensaje…"
              aria-label="Mensaje para Indira"
              onChange={(e) => {
                setEntrada(e.target.value);
                ajustarAltura(e.target);
              }}
              onKeyDown={alPresionarTecla}
              className="input h-auto min-h-10 flex-1 resize-none py-2.5"
            />
            <button type="submit" disabled={enviando || entrada.trim().length === 0} aria-label="Enviar mensaje" className="btn btn-primary btn-icon h-10 w-10 rounded-xl">
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="flex justify-between gap-2 py-1.5 text-[11px] text-faint">
            <span>Indira puede equivocarse. Verifica la información importante.</span>
            {quedanPocos && (
              <span className="shrink-0 tabular-nums">
                {entrada.length}/{MAX_CARACTERES}
              </span>
            )}
          </p>
        </form>
      </aside>
    </>
  );
}
