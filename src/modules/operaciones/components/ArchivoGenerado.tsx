'use client';

import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoDescargar, IconoDocumento, IconoVisto } from '@/shared/ui/iconos';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { descargarBlob, tamanoLegible } from '../lib/archivos';
import { useAvisoPendiente } from '../lib/aviso';
import { textoDeFalla } from '../lib/errores';
import { fechaCorta, fechaHora, hoyIso, mesLargo } from '../lib/formato';
import { useCarga } from '../lib/useCarga';
import { camposDeError, codigoDeError, operacionesService, type Exportacion } from '../services/operacionesService';
import { CAMPO, CAMPO_BORDE, Dato, ErrorPagina, EsqueletoPagina, Tarjeta } from './piezas';
import { AREA_B, AreaAutoajustable, BTN_B, BTN_PB, BotonAdjuntar, CampoB, NotaLateral, REJILLA_B } from './piezasB';

const MAX_ACUSE = 100;
const MAX_NOTAS = 2000;

function Marco({ descripcion, children }: { descripcion?: string; children: ReactNode }) {
  return (
    <PageShell ancho="amplio">
      <PageHeader antetitulo="Exportar a la UIF" titulo="Archivo generado" descripcion={descripcion} icono={IconoVisto} sinLinea />
      {children}
    </PageShell>
  );
}

/** RO 15 · /operaciones/exportar/{id} — el archivo generado y la constancia de su envío a la UIF. */
export function ArchivoGenerado({ id }: { id: number }) {
  const carga = useCarga(`exportacion-${id}`, () => operacionesService.exportacion(id), 'No se pudo abrir el archivo generado.');
  const [avisoInicial, setAvisoInicial] = useAvisoPendiente();
  if (!carga.datos) {
    return (
      <Marco>
        {carga.error
          ? <ErrorPagina mensaje={carga.noEncontrada ? 'No encontramos ese archivo. Puede que no exista o que no sea de tu empresa.' : carga.error} onReintentar={carga.noEncontrada ? undefined : carga.recargar} volverHref="/operaciones/exportar" volverTexto="Volver a exportar" />
          : <EsqueletoPagina />}
      </Marco>
    );
  }
  return <ContenidoArchivo inicial={carga.datos} avisoInicial={avisoInicial} onCerrarAvisoInicial={() => setAvisoInicial(null)} />;
}

/** Un punto de la lista «Qué cambia al guardar»: círculo lavanda con visto y el texto. */
function Punto({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden="true">
        <IconoVisto className="h-3 w-3" />
      </span>
      <span className="min-w-0 flex-1 text-[15px] font-medium leading-[normal] text-ink">{children}</span>
    </li>
  );
}

