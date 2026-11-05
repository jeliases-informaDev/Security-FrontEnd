'use client';

import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { esAdministrador } from '@/shared/lib/modulos';
import { Aviso, type AvisoDatos } from '@/shared/ui/kit';
import { useLicencia } from '../context/LicenciaContext';
import { ENLACE_LICENCIA } from '../lib/errores';

interface Franja {
  aviso: AvisoDatos;
  etiquetaEnlace: string;
}

/** Franja bajo la barra superior. Muestra una sola cosa a la vez: primero lo que bloquea, luego los tokens, luego el vencimiento. */
export function LicenciaBanner() {
  const { usuario } = useAuth();
  const { licencia, exento } = useLicencia();

  if (!licencia) return null;

  const admin = esAdministrador(usuario);
  const tokens = licencia.tokens;
  let franja: Franja | null = null;

  if (licencia.estado === 'SOLO_LECTURA' && !exento) {
    franja = { aviso: { tipo: 'aviso', texto: licencia.mensaje }, etiquetaEnlace: 'Renovar en Sulotec' };
  } else if ((licencia.estado === 'SUSPENDIDA' || licencia.estado === 'CANCELADA') && !exento) {
    franja = { aviso: { tipo: 'error', texto: licencia.mensaje }, etiquetaEnlace: 'Ver mi licencia' };
  } else if (licencia.estado === 'SIN_LICENCIA') {
    // Solo los administradores pueden hacer algo al respecto.
    if (admin) franja = { aviso: { tipo: 'info', texto: licencia.mensaje }, etiquetaEnlace: 'Ver mi licencia' };
  } else if (tokens && !exento && tokens.nivel === 'bloqueado') {
    franja = { aviso: { tipo: 'error', texto: 'Tokens del mes agotados.' }, etiquetaEnlace: 'Ampliar plan' };
  } else if (tokens && !exento && tokens.nivel === 'tolerancia') {
    franja = { aviso: { tipo: 'aviso', texto: 'Tokens del mes agotados: estás usando la tolerancia, que se factura aparte.' }, etiquetaEnlace: 'Ampliar plan' };
  } else if (tokens && !exento && tokens.nivel === 'aviso') {
    franja = { aviso: { tipo: 'aviso', texto: 'Usaste el 80 % de los tokens de este mes.' }, etiquetaEnlace: 'Ampliar plan' };
  } else if (licencia.estado === 'ACTIVA' && admin && licencia.dias_para_vencer != null && licencia.dias_para_vencer <= 7) {
    const dias = licencia.dias_para_vencer;
    franja = {
      aviso: { tipo: 'info', texto: dias <= 0 ? 'Tu licencia vence hoy.' : `Tu licencia vence en ${dias} ${dias === 1 ? 'día' : 'días'}.` },
      etiquetaEnlace: 'Ver mi licencia',
    };
  }

  if (!franja) return null;

  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8">
      <Aviso aviso={franja.aviso}>
        <a
          href={licencia.enlace || ENLACE_LICENCIA}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm mt-2"
        >
          {franja.etiquetaEnlace}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </Aviso>
    </div>
  );
}
