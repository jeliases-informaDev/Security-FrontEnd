'use client';

import { Coins, ExternalLink } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Boton } from '@/shared/ui/kit';
import { useLicencia } from '../context/LicenciaContext';

/** Se abre solo cuando el servidor responde 402: la empresa gastó todos los tokens del mes. */
export function BolsaAgotadaModal() {
  const { bolsaAgotada, cerrarBolsaAgotada } = useLicencia();

  if (!bolsaAgotada.abierta) return null;

  return (
    <Modal
      titulo="Tokens del mes agotados"
      onCerrar={cerrarBolsaAgotada}
      tamano="md"
      pie={
        <>
          <Boton variante="secundario" onClick={cerrarBolsaAgotada}>
            Cerrar
          </Boton>
          <a href={bolsaAgotada.enlace} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Ampliar plan
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </>
      }
    >
      <div className="flex items-start gap-3.5 rounded-xl border border-bad/25 bg-bad-soft p-4">
        <span className="badge-bad flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" aria-hidden="true">
          <Coins className="h-5 w-5" />
        </span>
        <p className="min-w-0 flex-1 text-sm text-ink">{bolsaAgotada.mensaje}</p>
      </div>
      <p className="text-xs text-muted">Puedes seguir navegando y consultando lo que ya está registrado. Solo se pausan las acciones que gastan tokens.</p>
    </Modal>
  );
}
