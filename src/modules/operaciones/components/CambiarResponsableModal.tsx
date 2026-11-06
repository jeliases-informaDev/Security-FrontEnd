'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import { Modal } from '@/shared/ui/Modal';
import { Avatar, Aviso, Boton, Esqueleto } from '@/shared/ui/kit';
import { operacionesService, type OpcionResponsable, type ResponsableOperacion } from '../services/operacionesService';

interface Props {
  id: number;
  numero: string;
  onCerrar: () => void;
  /** Recibe el responsable que quedó guardado. */
  onGuardado: (responsable: ResponsableOperacion) => void;
}

/** RO 8 · Cambiar responsable: solo usuarios activos de la empresa del registro; el cambio queda en el historial. */
export function CambiarResponsableModal({ id, numero, onCerrar, onGuardado }: Props) {
  const [opciones, setOpciones] = useState<OpcionResponsable[] | null>(null);
  const [elegido, setElegido] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    operacionesService
      .responsables(id)
      .then((lista) => {
        if (!vigente) return;
        setOpciones(lista);
        setElegido(lista.find((o) => o.actual)?.id ?? null);
      })
      .catch((err: unknown) => { if (vigente) setError(mensajeDe(err, 'No se pudo cargar la lista de usuarios de la empresa.')); });
    return () => { vigente = false; };
  }, [id]);

  const actual = opciones?.find((o) => o.actual)?.id ?? null;
  const puedeGuardar = elegido !== null && elegido !== actual && !guardando;

  const guardar = async () => {
    if (elegido === null) return;
    setGuardando(true);
    setError(null);
    try {
      const respuesta = await operacionesService.cambiarResponsable(id, elegido);
      onGuardado(respuesta.responsable);
    } catch (err) {
      setGuardando(false);
      setError(mensajeDeFalla(err, mensajeDe(err, 'No se pudo cambiar el responsable. Inténtalo de nuevo.')) ?? 'No se pudo cambiar el responsable.');
    }
  };

  return (
    <Modal
      titulo="Cambiar responsable"
      subtitulo={<span className="font-mono text-xs">{numero}</span>}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton icono={Check} onClick={guardar} disabled={!puedeGuardar} cargando={guardando}>Guardar</Boton>
        </>
      }
    >
      <p id={`responsable-${id}-ayuda`} className="text-sm text-muted">Elige quién se hace cargo de este registro.</p>
      {error && <Aviso aviso={{ tipo: 'error', texto: error }} />}
      {!opciones && !error && <Esqueleto lineas={4} />}
      {opciones && opciones.length === 0 && <p className="rounded-xl bg-paper p-4 text-sm text-muted">La empresa no tiene usuarios activos para asignar.</p>}
      {opciones && opciones.length > 0 && (
        <div role="radiogroup" aria-labelledby={`responsable-${id}-ayuda`} className="flex flex-col gap-2">
          {opciones.map((o) => {
            const marcada = elegido === o.id;
            return (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${marcada ? 'border-accent bg-accent-soft' : 'border-line bg-white hover:bg-paper'}`}
              >
                <input type="radio" name={`responsable-${id}`} value={o.id} checked={marcada} onChange={() => setElegido(o.id)} className="sr-only" />
                <Avatar nombre={o.nombreCompleto} tamano="sm" className="!bg-accent-soft !text-accent" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{o.nombreCompleto}</span>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${marcada ? 'border-accent' : 'border-line-strong'}`} aria-hidden="true">
                  {marcada && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
                </span>
              </label>
            );
          })}
        </div>
      )}
      <p className="text-xs leading-5 text-muted">Solo aparecen usuarios activos de tu empresa. El cambio queda en el historial del registro.</p>
    </Modal>
  );
}
