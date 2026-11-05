'use client';

import { useState } from 'react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { administracionService, mensajeDeError, type Empresa } from '@/modules/administracion/services/administracionService';
import { UUID } from '@/modules/administracion/lib/formatos';
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
  const [uuid, setUuid] = useState(empresa.uuid ?? '');
  const [errorUuid, setErrorUuid] = useState<string | null>(null);
  // Solo el administrador de Sulotec puede cambiar el UUID.
  const { usuario } = useAuth();
  const esSulotec = usuario?.rol?.trim().toUpperCase() === 'ADMINISTRADOR';
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    const limpio = ruc.trim();
    if (limpio !== '' && !RUC.test(limpio)) {
      setError('El RUC debe tener 11 dígitos.');
      return;
    }
    const uuidLimpio = uuid.trim();
    // Solo se manda el UUID si cambió; vacío significa dejar el que ya tiene.
    const uuidCambia = esSulotec && uuidLimpio !== '' && uuidLimpio.toLowerCase() !== (empresa.uuid ?? '').toLowerCase();
    if (uuidCambia && !UUID.test(uuidLimpio)) {
      setErrorUuid('No tiene formato de UUID. Ejemplo: 123e4567-e89b-12d3-a456-426614174000.');
      return;
    }
    setErrorUuid(null);
    setGuardando(true);
    setError(null);
    try {
      onGuardado(await administracionService.actualizarEmpresa(empresa.id, { ruc: limpio === '' ? null : limpio, ...(uuidCambia ? { uuid: uuidLimpio } : {}) }));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron guardar los cambios. Inténtalo de nuevo.'));
      setGuardando(false);
    }
  };

  return (
    <Modal
      titulo="Editar empresa"
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

      {esSulotec && (
        <div>
          <label htmlFor="uuid-empresa" className={etiqueta}>
            UUID
          </label>
          <input
            id="uuid-empresa"
            value={uuid}
            onChange={(evento) => setUuid(evento.target.value.trim())}
            maxLength={36}
            autoComplete="off"
            spellCheck={false}
            className={`${campo} font-mono ${errorUuid ? campoError : ''}`}
            aria-describedby={errorUuid ? 'uuid-empresa-error' : undefined}
          />
          <p className="mt-1 text-xs text-brand-muted">Usa el mismo UUID de la empresa en la cuenta Sulotec.</p>
          {errorUuid && (
            <p id="uuid-empresa-error" role="alert" className={mensajeError}>
              {errorUuid}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
