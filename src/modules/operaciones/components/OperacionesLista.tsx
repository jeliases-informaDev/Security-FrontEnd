'use client';

import { useEffect, useState } from 'react';
import { FileDown, UserRoundCog } from 'lucide-react';
import { operacionesService, mensajeDeErrorOperaciones, type OperacionItem, type PaginaOperaciones } from '@/modules/operaciones/services/operacionesService';
import { Panel } from '@/shared/ui/PageShell';
import { botonSecundario, botonTexto } from '@/shared/ui/estilos';

const POR_PAGINA = 10;

const formatoFecha = (valor: string | null) => {
  if (!valor) return '—';
  const [anio, mes, dia] = valor.split('-');
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : valor;
};

interface OperacionesListaProps {
  empresa: string;
  /** Cambia cada vez que hay que volver a pedir la lista (después de guardar o de cambiar un responsable). */
  version: number;
  /** Responsables cambiados en esta sesión (por id de registro), para cuando el listado no los trae. */
  asignados: Record<number, string>;
  onEditar: (id: number) => void;
  onCambiarResponsable: (operacion: OperacionItem) => void;
  onDescargarPdf: (operacion: OperacionItem) => void;
  onNuevo: () => void;
}

export function OperacionesLista({ empresa, version, asignados, onEditar, onCambiarResponsable, onDescargarPdf, onNuevo }: OperacionesListaProps) {
  const [pagina, setPagina] = useState(0);
  const [reintento, setReintento] = useState(0);
  // El resultado guarda a qué pedido corresponde: si no coincide con el pedido actual, todavía se está cargando.
  const [resultado, setResultado] = useState<{ clave: string; datos: PaginaOperaciones | null; error: string | null } | null>(null);

  const clave = `${empresa}|${pagina}|${version}|${reintento}`;
  const cargando = resultado?.clave !== clave;
  const datos = resultado?.datos ?? null;
  const error = cargando ? null : resultado?.error ?? null;

  useEffect(() => {
    let vigente = true;
    operacionesService
      .listar(empresa, pagina, POR_PAGINA)
      .then((respuesta) => {
        if (vigente) setResultado({ clave, datos: respuesta, error: null });
      })
      .catch((err) => {
        if (vigente) setResultado({ clave, datos: null, error: mensajeDeErrorOperaciones(err, 'No se pudieron cargar los registros. Inténtalo de nuevo.') });
      });
    return () => {
      vigente = false;
    };
  }, [empresa, pagina, clave]);

  // Mientras llega la página nueva se siguen mostrando los datos anteriores, atenuados
  const filas = datos?.content ?? [];
  const total = datos?.totalElements ?? 0;
  const desde = total === 0 ? 0 : pagina * POR_PAGINA + 1;
  const hasta = Math.min((pagina + 1) * POR_PAGINA, total);
  const totalPaginas = datos?.totalPages ?? 0;

  if (error) {
    return (
      <Panel className="px-6 py-10 text-center">
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
        <button type="button" onClick={() => setReintento((actual) => actual + 1)} className={`${botonSecundario} mt-4`}>
          Reintentar
        </button>
      </Panel>
    );
  }

  if (!cargando && total === 0) {
    return (
      <Panel className="px-6 py-12 text-center">
        <p className="font-medium text-brand-ink">Todavía no hay registros de operaciones.</p>
        <p className="mt-1 text-sm text-brand-muted">Cuando registres el primero aparecerá aquí con su responsable.</p>
        <button type="button" onClick={onNuevo} className={`${botonSecundario} mt-5`}>
          Registrar una operación
        </button>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-brand-muted">
              <th scope="col" className="px-5 py-3">N.º de registro</th>
              <th scope="col" className="px-3 py-3">Persona física</th>
              <th scope="col" className="px-3 py-3">Representada</th>
              <th scope="col" className="px-3 py-3">Oficina</th>
              <th scope="col" className="px-3 py-3">Fecha</th>
              <th scope="col" className="px-3 py-3">Responsable</th>
              <th scope="col" className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cargando && filas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-brand-muted">
                  Cargando registros…
                </td>
              </tr>
            )}
            {filas.map((fila) => (
              <tr key={fila.id} className={`transition hover:bg-slate-50 ${cargando ? 'opacity-60' : ''}`}>
                <td className="whitespace-nowrap px-5 py-3 font-mono text-[13px] text-brand-ink">{fila.numeroRegistro ?? '—'}</td>
                <td className="px-3 py-3 text-brand-ink">{fila.personaFisica ?? '—'}</td>
                <td className="px-3 py-3 text-brand-muted">{fila.personaNombre ?? '—'}</td>
                <td className="px-3 py-3 text-brand-muted">{fila.oficina ?? '—'}</td>
                <td className="px-3 py-3 tabular-nums text-brand-muted">{formatoFecha(fila.fecha)}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  {fila.responsable?.nombreCompleto || asignados[fila.id] ? (
                    <span className="text-brand-ink">{fila.responsable?.nombreCompleto || asignados[fila.id]}</span>
                  ) : (
                    <span className="text-slate-400" title="El listado no informa el responsable de este registro">
                      —
                    </span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" onClick={() => onEditar(fila.id)} className={`${botonTexto} whitespace-nowrap`}>
                      Ver y editar
                    </button>
                    <button type="button" onClick={() => onDescargarPdf(fila)} className={`${botonTexto} whitespace-nowrap`} aria-label={`Descargar el PDF de ${fila.numeroRegistro ?? 'la operación'}`}>
                      <FileDown className="h-4 w-4" aria-hidden="true" />
                      PDF
                    </button>
                    <button type="button" onClick={() => onCambiarResponsable(fila)} className={`${botonTexto} whitespace-nowrap`}>
                      <UserRoundCog className="h-4 w-4" aria-hidden="true" />
                      Responsable
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3 text-sm text-brand-muted">
        <p aria-live="polite">
          Mostrando {desde}–{hasta} de {total}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPagina((actual) => Math.max(0, actual - 1))} disabled={pagina === 0 || cargando} className={botonSecundario}>
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPagina((actual) => actual + 1)}
            disabled={pagina + 1 >= totalPaginas || cargando}
            className={botonSecundario}
          >
            Siguiente
          </button>
        </div>
      </div>
    </Panel>
  );
}
