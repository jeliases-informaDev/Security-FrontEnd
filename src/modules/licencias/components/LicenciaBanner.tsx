'use client';

import Link from 'next/link';
import { AlertTriangle, Clock, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { useLicencia } from '../context/LicenciaContext';

export function LicenciaBanner() {
  const { usuario } = useAuth();
  const { bolsa, bannerEstado, descartarBanner } = useLicencia();

  // El Administrador Universal de Sulotec está exento de restricciones de licencia
  if (usuario?.rol?.toUpperCase() === 'ADMINISTRADOR') {
    return null;
  }

  // Estado prioritario: SUSPENDIDA > SOLO_LECTURA > enExceso
  const estado = bannerEstado || bolsa?.estado;
  const enExceso = bolsa?.enExceso && estado === 'VIGENTE';

  if (!estado && !enExceso) return null;
  if (estado === 'VIGENTE' && !enExceso) return null;

  if (estado === 'SUSPENDIDA') {
    return (
      <div
        role="alert"
        className="relative z-10 flex items-center justify-between gap-3 border-b border-bad/30 bg-bad px-4 py-2 text-xs text-white shadow-sm sm:px-6"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="h-4 w-4 shrink-0 text-white animate-pulse" aria-hidden="true" />
          <p className="truncate font-medium">
            <strong>Acceso suspendido:</strong> El período de gracia de tu licencia ha concluido. Contacta a Sulotec para reactivar el servicio.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/licencias"
            className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white transition hover:bg-white/30"
          >
            Ver estado
          </Link>
          <button
            type="button"
            onClick={descartarBanner}
            aria-label="Ocultar aviso"
            className="rounded p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (estado === 'SOLO_LECTURA') {
    return (
      <div
        role="alert"
        className="relative z-10 flex items-center justify-between gap-3 border-b border-amber-500/30 bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs text-white shadow-sm sm:px-6"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
          <p className="truncate font-medium">
            <strong>Modo solo lectura:</strong> Tu licencia ha vencido. Puedes consultar información existente, pero no realizar nuevas operaciones ni consumos.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/licencias"
            className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white transition hover:bg-white/30"
          >
            Gestionar licencia
          </Link>
          <button
            type="button"
            onClick={descartarBanner}
            aria-label="Ocultar aviso"
            className="rounded p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (enExceso) {
    return (
      <div
        role="status"
        className="relative z-10 flex items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-1.5 text-xs text-amber-900 sm:px-6"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="truncate">
            <strong>Operando en exceso (+10% tolerancia):</strong> Se han agotado los créditos contratados.
            Por favor tramita una recarga para evitar la suspensión del servicio.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/licencias"
            className="font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-950"
          >
            Ver bolsa
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
