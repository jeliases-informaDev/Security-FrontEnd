'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  operacionesService,
  mensajeDeErrorOperaciones,
  type OperacionItem,
  type UsuarioEmpresa,
} from '@/modules/operaciones/services/operacionesService';
import { botonPrimario, botonSecundario, campo, etiqueta } from '@/shared/ui/estilos';

interface CambiarResponsableModalProps {
  operacion: OperacionItem;
  empresa: string;
  onCerrar: () => void;
  onGuardado: () => void;
}

/** Cambia a qué usuario de la empresa se le asigna el registro. Solo se ofrecen usuarios activos de la misma empresa. */
export function CambiarResponsableModal({ operacion, empresa, onCerrar, onGuardado }: CambiarResponsableModalProps) {
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[] | null>(null);
  const [seleccionado, setSeleccionado] = useState<string>(operacion.responsable ? String(operacion.responsable.id) : '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectorRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    let vigente = true;
    operacionesService
      .usuariosPorEmpresa(empresa)
      .then((lista) => {
        if (vigente) setUsuarios(lista.filter((usuario) => usuario.activo));
      })
      .catch((err) => {
        if (vigente) setError(mensajeDeErrorOperaciones(err, 'No se pudo cargar la lista de usuarios de la empresa.'));
      });
    return () => {
      vigente = false;
    };
  }, [empresa]);

  useEffect(() => {
    selectorRef.current?.focus();
  }, [usuarios]);

  useEffect(() => {
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  const guardar = async () => {
    if (!seleccionado) return;
    setGuardando(true);
    setError(null);
    try {
      await operacionesService.cambiarResponsable(operacion.id, Number(seleccionado));
      onGuardado();
    } catch (err) {
      setError(mensajeDeErrorOperaciones(err, 'No se pudo cambiar el responsable. Actualiza la lista e inténtalo de nuevo.'));
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={(evento) => evento.target === evento.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-responsable" className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="titulo-responsable" className="text-base font-semibold text-brand-ink">
              Cambiar responsable
            </h2>
            <p className="mt-0.5 font-mono text-[13px] text-brand-muted">{operacion.numeroRegistro ?? `Registro ${operacion.id}`}</p>
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          <div>
            <label htmlFor="responsable" className={etiqueta}>
              Responsable
            </label>
            <select
              id="responsable"
              ref={selectorRef}
              value={seleccionado}
              onChange={(evento) => setSeleccionado(evento.target.value)}
              disabled={usuarios === null || guardando}
              className={campo}
            >
              <option value="">{usuarios === null ? 'Cargando usuarios…' : 'Elige un usuario'}</option>
              {(usuarios ?? []).map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombreCompleto || usuario.usuario}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-brand-muted">Solo aparecen usuarios activos de {empresa}.</p>
          </div>
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onCerrar} className={botonSecundario}>
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={!seleccionado || guardando} className={botonPrimario}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
