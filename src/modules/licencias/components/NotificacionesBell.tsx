'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { useLicencia } from '../context/LicenciaContext';
import { licenciasService } from '../services/licenciasService';

export function NotificacionesBell() {
  const { usuario } = useAuth();
  const { avisos, avisosNoLeidos, refrescarAvisos } = useLicencia();
  const [abierto, setAbierto] = useState(false);
  const [marcandoId, setMarcandoId] = useState<number | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const esAdminUniversal = usuario?.rol?.toUpperCase() === 'ADMINISTRADOR';
  const esAdminEmpresa = usuario?.rol?.toUpperCase() === 'ADMINISTRADOR_EMPRESA';
  const tienePermisoAvisos = esAdminUniversal || esAdminEmpresa;

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!abierto) return;
    const alClicAfuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', alClicAfuera);
    document.addEventListener('keydown', alEscape);
    return () => {
      document.removeEventListener('mousedown', alClicAfuera);
      document.removeEventListener('keydown', alEscape);
    };
  }, [abierto]);

  if (!tienePermisoAvisos) {
    return null;
  }

  const marcarLeido = async (id: number) => {
    try {
      setMarcandoId(id);
      await licenciasService.marcarAvisoLeido(id);
      await refrescarAvisos();
    } catch {
      // Silencioso
    } finally {
      setMarcandoId(null);
    }
  };

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return '';
    try {
      return new Date(fechaStr).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        title="Centro de notificaciones y avisos de licencia"
        className="btn btn-ghost btn-icon relative text-muted hover:text-ink"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {avisosNoLeidos > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-bad text-[10px] font-bold text-white shadow-xs animate-pulse">
            {avisosNoLeidos}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Centro de notificaciones"
          className="aparece absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-line bg-surface p-4 shadow-xl z-50 text-xs"
        >
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand" />
              <h3 className="text-sm font-semibold text-ink">Avisos de Licencia</h3>
            </div>
            {avisosNoLeidos > 0 && (
              <span className="badge badge-warn text-[10px] font-medium">
                {avisosNoLeidos} pendiente{avisosNoLeidos === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <div className="mt-2.5 max-h-80 overflow-y-auto divide-y divide-line">
            {avisos.length === 0 ? (
              <div className="py-6 text-center text-muted">
                <CheckCircle2 className="mx-auto h-8 w-8 text-ok/60 mb-2" />
                <p className="font-medium text-ink">Sin notificaciones</p>
                <p className="text-[11px] mt-0.5">No hay alertas de consumo ni vencimiento pendientes.</p>
              </div>
            ) : (
              avisos.map((aviso) => (
                <div
                  key={aviso.id}
                  className={`py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3 ${
                    aviso.leido ? 'opacity-60' : 'bg-surface-2/40 rounded-lg p-2 my-1'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-ink truncate">
                        {aviso.titulo || 'Alerta del sistema'}
                      </p>
                      {aviso.fechaCreacion && (
                        <span className="text-[10px] text-faint ml-auto shrink-0">
                          {formatearFecha(aviso.fechaCreacion)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted leading-relaxed">
                      {aviso.mensaje}
                    </p>
                  </div>

                  {!aviso.leido && (
                    <button
                      type="button"
                      onClick={() => marcarLeido(aviso.id)}
                      disabled={marcandoId === aviso.id}
                      title="Marcar como leído"
                      className="btn btn-ghost btn-sm h-7 px-2 shrink-0 text-muted hover:text-ok text-[11px]"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
