'use client';

import { useEffect, useMemo, useState } from 'react';
import { History, Search, ExternalLink, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import {
  listasNegativasService,
  HistorialConsultaResponse,
  ManchaResponse,
} from '@/modules/listas_negativas/services/listasNegativasService';
import { EtiquetaLista } from '@/modules/listas_negativas/components/ManchaCard';
import { Panel } from '@/shared/ui/PageShell';
import { Avatar, Paginacion } from '@/shared/ui/kit';

// Los nombres reales de lista (catálogo Inspektor) son demasiado largos para una celda
// de tabla ("Peru - Personas sancionadas por la Superintendencia de Banca y Seguros"),
// así que se muestra el grupo abreviado y el nombre completo queda en el tooltip.
const GRUPO_ABREVIADO: Record<string, string> = {
  'Listas Restrictivas': 'Restrictiva',
  'Listas Asociadas a LA/FT o Corrupcion (Penal)': 'LA/FT Penal',
  'Listas Asociadas a LA/FT o Corrupcion (Administrativo)': 'LA/FT Admin.',
  'Sanciones Administrativas': 'Sanción Admin.',
  'Listas de Afectacion Financiera': 'Afect. Financiera',
  'Listas Informativas y PEPs': 'Informativa',
};

function etiquetaCorta(mancha: ManchaResponse): string {
  if (mancha.esPep) return 'PEP';
  if (mancha.grupoNombre) return GRUPO_ABREVIADO[mancha.grupoNombre] ?? mancha.grupoNombre;
  return mancha.tipoListaNombre ?? mancha.tipoListaCodigo ?? '—';
}

const formatoFechaHora = new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

type Orden = 'nombre' | 'fecha';
type Direccion = 'asc' | 'desc';

/** Flecha del encabezado ordenable: doble cuando la columna no es la activa, simple en el sentido actual. */
function IconoOrden({ activo, direccion }: { activo: boolean; direccion: Direccion }) {
  if (!activo) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />;
  return direccion === 'asc' ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />;
}

interface Resultado {
  /** A qué pedido corresponde: si no coincide con el pedido actual, todavía se está cargando. */
  clave: string;
  items: HistorialConsultaResponse[];
  totalPaginas: number;
}

interface HistorialBusquedasProps {
  onVerDetalle: (entidadId: number) => void;
  recargarClave: number;
}

export function HistorialBusquedas({ onVerDetalle, recargarClave }: HistorialBusquedasProps) {
  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(10);
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState<Orden>('fecha');
  const [direccion, setDireccion] = useState<Direccion>('desc');
  const [resultado, setResultado] = useState<Resultado | null>(null);

  // Una búsqueda nueva (recargarClave) siempre vuelve a la primera página.
  const [ultimaRecarga, setUltimaRecarga] = useState(recargarClave);
  if (ultimaRecarga !== recargarClave) {
    setUltimaRecarga(recargarClave);
    setPagina(0);
  }

  const clave = `${recargarClave}|${pagina}|${tamano}`;
  const cargando = resultado?.clave !== clave;
  const items = resultado?.items ?? [];
  const totalPaginas = resultado?.totalPaginas ?? 0;

  useEffect(() => {
    let cancelado = false;
    listasNegativasService
      .obtenerHistorial(pagina, tamano)
      .then((data) => {
        if (!cancelado) setResultado({ clave, items: data.content, totalPaginas: data.totalPages });
      })
      .catch(() => {
        // Sin historial disponible o backend no accesible: se conserva lo que había y no se bloquea el resto de la pantalla.
        if (!cancelado) setResultado((previo) => ({ clave, items: previo?.items ?? [], totalPaginas: previo?.totalPaginas ?? 0 }));
      });
    return () => {
      cancelado = true;
    };
  }, [clave, pagina, tamano]);

  const itemsFiltrados = useMemo(() => {
    const texto = filtro.trim().toLowerCase();
    const filtrados = texto
      ? items.filter((item) => item.resultado.nombreCompleto.toLowerCase().includes(texto) || item.resultado.documento.toLowerCase().includes(texto))
      : items;

    const factor = direccion === 'asc' ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      if (orden === 'nombre') return factor * a.resultado.nombreCompleto.localeCompare(b.resultado.nombreCompleto);
      return factor * (new Date(a.fechaConsulta).getTime() - new Date(b.fechaConsulta).getTime());
    });
  }, [items, filtro, orden, direccion]);

  const alternarOrden = (campo: Orden) => {
    if (orden === campo) setDireccion((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setOrden(campo);
      setDireccion('asc');
    }
  };

  const ariaSort = (campo: Orden) => (orden === campo ? (direccion === 'asc' ? 'ascending' : 'descending') : 'none');

  if (!cargando && items.length === 0 && pagina === 0 && !filtro) return null;

  return (
    <section className="mt-10" aria-labelledby="titulo-historial">
      <Panel
        titulo={<span id="titulo-historial" className="flex items-center gap-2"><History className="h-4 w-4 text-brand" aria-hidden="true" /> Mis búsquedas recientes</span>}
        descripcion="Cada consulta queda registrada con quién la hizo y cuándo."
        acciones={
          <>
            <label className="flex items-center gap-2 text-xs text-muted">
              Mostrar
              <select
                value={tamano}
                onChange={(e) => { setTamano(Number(e.target.value)); setPagina(0); }}
                aria-label="Registros por página"
                className="input h-8 w-auto px-2 text-xs"
              >
                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" aria-hidden="true" />
              <input
                type="search"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Buscar en esta página…"
                aria-label="Buscar en el historial"
                autoComplete="off"
                className="input h-8 w-56 pl-8 text-xs"
              />
            </div>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th scope="col" aria-sort={ariaSort('nombre')}>
                  <button type="button" onClick={() => alternarOrden('nombre')} className="flex items-center gap-1 uppercase tracking-wide hover:text-ink">
                    Persona / institución <IconoOrden activo={orden === 'nombre'} direccion={direccion} />
                  </button>
                </th>
                <th scope="col">Identificación</th>
                <th scope="col">Tipo de lista</th>
                <th scope="col" aria-sort={ariaSort('fecha')}>
                  <button type="button" onClick={() => alternarOrden('fecha')} className="flex items-center gap-1 uppercase tracking-wide hover:text-ink">
                    Fecha de consulta <IconoOrden activo={orden === 'fecha'} direccion={direccion} />
                  </button>
                </th>
                <th scope="col" className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className={cargando ? 'opacity-60' : ''}>
              {itemsFiltrados.map((item) => {
                const primeraMancha = item.resultado.manchas[0];
                const extra = item.resultado.manchas.length - 1;
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar nombre={item.resultado.nombreCompleto} tamano="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{item.resultado.nombreCompleto}</p>
                          <p className="text-xs text-muted">{item.resultado.tipoEntidad === 'JURIDICA' ? 'Persona jurídica' : 'Persona natural'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap font-mono text-[13px]">
                      <span className="text-muted">{item.resultado.tipoDocumento ?? 'Doc.'}</span> {item.resultado.documento}
                    </td>
                    <td>
                      {primeraMancha ? (
                        <span className="inline-flex items-center gap-1.5" title={`${primeraMancha.tipoListaNombre ?? ''}${extra > 0 ? ` · +${extra} coincidencia${extra === 1 ? '' : 's'} más` : ''}`}>
                          <EtiquetaLista mancha={primeraMancha} texto={etiquetaCorta(primeraMancha)} />
                          {extra > 0 && <span className="badge badge-neutral">+{extra}</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap tabular-nums text-muted">{formatoFechaHora.format(new Date(item.fechaConsulta))}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => onVerDetalle(item.resultado.entidadId)} title="Ver detalle" aria-label={`Ver detalle de ${item.resultado.nombreCompleto}`} className="btn btn-ghost btn-icon h-8 w-8">
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {primeraMancha?.link && (
                          <a href={primeraMancha.link} target="_blank" rel="noopener noreferrer" title="Ver fuente" aria-label="Ver fuente" className="btn btn-ghost btn-icon h-8 w-8">
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted">
                    {cargando ? 'Cargando búsquedas…' : filtro ? `No hay búsquedas que coincidan con «${filtro}».` : 'Sin búsquedas registradas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <Paginacion desde={pagina * tamano + 1} hasta={pagina * tamano + items.length} total={totalPaginas * tamano} pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} cargando={cargando} />
        )}
      </Panel>
    </section>
  );
}
