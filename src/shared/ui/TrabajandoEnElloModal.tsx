'use client';

import { Wrench } from 'lucide-react';
import { Modal } from './Modal';

interface TrabajandoEnElloModalProps {
  titulo: string;
  onClose: () => void;
}

export function TrabajandoEnElloModal({ titulo, onClose }: TrabajandoEnElloModalProps) {
  return (
    <Modal titulo={titulo} onCerrar={onClose} pie={<button type="button" onClick={onClose} className="btn btn-primary">Entendido</button>}>
      <div className="flex flex-col items-center py-2 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-brand-ink" aria-hidden="true"><Wrench className="h-5 w-5" /></span>
        <p className="text-sm text-muted">Estamos trabajando en esta funcionalidad. Pronto va a estar disponible.</p>
      </div>
    </Modal>
  );
}
