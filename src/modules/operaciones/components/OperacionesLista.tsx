'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Search } from 'lucide-react';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { IconoAjustes, IconoCandado, IconoDocumento, IconoFiltro, IconoHistorial, IconoInfo, IconoLupa, IconoMas, IconoOjo, IconoRecibo, IconoReloj, IconoSubir, IconoUsuario, IconoVisto } from '@/shared/ui/iconos';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Esqueleto, Etiqueta, EstadoVacio } from '@/shared/ui/kit';
import { useAvisoPendiente } from '../lib/aviso';
import { fechaCorta, mesLargo, montoANumero, montoConMoneda } from '../lib/formato';
import { usd } from '../lib/formatoB';
import { useCarga } from '../lib/useCarga';
import {
  operacionesService,
  TAMANO_PAGINA,
  type CatalogosOperacion,
  type FiltrosOperaciones,
  type Indicadores,
  type OperacionItem,
  type PaginaOperaciones,
  type UsuarioEmpresa,
} from '../services/operacionesService';
import { CambiarResponsableModal } from './CambiarResponsableModal';
import { cuantosFiltros, FiltrosCajon, SIN_FILTROS, type FiltrosLista } from './FiltrosCajon';
import { usePdfOperacion } from './PdfOperacion';
import { AccionFila, BTN, BTN_P, CeldaResponsable, FilaValor, InsigniaEstado, PiePaginas, Segmentado, Tarjeta } from './piezas';
import { BTN_B } from './piezasB';

// Anchos de las columnas del diseño (RO 1).
const COLUMNAS = [
  { titulo: 'N.º de registro', ancho: 'w-[170px]' },
  { titulo: 'Persona que realiza', ancho: 'w-[190px]' },
  { titulo: 'Representada', ancho: 'w-[170px]' },
  { titulo: 'Operación', ancho: 'w-[160px]' },
  { titulo: 'Monto', ancho: 'w-[130px]' },
  { titulo: 'Fecha', ancho: 'w-[90px]' },
  { titulo: 'Estado', ancho: 'w-[150px]' },
  { titulo: 'Responsable', ancho: 'w-[120px]' },
  { titulo: 'Acciones', ancho: 'w-[132px]' },
];

