'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Coins,
  RefreshCw,
  Clock,
  User,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Boton, Esqueleto, EstadoVacio, Etiqueta, Paginacion } from '@/shared/ui/kit';
import { licenciasService } from '../services/licenciasService';
import { useLicencia } from '../context/LicenciaContext';
import type { MovimientoCredito } from '../types/licencia.types';
import { ACCIONES_CREDITO_INFO } from '../types/licencia.types';

interface HistorialConsumosModalProps {
  abierta: boolean;
  onCerrar: () => void;
}

export function HistorialConsumosModal({ abierta, onCerrar }: HistorialConsumosModalProps) {
  const { bolsa } = useLicencia();
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalElementos, setTotalElementos] = useState(0);
  const [movimientos, setMovimientos] = useState<MovimientoCredito[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const tamanoPagina = 10;

  const cargarMovimientos = useCallback(async (pag: number) => {
    setCargando(true);
    try {
      const resp = await licenciasService.listarMovimientos(pag, tamanoPagina);
      setMovimientos(resp.content || []);
      setTotalPaginas(Math.max(1, resp.totalPages || 1));
      setTotalElementos(resp.totalElements || 0);
    } catch {
      setMovimientos([]);
    } finally {
      setCargando(false);
    }
  }, [tamanoPagina]);

  useEffect(() => {
    if (abierta) {
      cargarMovimientos(pagina);
    }
  }, [abierta, pagina, cargarMovimientos]);

  if (!abierta) return null;

  const subtitulo = bolsa?.empresaNombre
    ? `Consumos y movimientos de ${bolsa.empresaNombre} (Total: ${totalElementos} registros)`
    : `Consumos y deducción de tokens por usuario y acción`;

  const desde = totalElementos === 0 ? 0 : pagina * tamanoPagina + 1;
  const hasta = Math.min((pagina + 1) * tamanoPagina, totalElementos);

  const pie = (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Coins className="h-4 w-4 text-brand" />
        <span>
          Disponibles: <strong>{bolsa?.creditosDisponibles ?? '—'}</strong> / {bolsa?.creditosTotales ?? '—'} tokens
        </span>
      </div>
      <Boton variante="secundario" onClick={onCerrar}>
        Cerrar
      </Boton>
    </div>
  );

  return (
    <Modal
      titulo="Historial de Consumos de Tokens"
      subtitulo={subtitulo}
      onCerrar={onCerrar}
      tamano="xl"
      pie={pie}
    >
      <div className="space-y-4">
        {/* Barra superior del modal: botón de refrescar y resumen */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted">
            Cada acción realizada por los usuarios de la empresa descuenta tokens según el tarifario vigente.
          </p>
          <Boton
            variante="fantasma"
            onClick={() => cargarMovimientos(pagina)}
            disabled={cargando}
            icono={RefreshCw}
            aria-label="Refrescar consumos"
          >
            Refrescar
          </Boton>
        </div>

        {/* Tabla o estados */}
        {cargando && !movimientos ? (
          <div className="space-y-2 py-4">
            <Esqueleto className="h-10 w-full rounded-xl" />
            <Esqueleto className="h-10 w-full rounded-xl" />
            <Esqueleto className="h-10 w-full rounded-xl" />
            <Esqueleto className="h-10 w-full rounded-xl" />
          </div>
        ) : !movimientos || movimientos.length === 0 ? (
          <div className="py-8">
            <EstadoVacio
              icono={History}
              titulo="Sin consumos registrados"
              texto="Aún no se han ejecutado acciones que consuman tokens en esta empresa."
            />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-xs text-ink">
              <thead className="border-b border-line bg-surface-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2.5">Fecha y Hora</th>
                  <th scope="col" className="px-3 py-2.5">Acción / Módulo</th>
                  <th scope="col" className="px-3 py-2.5 text-center">Tokens</th>
                  <th scope="col" className="px-3 py-2.5">Usuario</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Saldo Restante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface">
                {movimientos.map((mov) => {
                  const meta = mov.accion ? ACCIONES_CREDITO_INFO[mov.accion] : undefined;
                  const valorRaw = mov.cantidad ?? mov.creditos ?? 0;
                  const valorNum = Number(valorRaw);
                  const tokensSeguros = Number.isNaN(valorNum) ? 0 : Math.abs(valorNum);
                  const esRecarga = mov.tipo === 'RECARGA' || (!mov.tipo && valorNum > 0);
                  const detalleTexto = mov.referencia || mov.descripcion;

                  // Saldo restante posterior a este movimiento
                  const saldoRestanteTexto = mov.saldoPosterior != null
                    ? `${mov.saldoPosterior} tokens`
                    : mov.consumidosDespues != null && bolsa?.creditosTotales != null
                    ? `${Math.max(0, bolsa.creditosTotales - mov.consumidosDespues)} tokens`
                    : mov.consumidosDespues != null
                    ? `${mov.consumidosDespues} consumidos`
                    : '—';

                  const fechaFormateada = mov.fecha
                    ? new Date(mov.fecha).toLocaleString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={mov.id} className="transition hover:bg-surface-2/60">
                      {/* Fecha */}
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-muted" />
                          <span className="tabular-nums font-mono text-[11px]">{fechaFormateada}</span>
                        </div>
                      </td>

                      {/* Acción y detalle */}
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink">
                            {meta?.nombre || mov.accion || 'Operación'}
                          </span>
                          {detalleTexto && (
                            <span className="text-[11px] text-muted line-clamp-1" title={detalleTexto}>
                              {detalleTexto}
                            </span>
                          )}
                          {mov.exceso && (
                            <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800">
                              <AlertTriangle className="h-2.5 w-2.5" /> En tolerancia de exceso
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tokens consumidos o sumados */}
                      <td className="whitespace-nowrap px-3 py-2.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold tabular-nums px-2 py-0.5 rounded-full text-xs ${
                            esRecarga
                              ? 'bg-ok-soft text-ok'
                              : 'bg-amber-50 text-amber-900 border border-amber-200'
                          }`}
                        >
                          {esRecarga ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" />+{tokensSeguros}
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3 text-amber-700" />
                              -{tokensSeguros}
                            </>
                          )}
                        </span>
                      </td>

                      {/* Usuario */}
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 shrink-0 text-muted" />
                          <span className="truncate max-w-[140px] text-[11px]">
                            {mov.usuario || 'Sistema'}
                          </span>
                        </div>
                      </td>

                      {/* Saldo Posterior */}
                      <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted">
                        {saldoRestanteTexto}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {totalElementos > tamanoPagina && (
          <div className="pt-2">
            <Paginacion
              desde={desde}
              hasta={hasta}
              total={totalElementos}
              pagina={pagina}
              totalPaginas={totalPaginas}
              onCambiar={(p) => setPagina(p)}
              cargando={cargando}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
