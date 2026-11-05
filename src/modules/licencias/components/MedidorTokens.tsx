'use client';

import { useEffect, useRef, useState } from 'react';
import { Coins, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { useLicencia } from '../context/LicenciaContext';
import { ENLACE_LICENCIA } from '../lib/errores';
import type { NivelTokens } from '../types/licencia.types';

const COLOR_BARRA: Record<NivelTokens, string> = {
  normal: 'bg-brand',
  aviso: 'bg-warn',
  tolerancia: 'bg-warn',
  bloqueado: 'bg-bad',
};

const ETIQUETA_ESTADO = {
  ACTIVA: 'Activa',
  SOLO_LECTURA: 'Solo lectura',
  SUSPENDIDA: 'Suspendida',
  CANCELADA: 'Cancelada',
  SIN_LICENCIA: 'Sin licencia',
} as const;

function fechaCorta(iso: string | null): string {
  if (!iso) return '—';
  const [anio, mes, dia] = iso.split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso;
}

const numero = (n: number) => n.toLocaleString('es-PE');

/** Pastilla de la barra superior: tokens usados del mes y, al abrirla, el detalle de la licencia. */
export function MedidorTokens() {
  const { usuario } = useAuth();
  const { licencia, refrescar } = useLicencia();
  const [abierto, setAbierto] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Se cierra con clic fuera o con Escape.
  useEffect(() => {
    if (!abierto) return;
    const alClicAfuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
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

  const rol = usuario?.rol?.trim().toUpperCase();

  // El administrador de Sulotec no tiene tope.
  if (rol === 'ADMINISTRADOR') {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-medium text-muted">
        <Coins className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
        Sulotec: sin límite
      </span>
    );
  }

  const tokens = licencia?.tokens;
  if (rol !== 'ADMINISTRADOR_EMPRESA' || !licencia || !tokens) return null;

  const porcentaje = Math.max(0, Math.min(100, tokens.porcentaje));
  const alActualizar = async () => {
    setActualizando(true);
    await refrescar();
    setActualizando(false);
  };

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        title="Ver el detalle de tu licencia"
        className="flex h-8 items-center gap-2 rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink transition-colors hover:bg-surface-2"
      >
        <Coins className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
        <span className="tabular-nums">{numero(tokens.usados)} / {numero(tokens.capacidad)}</span>
        <span className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
          <span className={`block h-full rounded-full ${COLOR_BARRA[tokens.nivel]}`} style={{ width: `${porcentaje}%` }} />
        </span>
      </button>

      {abierto && (
        <div role="dialog" aria-label="Detalle de tu licencia" className="aparece absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-line bg-surface p-4 text-xs shadow-lg sm:w-96">
          <div className="flex items-start justify-between gap-2 border-b border-line pb-3">
            <div className="min-w-0">
              <p className="eyebrow truncate">{licencia.plan ? `Plan ${licencia.plan}` : 'Tu licencia'}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">
                {ETIQUETA_ESTADO[licencia.estado]}
                {licencia.periodo ? <span className="font-normal text-muted"> · {licencia.periodo}</span> : null}
              </p>
            </div>
            <button type="button" onClick={alActualizar} disabled={actualizando} title="Actualizar" aria-label="Actualizar" className="btn btn-ghost btn-icon h-8 w-8 text-muted">
              <RefreshCw className={`h-3.5 w-3.5 ${actualizando ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <div className={`h-full rounded-full ${COLOR_BARRA[tokens.nivel]}`} style={{ width: `${porcentaje}%` }} />
            </div>
            <p className="mt-1.5 text-muted">Usaste el <span className="tabular-nums">{porcentaje}</span> % de los tokens de este mes.</p>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-ink">
            <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
              <dt className="text-[11px] text-muted">Usados</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{numero(tokens.usados)}</dd>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
              <dt className="text-[11px] text-muted">Disponibles</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{numero(tokens.disponibles)}</dd>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
              <dt className="text-[11px] text-muted">Capacidad del mes</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">{numero(tokens.capacidad)}</dd>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
              <dt className="text-[11px] text-muted">Usuarios activos</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">
                {licencia.usuarios_activos ?? '—'} de {licencia.usuarios_max ?? '—'}
              </dd>
            </div>
            <div className="col-span-2 rounded-xl border border-line bg-surface-2/40 p-2.5">
              <dt className="text-[11px] text-muted">Vencimiento</dt>
              <dd className="mt-0.5 text-sm font-semibold tabular-nums">
                {fechaCorta(licencia.vencimiento)}
                {licencia.dias_para_vencer != null && licencia.dias_para_vencer >= 0 ? (
                  <span className="font-normal text-muted"> · faltan {licencia.dias_para_vencer} {licencia.dias_para_vencer === 1 ? 'día' : 'días'}</span>
                ) : null}
              </dd>
            </div>
          </dl>

          <a href={licencia.enlace || ENLACE_LICENCIA} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm mt-3 w-full">
            Ver en Sulotec
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
    </div>
  );
}
