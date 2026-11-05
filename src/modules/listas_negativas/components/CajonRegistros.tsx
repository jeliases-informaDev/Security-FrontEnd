'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, ExternalLink, FileText, Flag, Info, Newspaper, X } from 'lucide-react';
import type { ConsultaResponse, FilaResultado, ItemRegistro } from '../services/listasNegativasService';
import { diaYMes, fechaCorta, haceAnios, iniciales, inicialesDeDominio, nombreTipoPersona, plural } from '../lib/formato';
import { PuntoEstado, estiloDe } from './piezas';

const CHIP_NEUTRO = 'badge badge-neutral';

/** Cargo e institución de un registro PEP, o la descripción de uno de otra lista. */
function textoDeRegistro(item: ItemRegistro): string {
  if (item.esPep) return [item.cargo, item.institucion].filter(Boolean).join(' — ') || item.lista;
  return item.descripcion || item.lista;
}

function RegistroFila({ item, mostrarLista }: { item: ItemRegistro; mostrarLista: boolean }) {
  const texto = textoDeRegistro(item);
  const fecha = fechaCorta(item.fechaRegistro);
  const hace = haceAnios(item.fechaRegistro);
  const periodo = item.sinPeriodo
    ? 'Sin período'
    : [item.periodoDesde, item.periodoHasta].filter(Boolean).join(' – ') || null;
  return (
    <li className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 pt-2">
      {item.esPep ? (
        <span className="badge badge-bad">PEP</span>
      ) : (
        mostrarLista && <span className={`${CHIP_NEUTRO} max-w-[14rem] truncate`}>{item.lista}</span>
      )}
      <p className="min-w-0 flex-1 basis-48 text-sm leading-[22px] text-ink">
        {item.link ? <a href={item.link} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-brand">{texto}</a> : texto}
      </p>
      {fecha && <span className="rotulo shrink-0 !text-[11px]">{fecha}</span>}
      {hace && <span className={CHIP_NEUTRO}>{hace}</span>}
      {item.esPep && periodo && <span className={CHIP_NEUTRO}>{periodo}</span>}
    </li>
  );
}

function GrupoRegistros({ fila }: { fila: FilaResultado }) {
  const act = diaYMes(fila.actualizada);
  return (
    <section className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <PuntoEstado estado="COINCIDENCIA" tamano="h-2 w-2" />
        <h4 className="min-w-0 flex-1 text-[15px] font-medium leading-[22px] text-ink">{fila.nombre}</h4>
        <span className="badge badge-bad">{fila.etiquetaConteo}</span>
        {act && <span className="rotulo">act. {act}</span>}
      </div>
      <ul className="flex flex-col">
        {fila.items.map((item) => <RegistroFila key={item.id} item={item} mostrarLista={fila.otraLista || fila.items.some((o) => o.lista !== item.lista)} />)}
      </ul>
      {fila.avisos.map((aviso) => (
        <p key={aviso} className="flex items-start gap-2 rounded-[10px] bg-paper p-3 text-[13px] leading-[22px] text-ink">
          <AlertTriangle className="mt-[3px] h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
          <span className="min-w-0 flex-1">{aviso}</span>
        </p>
      ))}
    </section>
  );
}

function Noticia({ item }: { item: ItemRegistro }) {
  const fecha = fechaCorta(item.fechaRegistro);
  const titular = item.descripcion || item.lista;
  return (
    <article className="flex flex-col gap-2.5 rounded-[14px] border border-line bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent" aria-hidden="true">{inicialesDeDominio(item.dominio)}</span>
        <p className="min-w-0 flex-1 truncate text-[15px] font-medium leading-[22px] text-ink">{item.dominio ?? item.lista}</p>
        {fecha && <span className="rotulo shrink-0">{fecha}</span>}
      </div>
      {item.link ? (
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[15px] font-medium leading-[22px] text-accent underline underline-offset-2">{titular}</a>
      ) : (
        <p className="text-[15px] font-medium leading-[22px] text-ink">{titular}</p>
      )}
      {item.link && (
        <div className="flex items-center gap-2">
          <p className="rotulo min-w-0 flex-1 truncate">{item.dominio ? `Fuente: ${item.dominio}` : ''}</p>
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold leading-5 text-accent">
            Abrir noticia <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
    </article>
  );
}

/** Rótulo por tipo de coincidencia del «Por qué coincide» (los códigos los define el backend). */
const ETIQUETA_COINCIDENCIA: Record<string, { texto: string; clase: string }> = {
  EXACTA_DOCUMENTO: { texto: 'Exacta', clase: 'badge-ok' },
  POR_NOMBRE: { texto: 'Por nombre', clase: 'badge-warn' },
  SIN_RESULTADOS: { texto: 'Sin resultados', clase: 'badge-neutral' },
};

interface Props {
  consulta: ConsultaResponse;
  onCerrar: () => void;
}

/** Cajón lateral (se monta solo después de un clic, así que `document` ya existe) «Registros y noticias» de la coincidencia: por qué coincide, registros por lista y noticias. */
export function CajonRegistros({ consulta, onCerrar }: Props) {
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alPresionar);
    cerrarRef.current?.focus();
    return () => document.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  const r = consulta.resultado;
  const c = consulta.consultado;
  const nombre = c?.nombre ?? consulta.criterio.texto;
  const tipoPersona = nombreTipoPersona(c?.tipoPersona);
  const linea = [c?.documento ? `${c.tipoDocumento ?? 'Doc.'} ${c.documento}` : null, tipoPersona].filter(Boolean).join(' · ');
  const estilo = estiloDe(r.clasificacion);
  const coincidencias = r.filas.filter((f) => f.estado === 'COINCIDENCIA');
  const grupos = coincidencias.filter((f) => f.tipoConteo !== 'NOTICIAS');
  const noticias = coincidencias.filter((f) => f.tipoConteo === 'NOTICIAS').flatMap((f) => f.items);
  const etiqueta = ETIQUETA_COINCIDENCIA[consulta.porQueCoincide.tipo];

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/55 p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-cajon-registros"
        className="flex h-full w-full max-w-[920px] flex-col gap-[18px] overflow-y-auto bg-white p-5 shadow-lg sm:rounded-3xl sm:p-7"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent" aria-hidden="true">{iniciales(nombre)}</span>
          <div className="min-w-0 flex-1">
            <h2 id="titulo-cajon-registros" className="truncate text-[17px] font-semibold leading-[25.5px] tracking-[-0.01em] text-ink">{nombre}</h2>
            {linea && <p className="rotulo truncate">{linea}</p>}
          </div>
          <button ref={cerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white transition-colors hover:bg-paper">
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="badge badge-neutral gap-1.5"><FileText className="h-3 w-3" aria-hidden="true" />{plural(r.registrosEnListas, 'registro', 'registros')} en listas</span>
          <span className="badge badge-neutral gap-1.5"><Newspaper className="h-3 w-3" aria-hidden="true" />{plural(r.noticiasEnMedios, 'noticia', 'noticias')} en medios</span>
          {(c?.esPep ?? r.esPep) && <span className="badge badge-bad gap-1.5"><Flag className="h-3 w-3" aria-hidden="true" />PEP</span>}
          <span className={`badge ${estilo.chip}`}>{r.clasificacionNombre} · {r.porcentaje}%</span>
        </div>

        <div className="h-px w-full bg-line" />

        <p className="eyebrow">Por qué coincide</p>
        <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-paper p-3.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok" aria-hidden="true"><Check className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1 basis-56">
            <p className="text-[15px] font-medium leading-[22px] text-ink">{consulta.porQueCoincide.titulo}</p>
            {consulta.porQueCoincide.detalle && <p className="text-[13px] leading-[22px] text-muted">{consulta.porQueCoincide.detalle}</p>}
          </div>
          {etiqueta && <span className={`badge ${etiqueta.clase}`}>{etiqueta.texto}</span>}
        </div>
        {consulta.porQueCoincide.advertencia && (
          <p className="flex items-start gap-2.5 rounded-xl bg-media-aviso p-3.5 text-[13px] leading-[22px] text-ink">
            <AlertTriangle className="mt-[3px] h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
            <span className="min-w-0 flex-1">{consulta.porQueCoincide.advertencia}</span>
          </p>
        )}

        {grupos.length > 0 && (
          <>
            <p className="eyebrow">Registros en listas · {r.registrosEnListas}</p>
            {grupos.map((fila) => <GrupoRegistros key={fila.codigo + fila.nombre} fila={fila} />)}
          </>
        )}

        {noticias.length > 0 && (
          <>
            <p className="eyebrow">Noticias en medios · {r.noticiasEnMedios}</p>
            {noticias.map((item) => <Noticia key={item.id} item={item} />)}
            {consulta.pieNoticias && (
              <p className="flex items-start gap-2.5 rounded-xl bg-accent-soft p-3.5 text-[13px] leading-[22px] text-ink">
                <Info className="mt-[3px] h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span className="min-w-0 flex-1">{consulta.pieNoticias}</span>
              </p>
            )}
          </>
        )}

        {grupos.length === 0 && noticias.length === 0 && (
          <p className="rounded-[14px] bg-paper p-4 text-sm text-muted">Esta consulta no tiene registros ni noticias.</p>
        )}
      </aside>
    </div>,
    document.body,
  );
}
