'use client';

import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoAlerta } from '@/shared/ui/iconos';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { descargarBlob, tamanoLegible } from '../lib/archivos';
import { textoDeFalla } from '../lib/errores';
import { dejarAviso } from '../lib/aviso';
import { fechaCorta, fechaHora, hoyIso, montoTexto, textoOGuion } from '../lib/formato';
import { pideTexto } from '../lib/formulario';
import { useCarga } from '../lib/useCarga';
import {
  camposDeError, operacionesService,
  type AdjuntoAnalisis, type CatalogosOperacion, type DecisionInusualidad, type Inusualidad, type SolicitudInusualidad,
} from '../services/operacionesService';
import { BTN, ErrorPagina, EsqueletoPagina, FilaValor, Tarjeta } from './piezas';
import { AREA_B, BORDE_CAMPO, BotonAdjuntar, CAMPO_B, CampoB, ChipArchivo, OpcionRadio } from './piezasB';

const DESCRIPCION = 'Documenta la señal de alerta y tu análisis. Si la calificas como sospechosa, el ROS debe comunicarse a la UIF en un máximo de 24 horas.';

const DECISIONES: { valor: DecisionInusualidad; titulo: string; texto: string }[] = [
  { valor: 'NO_SOSPECHOSA', titulo: 'No es sospechosa', texto: 'Se conserva el análisis y el motivo por el cual no se reporta.' },
  { valor: 'SOSPECHOSA', titulo: 'Es sospechosa: preparar el ROS', texto: 'Se abre el ROS con los datos de esta operación y corre el plazo de 24 horas.' },
];

const GRANDE = 'xl:grid-cols-[minmax(0,1fr)_clamp(340px,28.75vw,460px)]';

/** Lo que la persona escribe en el formulario (todo texto; al enviar se arma la solicitud). */
interface Borrador {
  senal: string;
  senalTexto: string;
  fuente: string;
  fechaDeteccion: string;
  descripcionSenal: string;
  descripcionOperacion: string;
  analisis: string;
}

const nulo = (valor: string): string | null => (valor.trim() === '' ? null : valor.trim());

function borradorDe(i: Inusualidad, hoy: string): Borrador {
  return {
    senal: i.senal ?? '',
    senalTexto: i.senalTexto ?? '',
    fuente: i.fuente ?? '',
    fechaDeteccion: i.fechaDeteccion ?? hoy,
    descripcionSenal: i.descripcionSenal ?? '',
    descripcionOperacion: i.descripcionOperacion ?? '',
    analisis: i.analisis ?? '',
  };
}

/** Lo mínimo que pide el servidor para guardar (él valida lo mismo y manda la última palabra). */
function faltas(b: Borrador, cat: CatalogosOperacion, hoy: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (!b.senal) e.senal = 'Elige la señal de alerta.';
  else if (pideTexto(cat.senalesAlerta, b.senal) && !b.senalTexto.trim()) e.senalTexto = 'Describe la señal de alerta.';
  if (!b.fuente) e.fuente = 'Elige la fuente de la señal.';
  if (!b.fechaDeteccion) e.fechaDeteccion = 'Indica la fecha de detección.';
  else if (b.fechaDeteccion > hoy) e.fechaDeteccion = 'La fecha de detección no puede ser posterior a hoy.';
  return e;
}

function solicitudDe(b: Borrador, cat: CatalogosOperacion): SolicitudInusualidad {
  return {
    senal: b.senal,
    senalTexto: pideTexto(cat.senalesAlerta, b.senal) ? nulo(b.senalTexto) : null,
    fuente: b.fuente,
    fechaDeteccion: b.fechaDeteccion,
    descripcionSenal: nulo(b.descripcionSenal),
    descripcionOperacion: nulo(b.descripcionOperacion),
    analisis: nulo(b.analisis),
  };
}

function Marco({ antetitulo, children }: { antetitulo?: string; children: ReactNode }) {
  return (
    <PageShell ancho="amplio">
      <PageHeader antetitulo={antetitulo ?? 'Registro de operaciones'} titulo="Marcar como inusual" descripcion={DESCRIPCION} icono={IconoAlerta} sinLinea />
      {children}
    </PageShell>
  );
}

