'use client';

import { Wrench, X } from 'lucide-react';

interface TrabajandoEnElloModalProps {
  titulo: string;
  onClose: () => void;
}

export function TrabajandoEnElloModal({ titulo, onClose }: TrabajandoEnElloModalProps) {
  return (
    <div
      className="fixed inset-0 z-20 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-full bg-brand-amber-soft text-brand-navy flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-5 h-5" />
        </div>

        <h3 className="font-semibold text-brand-ink mb-1.5">{titulo}</h3>
        <p className="text-sm text-brand-muted">
          Estamos trabajando en esta funcionalidad. Pronto va a estar disponible.
        </p>
      </div>
    </div>
  );
}
