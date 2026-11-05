'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { licenciaService } from '../services/licenciaService';
import { ENLACE_LICENCIA } from '../lib/errores';
import type { DetalleSaldoInsuficiente, Licencia, LicenciaResponse, TarifaToken } from '../types/licencia.types';

interface BolsaAgotada {
  abierta: boolean;
  mensaje: string;
  enlace: string;
}

interface LicenciaContextValue {
  /** null = licencias apagadas, sin información o aún sin cargar: no se muestra nada. */
  licencia: Licencia | null;
  /** true si el usuario es el administrador de Sulotec (nunca se bloquea). */
  exento: boolean;
  /** Nombre de la empresa del usuario. */
  empresa: string | null;
  /** Costo en tokens de cada acción, tal como lo fija Sulotec (vacío si no hay información). */
  tarifas: TarifaToken[];
  cargando: boolean;
  /** Vuelve a leer la licencia al servidor (por ejemplo, tras gastar tokens). */
  refrescar: () => Promise<void>;
  /** Las escrituras están bloqueadas: solo lectura, suspendida o cancelada. */
  soloLectura: boolean;
  /** Se pueden crear o reactivar cuentas (hay cupo, o no hay licencia que lo limite). */
  puedeCrear: boolean;
  bolsaAgotada: BolsaAgotada;
  cerrarBolsaAgotada: () => void;
}

const LicenciaContext = createContext<LicenciaContextValue | null>(null);

const BOLSA_CERRADA: BolsaAgotada = { abierta: false, mensaje: '', enlace: ENLACE_LICENCIA };

export function LicenciaProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState<LicenciaResponse | null>(null);
  const [listo, setListo] = useState(false);
  const [bolsaAgotada, setBolsaAgotada] = useState<BolsaAgotada>(BOLSA_CERRADA);

  const hayUsuario = Boolean(usuario);

  const leer = useCallback(async (forzar: boolean) => {
    try {
      const respuesta = await licenciaService.obtener(forzar);
      setDatos(respuesta);
    } catch {
      // Si falla se conserva la última licencia conocida: un corte de red no debe cambiar lo que ve la persona.
    } finally {
      setListo(true);
    }
  }, []);

  const refrescar = useCallback(() => leer(true), [leer]);

  // Carga inicial al tener sesión. El estado solo cambia dentro de las respuestas, nunca de forma directa en el efecto.
  useEffect(() => {
    if (!hayUsuario) return;
    let cancelado = false;
    licenciaService
      .obtener(false)
      .then((respuesta) => { if (!cancelado) setDatos(respuesta); })
      .catch(() => { /* se queda sin licencia conocida: no se muestra nada */ })
      .finally(() => { if (!cancelado) setListo(true); });
    return () => { cancelado = true; };
  }, [hayUsuario]);

  // Eventos que dispara apiClient cuando el servidor responde 402 o 403 por licencia.
  useEffect(() => {
    const alSaldoInsuficiente = (evento: Event) => {
      const detalle = (evento as CustomEvent<Partial<DetalleSaldoInsuficiente>>).detail;
      setBolsaAgotada({
        abierta: true,
        mensaje: detalle?.mensaje || 'Tu empresa usó todos los tokens de este mes. Amplía tu plan en Sulotec para seguir consultando.',
        enlace: detalle?.enlace || ENLACE_LICENCIA,
      });
      void leer(true);
    };
    const alActualizar = () => {
      void leer(true);
    };
    window.addEventListener('licencia:saldo-insuficiente', alSaldoInsuficiente);
    window.addEventListener('licencia:actualizar', alActualizar);
    return () => {
      window.removeEventListener('licencia:saldo-insuficiente', alSaldoInsuficiente);
      window.removeEventListener('licencia:actualizar', alActualizar);
    };
  }, [leer]);

  const cerrarBolsaAgotada = useCallback(() => setBolsaAgotada(BOLSA_CERRADA), []);

  const valor = useMemo<LicenciaContextValue>(() => {
    // Sin sesión no se muestra nada, aunque quede una respuesta vieja en memoria.
    const vigente = hayUsuario ? datos : null;
    const licencia = vigente?.licencia ?? null;
    const exento = vigente?.exento ?? false;
    const bloqueada = licencia?.estado === 'SOLO_LECTURA' || licencia?.estado === 'SUSPENDIDA' || licencia?.estado === 'CANCELADA';
    return {
      licencia,
      exento,
      empresa: vigente?.empresa ?? null,
      tarifas: vigente?.tarifas ?? [],
      cargando: hayUsuario && !listo,
      refrescar,
      soloLectura: bloqueada && !exento,
      puedeCrear: !licencia || licencia.estado === 'SIN_LICENCIA' || licencia.puede_crear_usuarios !== false,
      bolsaAgotada,
      cerrarBolsaAgotada,
    };
  }, [hayUsuario, datos, listo, refrescar, bolsaAgotada, cerrarBolsaAgotada]);

  return <LicenciaContext.Provider value={valor}>{children}</LicenciaContext.Provider>;
}

export function useLicencia(): LicenciaContextValue {
  const contexto = useContext(LicenciaContext);
  if (!contexto) throw new Error('useLicencia debe usarse dentro de un LicenciaProvider');
  return contexto;
}