/** Las pestañas son atajos del filtro de estado; con varios estados elegidos en el panel no queda ninguna marcada (`VARIOS`). */
type Pestana = '' | 'PENDIENTE' | 'ENVIADO' | 'INUSUAL' | 'VARIOS';
const PESTANAS: { valor: Pestana; etiqueta: string }[] = [
  { valor: '', etiqueta: 'Todos' },
  { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
  { valor: 'ENVIADO', etiqueta: 'Enviados' },
  { valor: 'INUSUAL', etiqueta: 'Inusuales' },
];
const pestanaDe = (estado: string[]): Pestana => (estado.length === 0 ? '' : estado.length === 1 ? (estado[0] as Pestana) : 'VARIOS');

/** Detalle del indicador de inusuales: el servidor cuenta las que están en análisis y las ya calificadas como sospechosas. */
function detalleInusuales(i: Indicadores): string {
  const sospechosas = i.sospechosas ?? 0;
  return sospechosas > 0 ? `En análisis · ${sospechosas} ${sospechosas === 1 ? 'sospechosa' : 'sospechosas'}` : 'En análisis';
}

function Indicador({ rotulo, valor, detalle }: { rotulo: string; valor: string; detalle: string }) {
  return (
    <div className="card flex flex-col gap-1.5 rounded-[22px] px-5 py-[18px]">
      <p className="flex items-center gap-2 font-mono text-xs uppercase leading-[normal] tracking-[0.04em] text-muted">{rotulo}</p>
      <p className="text-[40px] font-bold leading-[normal] tracking-[-0.02em] tabular-nums text-ink">{valor}</p>
      <p className="text-sm leading-[normal] text-muted">{detalle}</p>
    </div>
  );
}

const REGLAS = ['Se registra el mismo día', 'Un RO por cada actividad', 'No se excluye a ningún cliente', 'Copia de seguridad del RO', 'Conservación: 5 años'];
const QUE_SE_GUARDA = ['Persona que realiza', 'Persona representada', 'Beneficiarios', 'Monto y moneda', 'Medio de pago', 'Origen de fondos', 'Historial de cambios'];

/** Tarjeta «Umbral de tu sector» (RO 0): lo que ya está configurado en RO 16 o la invitación a configurarlo. Si la configuración no llega, queda la invitación. */
function UmbralDeTuSector() {
  const carga = useCarga('lista-configuracion', () => operacionesService.configuracion(), 'No se pudo cargar la configuración del registro.');
  const c = !carga.cargando && !carga.error ? carga.datos : null;
  const configurado = c !== null && c.sector !== null;
  return (
    <Tarjeta
      espacio="gap-[14px]"
      titulo="Umbral de tu sector"
      derecha={c ? (c.porConfigurar ? <Etiqueta className="!leading-[normal]">Por configurar</Etiqueta> : <span className="badge badge-ok !leading-[normal]">Configurado</span>) : undefined}
    >
      {carga.cargando && <Esqueleto lineas={2} />}
      {!carga.cargando && !configurado && (
        <p className="text-[15px] leading-[22px] text-muted">Define tu sector para saber qué operaciones deben ir al registro y desde qué monto. Hasta entonces no se puede calcular el umbral.</p>
      )}
      {c && configurado && (
        <div className="flex flex-col gap-3">
          <FilaValor etiqueta="Sector">{c.sectorNombre ?? c.sector}</FilaValor>
          {c.umbralesNorma.map((u) => <FilaValor key={u.tipoBien} etiqueta={u.nombre}>{usd(u.umbralUsd)}</FilaValor>)}
          {c.umbralInterno && <FilaValor etiqueta="Umbral interno">{usd(c.umbralInterno.montoUsd)}</FilaValor>}
          {c.umbralesNorma.length === 0 && <p className="text-sm leading-[21px] text-muted">Este sector todavía no tiene umbrales cargados en PLAFT.</p>}
        </div>
      )}
      <div>
        <Link href="/operaciones/configuracion" className={`btn btn-secondary ${BTN_B}`}>
          <IconoAjustes className="h-4 w-4 shrink-0" aria-hidden="true" />
          {configurado ? 'Cambiar sector o umbral' : 'Configurar sector'}
        </Link>
      </div>
    </Tarjeta>
  );
}

/** RO 0 · Todavía no hay registros. La columna de la derecha mide 460 px en el diseño (1920 px) y se encoge hasta 340 px en pantallas chicas. */
function SinRegistros() {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(21.25rem,24vw,28.75rem)]">
      <div className="flex min-w-0 flex-col gap-5">
        <section className="card flex flex-col items-center gap-[14px] px-6 py-10 text-center sm:px-12">
          <span className="flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-brand-soft text-brand" aria-hidden="true"><IconoRecibo className="h-8 w-8" /></span>
          <h2 className="max-w-[560px] text-[26px] font-bold leading-[normal] tracking-normal text-ink">Aún no hay operaciones registradas</h2>
          <p className="max-w-[560px] text-base leading-6 text-muted">
            Cuando registres la primera operación aparecerá aquí, con su responsable, su PDF y su historial de cambios. Recuerda registrarla el mismo día en que ocurre.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link href="/operaciones/nueva" className={`btn btn-primary ${BTN_P}`}><IconoMas className="h-4 w-4" aria-hidden="true" /> Nueva operación</Link>
            <Link href="/operaciones/configuracion" className={`btn btn-secondary ${BTN_B}`}><IconoInfo className="h-4 w-4 shrink-0" aria-hidden="true" /> Cómo se define el umbral</Link>
          </div>
          <div className="h-px w-full bg-line" aria-hidden="true" />
          <p className="font-mono text-xs leading-[normal] text-muted">Qué se guarda en cada registro</p>
          <ul className="flex w-full flex-wrap justify-center gap-2">
            {QUE_SE_GUARDA.map((t) => <li key={t} className="badge badge-neutral !leading-[normal]">{t}</li>)}
          </ul>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icono: IconoReloj, titulo: 'El mismo día', texto: 'Cada operación se registra el día en que ocurre, de forma cronológica.' },
            { icono: IconoCandado, titulo: 'Confidencial', texto: 'Solo ven el registro los usuarios autorizados; todo acceso queda anotado.' },
            { icono: IconoHistorial, titulo: '5 años', texto: 'Se conserva desde la fecha de la operación, con copia de seguridad.' },
          ].map(({ icono: Icono, titulo, texto }) => (
            <section key={titulo} className="card flex flex-col gap-[10px] p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand" aria-hidden="true"><Icono className="h-5 w-5" /></span>
              <h3 className="text-base font-semibold leading-[normal] tracking-normal text-ink">{titulo}</h3>
              <p className="text-sm leading-[normal] text-muted">{texto}</p>
            </section>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <UmbralDeTuSector />
        <Tarjeta espacio="gap-3" titulo="Reglas del registro">
          <ul className="flex flex-col gap-3">
            {REGLAS.map((r) => (
              <li key={r} className="flex items-center gap-2.5 text-[15px] font-medium leading-[normal] text-ink">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden="true"><IconoVisto className="h-3 w-3" /></span>
                {r}
              </li>
            ))}
          </ul>
          <p className="font-mono text-[11px] leading-[normal] tracking-[0.04em] text-muted">Res. SBS 789-2018 · art. 22 y 31</p>
        </Tarjeta>
      </div>
    </div>
  );
}

