'use client';

import { useState } from 'react';
import { administracionService, mensajeDeError, type Empresa } from '@/modules/administracion/services/administracionService';
import { Modal } from '@/shared/ui/Modal';
import { botonPrimario, botonSecundario, campo, campoError, etiqueta, mensajeError } from '@/shared/ui/estilos';

const RUC = /^\d{11}$/;

interface EditarRucModalProps {
  empresa: Empresa;
  onCerrar: () => void;
  onGuardado: (empresa: Empresa) => void;
}

export function EditarRucModal({ empresa, onCerrar, onGuardado }: EditarRucModalProps) {
  const [ruc, setRuc] = useState(empresa.ruc ?? '');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const limpio = ruc.trim();
    if (limpio !== '' && !RUC.test(limpio)) {
      setError('El RUC debe tener 11 dígitos.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      onGuardado(await administracionService.actualizarRuc(empresa.id, limpio === '' ? null : limpio));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo guardar el RUC. Inténtalo de nuevo.'));
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo="Editar RUC"
      subtitulo={empresa.nombre}
      onCerrar={onCerrar}
      pie={
        <>
          <button type="button" onClick={onCerrar} className={botonSecundario}>
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={guardando} className={botonPrimario}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div>
        <label htmlFor="ruc-empresa" className={etiqueta}>
          RUC
        </label>
        <input
          id="ruc-empresa"
          inputMode="numeric"
          maxLength={11}
          value={ruc}
          onChange={(evento) => setRuc(evento.target.value.replace(/\D/g, ''))}
          onKeyDown={(evento) => evento.key === 'Enter' && guardar()}
          className={`${campo} font-mono ${error ? campoError : ''}`}
          aria-describedby={error ? 'ruc-empresa-error' : undefined}
        />
        <p className="mt-1 text-xs text-brand-muted">11 dígitos. Déjalo vacío si no lo tienes.</p>
        {error && (
          <p id="ruc-empresa-error" role="alert" className={mensajeError}>
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
