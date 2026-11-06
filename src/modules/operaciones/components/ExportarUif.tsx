'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoAlerta, IconoDescargar, IconoLapiz, IconoSubir, IconoVisto } from '@/shared/ui/iconos';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { Aviso, Boton, Esqueleto, type AvisoDatos } from '@/shared/ui/kit';
import { descargarBlob } from '../lib/archivos';
import { dejarAviso } from '../lib/aviso';
import { textoDeFalla } from '../lib/errores';
import { mesLargo } from '../lib/formato';
import { ultimosMeses } from '../lib/formatoB';
import { useCarga } from '../lib/useCarga';
import { operacionesService, type CatalogosOperacion } from '../services/operacionesService';
import { CAMPO_BORDE, ErrorPagina, EsqueletoPagina, FilaValor, Pronto, Tarjeta } from './piezas';
import { BTN_B, BTN_PB, CampoB, NotaLateral, REJILLA_B, SELECT_B } from './piezasB';

const DESCRIPCION = 'Genera el archivo del RO en el formato de tu sector y registra su envío. Lo envía el oficial de cumplimiento.';
/** Las tablas oficiales de la SBS que usa el archivo (texto fijo del diseño). */
const TABLAS_SBS = ['Moneda ISO 4217', 'País ISO 3166', 'Actividad CIIU'];
const CAMPO_SELECT = `${SELECT_B} ${CAMPO_BORDE}`;

function Marco({ children }: { children: ReactNode }) {
  return (
    <PageShell ancho="amplio">
      <PageHeader antetitulo="Registro de operaciones" titulo="Exportar a la UIF" descripcion={DESCRIPCION} icono={IconoSubir} sinLinea />
      {children}
    </PageShell>
  );
}

/** RO 14 · /operaciones/exportar — elige periodo y formato, revisa el archivo y lo genera. `periodoInicial` («AAAA-MM») viene de la dirección. */
export function ExportarUif({ periodoInicial }: { periodoInicial?: string }) {
  const base = useCarga(
    'exportar-base',
    async () => {
      const [catalogos, configuracion] = await Promise.all([operacionesService.catalogos(), operacionesService.configuracion().catch(() => null)]);
      // Si la configuración no llega, no se apaga nada: el servidor tiene la última palabra sobre quién puede generar.
      return { catalogos, puedeEditar: configuracion ? configuracion.puedeEditar : null };
    },
    'No se pudo cargar la pantalla de exportación.',
  );
  if (!base.datos) {
    return (
      <Marco>
        {base.error ? <ErrorPagina mensaje={base.error} onReintentar={base.recargar} /> : <EsqueletoPagina />}
      </Marco>
    );
  }
  return <FormularioExportar catalogos={base.datos.catalogos} puedeEditar={base.datos.puedeEditar} periodoInicial={periodoInicial} />;
}

