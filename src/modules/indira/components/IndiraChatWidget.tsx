'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { isAxiosError } from 'axios';
import { Bot, MessageCircle, Send, ThumbsDown, ThumbsUp, X } from 'lucide-react';
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

export function IndiraChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
  const [entrada, setEntrada] = useState('');
  const [enviando, setEnviando] = useState(false);

  // La conversación vive solo en memoria: no se guarda contenido del chat en el navegador.
  const conversacionId = useRef<string | null>(null);
  const contadorIds = useRef(0);
  const listaRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLTextAreaElement>(null);
  const lanzadorRef = useRef<HTMLButtonElement>(null);

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
      setAbierto(false);
      lanzadorRef.current?.focus();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [abierto]);

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

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      {abierto && (
        <section
          role="dialog"
          aria-label="Chat con Indira"
          className="w-[calc(100vw-2rem)] sm:w-96 h-[min(34rem,calc(100vh-7rem))] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          <header className="bg-brand-navy text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-brand-amber-soft text-brand-navy flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm font-semibold">Indira</p>
              <p className="text-xs text-white/60 truncate">Asistente virtual</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                lanzadorRef.current?.focus();
              }}
              aria-label="Cerrar chat"
              className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div
            ref={listaRef}
            aria-live="polite"
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-brand-paper/60"
          >
            {mensajes.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.rol === 'usuario' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                    m.rol === 'usuario'
                      ? 'bg-brand-navy text-white rounded-2xl rounded-br-md'
                      : m.esError
                        ? 'bg-red-50 text-red-700 border border-red-200 rounded-2xl rounded-bl-md'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-bl-md'
                  }`}
                >
                  {m.texto}
                </div>

                {m.rol === 'indira' && m.mensajeId && (
                  <div className="mt-1 flex items-center gap-1 pl-1">
                    <button
                      type="button"
                      disabled={m.feedback !== undefined}
                      onClick={() => void darFeedback(m.id, m.mensajeId!, 'positivo')}
                      aria-label="Respuesta útil"
                      aria-pressed={m.feedback === 'positivo'}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                        m.feedback === 'positivo'
                          ? 'text-green-700 bg-green-50'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:hover:bg-transparent disabled:opacity-40'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={m.feedback !== undefined}
                      onClick={() => void darFeedback(m.id, m.mensajeId!, 'negativo')}
                      aria-label="Respuesta no útil"
                      aria-pressed={m.feedback === 'negativo'}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                        m.feedback === 'negativo'
                          ? 'text-red-700 bg-red-50'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:hover:bg-transparent disabled:opacity-40'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
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
                    className="px-3 py-1.5 text-xs rounded-full border border-brand-navy/20 text-brand-navy bg-white hover:bg-brand-amber-soft transition"
                  >
                    {s.trim().replace(/:$/, '')}
                  </button>
                ))}
              </div>
            )}

            {enviando && (
              <div role="status" className="flex items-start">
                <span className="sr-only">Indira está escribiendo</span>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-3 flex items-center gap-1">
                  {[0, 150, 300].map((retraso) => (
                    <span
                      key={retraso}
                      className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: `${retraso}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={alEnviarFormulario} className="border-t border-slate-200 bg-white px-3 pt-3 pb-1 shrink-0">
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
                className="flex-1 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 transition"
              />
              <button
                type="submit"
                disabled={enviando || entrada.trim().length === 0}
                aria-label="Enviar mensaje"
                className="w-10 h-10 shrink-0 rounded-xl bg-brand-navy text-white flex items-center justify-center hover:bg-brand-navy-2 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="py-1.5 text-[11px] text-slate-400 flex justify-between gap-2">
              <span>Indira puede equivocarse. Verifica la información importante.</span>
              {quedanPocos && (
                <span className="shrink-0 tabular-nums">
                  {entrada.length}/{MAX_CARACTERES}
                </span>
              )}
            </p>
          </form>
        </section>
      )}

      <button
        ref={lanzadorRef}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-label={abierto ? 'Cerrar chat con Indira' : 'Abrir chat con Indira'}
        title="Indira, asistente de la plataforma"
        className="w-14 h-14 rounded-full bg-brand-navy text-white shadow-lg ring-2 ring-brand-amber/60 flex items-center justify-center hover:bg-brand-navy-2 transition"
      >
        {abierto ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
