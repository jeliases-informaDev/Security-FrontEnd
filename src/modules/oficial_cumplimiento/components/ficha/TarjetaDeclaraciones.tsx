'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { Download, Eye, FileText, Loader2 } from 'lucide-react';
import { Etiqueta } from '@/shared/ui/kit';
import { useCarga } from '../../hooks/useCarga';
import { fechaCorta } from '../../lib/formato';
import { oficialService, type DeclaracionFicha, type FichaOficial } from '../../services/oficialService';
import { BotonDescargar, useDescarga } from '../ArchivoDescargable';
import { EsqueletoHoja, HojaDeclaracionVista } from '../HojaDeclaracionVista';
import { BTN, Tarjeta } from '../piezas';
import { Ventana } from '../Ventana';

type Cual = 'requisitos' | 'designante';

/** Cómo quedó firmada una declaración (lo que manda el servidor: fecha escrita y/o archivo firmado). Los roles de solo lectura no reciben el archivo. */
function textoFirma(d: DeclaracionFicha): string {
  const fecha = d.fechaFirma ? fechaCorta(d.fechaFirma) : '';
  if (fecha && d.adjunto) return `Firmada el ${fecha} · con el archivo firmado`;
  if (fecha) return `Firmada el ${fecha}`;
  if (d.adjunto) return 'Firmada (archivo adjunto)';
  return d.completa ? 'Firmada' : 'Sin firma';
}

function FilaDeclaracion({ titulo, declaracion, alVer }: { titulo: string; declaracion: DeclaracionFicha; alVer: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 rounded-xl border border-line bg-paper px-3.5 py-3">
      <FileText className="h-[18px] w-[18px] shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-[15px] font-semibold leading-5 text-ink">{titulo}</p>
        <p className="font-mono text-[11px] tracking-[0.02em] text-muted">{textoFirma(declaracion)}</p>
      </div>
      <Etiqueta tono={declaracion.vigente ? 'ok' : 'neutral'}>{declaracion.vigente ? 'Vigente' : 'Sin vigencia'}</Etiqueta>
      <button type="button" onClick={alVer} className="btn btn-secondary btn-sm">
        <Eye className="h-4 w-4" aria-hidden="true" /> Ver<span className="sr-only"> {titulo.toLowerCase()}</span>
      </button>
    </div>
  );
}

/** Error al abrir una declaración (por ejemplo, un rol que no puede verla), con «Reintentar». */
function ErrorDeVentana({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-[680px] flex-col items-center gap-3 rounded-2xl border border-bad/20 bg-bad-soft px-6 py-8 text-center">
      <p className="text-[15px] font-medium text-bad">{mensaje}</p>
      <button type="button" onClick={onReintentar} className="btn btn-secondary">Reintentar</button>
    </div>
  );
}