function FormularioExportar({ catalogos, puedeEditar, periodoInicial }: { catalogos: CatalogosOperacion; puedeEditar: boolean | null; periodoInicial?: string }) {
  const router = useRouter();
  const [periodos] = useState(() => {
    const lista = ultimosMeses(12);
    // Si llegan desde un registro de un mes más antiguo, ese mes también se puede elegir.
    return periodoInicial && !lista.some((p) => p.valor === periodoInicial) ? [...lista, { valor: periodoInicial, etiqueta: mesLargo(periodoInicial) }] : lista;
  });
  const [periodo, setPeriodo] = useState(() => periodoInicial ?? periodos[0].valor);
  const formatos = catalogos.formatosExportacion;
  const [formato, setFormato] = useState(() => formatos.find((f) => f.disponible !== false)?.codigo ?? '');
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [generando, setGenerando] = useState(false);

  const revision = useCarga(`exportar-validacion-${periodo}-${formato}`, () => (formato ? operacionesService.validarExportacion(periodo, formato) : Promise.resolve(null)), 'No se pudo revisar el periodo.');
  // `useCarga` conserva lo último que llegó: solo vale si es de este periodo y formato.
  const v = !revision.cargando && !revision.error ? revision.datos : null;
  const observaciones = v?.observaciones ?? [];
  const sinPendientes = v !== null && v.pendientes === 0;
  const soloAdministrador = puedeEditar === false;
  const puedeGenerar = v !== null && v.puedeGenerar && v.pendientes > 0 && !soloAdministrador;

  const opcionesPeriodo = periodos.map((p) => ({ value: p.valor, label: p.etiqueta }));
  const opcionesFormato = formatos.map((f) => ({ value: f.codigo, label: f.nombre, disabled: f.disponible === false, etiqueta: f.disponible === false ? <Pronto compacto /> : undefined }));

  const generar = async () => {
    if (!puedeGenerar || generando) return;
    setAviso(null);
    setGenerando(true);
    try {
      const exportacion = await operacionesService.generarExportacion(periodo, formato);
      let descargado = false;
      try {
        descargarBlob(await operacionesService.archivoExportacion(exportacion.id, 'xlsx'), exportacion.archivoXlsx);
        descargado = true;
      } catch {
        // El archivo ya quedó guardado: se puede bajar de nuevo desde la pantalla que sigue.
      }
      dejarAviso(descargado ? 'Archivo generado. El Excel se descargó en tu equipo.' : 'Archivo generado, pero la descarga no empezó sola. Usa los botones de descarga de esta pantalla.');
      router.push(`/operaciones/exportar/${exportacion.id}`);
    } catch (err) {
      setGenerando(false);
      const texto = textoDeFalla(err, 'No se pudo generar el archivo. Inténtalo de nuevo.');
      if (texto) setAviso({ tipo: 'error', texto });
    }
  };

  return (
    <Marco>
      <div className={REJILLA_B}>
        <div className="flex min-w-0 flex-col gap-5">
          {aviso && <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />}

          <Tarjeta titulo="Periodo y formato" espacio="gap-[18px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CampoB id="exp-periodo" texto="Periodo">
                <StyledSelect id="exp-periodo" value={periodo} options={opcionesPeriodo} onChange={setPeriodo} disabled={generando} ajustar className={CAMPO_SELECT} />
              </CampoB>
              <CampoB id="exp-formato" texto="Formato">
                <StyledSelect id="exp-formato" value={formato} options={opcionesFormato} onChange={setFormato} placeholder="Elige un formato" disabled={generando} ajustar className={CAMPO_SELECT} />
              </CampoB>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm leading-[normal] text-muted">Tablas oficiales SBS:</p>
              <ul className="flex flex-wrap items-center gap-2" aria-label="Tablas oficiales de la SBS">
                {TABLAS_SBS.map((t) => <li key={t} className="badge badge-neutral !leading-[normal]">{t}</li>)}
              </ul>
            </div>
          </Tarjeta>

          <Tarjeta
            titulo="Validación del archivo"
            descripcion="Se revisa antes de generarlo."
            derecha={v && !sinPendientes ? (observaciones.length > 0 ? <span className="badge badge-warn !leading-[normal]">{observaciones.length} {observaciones.length === 1 ? 'observación' : 'observaciones'}</span> : <span className="badge badge-ok !leading-[normal]">Sin observaciones</span>) : undefined}
            espacio="gap-[14px]"
          >
            {revision.cargando && <Esqueleto lineas={4} />}
            {!revision.cargando && revision.error && (
              <div className="flex flex-col items-start gap-3">
                <Aviso aviso={{ tipo: 'error', texto: revision.error }} className="w-full" />
                <button type="button" onClick={revision.recargar} className={`btn btn-secondary ${BTN_B}`}>Reintentar</button>
              </div>
            )}
            {v && sinPendientes && (
              <p className="text-[15px] leading-[22px] text-muted">
                {v.registros === 0 ? 'No hay registros con fecha de operación en este periodo.' : 'Todos los registros de este periodo ya figuran como enviados.'} No hay nada pendiente que exportar.
              </p>
            )}
            {v && !sinPendientes && (
              <>
                <ul className="flex flex-col gap-3.5">
                  {v.chequeos.map((c) => (
                    <li key={c.codigo} className="flex items-center gap-2.5">
                      <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${c.ok ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn'}`} aria-hidden="true">
                        {c.ok ? <IconoVisto className="h-3 w-3" /> : <IconoAlerta className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] font-medium leading-[normal] text-ink">
                        {c.texto}
                        <span className="sr-only">{c.ok ? ': correcto' : ': con observaciones'}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {observaciones.length > 0 && (
                  <>
                    <ul className="flex flex-col gap-[14px]" aria-label="Observaciones por registro">
                      {observaciones.map((o, i) => (
                        <li key={`${o.idRegistro}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-warn-soft px-3.5 py-3">
                          <IconoAlerta className="h-[18px] w-[18px] shrink-0 text-warn" aria-hidden="true" />
                          <div className="min-w-0 flex-1">
                            <p className="break-words font-mono text-xs leading-[normal] text-ink">{o.numeroRegistro}</p>
                            <p className="break-words text-[15px] font-medium leading-[normal] text-ink">{o.texto}</p>
                          </div>
                          <Link href={`/operaciones/${o.idRegistro}/editar`} className="btn btn-secondary h-auto min-h-11 max-w-full py-2 text-center text-[14px]">
                            <IconoLapiz className="h-4 w-4 shrink-0" aria-hidden="true" />
                            Corregir
                            <span className="sr-only"> {o.numeroRegistro}: {o.texto}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm leading-[21px] text-muted">Puedes generar el archivo igual, pero conviene corregir estas observaciones antes.</p>
                  </>
                )}
              </>
            )}
          </Tarjeta>

          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
            {soloAdministrador && <p className="mr-auto text-sm leading-[21px] text-muted">Solo el administrador de tu empresa puede generar el archivo.</p>}
            <Link href="/operaciones" className={`btn btn-secondary ${BTN_B}`}>Cancelar</Link>
            <Boton icono={IconoDescargar} className={BTN_PB} onClick={generar} cargando={generando} disabled={!puedeGenerar}>Generar y descargar archivo</Boton>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-4">
          <Tarjeta titulo="Resumen del envío" espacio="gap-3">
            <div className="flex flex-col gap-3">
              <FilaValor etiqueta="Periodo">{mesLargo(periodo)}</FilaValor>
              <FilaValor etiqueta="Registros del periodo">{v ? v.registros : '—'}</FilaValor>
              <FilaValor etiqueta="Pendientes de envío">{v ? v.pendientes : '—'}</FilaValor>
              <FilaValor etiqueta="Ya enviados">{v ? v.enviados : '—'}</FilaValor>
              <FilaValor etiqueta="Quién envía">Oficial de cumplimiento</FilaValor>
            </div>
          </Tarjeta>
          <NotaLateral rotulo="Recordatorio">La estructura y la periodicidad del envío las fija la SBS para tu sector. Confírmalas en el formato y las instrucciones vigentes.</NotaLateral>
        </div>
      </div>
    </Marco>
  );
}
