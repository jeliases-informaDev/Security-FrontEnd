'use client';

import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Aviso, Boton } from '@/shared/ui/kit';
import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import { listasNegativasService, type ConsultaResponse } from '../services/listasNegativasService';

interface Props {
  consulta: ConsultaResponse;
  /** «marcar»: pide el comentario (obligatorio). «deshacer»: el comentario es opcional. */
  modo: 'marcar' | 'deshacer';
  onCerrar: () => void;
  onListo: (consulta: ConsultaResponse) => void;
}

/** Ventana de «Es homónimo» (con comentario) y de «Deshacer homónimo». */
export function HomonimoModal({ consulta, modo, onCerrar, onListo }: Props) {
  const marcar = modo === 'marcar';
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const actualizada = marcar
        ? await listasNegativasService.marcarHomonimo(consulta.id, comentario.trim())
        : await listasNegativasService.deshacerHomonimo(consulta.id, comentario);
      onListo(actualizada);
    } catch (err) {
      setError(mensajeDeFalla(err, marcar ? 'No se pudo marcar como homónimo. Inténtalo de nuevo.' : 'No se pudo deshacer. Inténtalo de nuevo.'));
      setEnviando(false);
    }
  };

  return (
    <Modal
      titulo={marcar ? 'Es homónimo' : 'Deshacer homónimo'}
      subtitulo={consulta.consultado?.nombre ?? consulta.criterio.texto}
      onCerrar={onCerrar}
      pie={
        <>
          <Boton variante="fantasma" onClick={onCerrar} disabled={enviando}>Cancelar</Boton>
          <Boton cargando={enviando} disabled={marcar && comentario.trim() === ''} onClick={confirmar}>
            {marcar ? 'Marcar como homónimo' : 'Deshacer'}
          </Boton>
        </>
      }
    >
      <p className="text-sm text-muted">
        {marcar
          ? 'La persona consultada no es la de las listas. Queda registrado quién lo marcó y cuándo, y el scoring ya no aplicará esta coincidencia.'
          : 'La consulta vuelve a quedar vigente. Queda registrado quién lo deshizo y cuándo.'}
      </p>
      {error && <Aviso aviso={{ tipo: 'error', texto: error }} />}
      <div>
        <label htmlFor="ln-comentario" className="label">{marcar ? 'Comentario' : 'Comentario (opcional)'}</label>
        <textarea
          id="ln-comentario"
          rows={4}
          className="input h-auto resize-y py-2.5"
          placeholder={marcar ? 'Ej. La fecha de nacimiento y el documento no son los del registro.' : 'Ej. Se marcó por error.'}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </div>
    </Modal>
  );
}