/** «Ver» la declaración jurada de requisitos tal como quedó guardada (la hoja la arma el servidor con los datos de la designación). */
function VentanaRequisitos({ designacionId, onCerrar }: { designacionId: string; onCerrar: () => void }) {
  const leer = useCallback(() => oficialService.declaracionRequisitos(designacionId), [designacionId]);
  const { datos: hoja, error, cargando, recargar } = useCarga(leer, 'No se pudo abrir la declaración jurada.');
  const pdf = useDescarga(() => oficialService.declaracionRequisitosPdf(designacionId), 'No se pudo descargar el PDF. Inténtalo de nuevo.');

  return (
    <Ventana
      titulo="Declaración jurada"
      rotulo="Requisitos del oficial"
      onCerrar={onCerrar}
      pie={
        <>
          {hoja?.adjunto && <BotonDescargar adjunto={hoja.adjunto} className={`btn btn-secondary ${BTN}`}>Descargar la firmada</BotonDescargar>}
          {hoja && (
            <button type="button" onClick={() => void pdf.bajar()} disabled={pdf.bajando} className={`btn btn-secondary ${BTN}`}>
              {pdf.bajando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              Descargar PDF
            </button>
          )}
          <button type="button" onClick={onCerrar} className={`btn btn-secondary ${BTN}`}>Cerrar</button>
        </>
      }
    >
      {hoja ? (
        <>
          <HojaDeclaracionVista hoja={hoja} />
          {hoja.firmada && hoja.fechaFirma && <p className="mt-3 text-center text-sm text-muted">Firmada el {fechaCorta(hoja.fechaFirma)}.</p>}
          {pdf.falla && <p role="alert" className="error-text mt-3 text-center">{pdf.falla}</p>}
        </>
      ) : error ? (
        <ErrorDeVentana mensaje={error} onReintentar={recargar} />
      ) : cargando ? (
        <EsqueletoHoja />
      ) : null}
    </Ventana>
  );
}

function Linea({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="rotulo">{rotulo}</p>
      <p className="mt-0.5 break-words text-[13px] leading-5 text-ink">{children}</p>
    </div>
  );
}

/** «Ver» la declaración jurada de quién designó. Su PDF todavía no existe (queda «Pronto» en el contrato), así que solo se lee y se baja el archivo firmado. */
function VentanaDesignante({ designacionId, onCerrar }: { designacionId: string; onCerrar: () => void }) {
  const leer = useCallback(() => oficialService.declaracionDesignante(designacionId), [designacionId]);
  const { datos: d, error, cargando, recargar } = useCarga(leer, 'No se pudo abrir la declaración jurada.');

  return (
    <Ventana
      titulo="Declaración jurada"
      rotulo="De quién designó"
      onCerrar={onCerrar}
      pie={
        <>
          {d?.adjunto && <BotonDescargar adjunto={d.adjunto} className={`btn btn-secondary ${BTN}`}>Descargar la firmada</BotonDescargar>}
          <button type="button" onClick={onCerrar} className={`btn btn-secondary ${BTN}`}>Cerrar</button>
        </>
      }
    >
      {d ? (
        <article aria-label={d.titulo} className="mx-auto flex w-full max-w-[680px] flex-col gap-3.5 border border-ink/[0.14] bg-white px-6 pb-9 pt-10 sm:px-11">
          <h3 className="text-center text-[15px] font-bold leading-[21px] text-ink">{d.titulo}</h3>
          <Linea rotulo="Designa">{d.organo} · {d.designaNombre}</Linea>
          <Linea rotulo="Documento que lo acredita">{d.documento}</Linea>
          <p className="text-[13px] leading-5 text-ink">{d.texto}</p>
          <div className="mt-4 flex w-[260px] max-w-full flex-col gap-1">
            <div className="h-px bg-ink/50" />
            <p className="break-words text-xs text-ink/70">
              {d.firmaNombre ?? 'Sin nombre escrito'}{d.fechaFirma ? ` · ${fechaCorta(d.fechaFirma)}` : ''}
            </p>
          </div>
        </article>
      ) : error ? (
        <ErrorDeVentana mensaje={error} onReintentar={recargar} />
      ) : cargando ? (
        <EsqueletoHoja />
      ) : null}
    </Ventana>
  );
}

/** Tarjeta «Declaraciones juradas» de la ficha: las dos declaraciones con su firma y vigencia, y «Ver» para leerlas. */
export function TarjetaDeclaraciones({ ficha }: { ficha: FichaOficial }) {
  const [abierta, setAbierta] = useState<Cual | null>(null);
  const { requisitos, designante } = ficha.declaraciones;

  return (
    <Tarjeta titulo="Declaraciones juradas" className="!gap-3">
      <FilaDeclaracion titulo="Declaración jurada de requisitos" declaracion={requisitos} alVer={() => setAbierta('requisitos')} />
      <FilaDeclaracion titulo="Declaración jurada de quién designó" declaracion={designante} alVer={() => setAbierta('designante')} />
      {abierta === 'requisitos' && <VentanaRequisitos designacionId={ficha.id} onCerrar={() => setAbierta(null)} />}
      {abierta === 'designante' && <VentanaDesignante designacionId={ficha.id} onCerrar={() => setAbierta(null)} />}
    </Tarjeta>
  );
}
