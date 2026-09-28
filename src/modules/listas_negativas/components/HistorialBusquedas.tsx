'use client';

import { useEffect, useMemo, useState } from 'react';
import { History, Search, ExternalLink, Eye } from 'lucide-react';
import {
  listasNegativasService,
  HistorialConsultaResponse,
  ManchaResponse,
} from '@/modules/listas_negativas/services/listasNegativasService';

// Los nombres reales de lista (catalogo Inspektor) son demasiado largos para una celda
// de tabla ("Peru - Personas sancionadas por la Superintendencia de Banca y Seguros"),
// asi que se muestra el grupo abreviado y el nombre completo queda en el tooltip.
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

// Colorimetria real de Inspektor/Risk Consulting (grupoColor viene del backend);
// sin grupo (ej. Noticias) cae en el estilo por defecto (gris).
const COLOR_GRUPO_STYLES: Record<string, string> = {
  Vinotinto: 'bg-rose-50 text-rose-800 border-rose-200',
  Rojo: 'bg-red-50 text-red-700 border-red-100',
  Naranja: 'bg-orange-50 text-orange-700 border-orange-100',
  Amarillo: 'bg-amber-50 text-amber-700 border-amber-100',
  Verde: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

function formatearFechaHora(fecha: string): string {
  return new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

type Orden = 'nombre' | 'fecha';
type Direccion = 'asc' | 'desc';

interface HistorialBusquedasProps {
  onVerDetalle: (entidadId: number) => void;
  recargarClave: number;
}

export function HistorialBusquedas({ onVerDetalle, recargarClave }: HistorialBusquedasProps) {
  const [items, setItems] = useState<HistorialConsultaResponse[]>([]);
  const [pagina, setPagina] = useState(0);
  const [tamano, setTamano] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [orden, setOrden] = useState<Orden>('fecha');
  const [direccion, setDireccion] = useState<Direccion>('desc');

  // Una busqueda nueva (recargarClave) siempre vuelve a la primera pagina.
  useEffect(() => {
    setPagina(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recargarClave]);

  useEffect(() => {
    let cancelado = false;
    // Patron de fetch-en-mount documentado por React (react.dev/learn/synchronizing-with-effects).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCargando(true);

    listasNegativasService
      .obtenerHistorial(pagina, tamano)
      .then((data) => {
        if (cancelado) return;
        setItems(data.content);
        setTotalPaginas(data.totalPages);
      })
      .catch(() => {
        // Sin historial disponible o backend no accesible: no bloquea el resto de la pantalla
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [recargarClave, pagina, tamano]);

  const itemsFiltrados = useMemo(() => {
    const texto = filtro.trim().toLowerCase();
    const filtrados = texto
      ? items.filter(
          (item) =>
            item.resultado.nombreCompleto.toLowerCase().includes(texto) ||
            item.resultado.documento.toLowerCase().includes(texto)
        )
      : items;

    const factor = direccion === 'asc' ? 1 : -1;
    return [...filtrados].sort((a, b) => {
      if (orden === 'nombre') {
        return factor * a.resultado.nombreCompleto.localeCompare(b.resultado.nombreCompleto);
      }
      return factor * (new Date(a.fechaConsulta).getTime() - new Date(b.fechaConsulta).getTime());
    });
  }, [items, filtro, orden, direccion]);

  const alternarOrden = (campo: Orden) => {
    if (orden === campo) {
      setDireccion((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrden(campo);
      setDireccion('asc');
    }
  };

  if (!cargando && items.length === 0 && pagina === 0 && !filtro) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-brand-muted" />
        <h2 className="text-sm font-semibold text-brand-ink">Mis búsquedas recientes</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100">
          <label className="flex items-center gap-2 text-xs text-brand-muted">
            Mostrar
            <select
              value={tamano}
              onChange={(e) => {
                setTamano(Number(e.target.value));
                setPagina(0);
              }}
              className="rounded-lg border border-slate-200 text-xs px-2 py-1 text-brand-ink focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            registros
          </label>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar en esta página…"
              className="pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-brand-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-medium text-brand-muted uppercase tracking-wide border-b border-slate-100">
                <th className="px-5 py-2.5">
                  <button
                    onClick={() => alternarOrden('nombre')}
                    className="flex items-center gap-1 hover:text-brand-ink transition"
                  >
                    Persona / Institución
                    {orden === 'nombre' && <span>{direccion === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-5 py-2.5">Identificación</th>
                <th className="px-5 py-2.5">Tipo de lista</th>
                <th className="px-5 py-2.5">
                  <button
                    onClick={() => alternarOrden('fecha')}
                    className="flex items-center gap-1 hover:text-brand-ink transition"
                  >
                    Fecha de registro
                    {orden === 'fecha' && <span>{direccion === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-5 py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsFiltrados.map((item) => {
                const primeraMancha = item.resultado.manchas[0];
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-brand-navy text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                          {iniciales(item.resultado.nombreCompleto) || '·'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-brand-ink truncate">
                            {item.resultado.nombreCompleto}
                          </p>
                          <p className="text-xs text-brand-muted">
                            {item.resultado.tipoEntidad === 'JURIDICA'
                              ? 'Persona jurídica'
                              : 'Persona natural'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-brand-ink whitespace-nowrap">
                      {item.resultado.tipoDocumento ?? 'Doc.'}: {item.resultado.documento}
                    </td>
                    <td className="px-5 py-3">
                      {primeraMancha ? (
                        <span className="relative inline-block group/tooltip">
                          <span
                            className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border cursor-default ${
                              COLOR_GRUPO_STYLES[primeraMancha.grupoColor ?? ''] ??
                              'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {etiquetaCorta(primeraMancha)}
                            {item.resultado.manchas.length > 1
                              ? ` +${item.resultado.manchas.length - 1}`
                              : ''}
                          </span>
                          <span className="pointer-events-none absolute z-10 hidden group-hover/tooltip:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[240px] px-3 py-2 rounded-lg bg-brand-ink text-white text-xs leading-snug shadow-lg">
                            {primeraMancha.tipoListaNombre}
                            {item.resultado.manchas.length > 1 && (
                              <span className="block mt-1 text-slate-300">
                                +{item.resultado.manchas.length - 1} coincidencia
                                {item.resultado.manchas.length - 1 === 1 ? '' : 's'} más
                              </span>
                            )}
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs text-brand-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-brand-muted whitespace-nowrap">
                      {formatearFechaHora(item.fechaConsulta)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onVerDetalle(item.resultado.entidadId)}
                          title="Ver detalle"
                          className="p-1.5 rounded-lg text-brand-navy hover:bg-brand-navy/10 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {primeraMancha?.link && (
                          <a
                            href={primeraMancha.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Ver fuente"
                            className="p-1.5 rounded-lg text-brand-navy hover:bg-brand-navy/10 transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {itemsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-brand-muted">
                    {filtro
                      ? `No hay búsquedas que coincidan con "${filtro}".`
                      : 'Sin búsquedas registradas.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="text-xs text-brand-muted">
              Página {pagina + 1} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0 || cargando}
                className="px-3 py-1.5 text-xs font-medium text-brand-navy rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina >= totalPaginas - 1 || cargando}
                className="px-3 py-1.5 text-xs font-medium text-brand-navy rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