/** RO 12 · /operaciones/{id}/inusual — carga las listas y el análisis (si ya hay uno) y muestra el formulario. */
export function MarcarInusual({ id }: { id: number }) {
  const carga = useCarga(`inusual-${id}`, () => Promise.all([operacionesService.catalogos(), operacionesService.inusualidad(id)]), 'No se pudo cargar el análisis de este registro.');
  const [catalogos, inicial] = carga.datos ?? [null, null];
  if (!catalogos || !inicial) {
    return (
      <Marco>
        {carga.error
          ? <ErrorPagina mensaje={carga.error} onReintentar={carga.noEncontrada ? undefined : carga.recargar} volverHref={`/operaciones/${id}`} volverTexto="Volver al registro" />
          : <EsqueletoPagina />}
      </Marco>
    );
  }
  return <FormularioInusual id={id} catalogos={catalogos} inicial={inicial} />;
}

function FormularioInusual({ id, catalogos, inicial }: { id: number; catalogos: CatalogosOperacion; inicial: Inusualidad }) {
  const router = useRouter();
  const [hoy] = useState(hoyIso);
  const [actual, setActual] = useState<Inusualidad>(inicial);
  const [b, setB] = useState<Borrador>(() => borradorDe(inicial, hoyIso()));
  const [decision, setDecision] = useState<DecisionInusualidad | null>(inicial.estado === 'SOSPECHOSA' ? 'SOSPECHOSA' : inicial.estado === 'DESCARTADA' ? 'NO_SOSPECHOSA' : null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [pendientes, setPendientes] = useState<File[]>([]);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [enviando, setEnviando] = useState<'guardar' | 'calificar' | null>(null);

  const cerrado = actual.estado === 'DESCARTADA' || actual.estado === 'SOSPECHOSA';
  const bloqueado = cerrado || enviando !== null;
  const poner = (parche: Partial<Borrador>) => setB((anterior) => ({ ...anterior, ...parche }));
  const volver = `/operaciones/${id}`;

  const mostrarAviso = useCallback((nuevo: AvisoDatos) => {
    setAviso(nuevo);
    requestAnimationFrame(() => document.getElementById('aviso-inusual')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  }, []);

  const agregarArchivos = (archivos: File[]) => {
    setErrorArchivo(null);
    setPendientes((anteriores) => {
      const clave = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
      const ya = new Set(anteriores.map(clave));
      return [...anteriores, ...archivos.filter((f) => !ya.has(clave(f)))];
    });
  };

  const descargar = async (adjunto: AdjuntoAnalisis) => {
    try {
      descargarBlob(await operacionesService.descargarAdjunto(id, adjunto.id), adjunto.nombre);
    } catch (err) {
      const texto = textoDeFalla(err, `No se pudo descargar «${adjunto.nombre}».`);
      if (texto) mostrarAviso({ tipo: 'error', texto });
    }
  };

  /** Guarda el análisis y sube los archivos que estaban esperando. Devuelve el análisis guardado, o `null` si algo falló (ya avisó). */
  const guardarTodo = async (): Promise<Inusualidad | null> => {
    const pendientesDeLlenar = faltas(b, catalogos, hoy);
    setErrores(pendientesDeLlenar);
    if (Object.keys(pendientesDeLlenar).length > 0) {
      mostrarAviso({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' });
      return null;
    }
    let guardado: Inusualidad;
    try {
      guardado = await operacionesService.guardarInusualidad(id, solicitudDe(b, catalogos));
    } catch (err) {
      const campos = camposDeError(err);
      if (campos) setErrores(Object.fromEntries(Object.entries(campos).map(([clave, mensaje]) => [clave.split('.').pop() ?? clave, mensaje])));
      const texto = textoDeFalla(err, 'No se pudo guardar el análisis. Revisa los datos e inténtalo de nuevo.');
      if (texto) mostrarAviso({ tipo: 'error', texto });
      return null;
    }
    // Los archivos se suben de a uno; si uno falla, el análisis ya quedó guardado y los que faltan siguen en la lista.
    const faltantes: File[] = [];
    let falla: string | null = null;
    for (const archivo of pendientes) {
      if (falla) { faltantes.push(archivo); continue; }
      try {
        const subido = await operacionesService.subirAdjunto(id, archivo);
        guardado = { ...guardado, adjuntos: [...guardado.adjuntos, subido] };
      } catch (err) {
        falla = `No se pudo subir «${archivo.name}»: ${textoDeFalla(err, 'inténtalo de nuevo.') ?? 'sin tokens disponibles.'}`;
        faltantes.push(archivo);
      }
    }
    setActual(guardado);
    setPendientes(faltantes);
    if (falla) {
      mostrarAviso({ tipo: 'error', texto: `El análisis se guardó, pero ${falla.charAt(0).toLowerCase()}${falla.slice(1)}` });
      return null;
    }
    return guardado;
  };

  const guardarAnalisis = async () => {
    setAviso(null);
    setEnviando('guardar');
    const guardado = await guardarTodo();
    setEnviando(null);
    if (guardado) mostrarAviso({ tipo: 'ok', texto: 'Análisis guardado. El registro cuenta como inusual y quedó anotado en el historial.' });
  };

  const calificar = async () => {
    if (!decision) return;
    setAviso(null);
    if (!b.analisis.trim()) {
      setErrores((e) => ({ ...e, analisis: 'Escribe el análisis y la evaluación: es el motivo de tu decisión.' }));
      mostrarAviso({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' });
      return;
    }
    setEnviando('calificar');
    const guardado = await guardarTodo();
    if (!guardado) { setEnviando(null); return; }
    try {
      await operacionesService.calificar(id, decision);
      dejarAviso(decision === 'SOSPECHOSA' ? 'Calificada como sospechosa. Corre el plazo de 24 horas para comunicar el ROS.' : 'Descartada: no es sospechosa. El análisis quedó guardado como constancia.');
      router.push(decision === 'SOSPECHOSA' ? `/operaciones/${id}/ros` : volver);
    } catch (err) {
      setEnviando(null);
      const campos = camposDeError(err);
      if (campos) setErrores(Object.fromEntries(Object.entries(campos).map(([clave, mensaje]) => [clave.split('.').pop() ?? clave, mensaje])));
      const texto = textoDeFalla(err, 'No se pudo calificar el registro. Inténtalo de nuevo.');
      if (texto) mostrarAviso({ tipo: 'error', texto });
    }
  };

  const d = actual.datosOperacion;
  const opcionesSenal = catalogos.senalesAlerta.map((o) => ({ value: o.codigo, label: o.nombre }));
  const opcionesFuente = catalogos.fuentesSenal.map((o) => ({ value: o.codigo, label: o.nombre }));
  const pideSenalTexto = pideTexto(catalogos.senalesAlerta, b.senal);
  const clase = (campo: string) => `input ${CAMPO_B} ${errores[campo] ? 'input-error' : BORDE_CAMPO}`;
  const claseArea = (campo: string, minimo: string) => `input ${AREA_B} ${minimo} resize-y ${errores[campo] ? 'input-error' : BORDE_CAMPO}`;
  const ariaError = (campo: string) => (errores[campo] ? { 'aria-invalid': true as const, 'aria-describedby': `inu-${campo}-error` } : {});

  return (
    <PageShell ancho="amplio">
      <PageHeader antetitulo={actual.numeroRegistro} titulo="Marcar como inusual" descripcion={DESCRIPCION} icono={IconoAlerta} sinLinea />

      <form onSubmit={(e) => e.preventDefault()} noValidate className={`grid items-start gap-6 ${GRANDE}`}>
        <div className="flex min-w-0 flex-col gap-5">
          {aviso && <div id="aviso-inusual" className="scroll-mt-6"><Aviso aviso={aviso} onCerrar={() => setAviso(null)} /></div>}

          {cerrado && (
            <Aviso
              aviso={{
                tipo: 'info',
                texto: actual.estado === 'SOSPECHOSA'
                  ? `Calificada como sospechosa${actual.calificadaEn ? ` el ${fechaHora(actual.calificadaEn)}` : ''}${actual.calificadaPor ? ` por ${actual.calificadaPor}` : ''}. El análisis ya no se puede cambiar.`
                  : `Descartada: no es sospechosa${actual.calificadaEn ? ` el ${fechaHora(actual.calificadaEn)}` : ''}${actual.calificadaPor ? ` por ${actual.calificadaPor}` : ''}. El análisis ya no se puede cambiar.`,
              }}
            />
          )}

          <Tarjeta titulo="Señal de alerta" descripcion="Qué te llamó la atención." className="!gap-[18px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <CampoB id="inu-senal" texto="Señal de alerta" error={errores.senal}>
                <StyledSelect id="inu-senal" value={b.senal} options={opcionesSenal} onChange={(v) => poner({ senal: v })} placeholder="Elige una señal" disabled={bloqueado} error={!!errores.senal} className={`${CAMPO_B} ${errores.senal ? '' : BORDE_CAMPO}`} />
              </CampoB>
              <CampoB id="inu-fuente" texto="Fuente de la señal" error={errores.fuente}>
                <StyledSelect id="inu-fuente" value={b.fuente} options={opcionesFuente} onChange={(v) => poner({ fuente: v })} placeholder="Elige una fuente" disabled={bloqueado} error={!!errores.fuente} className={`${CAMPO_B} ${errores.fuente ? '' : BORDE_CAMPO}`} />
              </CampoB>
              <CampoB id="inu-fechaDeteccion" texto="Fecha de detección" error={errores.fechaDeteccion}>
                <input id="inu-fechaDeteccion" type="date" max={hoy} value={b.fechaDeteccion} onChange={(e) => poner({ fechaDeteccion: e.target.value })} disabled={bloqueado} className={clase('fechaDeteccion')} {...ariaError('fechaDeteccion')} />
              </CampoB>
            </div>
            {pideSenalTexto && (
              <CampoB id="inu-senalTexto" texto="¿Cuál es la señal de alerta?" error={errores.senalTexto}>
                <input id="inu-senalTexto" type="text" maxLength={300} autoComplete="off" placeholder="Descríbela" value={b.senalTexto} onChange={(e) => poner({ senalTexto: e.target.value })} disabled={bloqueado} className={clase('senalTexto')} {...ariaError('senalTexto')} />
              </CampoB>
            )}
            <CampoB id="inu-descripcionSenal" texto="Descripción de la señal" error={errores.descripcionSenal}>
              <textarea id="inu-descripcionSenal" rows={3} maxLength={4000} value={b.descripcionSenal} onChange={(e) => poner({ descripcionSenal: e.target.value })} disabled={bloqueado} className={claseArea('descripcionSenal', 'min-h-[88px]')} {...ariaError('descripcionSenal')} />
            </CampoB>
          </Tarjeta>

          <Tarjeta titulo="Análisis de la operación" descripcion="Queda como constancia documental." className="!gap-[18px]">
            <CampoB id="inu-descripcionOperacion" texto="Descripción de la operación y argumentos" error={errores.descripcionOperacion}>
              <textarea id="inu-descripcionOperacion" rows={3} maxLength={4000} value={b.descripcionOperacion} onChange={(e) => poner({ descripcionOperacion: e.target.value })} disabled={bloqueado} className={claseArea('descripcionOperacion', 'min-h-[96px]')} {...ariaError('descripcionOperacion')} />
            </CampoB>
            <CampoB id="inu-analisis" texto="Análisis y evaluación" error={errores.analisis}>
              <textarea id="inu-analisis" rows={4} maxLength={4000} value={b.analisis} onChange={(e) => poner({ analisis: e.target.value })} disabled={bloqueado} className={claseArea('analisis', 'min-h-[112px]')} {...ariaError('analisis')} />
            </CampoB>
            <div className="flex flex-col gap-2.5">
              {(actual.adjuntos.length > 0 || pendientes.length > 0) && (
                <ul className="flex flex-wrap gap-2" aria-label="Archivos adjuntos">
                  {actual.adjuntos.map((a) => (
                    <li key={a.id}><ChipArchivo nombre={a.nombre} onClick={() => descargar(a)} titulo={`Descargar (${tamanoLegible(a.tamano)})`} /></li>
                  ))}
                  {pendientes.map((f) => (
                    <li key={`${f.name}|${f.size}|${f.lastModified}`}>
                      <ChipArchivo pendiente nombre={f.name} titulo="Se sube al guardar el análisis" onQuitar={bloqueado ? undefined : () => setPendientes((lista) => lista.filter((x) => x !== f))} />
                    </li>
                  ))}
                </ul>
              )}
              {cerrado && actual.adjuntos.length === 0 && <p className="text-sm text-muted">Este análisis no tiene archivos adjuntos.</p>}
              {!cerrado && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <BotonAdjuntar multiple onArchivos={agregarArchivos} onError={setErrorArchivo} deshabilitado={bloqueado}>Adjuntar archivo</BotonAdjuntar>
                  <span className="text-xs text-muted">PDF, DOC o DOCX · hasta 10 MB cada uno. Se suben al guardar y no se pueden borrar: quedan como constancia.</span>
                </div>
              )}
              {errorArchivo && <p role="alert" className="error-text">{errorArchivo}</p>}
            </div>
          </Tarjeta>

          <Tarjeta titulo="Decisión" descripcion="Elige una opción y documenta por qué." className="!gap-[18px]">
            <div role="radiogroup" aria-label="Decisión" className="flex flex-col gap-[18px]">
              {DECISIONES.map((o) => (
                <OpcionRadio key={o.valor} nombre="decision-inusual" valor={o.valor} marcada={decision === o.valor} onElegir={(v) => setDecision(v as DecisionInusualidad)} titulo={o.titulo} texto={o.texto} deshabilitada={bloqueado || !actual.puedeCalificar} />
              ))}
            </div>
            {!cerrado && !actual.puedeCalificar && <p className="text-sm text-muted">Solo el administrador de tu empresa puede calificar un análisis. Tú puedes guardarlo.</p>}
          </Tarjeta>

          <div className="flex flex-wrap justify-end gap-2.5 pb-2 pt-1">
            {cerrado ? (
              <>
                <Link href={volver} className={`btn btn-secondary ${BTN}`}>Volver al registro</Link>
                {actual.estado === 'SOSPECHOSA' && <Link href={`/operaciones/${id}/ros`} className={`btn btn-primary ${BTN}`}>Preparar el ROS</Link>}
              </>
            ) : (
              <>
                <Link href={volver} className={`btn btn-secondary ${BTN}`}>Cancelar</Link>
                <Boton variante="secundario" className={BTN} onClick={guardarAnalisis} cargando={enviando === 'guardar'} disabled={bloqueado}>Guardar análisis</Boton>
                {actual.puedeCalificar && (
                  <Boton icono={decision === 'NO_SOSPECHOSA' ? undefined : AlertTriangle} className={BTN} onClick={calificar} cargando={enviando === 'calificar'} disabled={bloqueado || !decision}>
                    {decision === 'NO_SOSPECHOSA' ? 'Calificar como no sospechosa' : 'Calificar como sospechosa'}
                  </Boton>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-4">
          <Tarjeta titulo="Datos de la operación" descripcion="Se completan solos desde el registro." className="!gap-3">
            <div className="flex flex-col gap-3">
              <FilaValor etiqueta="Fecha">{fechaCorta(d.fechaOperacion) ?? '—'}</FilaValor>
              <FilaValor etiqueta="Tipo">{textoOGuion(d.tipoOperacion)}</FilaValor>
              <FilaValor etiqueta="Monto">{`${d.moneda ?? ''} ${montoTexto(d.monto)}`.trim()}</FilaValor>
              <FilaValor etiqueta="Medio de pago">{textoOGuion(d.modalidadPago)}</FilaValor>
              <FilaValor etiqueta="Origen de fondos">{textoOGuion(d.origenFondos)}</FilaValor>
              <FilaValor etiqueta="Comprobante">{textoOGuion(d.numeroComprobante)}</FilaValor>
              <FilaValor etiqueta="Participantes">{`${d.participantes} ${d.participantes === 1 ? 'persona' : 'personas'}`}</FilaValor>
            </div>
          </Tarjeta>
          <Tarjeta titulo="Plazo del ROS" descripcion="Desde que lo calificas como sospechoso." derecha={<span className="badge badge-warn">24 horas</span>} className="!gap-3">
            <p className="text-sm leading-[21px] text-ink/80">El ROS no debe identificar al oficial de cumplimiento ni a la empresa; solo se usan los códigos secretos de la UIF-Perú.</p>
          </Tarjeta>
        </div>
      </form>
    </PageShell>
  );
}
