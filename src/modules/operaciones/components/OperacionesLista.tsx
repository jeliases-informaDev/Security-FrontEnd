'use client';

import { useEffect, useState } from 'react';
import { FileDown, Receipt, UserRoundCog } from 'lucide-react';
import { operacionesService, mensajeDeErrorOperaciones, type OperacionItem, type PaginaOperaciones } from '@/modules/operaciones/services/operacionesService';
import { Panel } from '@/shared/ui/PageShell';
import { Boton, EstadoVacio, Paginacion } from '@/shared/ui/kit';

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
      <Panel>
        <EstadoVacio icono={Receipt} titulo="No se pudieron cargar los registros" texto={error} accion={<Boton variante="secundario" onClick={() => setReintento((actual) => actual + 1)}>Reintentar</Boton>} />
      </Panel>
    );
  }

  if (!cargando && total === 0) {
    return (
      <Panel>
        <EstadoVacio
          icono={Receipt}
          titulo="Todavía no hay registros de operaciones"
          texto="Cuando registres el primero aparecerá aquí con su responsable y su PDF."
          accion={<Boton variante="secundario" onClick={onNuevo}>Registrar una operación</Boton>}
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="overflow-x-auto">
        <table className="tabla min-w-[56rem]">
          <thead>
            <tr>
              <th scope="col">N.º de registro</th>
              <th scope="col">Persona física</th>
              <th scope="col">Representada</th>
              <th scope="col">Oficina</th>
              <th scope="col">Fecha</th>
              <th scope="col">Responsable</th>
              <th scope="col" className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className={cargando ? 'opacity-60' : ''}>
            {cargando && filas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-muted">Cargando registros…</td>
              </tr>
            )}
            {filas.map((fila) => {
              const responsable = fila.responsable?.nombreCompleto || asignados[fila.id];
              return (
                <tr key={fila.id}>
                  <td className="whitespace-nowrap font-mono text-[13px] font-medium">{fila.numeroRegistro ?? '—'}</td>
                  <td>{fila.personaFisica ?? '—'}</td>
                  <td className="text-muted">{fila.personaNombre ?? '—'}</td>
                  <td className="text-muted">{fila.oficina ?? '—'}</td>
                  <td className="whitespace-nowrap tabular-nums text-muted">{formatoFecha(fila.fecha)}</td>
                  <td className="whitespace-nowrap">
                    {responsable ? (
                      <span className="badge badge-brand">{responsable}</span>
                    ) : (
                      <span className="text-faint" title="El listado no informa el responsable de este registro">—</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button type="button" onClick={() => onEditar(fila.id)} className="btn btn-ghost btn-sm whitespace-nowrap">Ver y editar</button>
                      <button type="button" onClick={() => onDescargarPdf(fila)} className="btn btn-ghost btn-sm whitespace-nowrap" aria-label={`Descargar el PDF de ${fila.numeroRegistro ?? 'la operación'}`}>
                        <FileDown className="h-4 w-4" aria-hidden="true" /> PDF
                      </button>
                      <button type="button" onClick={() => onCambiarResponsable(fila)} className="btn btn-ghost btn-sm whitespace-nowrap">
                        <UserRoundCog className="h-4 w-4" aria-hidden="true" /> Responsable
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Paginacion desde={desde} hasta={hasta} total={total} pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} cargando={cargando} />
    </Panel>
  );
}
