'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, Check, Clock, FileText, Flag, Search, ShieldCheck, X } from 'lucide-react';
import { Aviso, Boton, Etiqueta } from '@/shared/ui/kit';
import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import type { CatalogoListas, ConsultaResponse, FilaResultado } from '../services/listasNegativasService';
import { listasNegativasService } from '../services/listasNegativasService';
import { cuando, fechaCorta, iniciales, nombreTipoPersona, plural } from '../lib/formato';
import { AnilloCoincidencia, ChipClasificacion, Eyebrow, estiloDe } from './piezas';
import { CajonRegistros } from './CajonRegistros';
import { HomonimoModal } from './HomonimoModal';

// Los botones del resultado miden 46 px de alto con texto de 15 px, como en el diseño.
const BTN = 'h-[46px] text-[15px]';

const CHIP_FUENTE = {
  COINCIDENCIA: { chip: 'bg-bad-soft text-bad', punto: 'bg-bad-solid' },
  SIN_COINCIDENCIAS: { chip: 'border border-line bg-white text-ink', punto: 'bg-ok' },
  PRONTO: { chip: 'border border-line bg-white text-muted', punto: 'bg-faint' },
} as const;

/** Tarjeta «Aún no hay una consulta» con las fuentes que se consultarán (LN 0). */
export function ResultadoInicial({ catalogo }: { catalogo: CatalogoListas | null }) {
  return (
    <section className="card flex flex-col gap-5 p-6" aria-label="Resultado de la consulta">
      <div className="flex flex-col items-center gap-3 pb-7 pt-9 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-brand-soft text-ink" aria-hidden="true"><Search className="h-7 w-7" /></span>
        <p className="text-[22px] font-bold leading-snug text-ink">Aún no hay una consulta</p>
        <p className="max-w-[520px] text-[15px] leading-[22px] text-muted">Escribe el nombre o el documento de la persona y PLAFT revisará PEP, SUNAT, sanciones, listas de LA/FT y noticias en una sola búsqueda.</p>
      </div>
      <div className="h-px w-full bg-line" />
      <Eyebrow>Fuentes que se consultarán</Eyebrow>
      <ul className="flex flex-wrap gap-2.5">
        {(catalogo?.fuentes ?? []).map((f) => (
          <li key={f.codigo} className={`inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-[7px] text-[13px] font-semibold leading-5 ${f.estado === 'PRONTO' ? 'text-muted' : 'text-ink'}`}>
            <span className="h-[7px] w-[7px] rounded-full bg-faint" aria-hidden="true" />
            {f.nombre}
            {f.estado === 'PRONTO' && <span className="rotulo !text-[10px]">Pronto</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Tarjeta de carga mientras se consulta o se abre una consulta. */
export function ResultadoCargando({ texto }: { texto: string }) {
  return (
    <section className="card flex flex-col gap-5 p-6" aria-busy="true" aria-label={texto}>
      <div className="flex items-center gap-4">
        <span className="skeleton h-12 w-12 shrink-0 rounded-full" />
        <span className="flex-1 space-y-2"><span className="skeleton block h-4 w-2/5" /><span className="skeleton block h-3 w-1/4" /></span>
      </div>
      <div className="h-px w-full bg-line" />
      <div className="flex items-center gap-12 px-6">
        <span className="skeleton h-[176px] w-[176px] shrink-0 rounded-full" />
        <span className="flex-1 space-y-3"><span className="skeleton block h-8 w-1/2 rounded-full" /><span className="skeleton block h-5 w-2/3" /><span className="skeleton block h-3 w-3/4" /></span>
      </div>
      <p role="status" className="text-center text-sm text-muted">{texto}</p>
    </section>
  );
}

function descargarArchivo(blob: Blob, nombre: string) {
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.setAttribute('download', nombre);
  document.body.appendChild(enlace);
  enlace.click();
  enlace.parentNode?.removeChild(enlace);
  window.URL.revokeObjectURL(url);
}

interface Props {
  consulta: ConsultaResponse;
  /** Si la consulta salió de una lista de candidatos: vuelve a ella. */
  onVolverACandidatos?: () => void;
  onActualizada: (consulta: ConsultaResponse) => void;
}

/** Resultado de una consulta (LN 1, LN 2 y LN 4): persona, anillo, clasificación, fuentes, aviso y acciones. */
export function ResultadoConsulta({ consulta, onVolverACandidatos, onActualizada }: Props) {
  const router = useRouter();
  const [cajon, setCajon] = useState(false);
  const [homonimo, setHomonimo] = useState<'marcar' | 'deshacer' | null>(null);
  const [descargando, setDescargando] = useState(false);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);

  const r = consulta.resultado;
  const c = consulta.consultado;
  const a = consulta.acciones;
  const estilo = estiloDe(r.clasificacion);
  const descartada = consulta.estado === 'DESCARTADA_HOMONIMO';
  const nombre = c?.nombre ?? consulta.criterio.texto;
  const lineaPersona = [
    c?.documento ? `${c.tipoDocumento ?? 'Doc.'} ${c.documento}` : null,
    nombreTipoPersona(c?.tipoPersona),
    `Consulta como ${consulta.tipoConsultaNombre.toLowerCase()}`,
  ].filter(Boolean).join(' · ');
  const filaSunat: FilaResultado | undefined = r.filas.find((f) => f.fuente === 'SUNAT');
  const lineaAviso = [r.aviso.titulo, r.aviso.fuentes.length > 0 ? r.aviso.fuentes.join(' · ') : null];
  const detalleAviso = [r.aviso.suma, r.aviso.texto].filter(Boolean).join(' ');

  const descargarPdf = async () => {
    setErrorPdf(null);
    setDescargando(true);
    try {
      descargarArchivo(await listasNegativasService.descargarPdf(consulta.id), `listas-negativas-consulta-${consulta.id}.pdf`);
    } catch (err) {
      // Con 402 el aviso global de tokens agotados ya sale: no se repite aquí.
      setErrorPdf(mensajeDeFalla(err, 'No se pudo generar el reporte en PDF. Inténtalo de nuevo en un momento.'));
    } finally {
      setDescargando(false);
    }
  };

  const continuarAlScoring = () => {
    const s = consulta.scoring;
    const params = new URLSearchParams();
    if (s.documento) params.set('documento', s.documento);
    if (s.documento && s.tipoDocumento) params.set('tipoDocumento', s.tipoDocumento);
    if (s.documento && s.clienteNuevo && s.nombre) params.set('nombre', s.nombre);
    const texto = params.toString();
    router.push(texto ? `/scoring?${texto}` : '/scoring');
  };

  const IconoAviso = r.clasificacion === 'CRITICA' ? AlertTriangle : r.clasificacion === 'SIN_COINCIDENCIAS' ? ShieldCheck : Flag;
  const colorIconoAviso = r.clasificacion === 'CRITICA' ? 'text-critica' : r.clasificacion === 'SIN_COINCIDENCIAS' ? 'text-ok' : 'text-warn';

  return (
    <section className="card aparece flex flex-col gap-5 p-6" aria-label="Resultado de la consulta">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent" aria-hidden="true">{iniciales(nombre)}</span>
        <div className="min-w-0 flex-1 basis-56">
          <h2 className="break-words text-[17px] font-semibold leading-[25.5px] tracking-[-0.01em] text-ink">{nombre}</h2>
          <p className="rotulo">{lineaPersona}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(c?.esPep ?? r.esPep) && <span className="badge badge-bad gap-1.5"><Flag className="h-3 w-3" aria-hidden="true" />PEP</span>}
          <span className="badge badge-neutral gap-1.5"><Clock className="h-3 w-3" aria-hidden="true" />{cuando(consulta.fecha)}</span>
        </div>
      </div>

      {onVolverACandidatos && (
        <button type="button" onClick={onVolverACandidatos} className="-mt-2 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a los candidatos
        </button>
      )}

      {descartada && (
        <div className="rounded-[14px] bg-paper p-4 text-sm">
          <p className="font-semibold text-ink">{consulta.estadoNombre}</p>
          {consulta.homonimo && (
            <p className="mt-0.5 text-muted">
              {consulta.homonimo.comentario ? `«${consulta.homonimo.comentario}» · ` : ''}
              {consulta.homonimo.usuario.nombre}, {cuando(consulta.homonimo.fecha)}
            </p>
          )}
        </div>
      )}

      <div className="h-px w-full bg-line" />

      {/* Anillo y clasificación */}
      <div className="flex flex-wrap items-center gap-x-12 gap-y-6 sm:px-6">
        <AnilloCoincidencia porcentaje={r.porcentaje} />
        <div className="flex min-w-0 flex-col items-start gap-2.5">
          <Eyebrow>Clasificación</Eyebrow>
          <ChipClasificacion clasificacion={r.clasificacion} nombre={r.clasificacionNombre} />
          <p className="flex items-end gap-2">
            <span className="text-[28px] font-semibold leading-[31px] tracking-[-0.015em] text-ink">{r.listasConCoincidencia}</span>
            <span className="text-[15px] leading-[22px] text-muted">de {r.listasConsultadas} listas con coincidencia</span>
          </p>
          <p className="rotulo">{plural(r.registrosEnListas, 'registro', 'registros')} en listas · {plural(r.noticiasEnMedios, 'noticia', 'noticias')} en medios</p>
        </div>
      </div>

      {/* SUNAT: todavía sin fuente de datos */}
      {filaSunat && (
        <div className="flex flex-col gap-3 rounded-[14px] bg-paper p-4 opacity-80">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-ink" aria-hidden="true"><Building2 className="h-4 w-4" /></span>
            <p className="min-w-0 flex-1 text-[15px] font-medium leading-[22px] text-ink">Datos según SUNAT</p>
            <Etiqueta>Pronto</Etiqueta>
          </div>
          {filaSunat.motivo && <p className="text-[13px] leading-[22px] text-muted">{filaSunat.motivo}</p>}
        </div>
      )}

      {/* Fuentes consultadas */}
      <Eyebrow>Fuentes consultadas</Eyebrow>
      <ul className="flex flex-wrap gap-2.5">
        {r.fuentes.map((f) => {
          const e = CHIP_FUENTE[f.estado] ?? CHIP_FUENTE.PRONTO;
          return (
            <li key={f.codigo} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-[7px] text-[13px] font-semibold leading-5 ${e.chip}`}>
              <span className={`h-[7px] w-[7px] rounded-full ${e.punto}`} aria-hidden="true" />
              {f.nombre}
            </li>
          );
        })}
      </ul>

      {/* Aviso según la clasificación */}
      <div role="status" className={`flex items-center gap-3 rounded-[14px] p-4 ${estilo.aviso}`}>
        <IconoAviso className={`h-5 w-5 shrink-0 ${colorIconoAviso}`} aria-hidden="true" />
        <div className="min-w-0 flex-1 text-[15px] leading-[22px]">
          <p>
            <span className={`font-medium ${estilo.titulo}`}>{lineaAviso[0]}</span>
            {lineaAviso[1] && <span className="text-ink"> {lineaAviso[1]}</span>}
          </p>
          {detalleAviso && <p className="text-[13px] text-muted">{detalleAviso}</p>}
        </div>
      </div>

      {errorPdf && <Aviso aviso={{ tipo: 'error', texto: errorPdf }} onCerrar={() => setErrorPdf(null)} />}

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          {a.verRegistros && <Boton variante="secundario" icono={FileText} className={BTN} onClick={() => setCajon(true)}>Ver registros y noticias</Boton>}
          {a.reportePdf && <Boton variante="secundario" icono={FileText} className={BTN} cargando={descargando} onClick={descargarPdf}>{descargando ? 'Generando…' : 'Reporte PDF'}</Boton>}
        </div>
        <div className="flex flex-wrap gap-3">
          {a.marcarHomonimo && <Boton variante="secundario" icono={X} className={BTN} onClick={() => setHomonimo('marcar')}>Es homónimo</Boton>}
          {a.deshacerHomonimo && <Boton variante="secundario" className={BTN} onClick={() => setHomonimo('deshacer')}>Deshacer homónimo</Boton>}
          {a.continuarScoring && (
            <Boton className={BTN} onClick={continuarAlScoring}>
              {r.clasificacion === 'MEDIA' ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              Continuar al scoring
              {r.clasificacion === 'MEDIA' ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
            </Boton>
          )}
        </div>
      </div>
      {consulta.estado === 'VIGENTE' && consulta.decisiones.length > 0 && (
        <p className="-mt-2 text-[13px] text-muted">Última decisión: {consulta.decisiones[consulta.decisiones.length - 1].usuario.nombre}, {fechaCorta(consulta.decisiones[consulta.decisiones.length - 1].fecha)}.</p>
      )}

      {cajon && <CajonRegistros consulta={consulta} onCerrar={() => setCajon(false)} />}
      {homonimo && (
        <HomonimoModal
          consulta={consulta}
          modo={homonimo}
          onCerrar={() => setHomonimo(null)}
          onListo={(actualizada) => { setHomonimo(null); onActualizada(actualizada); }}
        />
      )}
    </section>
  );
}
