'use client';

import { useEffect, useRef, useState } from 'react';
import {
  operacionesService,
  mensajeDeErrorOperaciones,
  type OperacionItem,
  type UsuarioEmpresa,
} from '@/modules/operaciones/services/operacionesService';
import { Modal } from '@/shared/ui/Modal';
import { Aviso, Boton } from '@/shared/ui/kit';

interface CambiarResponsableModalProps {
  operacion: OperacionItem;
  empresa: string;
  onCerrar: () => void;
  /** Recibe el nombre del usuario que quedó como responsable. */
  onGuardado: (nombreCompleto: string) => void;
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

  // El selector empieza deshabilitado (cargando): se le da el foco cuando ya tiene opciones.
  useEffect(() => {
    if (usuarios !== null) selectorRef.current?.focus();
  }, [usuarios]);

  const guardar = async () => {
    if (!seleccionado) return;
    setGuardando(true);
    setError(null);
    try {
      const cambio = await operacionesService.cambiarResponsable(operacion.id, Number(seleccionado));
      const elegido = (usuarios ?? []).find((usuario) => String(usuario.id) === seleccionado);
      onGuardado(cambio?.nombreCompleto || elegido?.nombreCompleto || elegido?.usuario || 'el usuario elegido');
    } catch (err) {
      setError(mensajeDeErrorOperaciones(err, 'No se pudo cambiar el responsable. Actualiza la lista e inténtalo de nuevo.'));
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo="Cambiar responsable"
      subtitulo={<span className="font-mono text-[13px]">{operacion.numeroRegistro ?? `Registro ${operacion.id}`}</span>}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={onCerrar}>Cancelar</Boton>
          <Boton onClick={guardar} disabled={!seleccionado} cargando={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
        </>
      }
    >
      <div>
        <label htmlFor="responsable" className="label">Responsable</label>
        <select
          id="responsable"
          ref={selectorRef}
          value={seleccionado}
          onChange={(evento) => setSeleccionado(evento.target.value)}
          disabled={usuarios === null || guardando}
          className="input"
        >
          <option value="">{usuarios === null ? 'Cargando usuarios…' : 'Elige un usuario'}</option>
          {(usuarios ?? []).map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nombreCompleto || usuario.usuario}
            </option>
          ))}
        </select>
        <p className="hint mt-1.5">Solo aparecen usuarios activos de {empresa}.</p>
      </div>
      {error && <Aviso aviso={{ tipo: 'error', texto: error }} />}
    </Modal>
  );
}
