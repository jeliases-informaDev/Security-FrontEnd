'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Coins,
  ShieldCheck,
  RefreshCw,
  Clock,
  Users,
  AlertTriangle,
  ArrowUpRight,
  History,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { useLicencia } from '../context/LicenciaContext';
import { HistorialConsumosModal } from './HistorialConsumosModal';

export function CreditosWidget() {
  const { usuario } = useAuth();
  const { bolsa, cargando, refrescarBolsa } = useLicencia();
  const [abierto, setAbierto] = useState(false);
  const [modalHistorial, setModalHistorial] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

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

  const esSulotecAdmin = usuario?.rol?.toUpperCase() === 'ADMINISTRADOR';

  if (!bolsa && cargando) {
    return (
      <div className="flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs text-muted">
        <Coins className="h-3.5 w-3.5 animate-spin text-brand" />
        <span>Cargando tokens…</span>
      </div>
    );
  }

  const disponibles =
    bolsa?.creditosDisponibles != null && !Number.isNaN(Number(bolsa.creditosDisponibles))
      ? Number(bolsa.creditosDisponibles)
      : 0;
  const totales =
    bolsa?.creditosTotales != null && !Number.isNaN(Number(bolsa.creditosTotales))
      ? Number(bolsa.creditosTotales)
      : 0;

  // Texto del badge: Tokens: 85 / 100
  const textoBadge = bolsa
    ? `Tokens: ${disponibles} / ${totales}`
    : esSulotecAdmin
    ? 'Tokens: Sulotec (Admin)'
    : 'Tokens: —';

  const estadoBadgeClass =
    bolsa?.estado === 'SUSPENDIDA'
      ? 'border-bad/40 bg-bad-soft text-bad'
      : bolsa?.estado === 'SOLO_LECTURA' || bolsa?.enExceso
      ? 'border-amber-400 bg-amber-50 text-amber-900'
      : 'border-line bg-surface text-ink hover:bg-surface-2';

  return (
    <div
      ref={contenedorRef}
      className="relative"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      {/* Badge discreto en la barra superior */}
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        title="Ver estado de tokens y licencia"
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all shadow-2xs cursor-pointer ${estadoBadgeClass}`}
      >
        <Coins className="h-3.5 w-3.5 text-brand shrink-0" aria-hidden="true" />
        <span className="font-semibold tabular-nums">{textoBadge}</span>
        {bolsa?.enExceso && (
          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 animate-pulse">
            Tolerancia de exceso
          </span>
        )}
      </button>

      {/* Menú emergente al hacer clic o hover */}
      {abierto && (
        <div
          role="dialog"
          aria-label="Detalle de créditos y licencia"
          className="aparece absolute right-0 top-full mt-1.5 w-80 sm:w-96 rounded-2xl border border-line bg-surface p-4 shadow-xl z-50 text-xs"
        >
          {/* Cabecera del popover */}
          <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted">
                {bolsa?.empresaNombre || (esSulotecAdmin ? 'Sulotec Universal' : 'Tu Empresa')}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-ink">Estado de Créditos</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    esSulotecAdmin || bolsa?.estado === 'VIGENTE'
                      ? 'bg-ok-soft text-ok'
                      : bolsa?.estado === 'SOLO_LECTURA'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-bad-soft text-bad'
                  }`}
                >
                  {esSulotecAdmin
                    ? 'Exento (Sulotec)'
                    : bolsa?.estado === 'VIGENTE'
                    ? 'Vigente'
                    : bolsa?.estado === 'SOLO_LECTURA'
                    ? 'Solo Lectura'
                    : 'Suspendida'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refrescarBolsa()}
              disabled={cargando}
              title="Refrescar saldo"
              className="btn btn-ghost btn-icon h-7 w-7 text-muted hover:text-ink"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Si opera en exceso */}
          {bolsa?.enExceso && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Aviso de Tolerancia:</strong> Tu empresa superó el 100% de la bolsa y opera bajo el margen del {bolsa.toleranciaPorcentaje}%.
              </span>
            </div>
          )}

          {/* Grilla con los 6 datos solicitados */}
          {bolsa ? (
            <div className="mt-3 grid grid-cols-2 gap-2 text-ink">
              <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
                <span className="block text-[11px] text-muted">Total contratado</span>
                <span className="mt-0.5 block text-sm font-bold tabular-nums">
                  {bolsa.creditosTotales} tokens
                </span>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
                <span className="block text-[11px] text-muted">Consumidos</span>
                <span className="mt-0.5 block text-sm font-bold tabular-nums text-amber-700">
                  {bolsa.creditosConsumidos} tokens
                </span>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
                <span className="block text-[11px] text-muted">Disponibles</span>
                <span className="mt-0.5 block text-sm font-bold tabular-nums text-ok">
                  {bolsa.creditosDisponibles} tokens
                </span>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
                <span className="flex items-center gap-1 text-[11px] text-muted">
                  <Users className="h-3 w-3 text-brand" /> Usuarios activos / Cupo
                </span>
                <span className="mt-0.5 block text-sm font-bold tabular-nums">
                  {bolsa.usuariosActivos} / {bolsa.cupoUsuarios}
                </span>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
                <span className="block text-[11px] text-muted">Estado de licencia</span>
                <span className="mt-0.5 block text-sm font-bold">
                  {bolsa.estado}
                </span>
              </div>
              <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
                <span className="flex items-center gap-1 text-[11px] text-muted">
                  <Clock className="h-3 w-3 text-brand" /> Días para vencer
                </span>
                <span className="mt-0.5 block text-sm font-bold tabular-nums">
                  {bolsa.diasParaVencer} días
                </span>
              </div>
            </div>
          ) : esSulotecAdmin ? (
            <div className="mt-3 rounded-xl border border-brand/20 bg-brand-soft/50 p-3 text-xs text-ink leading-relaxed">
              <p className="font-semibold text-brand-ink">Administrador Universal (Sulotec)</p>
              <p className="mt-1 text-muted">
                Tu cuenta está exenta de consumo de créditos. Todas tus operaciones tienen costo 0.
              </p>
            </div>
          ) : null}

          {/* Enlace al modal de historial de consumos */}
          <div className="mt-3 pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                setModalHistorial(true);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-soft py-2 text-xs font-semibold text-brand-ink transition hover:bg-brand-soft/80 cursor-pointer"
            >
              <History className="h-3.5 w-3.5" />
              Ver historial de consumos
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal interactivo de consumos */}
      <HistorialConsumosModal
        abierta={modalHistorial}
        onCerrar={() => setModalHistorial(false)}
      />
    </div>
  );
}
