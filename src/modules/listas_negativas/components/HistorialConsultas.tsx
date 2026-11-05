'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye, History, Search } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, EstadoVacio } from '@/shared/ui/kit';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import {
  listasNegativasService,
  TAMANO_PAGINA_HISTORIAL,
  type FiltroHistorial,
  type PaginaHistorial,
  type ResumenMes,
} from '../services/listasNegativasService';
import { cuando, mesYAnio } from '../lib/formato';
import { InsigniaResultado, Segmentado } from './piezas';

const FILTROS: { valor: FiltroHistorial; etiqueta: string }[] = [
  { valor: 'TODAS', etiqueta: 'Todas' },
  { valor: 'CON_COINCIDENCIAS', etiqueta: 'Con coincidencias' },
  { valor: 'SIN_COINCIDENCIAS', etiqueta: 'Sin coincidencias' },
  { valor: 'CRITICAS', etiqueta: 'Críticas' },
];

// Anchos de columna del diseño (suman 1310 px; en pantallas angostas la tabla se desplaza de lado).
const COLUMNAS = [
  { titulo: 'Fecha y hora', ancho: 'w-[120px]' },
  { titulo: 'Consultado', ancho: 'w-[230px]' },
  { titulo: 'Documento', ancho: 'w-[150px]' },
  { titulo: 'Tipo', ancho: 'w-[120px]' },
  { titulo: 'Resultado', ancho: 'w-[170px]' },
  { titulo: 'Listas con coincidencia', ancho: 'w-[250px]' },
  { titulo: 'Usuario', ancho: 'w-[130px]' },
  { titulo: 'Acciones', ancho: 'w-[140px]' },
];

function Cifra({ rotulo, valor, detalle }: { rotulo: string; valor: string; detalle: string }) {
  return (
    <div className="card flex flex-col gap-1.5 rounded-[22px] px-5 py-[18px]">
      <p className="font-mono text-xs uppercase tracking-[0.04em] text-muted">{rotulo}</p>
      <p className="text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-ink tabular-nums">{valor}</p>
      <p className="text-sm text-muted">{detalle}</p>
    </div>
  );
}

/** Páginas que se muestran en el pie: hasta cinco alrededor de la actual. */
function paginasVisibles(actual: number, total: number): number[] {
  const inicio = Math.max(0, Math.min(actual - 2, total - 5));
  return Array.from({ length: Math.min(5, total) }, (_, i) => inicio + i);
}

