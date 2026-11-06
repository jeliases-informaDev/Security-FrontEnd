'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import { IconoDescargar, IconoHistorial, IconoVisto } from '@/shared/ui/iconos';
import { Modal } from '@/shared/ui/Modal';
import { Boton, Esqueleto } from '@/shared/ui/kit';
import { operacionesService, type ArchivoPdf } from '../services/operacionesService';
import { BTN, BTN_P } from './piezas';

interface Abierto {
  id: number;
  numero: string;
}

/** «4be1…c09a»: la huella completa son 64 caracteres. */
const huellaCorta = (huella: string) => (huella.length > 10 ? `${huella.slice(0, 4)}…${huella.slice(-4)}` : huella);

/**
 * Vista previa y descarga del PDF de un registro (RO 9 y RO 10).
 * El PDF se pide UNA sola vez al abrir (cada pedido cobra tokens): con ese mismo archivo se muestra y se descarga.
 * `onError` recibe el mensaje cuando el pedido falla (con 402 no se llama: el aviso global de tokens ya se abre solo).
 */
export function usePdfOperacion(onError: (texto: string) => void) {
  const [abierto, setAbierto] = useState<Abierto | null>(null);
  const [pdf, setPdf] = useState<{ datos: ArchivoPdf; url: string } | null>(null);
  const [descargado, setDescargado] = useState<Abierto | null>(null);
  const urlRef = useRef<string | null>(null);
  const pedido = useRef(0);

  const soltarUrl = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  useEffect(() => soltarUrl, [soltarUrl]);

  const cerrar = useCallback(() => {
    pedido.current += 1;
    soltarUrl();
    setAbierto(null);
    setPdf(null);
  }, [soltarUrl]);

  const abrir = useCallback(
    async (id: number, numero: string) => {
      const mio = ++pedido.current;
      soltarUrl();
      setPdf(null);
      setDescargado(null);
      setAbierto({ id, numero });
      try {
        const datos = await operacionesService.pdf(id);
        if (pedido.current !== mio) return;
        const blob = datos.archivo.type ? datos.archivo : new Blob([datos.archivo], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setPdf({ datos: { ...datos, archivo: blob }, url });
      } catch (err) {
        if (pedido.current !== mio) return;
        setAbierto(null);
        const texto = mensajeDeFalla(err, 'No se pudo generar el PDF de ese registro. Inténtalo de nuevo.');
        if (texto) onError(texto);
      }
    },
    [onError, soltarUrl],
  );

  const descargar = () => {
    if (!abierto || !pdf) return;
    const enlace = document.createElement('a');
    enlace.href = pdf.url;
    enlace.download = `${abierto.numero}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setDescargado(abierto);
  };

  // El aviso de «PDF descargado» se retira solo.
  useEffect(() => {
    if (!descargado) return undefined;
    const espera = setTimeout(() => setDescargado(null), 9000);
    return () => clearTimeout(espera);
  }, [descargado]);

  const elemento = (
    <>
      {abierto && (
        <Modal
          variante="suave"
          titulo="Vista previa del PDF"
          subtitulo={`${abierto.numero}${pdf ? ` · ${pdf.datos.paginas} ${pdf.datos.paginas === 1 ? 'página' : 'páginas'}` : ''}`}
          onCerrar={cerrar}
          tamano="lg"
          claseCuerpo="flex flex-col gap-3 overflow-y-auto bg-paper px-8 py-6"
          pie={
            <>
              <Boton variante="secundario" onClick={cerrar} className={BTN}>Cerrar</Boton>
              <Boton icono={IconoDescargar} onClick={descargar} disabled={!pdf} className={BTN_P}>Descargar PDF</Boton>
            </>
          }
        >
          {pdf ? (
            <div className="mx-auto flex w-full max-w-[640px] flex-col gap-3">
              <iframe src={pdf.url} title={`PDF del registro ${abierto.numero}`} className="block h-[min(582px,62vh)] w-full border border-line-strong bg-white" />
              {(pdf.datos.codigoVerificacion || pdf.datos.huella) && (
                <p className="break-all font-mono text-[11px] leading-5 text-muted">
                  {pdf.datos.codigoVerificacion && <>Código de verificación {pdf.datos.codigoVerificacion}</>}
                  {pdf.datos.codigoVerificacion && pdf.datos.huella && ' · '}
                  {pdf.datos.huella && <>SHA-256 {huellaCorta(pdf.datos.huella)}</>}
                </p>
              )}
              <p className="text-xs text-muted">Si tu navegador no muestra el archivo aquí, usa «Descargar PDF»: es el mismo archivo y no se vuelve a pedir.</p>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[640px] border border-line-strong bg-white p-6" role="status" aria-live="polite">
              <p className="mb-4 text-sm text-muted">Generando el PDF…</p>
              <Esqueleto lineas={6} />
            </div>
          )}
        </Modal>
      )}

      {descargado && (
        <div role="status" className="aparece fixed right-4 top-6 z-[70] flex w-[min(30rem,calc(100vw-2rem))] items-center gap-3 rounded-[14px] bg-ink px-4 py-[14px] shadow-[0_16px_36px_-12px_rgba(14,17,22,0.3)]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ok text-white" aria-hidden="true"><IconoVisto className="h-3.5 w-3.5" /></span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-[normal]">
            <p className="text-[15px] font-semibold text-paper">PDF descargado</p>
            <p className="text-[13px] text-paper/70">Se anotó la descarga en el historial.</p>
          </div>
          <Link href={`/operaciones/${descargado.id}/historial`} className="flex shrink-0 items-center gap-1.5 rounded-[9px] bg-white px-3.5 py-2 text-[13px] font-semibold leading-[normal] text-ink transition-colors hover:bg-paper focus-visible:outline-paper">
            <IconoHistorial className="h-3.5 w-3.5" aria-hidden="true" /> Ver historial
          </Link>
        </div>
      )}
    </>
  );

  return { abrir, elemento };
}
