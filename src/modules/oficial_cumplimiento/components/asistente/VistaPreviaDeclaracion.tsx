'use client';

import { useCallback, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useCarga } from '../../hooks/useCarga';
import { textoDeFalla } from '../../lib/errores';
import { guardarArchivo } from '../../lib/formato';
import { oficialService, type DatosVistaPrevia } from '../../services/oficialService';
import { EsqueletoHoja, HojaDeclaracionVista } from '../HojaDeclaracionVista';
import { BTN } from '../piezas';
import { Ventana } from '../Ventana';

/**
 * Vista previa de la declaración jurada de requisitos (OC 5). La hoja la arma el servidor con los datos del asistente (no se guarda
 * nada); solo la ven los administradores y, si el rol no puede, se muestra el mensaje del servidor.
 * «Descargar PDF» no está en el diseño: se agrega porque la persona firma esa hoja impresa y la sube en el paso de firmas.
 */
export function VistaPreviaDeclaracion({ datos, onCerrar }: { datos: DatosVistaPrevia; onCerrar: () => void }) {
  const leer = useCallback(() => oficialService.vistaPrevia(datos), [datos]);
  const { datos: hoja, error, cargando, recargar } = useCarga(leer, 'No se pudo preparar la vista previa de la declaración.');
  const [descargando, setDescargando] = useState(false);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);

  const descargarPdf = async () => {
    setDescargando(true);
    setErrorPdf(null);
    try {
      const { archivo, nombre } = await oficialService.vistaPreviaPdf(datos);
      guardarArchivo(archivo, nombre);
    } catch (err) {
      setErrorPdf(textoDeFalla(err, 'No se pudo descargar el PDF. Inténtalo de nuevo.'));
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Ventana
      titulo="Declaración jurada"
      rotulo="Vista previa · requisitos del oficial"
      onCerrar={onCerrar}
      pie={
        <>
          {hoja && (
            <button type="button" onClick={() => void descargarPdf()} disabled={descargando} className={`btn btn-secondary ${BTN}`}>
              {descargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
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
          {errorPdf && <p role="alert" className="error-text mt-3 text-center">{errorPdf}</p>}
        </>
      ) : error ? (
        <div role="alert" className="mx-auto flex max-w-[680px] flex-col items-center gap-3 rounded-2xl border border-bad/20 bg-bad-soft px-6 py-8 text-center">
          <p className="text-[15px] font-medium text-bad">{error}</p>
          <button type="button" onClick={recargar} className="btn btn-secondary">Reintentar</button>
        </div>
      ) : cargando ? (
        <EsqueletoHoja />
      ) : null}
    </Ventana>
  );
}
