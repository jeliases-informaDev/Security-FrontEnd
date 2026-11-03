'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { licenciasService } from '../services/licenciasService';
import type {
  BolsaEmpresaResponse,
  AvisoLicencia,
  EstadoLicencia,
} from '../types/licencia.types';

interface LicenciaContextValue {
  bolsa: BolsaEmpresaResponse | null;
  cargando: boolean;
  error: string | null;
  refrescarBolsa: () => Promise<void>;
  avisos: AvisoLicencia[];
  avisosNoLeidos: number;
  refrescarAvisos: () => Promise<void>;
  modalSaldoAbierto: boolean;
  mensajeSaldo: string | null;
  abrirModalSaldo: (mensaje?: string) => void;
  cerrarModalSaldo: () => void;
  bannerEstado: EstadoLicencia | null;
  mensajeBanner: string | null;
  descartarBanner: () => void;
}

const LicenciaContext = createContext<LicenciaContextValue | null>(null);

export function LicenciaProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [bolsa, setBolsa] = useState<BolsaEmpresaResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avisos, setAvisos] = useState<AvisoLicencia[]>([]);
  const [modalSaldoAbierto, setModalSaldoAbierto] = useState(false);
  const [mensajeSaldo, setMensajeSaldo] = useState<string | null>(null);

  const [bannerEstado, setBannerEstado] = useState<EstadoLicencia | null>(null);
  const [mensajeBanner, setMensajeBanner] = useState<string | null>(null);
  const [bannerDescartado, setBannerDescartado] = useState(false);

  const refrescarBolsa = useCallback(async () => {
    if (!usuario) return;
    try {
      setCargando(true);
      setError(null);
      const datos = await licenciasService.obtenerMiBolsa();
      setBolsa(datos);

      // Si la bolsa indica SOLO_LECTURA o SUSPENDIDA, configurar banner
      if (datos.estado === 'SOLO_LECTURA' || datos.estado === 'SUSPENDIDA') {
        setBannerEstado(datos.estado);
      }
    } catch (err: unknown) {
      // Si el backend aún no tiene datos de bolsa para el usuario o es Sulotec
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 401) {
        setError('No se pudo obtener el saldo de créditos de la empresa.');
      }
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  const refrescarAvisos = useCallback(async () => {
    if (!usuario) return;
    // Solo roles que pueden ver avisos (ADMINISTRADOR_EMPRESA / ADMINISTRADOR)
    const rol = usuario.rol?.toUpperCase();
    if (rol !== 'ADMINISTRADOR' && rol !== 'ADMINISTRADOR_EMPRESA') return;

    try {
      const lista = await licenciasService.listarAvisos();
      setAvisos(lista);
    } catch {
      // Silencioso para avisos no críticos
    }
  }, [usuario]);

  useEffect(() => {
    if (usuario) {
      refrescarBolsa();
      refrescarAvisos();
    } else {
      setBolsa(null);
      setAvisos([]);
    }
  }, [usuario, refrescarBolsa, refrescarAvisos]);

  // Manejadores de eventos de CustomEvent (disparados por el interceptor de Axios)
  useEffect(() => {
    const alSaldoInsuficiente = (evento: Event) => {
      const custom = evento as CustomEvent<{ mensaje?: string }>;
      setMensajeSaldo(
        custom.detail?.mensaje ||
          'La bolsa de créditos de su empresa se encuentra agotada (incluyendo el margen de tolerancia).'
      );
      setModalSaldoAbierto(true);
      refrescarBolsa();
    };

    const alLicenciaVencida = (evento: Event) => {
      const custom = evento as CustomEvent<{ mensaje?: string }>;
      setBannerEstado('SOLO_LECTURA');
      setMensajeBanner(
        custom.detail?.mensaje ||
          'La licencia de tu empresa ha vencido y está en período de gracia de solo lectura.'
      );
      setBannerDescartado(false);
      refrescarBolsa();
    };

    const alActualizarLicencia = () => {
      refrescarBolsa();
      refrescarAvisos();
    };

    window.addEventListener('licencia:saldo-insuficiente', alSaldoInsuficiente);
    window.addEventListener('licencia:vencida', alLicenciaVencida);
    window.addEventListener('licencia:actualizar', alActualizarLicencia);

    return () => {
      window.removeEventListener('licencia:saldo-insuficiente', alSaldoInsuficiente);
      window.removeEventListener('licencia:vencida', alLicenciaVencida);
      window.removeEventListener('licencia:actualizar', alActualizarLicencia);
    };
  }, [refrescarBolsa, refrescarAvisos]);

  const avisosNoLeidos = avisos.filter((a) => !a.leido).length;

  const abrirModalSaldo = (mensaje?: string) => {
    if (mensaje) setMensajeSaldo(mensaje);
    setModalSaldoAbierto(true);
  };

  const cerrarModalSaldo = () => {
    setModalSaldoAbierto(false);
  };

  const descartarBanner = () => {
    setBannerDescartado(true);
  };

  const bannerEstadoFinal = bannerDescartado ? null : (bannerEstado || (bolsa?.estado !== 'VIGENTE' ? bolsa?.estado ?? null : null));

  return (
    <LicenciaContext.Provider
      value={{
        bolsa,
        cargando,
        error,
        refrescarBolsa,
        avisos,
        avisosNoLeidos,
        refrescarAvisos,
        modalSaldoAbierto,
        mensajeSaldo,
        abrirModalSaldo,
        cerrarModalSaldo,
        bannerEstado: bannerEstadoFinal,
        mensajeBanner,
        descartarBanner,
      }}
    >
      {children}
    </LicenciaContext.Provider>
  );
}

export function useLicencia(): LicenciaContextValue {
  const context = useContext(LicenciaContext);
  if (!context) {
    throw new Error('useLicencia debe usarse dentro de un LicenciaProvider');
  }
  return context;
}