/** Historial de consultas (LN 5): cifras del mes, buscador, pestañas y tabla paginada; todo se filtra en el servidor. */
export function HistorialConsultas() {
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [filtro, setFiltro] = useState<FiltroHistorial>('TODAS');
  const [texto, setTexto] = useState('');
  const [consultaQ, setConsultaQ] = useState('');
  const [pagina, setPagina] = useState(0);
  // Última respuesta del servidor y para qué filtro, texto y página fue: si no coincide con lo pedido ahora, se está cargando.
  const [respuesta, setRespuesta] = useState<{ clave: string; datos: PaginaHistorial | null; error: string | null } | null>(null);
  const clave = `${filtro}|${consultaQ}|${pagina}`;
  const cargando = respuesta?.clave !== clave;
  const datos = respuesta?.datos ?? null;
  const error = respuesta && respuesta.clave === clave ? respuesta.error : null;

  useEffect(() => {
    let vigente = true;
    listasNegativasService.resumen().then((r) => { if (vigente) setResumen(r); }).catch(() => { /* las cifras son un apoyo: sin ellas la tabla sigue funcionando */ });
    return () => { vigente = false; };
  }, []);

  // El texto del buscador se envía al servidor un instante después de dejar de escribir.
  const qEnviada = useRef('');
  useEffect(() => {
    const espera = setTimeout(() => {
      const nuevo = texto.trim();
      if (nuevo === qEnviada.current) return;
      qEnviada.current = nuevo;
      setConsultaQ(nuevo);
      setPagina(0);
    }, 350);
    return () => clearTimeout(espera);
  }, [texto]);

  useEffect(() => {
    let vigente = true;
    const pedida = `${filtro}|${consultaQ}|${pagina}`;
    listasNegativasService
      .historial(filtro, consultaQ, pagina)
      .then((d) => { if (vigente) setRespuesta({ clave: pedida, datos: d, error: null }); })
      .catch((err: unknown) => { if (vigente) setRespuesta((anterior) => ({ clave: pedida, datos: anterior?.datos ?? null, error: mensajeDe(err, 'No se pudo cargar el historial.') })); });
    return () => { vigente = false; };
  }, [filtro, consultaQ, pagina]);

  const cambiarFiltro = (nuevo: FiltroHistorial) => {
    setFiltro(nuevo);
    setPagina(0);
  };

  const total = datos?.totalElements ?? 0;
  const desde = total === 0 ? 0 : (datos?.number ?? 0) * (datos?.size ?? TAMANO_PAGINA_HISTORIAL) + 1;
  const hasta = datos ? Math.min(total, desde + datos.content.length - 1) : 0;
  const totalPaginas = datos?.totalPages ?? 0;
  const pct = (n: number | null) => (n == null ? 'Sin consultas este mes' : `${n}% de las consultas`);

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Debida diligencia"
        titulo="Historial de consultas"
        descripcion="Todas las consultas hechas en listas negativas, con su resultado, quién la hizo y cuándo."
        icono={History}
        acciones={
          <Link href="/listas-negativas" className="btn btn-primary h-[46px] text-[15px]">
            <Search className="h-4 w-4" aria-hidden="true" /> Nueva consulta
          </Link>
        }
      />

      <div className="flex flex-col gap-5">
        {resumen && (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Cifras del mes">
            <Cifra rotulo="Consultas del mes" valor={String(resumen.consultas)} detalle={`Período ${mesYAnio(resumen.periodo)}`} />
            <Cifra rotulo="Con coincidencias" valor={String(resumen.conCoincidencias)} detalle={pct(resumen.porcentajeConCoincidencias)} />
            <Cifra
              rotulo="Coincidencias críticas"
              valor={String(resumen.criticas)}
              detalle={resumen.criticas === 0 ? 'Ninguna este mes' : resumen.criticasSinDecidir === 0 ? 'Todas con decisión' : resumen.criticasSinDecidir === resumen.criticas ? 'Requieren decisión' : `${resumen.criticasSinDecidir} requieren decisión`}
            />
            <Cifra rotulo="Sin coincidencias" valor={String(resumen.sinCoincidencias)} detalle={pct(resumen.porcentajeSinCoincidencias)} />
          </div>
        )}

        <section className="card overflow-hidden" aria-label="Consultas">
          <div className="flex flex-wrap items-center gap-3.5 px-5 py-4">
            <div className="relative w-full lg:w-[420px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
              <label htmlFor="ln-buscar-historial" className="sr-only">Buscar por nombre o documento</label>
              <input
                id="ln-buscar-historial"
                type="search"
                className="input h-[46px] rounded-[10px] border-line bg-paper pl-[42px]"
                placeholder="Buscar por nombre o documento"
                autoComplete="off"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            </div>
            <Segmentado ariaLabel="Filtrar consultas" valor={filtro} opciones={FILTROS} onCambiar={cambiarFiltro} />
          </div>

          {error && <div className="px-5 pb-4"><Aviso aviso={{ tipo: 'error', texto: error }} /></div>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1360px] border-collapse text-left">
              <thead>
                <tr className="bg-paper">
                  {COLUMNAS.map((c, i) => (
                    <th key={c.titulo} scope="col" className={`${c.ancho} py-2.5 pr-2 text-left font-mono text-[11px] font-normal uppercase tracking-[0.04em] text-muted ${i === 0 ? 'pl-6' : ''}`}>{c.titulo}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={cargando && datos ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                {datos?.content.map((f) => (
                  <tr key={f.id} className="border-t border-line">
                    <td className="w-[120px] py-3 pl-6 pr-2 font-mono text-xs text-muted">{cuando(f.fecha)}</td>
                    <td className="w-[230px] py-3 pr-2 text-sm font-medium text-ink"><span className="block max-w-[216px] break-words">{f.consultado}</span></td>
                    <td className="w-[150px] py-3 pr-2 font-mono text-xs uppercase text-ink">{f.documento ? `${f.tipoDocumento ?? ''} ${f.documento}`.trim() : '—'}</td>
                    <td className="w-[120px] py-3 pr-2 text-sm text-ink">{f.tipoConsultaNombre}</td>
                    <td className="w-[170px] py-3 pr-2">
                      <div className="flex flex-col items-start gap-1">
                        <InsigniaResultado clasificacion={f.clasificacion} nombre={f.clasificacionNombre} porcentaje={f.porcentaje} />
                        {f.homonimo && <span className="badge badge-neutral">Descartada · homónimo</span>}
                      </div>
                    </td>
                    <td className="w-[250px] py-3 pr-2 text-sm text-ink/80">
                      {f.listasConCoincidencia.length > 0 ? <span className="block max-w-[236px] break-words">{f.listasConCoincidencia.join(', ')}</span> : <span className="text-faint">—</span>}
                    </td>
                    <td className="w-[130px] py-3 pr-2 text-[13px] text-ink/80">{f.usuario}</td>
                    <td className="w-[140px] py-3 pr-2">
                      <Link href={`/listas-negativas?consulta=${f.id}`} className="btn btn-secondary h-auto px-3.5 py-2 text-sm">
                        <Eye className="h-4 w-4" aria-hidden="true" /> Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))}
                {cargando && !datos && Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="border-t border-line">
                    <td colSpan={COLUMNAS.length} className="px-6 py-3.5"><div className="skeleton h-5 w-full" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {datos && datos.content.length === 0 && !error && (
            <EstadoVacio
              icono={History}
              titulo={texto.trim() || filtro !== 'TODAS' ? 'No hay consultas con ese filtro' : 'Todavía no hay consultas'}
              texto={texto.trim() || filtro !== 'TODAS' ? 'Cambia la búsqueda o la pestaña para ver otras.' : 'Las consultas que hagas en Listas Negativas aparecerán aquí con su resultado.'}
            />
          )}

          {datos && total > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-line px-6 py-4">
              <p aria-live="polite" className="min-w-0 flex-1 font-mono text-xs tracking-[0.02em] text-muted">
                Mostrando {desde}–{hasta} de {total} {total === 1 ? 'consulta' : 'consultas'}
              </p>
              {totalPaginas > 1 && (
                <nav aria-label="Páginas" className="flex flex-wrap items-center gap-1.5">
                  <button type="button" onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pagina === 0 || cargando} className="btn btn-secondary h-auto px-3.5 py-2 text-sm">
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
                  </button>
                  {paginasVisibles(pagina, totalPaginas).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPagina(n)}
                      disabled={cargando}
                      aria-current={n === pagina ? 'page' : undefined}
                      aria-label={`Página ${n + 1}`}
                      className={`h-9 w-9 rounded-[9px] text-sm font-semibold tabular-nums transition-colors ${n === pagina ? 'bg-ink text-paper' : 'border border-line bg-white text-ink hover:bg-paper'}`}
                    >
                      {n + 1}
                    </button>
                  ))}
                  <button type="button" onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))} disabled={pagina + 1 >= totalPaginas || cargando} className="btn btn-secondary h-auto px-3.5 py-2 text-sm">
                    Siguiente <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
