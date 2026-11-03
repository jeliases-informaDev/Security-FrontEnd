'use client';

import { useRouter } from 'next/navigation';
import { Coins, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { useLicencia } from '../context/LicenciaContext';
import { Modal } from '@/shared/ui/Modal';
import { Boton } from '@/shared/ui/kit';

export function SaldoInsuficienteModal() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { modalSaldoAbierto, cerrarModalSaldo, bolsa } = useLicencia();

  if (!modalSaldoAbierto) return null;

  const esAdminUniversal = usuario?.rol?.toUpperCase() === 'ADMINISTRADOR';

  const irALicencias = () => {
    cerrarModalSaldo();
    router.push('/licencias');
  };

  return (
    <Modal
      titulo="Límite de tokens alcanzado"
      subtitulo={bolsa?.empresaNombre ? `Empresa: ${bolsa.empresaNombre}` : 'Saldo insuficiente (HTTP 402)'}
      onCerrar={cerrarModalSaldo}
      tamano="md"
      pie={
        <>
          <Boton variante="secundario" onClick={cerrarModalSaldo}>
            Cerrar
          </Boton>
          <Boton icono={ArrowRight} onClick={irALicencias}>
            Ver detalles de bolsa
          </Boton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Banner amigable */}
        <div className="flex items-start gap-3.5 rounded-xl border border-bad/25 bg-bad-soft/60 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bad text-white shadow-sm">
            <Coins className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-bad">Saldo de tokens insuficiente</p>
            <p className="mt-1 text-xs text-ink/90 leading-relaxed font-medium">
              Has alcanzado el límite de tokens disponibles para tu empresa. Contacta a tu administrador para solicitar una ampliación de plan a través de Sulotec.
            </p>
          </div>
        </div>

        {/* Resumen de bolsa actual */}
        {bolsa && (
          <div className="rounded-xl border border-line bg-surface-2/50 p-4">
            <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
              <div>
                <span className="block text-[11px] font-medium text-muted">Contratados</span>
                <span className="mt-0.5 block text-base font-semibold text-ink tabular-nums">
                  {bolsa.creditosTotales}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-muted">Consumidos</span>
                <span className="mt-0.5 block text-base font-semibold text-ink tabular-nums text-amber-700">
                  {bolsa.creditosConsumidos}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-muted">Disponibles</span>
                <span className="mt-0.5 block text-base font-bold text-bad tabular-nums">
                  {bolsa.creditosDisponibles}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-muted">Tolerancia</span>
                <span className="mt-0.5 block text-base font-semibold text-amber-600 tabular-nums">
                  +{bolsa.toleranciaPorcentaje}% (Agotada)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Guía según rol */}
        <div className="rounded-xl border border-line bg-surface p-3.5 text-xs text-muted leading-relaxed">
          {esAdminUniversal ? (
            <p>
              <strong className="text-ink">Atención Administrador Sulotec:</strong> Puedes consultar o configurar la bolsa de esta empresa desde la sección de{' '}
              <button
                type="button"
                onClick={irALicencias}
                className="font-semibold text-brand underline underline-offset-2"
              >
                Licencia y Créditos
              </button>
              .
            </p>
          ) : (
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p>
                Las consultas existentes y navegación se mantienen habilitadas de forma gratuita, pero las nuevas operaciones que descuentan créditos están pausadas hasta la ampliación de la bolsa.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
