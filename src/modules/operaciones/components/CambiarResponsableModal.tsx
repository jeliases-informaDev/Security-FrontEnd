'use client';

import { useEffect, useState } from 'react';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import { Modal } from '@/shared/ui/Modal';
import { IconoVisto } from '@/shared/ui/iconos';
import { Aviso, Boton, Esqueleto } from '@/shared/ui/kit';
import { operacionesService, type OpcionResponsable, type ResponsableOperacion } from '../services/operacionesService';
import { BTN, BTN_P } from './piezas';

interface Props {
  id: number;
  numero: string;
  onCerrar: () => void;
  /** Recibe el responsable que quedó guardado. */
  onGuardado: (responsable: ResponsableOperacion) => void;
}

/** Iniciales de las dos primeras palabras (separadas por espacio o guion bajo): «Juan Pérez» → JP, «test_nuevo» → TN. */
function iniciales(nombre: string) {
  return nombre.split(/[\s_]+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '·';
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
      variante="suave"
      titulo="Cambiar responsable"
      subtitulo={numero}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar} className={BTN}>Cancelar</Boton>
          <Boton icono={IconoVisto} onClick={guardar} disabled={!puedeGuardar} cargando={guardando} className={BTN_P}>Guardar</Boton>
        </>
      }
    >
      <p id={`responsable-${id}-ayuda`} className="text-[15px] leading-[normal] text-muted">Elige quién se hace cargo de este registro.</p>
      {error && <Aviso aviso={{ tipo: 'error', texto: error }} />}
      {!opciones && !error && <Esqueleto lineas={4} />}
      {opciones && opciones.length === 0 && <p className="rounded-xl bg-paper p-4 text-sm text-muted">La empresa no tiene usuarios activos para asignar.</p>}
      {opciones && opciones.length > 0 && (
        <div role="radiogroup" aria-labelledby={`responsable-${id}-ayuda`} className="flex flex-col gap-2.5">
          {opciones.map((o) => {
            const marcada = elegido === o.id;
            return (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl py-2.5 pl-3 pr-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${marcada ? 'border-[1.5px] border-accent bg-accent-soft' : 'border border-line bg-white hover:bg-paper'}`}
              >
                <input type="radio" name={`responsable-${id}`} value={o.id} checked={marcada} onChange={() => setElegido(o.id)} className="sr-only" />
                <span className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-semibold leading-[normal] text-accent ${marcada ? 'bg-white' : 'bg-accent-soft'}`} aria-hidden="true">{iniciales(o.nombreCompleto)}</span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium leading-[normal] text-ink">{o.nombreCompleto}</span>
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${marcada ? 'bg-accent' : 'border border-line bg-white'}`} aria-hidden="true">
                  {marcada && <span className="h-2 w-2 rounded-full bg-white" />}
                </span>
              </label>
            );
          })}
        </div>
      )}
      <p className="text-[13px] leading-[19px] text-muted">Solo aparecen usuarios activos de tu empresa. El cambio queda en el historial del registro.</p>
    </Modal>
  );
}