function ContenidoArchivo({ inicial, avisoInicial, onCerrarAvisoInicial }: { inicial: Exportacion; avisoInicial: AvisoDatos | null; onCerrarAvisoInicial: () => void }) {
  const [exportacion, setExportacion] = useState<Exportacion>(inicial);
  const [enviados, setEnviados] = useState<number | null>(null);
  const [hoy] = useState(hoyIso);
  const [fechaEnvio, setFechaEnvio] = useState(hoy);
  const [numeroAcuse, setNumeroAcuse] = useState('');
  const [notas, setNotas] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [descargando, setDescargando] = useState<'xlsx' | 'csv' | 'constancia' | null>(null);

  const enviado = exportacion.estado === 'ENVIADO' && exportacion.constancia !== null;
  const puedeRegistrar = exportacion.puedeRegistrarConstancia;
  const bloqueado = !puedeRegistrar || guardando;
  const mes = mesLargo(exportacion.periodo);
  const claseCampo = (campo: string) => `input ${CAMPO} ${errores[campo] ? 'input-error' : CAMPO_BORDE}`;
  const ariaError = (campo: string) => (errores[campo] ? { 'aria-invalid': true as const, 'aria-describedby': `con-${campo}-error` } : {});

  const mostrarAviso = (nuevo: AvisoDatos) => {
    setAviso(nuevo);
    requestAnimationFrame(() => document.getElementById('aviso-archivo')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

  const descargar = async (tipo: 'xlsx' | 'csv' | 'constancia') => {
    setDescargando(tipo);
    try {
      if (tipo === 'constancia') {
        descargarBlob(await operacionesService.archivoConstancia(exportacion.id), exportacion.constancia?.archivo ?? 'constancia');
      } else {
        descargarBlob(await operacionesService.archivoExportacion(exportacion.id, tipo), tipo === 'xlsx' ? exportacion.archivoXlsx : exportacion.archivoCsv);
      }
    } catch (err) {
      const texto = textoDeFalla(err, tipo === 'constancia' ? 'No se pudo descargar la constancia.' : `No se pudo descargar el archivo ${tipo === 'xlsx' ? 'Excel' : 'CSV'}. Inténtalo de nuevo.`);
      if (texto) mostrarAviso({ tipo: 'error', texto });
    } finally {
      setDescargando(null);
    }
  };

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setAviso(null);
    const faltas: Record<string, string> = {};
    const acuse = numeroAcuse.trim();
    if (!fechaEnvio) faltas.fechaEnvio = 'Indica la fecha en que enviaste el archivo.';
    else if (fechaEnvio > hoyIso()) faltas.fechaEnvio = 'La fecha de envío no puede ser posterior a hoy.';
    if (!acuse) faltas.numeroAcuse = 'Escribe el número de constancia o acuse que te dio la UIF.';
    else if (acuse.length > MAX_ACUSE) faltas.numeroAcuse = `El número de acuse admite hasta ${MAX_ACUSE} caracteres.`;
    if (notas.trim().length > MAX_NOTAS) faltas.notas = `Las notas admiten hasta ${MAX_NOTAS} caracteres.`;
    setErrores(faltas);
    if (Object.keys(faltas).length > 0) {
      mostrarAviso({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' });
      return;
    }

    setGuardando(true);
    try {
      const respuesta = await operacionesService.registrarConstancia(exportacion.id, { fechaEnvio, numeroAcuse: acuse, notas, archivo });
      setExportacion((actual) => ({ ...actual, estado: 'ENVIADO', constancia: respuesta.constancia }));
      setEnviados(respuesta.enviados);
      mostrarAviso({ tipo: 'ok', texto: `Envío guardado: ${respuesta.enviados} ${respuesta.enviados === 1 ? 'registro pasó' : 'registros pasaron'} a «Enviado» y quedó anotado en el historial.` });
    } catch (err) {
      const campos = camposDeError(err);
      if (campos) setErrores(Object.fromEntries(Object.entries(campos).map(([clave, mensaje]) => [clave.split('.').pop() ?? clave, mensaje])));
      const texto = textoDeFalla(err, 'No se pudo guardar el envío. Revisa los datos e inténtalo de nuevo.');
      if (texto) mostrarAviso({ tipo: 'error', texto });
      if (codigoDeError(err) === 'OPERACIONES_CONSTANCIA_YA_REGISTRADA') {
        // Alguien más ya la registró: se vuelve a leer para mostrarla.
        operacionesService.exportacion(exportacion.id).then(setExportacion).catch(() => undefined);
      }
    } finally {
      setGuardando(false);
    }
  };

  const descripcion = enviado
    ? `El envío del RO de ${mes.toLowerCase()} ya quedó registrado y el periodo está cerrado.`
    : `El archivo del RO de ${mes.toLowerCase()} se descargó. Después de enviarlo, registra la constancia para cerrar el periodo.`;
  const c = exportacion.constancia;
  const cuantos = enviados ?? exportacion.registros;

  return (
    <Marco descripcion={descripcion}>
      <form onSubmit={guardar} noValidate className={REJILLA_B}>
        <div className="flex min-w-0 flex-col gap-5">
          {avisoInicial && !aviso && <Aviso aviso={avisoInicial} onCerrar={onCerrarAvisoInicial} />}
          {aviso && <div id="aviso-archivo" className="scroll-mt-6"><Aviso aviso={aviso} onCerrar={() => setAviso(null)} /></div>}

          <section aria-label="Archivo generado" className="card flex flex-col gap-4 rounded-[22px] p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-ok-soft text-ok" aria-hidden="true">
                <IconoDocumento className="h-[26px] w-[26px]" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[3px] leading-[normal]">
                <p className="text-xl font-bold text-ink [overflow-wrap:anywhere]">{exportacion.archivoXlsx}</p>
                <p className="text-sm text-muted">
                  {exportacion.registros} {exportacion.registros === 1 ? 'registro' : 'registros'} · generado el {fechaHora(exportacion.generadoEn)}{exportacion.generadoPor ? ` por ${exportacion.generadoPor}` : ''}
                </p>
                <p className="text-sm text-muted">{exportacion.formatoNombre}</p>
              </div>
              <span className={`badge ${enviado ? 'badge-ok' : 'badge-neutral'} !leading-[normal]`}>{enviado ? 'Enviado' : 'Generado'}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Boton variante="secundario" icono={IconoDescargar} className={BTN_B} onClick={() => descargar('xlsx')} cargando={descargando === 'xlsx'}>Descargar Excel</Boton>
              <Boton variante="secundario" icono={IconoDescargar} className={BTN_B} onClick={() => descargar('csv')} cargando={descargando === 'csv'}>Descargar CSV</Boton>
            </div>
          </section>

          {enviado && c ? (
            <Tarjeta titulo="Constancia de envío" descripcion="Lo que se registró cuando la UIF dio el acuse." espacio="gap-[18px]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Dato rotulo="Fecha de envío">{fechaCorta(c.fechaEnvio) ?? '—'}</Dato>
                <Dato rotulo="N.º de constancia o acuse">{c.numeroAcuse}</Dato>
              </div>
              {c.notas && <Dato rotulo="Notas"><span className="whitespace-pre-line">{c.notas}</span></Dato>}
              {c.archivo && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3.5">
                  <IconoDocumento className="h-[18px] w-[18px] shrink-0 text-ink" aria-hidden="true" />
                  <span className="min-w-0 flex-1 text-[15px] font-medium leading-[normal] text-ink [overflow-wrap:anywhere]">{c.archivo}</span>
                  <span className="badge badge-ok !leading-[normal]">Adjunto</span>
                  <Boton variante="secundario" icono={IconoDescargar} tamano="sm" onClick={() => descargar('constancia')} cargando={descargando === 'constancia'}>Descargar</Boton>
                </div>
              )}
              <p className="text-sm leading-[21px] text-muted">
                Registrado{c.registradoPor ? ` por ${c.registradoPor}` : ''} el {fechaHora(c.registradoEn)}.
              </p>
            </Tarjeta>
          ) : (
            <Tarjeta titulo="Registra la constancia de envío" descripcion="Cuando la UIF te dé el acuse." espacio="gap-[18px]">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CampoB id="con-fechaEnvio" texto="Fecha de envío" error={errores.fechaEnvio}>
                  <input id="con-fechaEnvio" type="date" max={hoy} value={fechaEnvio} onChange={(e) => setFechaEnvio(e.target.value)} disabled={bloqueado} className={claseCampo('fechaEnvio')} {...ariaError('fechaEnvio')} />
                </CampoB>
                <CampoB id="con-numeroAcuse" texto="N.º de constancia o acuse" error={errores.numeroAcuse}>
                  <input id="con-numeroAcuse" type="text" autoComplete="off" placeholder="Ej. 2026-000123" value={numeroAcuse} onChange={(e) => setNumeroAcuse(e.target.value)} disabled={bloqueado} className={claseCampo('numeroAcuse')} {...ariaError('numeroAcuse')} />
                </CampoB>
              </div>

              <div className="flex flex-col gap-2.5">
                {archivo ? (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3.5">
                    <IconoDocumento className="h-[18px] w-[18px] shrink-0 text-ink" aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-[15px] font-medium leading-[normal] text-ink [overflow-wrap:anywhere]">
                      {archivo.name}
                      <span className="ml-2 text-xs font-normal text-muted">{tamanoLegible(archivo.size)}</span>
                    </span>
                    <span className="badge badge-ok !leading-[normal]">Adjunto</span>
                    <button type="button" onClick={() => setArchivo(null)} disabled={bloqueado} className="btn btn-secondary btn-sm">Quitar</button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <BotonAdjuntar onArchivos={(archivos) => { setErrorArchivo(null); setArchivo(archivos[0] ?? null); }} onError={setErrorArchivo} deshabilitado={bloqueado}>Adjuntar la constancia</BotonAdjuntar>
                    <span className="text-xs text-muted">PDF, DOC o DOCX · hasta 10 MB. Es opcional.</span>
                  </div>
                )}
                {(errorArchivo ?? errores.archivo) && <p role="alert" className="error-text">{errorArchivo ?? errores.archivo}</p>}
              </div>

              <CampoB id="con-notas" texto="Notas (opcional)" error={errores.notas}>
                <AreaAutoajustable id="con-notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} disabled={bloqueado} className={`input ${AREA_B} min-h-[72px] ${errores.notas ? 'input-error' : CAMPO_BORDE}`} {...ariaError('notas')} />
              </CampoB>
              {!puedeRegistrar && <p className="text-sm leading-[21px] text-muted">Solo el administrador de tu empresa puede registrar el envío.</p>}
            </Tarjeta>
          )}

          <div className="flex flex-wrap justify-end gap-2.5 pt-1">
            <Link href="/operaciones" className={`btn btn-secondary ${BTN_B}`}>Volver a la lista</Link>
            {!enviado && puedeRegistrar && <Boton type="submit" icono={IconoVisto} className={BTN_PB} cargando={guardando}>Guardar envío</Boton>}
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-4">
          <Tarjeta titulo={enviado ? 'Qué cambió al guardar' : 'Qué cambia al guardar'} espacio="gap-3">
            <ul className="flex flex-col gap-2.5">
              <Punto>{cuantos} {enviado ? (cuantos === 1 ? 'registro pasó' : 'registros pasaron') : (cuantos === 1 ? 'registro pasa' : 'registros pasan')} a «Enviado»</Punto>
              <Punto>Se guarda la constancia junto a cada registro</Punto>
              <Punto>Queda anotado en el historial</Punto>
            </ul>
          </Tarjeta>
          <NotaLateral rotulo="Recordatorio">El RO es confidencial: comparte el archivo solo con la UIF-Perú.</NotaLateral>
        </div>
      </form>
    </Marco>
  );
}
