'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, X } from 'lucide-react';
import { mensajeDeFalla } from '@/modules/licencias/lib/consumo';
import { Modal } from '@/shared/ui/Modal';
import { Boton, Esqueleto } from '@/shared/ui/kit';
import { operacionesService, type ArchivoPdf } from '../services/operacionesService';

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
          titulo="Vista previa del PDF"
          subtitulo={<span className="font-mono text-xs">{abierto.numero}{pdf ? ` · ${pdf.datos.paginas} ${pdf.datos.paginas === 1 ? 'página' : 'páginas'}` : ''}</span>}
          onCerrar={cerrar}
          tamano="lg"
          pie={
            <>
              <Boton variante="secundario" onClick={cerrar}>Cerrar</Boton>
              <Boton icono={Download} onClick={descargar} disabled={!pdf}>Descargar PDF</Boton>
            </>
          }
        >
          {pdf ? (
            <>
              <iframe src={pdf.url} title={`PDF del registro ${abierto.numero}`} className="h-[62vh] w-full rounded-xl border border-line bg-paper" />
              {(pdf.datos.codigoVerificacion || pdf.datos.huella) && (
                <p className="break-all font-mono text-[11px] leading-5 text-muted">
                  {pdf.datos.codigoVerificacion && <>Código de verificación {pdf.datos.codigoVerificacion}</>}
                  {pdf.datos.codigoVerificacion && pdf.datos.huella && ' · '}
                  {pdf.datos.huella && <>SHA-256 {huellaCorta(pdf.datos.huella)}</>}
                </p>
              )}
              <p className="text-xs text-muted">Si tu navegador no muestra el archivo aquí, usa «Descargar PDF»: es el mismo archivo y no se vuelve a pedir.</p>
            </>
          ) : (
            <div className="rounded-xl border border-line bg-paper p-6" role="status" aria-live="polite">
              <p className="mb-4 text-sm text-muted">Generando el PDF…</p>
              <Esqueleto lineas={6} />
            </div>
          )}
        </Modal>
      )}

      {descargado && (
        <div role="status" className="aparece fixed right-4 top-4 z-[70] flex w-[min(22rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl bg-noche p-4 text-paper shadow-lg">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">PDF descargado</p>
            <p className="mt-0.5 text-sm text-paper/70">Se anotó la descarga en el historial.</p>
            <Link href={`/operaciones/${descargado.id}/historial`} className="mt-2 inline-block text-sm font-semibold underline underline-offset-2">Ver historial</Link>
          </div>
          <button type="button" onClick={() => setDescargado(null)} aria-label="Cerrar el aviso" className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-paper/70 hover:bg-white/10 hover:text-paper">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );

  return { abrir, elemento };
}