/** Registro de operaciones (RO 0, RO 1, RO 11 y RO 8 desde la lista). Todo se filtra en el servidor. */
export function OperacionesLista() {
  const [catalogos, setCatalogos] = useState<CatalogosOperacion | null>(null);
  const [indicadores, setIndicadores] = useState<Indicadores | null>(null);
  const [filtros, setFiltros] = useState<FiltrosLista>(SIN_FILTROS);
  const [texto, setTexto] = useState('');
  const [consultaQ, setConsultaQ] = useState('');
  const [pagina, setPagina] = useState(0);
  const [version, setVersion] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; datos: PaginaOperaciones | null; error: string | null } | null>(null);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[] | null>(null);
  const [cambiando, setCambiando] = useState<OperacionItem | null>(null);
  const [aviso, setAviso] = useAvisoPendiente();
  const seccionRef = useRef<HTMLElement>(null);

  const clave = JSON.stringify([filtros, consultaQ, pagina, version]);
  const cargando = respuesta?.clave !== clave;
  const datos = respuesta?.datos ?? null;
  const error = respuesta && respuesta.clave === clave ? respuesta.error : null;

  const { abrir: abrirPdf, elemento: elementoPdf } = usePdfOperacion(useCallback((t: string) => setAviso({ tipo: 'error', texto: t }), [setAviso]));

  // Catálogos (opciones de los filtros) e indicadores: apoyos; si fallan, la tabla sigue funcionando.
  useEffect(() => {
    let vigente = true;
    operacionesService.catalogos().then((c) => { if (vigente) setCatalogos(c); }).catch(() => { /* sin catálogos solo se apaga el panel de filtros */ });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    operacionesService.indicadores().then((i) => { if (vigente) setIndicadores(i); }).catch(() => { /* las cifras son un apoyo */ });
    return () => { vigente = false; };
  }, [version]);

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
    const pedida = JSON.stringify([filtros, consultaQ, pagina, version]);
    const f: FiltrosOperaciones = {
      q: consultaQ,
      estado: filtros.estado,
      desde: filtros.desde,
      hasta: filtros.hasta,
      tipoOperacion: filtros.tipoOperacion,
      moneda: filtros.moneda,
      responsableId: filtros.responsableId ? Number(filtros.responsableId) : undefined,
      sinResponsable: filtros.sinResponsable,
      oficina: filtros.oficina.trim() || undefined,
      montoMinUsd: montoANumero(filtros.montoMin) ?? undefined,
      montoMaxUsd: montoANumero(filtros.montoMax) ?? undefined,
    };
    operacionesService
      .resumen(f, pagina)
      .then((d) => { if (vigente) setRespuesta({ clave: pedida, datos: d, error: null }); })
      .catch((err: unknown) => { if (vigente) setRespuesta((anterior) => ({ clave: pedida, datos: anterior?.datos ?? null, error: mensajeDe(err, 'No se pudo cargar la lista de registros.') })); });
    return () => { vigente = false; };
  }, [filtros, consultaQ, pagina, version]);

  const abrirPanel = () => {
    setPanelAbierto(true);
    if (usuarios === null) operacionesService.usuariosActivos().then(setUsuarios).catch(() => setUsuarios([]));
  };

  const cambiarPestana = (pestana: Pestana) => {
    setFiltros((f) => ({ ...f, estado: pestana === '' || pestana === 'VARIOS' ? [] : [pestana] }));
    setPagina(0);
  };

  const cambiarPagina = (nueva: number) => {
    setPagina(nueva);
    seccionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const hayFiltros = cuantosFiltros(filtros) > 0 || consultaQ !== '';
  const total = datos?.totalElements ?? 0;
  const sinRegistros = datos !== null && !error && !cargando && total === 0 && !hayFiltros;
  const desde = total === 0 ? 0 : (datos?.currentPage ?? 0) * (datos?.size ?? TAMANO_PAGINA) + 1;
  const hasta = datos ? Math.min(total, desde + datos.content.length - 1) : 0;
  const filtrosPuestos = cuantosFiltros(filtros);

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Cumplimiento · UIF-Perú"
        titulo="Registro de operaciones"
        descripcion={sinRegistros ? 'Bitácora confidencial de las operaciones de tu empresa. Se registra el mismo día, con respaldo y conservación por 5 años.' : 'Bitácora de las operaciones de tu empresa, con su responsable, su PDF y su estado de envío a la UIF.'}
        icono={IconoRecibo}
        sinLinea
        acciones={
          <div className="flex flex-wrap items-start gap-2.5">
            {sinRegistros ? (
              <Link href="/operaciones/configuracion" className={`btn btn-secondary ${BTN_B}`}><IconoAjustes className="h-4 w-4 shrink-0" aria-hidden="true" /> Configurar umbral</Link>
            ) : (
              <Link href="/operaciones/exportar" className={`btn btn-secondary ${BTN_B}`}><IconoSubir className="h-4 w-4 shrink-0" aria-hidden="true" /> Exportar a la UIF</Link>
            )}
            <Link href="/operaciones/nueva" className={`btn btn-primary ${BTN_P}`}><IconoMas className="h-4 w-4" aria-hidden="true" /> Nueva operación</Link>
          </div>
        }
      />

      {aviso && <Aviso aviso={aviso} onCerrar={() => setAviso(null)} className="mb-5" />}

      {sinRegistros ? (
        <SinRegistros />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Indicadores">
            {indicadores ? (
              <>
                <Indicador rotulo="Registros del mes" valor={String(indicadores.registrosDelPeriodo)} detalle={mesLargo(indicadores.periodo)} />
                <Indicador rotulo="Pendientes de envío" valor={String(indicadores.pendientesDeEnvio)} detalle="A la UIF-Perú" />
                <Indicador rotulo="Operaciones inusuales" valor={indicadores.inusualesEnAnalisis != null ? String(indicadores.inusualesEnAnalisis) : '—'} detalle={detalleInusuales(indicadores)} />
                <Indicador rotulo="Sin responsable" valor={String(indicadores.sinResponsable)} detalle="Asigna uno" />
              </>
            ) : (
              [0, 1, 2, 3].map((i) => <div key={i} className="card h-[130px] rounded-[22px] p-5"><div className="skeleton h-4 w-1/2" /><div className="skeleton mt-4 h-9 w-1/3" /></div>)
            )}
          </div>

          <section ref={seccionRef} className="card scroll-mt-4 overflow-hidden" aria-label="Registros">
            <div className="flex flex-wrap items-center gap-3.5 px-5 py-4">
              <div className="relative w-full lg:w-[420px]">
                <IconoLupa className="pointer-events-none absolute left-[15px] top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden="true" />
                <label htmlFor="ro-buscar" className="sr-only">Buscar por N.º, persona o documento</label>
                <input id="ro-buscar" type="search" className="input h-[46px] rounded-[10px] border-line bg-paper pl-[42px] text-[15px]" placeholder="Buscar por N.º, persona o documento" autoComplete="off" value={texto} onChange={(e) => setTexto(e.target.value)} />
              </div>
              <Segmentado ariaLabel="Filtrar por estado" valor={pestanaDe(filtros.estado)} opciones={PESTANAS} onCambiar={cambiarPestana} />
              <button type="button" onClick={abrirPanel} className={`btn btn-secondary ${BTN} sm:ml-auto`}>
                <IconoFiltro className="h-4 w-4" aria-hidden="true" /> Filtros
                {filtrosPuestos > 0 && <span className="badge badge-brand !px-2">{filtrosPuestos}</span>}
              </button>
            </div>

            {error && <div className="px-5 pb-4"><Aviso aviso={{ tipo: 'error', texto: error }} /></div>}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] border-collapse text-left">
                <thead>
                  <tr className="bg-paper">
                    {COLUMNAS.map((c, i) => (
                      <th key={c.titulo} scope="col" className={`${c.ancho} py-2.5 pr-2 text-left font-mono text-[11px] font-normal uppercase leading-[normal] tracking-[0.04em] text-muted ${i === 0 ? 'pl-6' : ''}`}>{c.titulo}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={cargando && datos ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                  {datos?.content.map((o) => (
                    <tr key={o.id} className="border-t border-line first:border-t-0">
                      <td className="py-3 pl-6 pr-2 font-mono text-xs leading-[normal] text-ink">{o.numeroRegistro ?? '—'}</td>
                      <td className="py-3 pr-2 text-sm font-medium leading-[normal] text-ink">{o.personaFisica ?? '—'}</td>
                      <td className={`py-3 pr-2 text-sm leading-[normal] ${o.personaNombre ? 'text-muted' : 'text-faint'}`}>{o.personaNombre || '—'}</td>
                      <td className="py-3 pr-2 text-sm leading-[normal] text-ink">{o.tipoOperacionNombre ?? o.tipoOperacion ?? '—'}</td>
                      <td className="py-3 pr-2 text-sm font-semibold leading-[normal] tabular-nums text-ink">{montoConMoneda(o)}</td>
                      <td className="py-3 pr-2 font-mono text-xs leading-[normal] text-muted">{fechaCorta(o.fechaOperacion ?? o.fecha) ?? '—'}</td>
                      <td className="py-3 pr-2"><InsigniaEstado estado={o.estado} /></td>
                      <td className="py-3 pr-2"><CeldaResponsable responsable={o.responsable} /></td>
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-1.5">
                          <AccionFila href={`/operaciones/${o.id}`} etiqueta={`Ver el detalle de ${o.numeroRegistro ?? 'este registro'}`}><IconoOjo className="h-[18px] w-[18px]" /></AccionFila>
                          <AccionFila onClick={() => abrirPdf(o.id, o.numeroRegistro ?? `operacion-${o.id}`)} etiqueta={`Ver el PDF de ${o.numeroRegistro ?? 'este registro'}`}><IconoDocumento className="h-[18px] w-[18px]" /></AccionFila>
                          <AccionFila onClick={() => setCambiando(o)} etiqueta={`Cambiar el responsable de ${o.numeroRegistro ?? 'este registro'}`}><IconoUsuario className="h-[18px] w-[18px]" /></AccionFila>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cargando && !datos && Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="border-t border-line"><td colSpan={COLUMNAS.length} className="px-6 py-3.5"><div className="skeleton h-5 w-full" /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            {datos && datos.content.length === 0 && !error && (
              <EstadoVacio
                icono={hayFiltros ? Search : AlertCircle}
                titulo="No hay registros con ese filtro"
                texto="Cambia la búsqueda o los filtros para ver otros registros."
                accion={<button type="button" onClick={() => { setFiltros(SIN_FILTROS); setTexto(''); }} className="btn btn-secondary">Quitar filtros</button>}
              />
            )}

            {datos && total > 0 && <PiePaginas desde={desde} hasta={hasta} total={total} pagina={pagina} totalPaginas={datos.totalPages} cargando={cargando} onCambiar={cambiarPagina} />}
          </section>
        </div>
      )}

      {panelAbierto && (
        <FiltrosCajon
          filtros={filtros}
          catalogos={catalogos}
          usuarios={usuarios}
          onAplicar={(nuevos) => { setFiltros(nuevos); setPagina(0); setPanelAbierto(false); }}
          onCerrar={() => setPanelAbierto(false)}
        />
      )}

      {cambiando && (
        <CambiarResponsableModal
          id={cambiando.id}
          numero={cambiando.numeroRegistro ?? `operacion-${cambiando.id}`}
          onCerrar={() => setCambiando(null)}
          onGuardado={(r) => {
            setAviso({ tipo: 'ok', texto: `${r.nombreCompleto} quedó como responsable de ${cambiando.numeroRegistro ?? 'el registro'}.` });
            setCambiando(null);
            setVersion((v) => v + 1);
          }}
        />
      )}

      {elementoPdf}
    </PageShell>
  );
}
