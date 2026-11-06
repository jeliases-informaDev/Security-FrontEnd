'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { IconoDocumento, IconoHistorial, IconoLapiz, IconoRecibo, IconoTriangulo, IconoUsuario } from '@/shared/ui/iconos';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso } from '@/shared/ui/kit';
import { useAvisoPendiente } from '../lib/aviso';
import { fechaCorta, montoConMoneda, montoTexto, soloHora, textoOGuion } from '../lib/formato';
import { esNoEncontrada, operacionesService, type DetalleOperacion, type PersonaDetalle } from '../services/operacionesService';
import { CambiarResponsableModal } from './CambiarResponsableModal';
import { usePdfOperacion } from './PdfOperacion';
import { BTN, BTN_P, BotonPronto, Dato, ErrorPagina, EsqueletoPagina, FilaValor, InsigniaEstado, Pronto, Tarjeta } from './piezas';

/** «Av. Larco 1301, Miraflores, Lima»: junta lo que haya sin repetir (provincia y departamento suelen llamarse igual). */
function direccion(p: PersonaDetalle): string {
  const partes = [p.domicilio, p.distrito, p.provincia, p.departamento].map((x) => x?.trim()).filter((x): x is string => !!x);
  return partes.filter((x, i) => x !== partes[i - 1]).join(', ');
}

const FILA3 = 'grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3';
const FILA2 = 'grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2';

const nombreDe = (p: PersonaDetalle) => [p.apellidos, p.nombres].map((x) => x?.trim()).filter(Boolean).join(', ');

/** «DNI 10001088»; sin documento, el motivo. */
function documentoDe(tipo: string | null, nombreTipo: string | null | undefined, numero: string | null, motivo?: string | null): string {
  const etiqueta = nombreTipo ?? tipo ?? '';
  if (numero && numero.trim()) return `${etiqueta} ${numero}`.trim();
  return motivo ? `${etiqueta} · ${motivo}`.trim() : etiqueta || '—';
}

const conTexto = (nombre: string | null, valor: string | null, texto: string | null) => {
  const base = nombre ?? valor ?? '—';
  return texto ? `${base} · ${texto}` : base;
};

/** RO 5 · Detalle del registro (con «Cambiar responsable» y la vista previa del PDF). */
export function DetalleRegistro({ id }: { id: number }) {
  const [version, setVersion] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; detalle: DetalleOperacion | null; error: string | null; noEncontrada: boolean } | null>(null);
  const [cambiando, setCambiando] = useState(false);
  const [aviso, setAviso] = useAvisoPendiente();
  const clave = `${id}|${version}`;
  const actual = respuesta?.clave === clave ? respuesta : null;
  const detalle = actual?.detalle ?? respuesta?.detalle ?? null;

  const { abrir: abrirPdf, elemento: elementoPdf } = usePdfOperacion(useCallback((t: string) => setAviso({ tipo: 'error', texto: t }), [setAviso]));

  useEffect(() => {
    let vigente = true;
    const pedida = `${id}|${version}`;
    operacionesService
      .detalle(id)
      .then((d) => { if (vigente) setRespuesta({ clave: pedida, detalle: d, error: null, noEncontrada: false }); })
      .catch((err: unknown) => {
        if (!vigente) return;
        const noEncontrada = esNoEncontrada(err);
        setRespuesta({ clave: pedida, detalle: null, noEncontrada, error: noEncontrada ? 'No encontramos ese registro. Puede que no exista o que no sea de tu empresa.' : mensajeDe(err, 'No se pudo cargar el registro.') });
      });
    return () => { vigente = false; };
  }, [id, version]);

  if (!detalle) {
    return (
      <PageShell ancho="amplio">
        <PageHeader antetitulo="Detalle del registro" titulo="Registro" icono={IconoRecibo} sinLinea />
        {actual?.error ? <ErrorPagina mensaje={actual.error} onReintentar={actual.noEncontrada ? undefined : () => setVersion((v) => v + 1)} /> : <EsqueletoPagina />}
      </PageShell>
    );
  }

  const { personaFisica: pf, personaRepresentada: pr, operacion: op, registro } = detalle;
  const hora = soloHora(registro.creadoEn);
  const cuentas = [op.cuenta1, op.cuenta2, op.cuenta3].filter((c): c is string => !!c && c.trim() !== '');

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Detalle del registro"
        titulo={detalle.numeroRegistro}
        descripcion={`Registrado el ${fechaCorta(registro.fechaRegistro) ?? ''}${hora ? ` a las ${hora}` : ''} por ${registro.usuario} · Oficina ${registro.oficina}.`}
        icono={IconoRecibo}
        sinLinea
        acciones={
          <div className="flex flex-wrap items-start gap-2.5">
            <Link href={`/operaciones/${id}/historial`} className={`btn btn-secondary ${BTN}`}><IconoHistorial className="h-4 w-4" aria-hidden="true" /> Historial</Link>
            <button type="button" onClick={() => abrirPdf(id, detalle.numeroRegistro)} className={`btn btn-secondary ${BTN}`}><IconoDocumento className="h-4 w-4" aria-hidden="true" /> PDF</button>
            <Link href={`/operaciones/${id}/editar`} className={`btn btn-primary ${BTN_P}`}><IconoLapiz className="h-4 w-4" aria-hidden="true" /> Editar</Link>
          </div>
        }
      />

      {aviso && <Aviso aviso={aviso} onCerrar={() => setAviso(null)} className="mb-5" />}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(21.25rem,24vw,28.75rem)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Tarjeta espacio="gap-[18px]" titulo="Persona que realiza la operación">
            <div className="flex flex-col gap-4">
              <div className={FILA3}>
                <Dato rotulo="Nombre">{textoOGuion(nombreDe(pf))}</Dato>
                <Dato rotulo="Documento">{documentoDe(pf.tipoDocumento, pf.tipoDocumentoNombre, pf.numeroDocumento, pf.motivoSinDocumento)}</Dato>
                <Dato rotulo="Fecha de nacimiento">{fechaCorta(pf.fechaNacimiento) ?? '—'}</Dato>
                <Dato rotulo="Nacionalidad">{textoOGuion(pf.nacionalidad)}</Dato>
                <Dato rotulo="Teléfono">{textoOGuion(pf.telefono)}</Dato>
                <Dato rotulo="Ocupación">{textoOGuion(pf.ocupacion)}</Dato>
              </div>
              <div className={FILA2}>
                <Dato rotulo="Estado civil">{textoOGuion(pf.estadoCivilNombre ?? pf.estadoCivil)}</Dato>
                <Dato rotulo="Domicilio">{textoOGuion(direccion(pf))}</Dato>
              </div>
            </div>
          </Tarjeta>

          <Tarjeta espacio="gap-[18px]" titulo="Persona representada" descripcion="En nombre de quien se hizo la operación.">
            {pr ? (
              pr.tipoPersona === 'JURIDICA' ? (
                <div className={FILA3}>
                  <Dato rotulo="Razón social">{textoOGuion(pr.razonSocial)}</Dato>
                  <Dato rotulo={pr.tipoDocumentoNombre ?? pr.tipoDocumento ?? 'Documento'}>{textoOGuion(pr.numeroDocumento) === '—' ? textoOGuion(pr.motivoSinDocumento) : pr.numeroDocumento}</Dato>
                  <Dato rotulo="Representante legal">{textoOGuion(pr.representanteLegal)}</Dato>
                  <Dato rotulo="Documento del representante">{pr.representanteNumeroDocumento ? documentoDe(pr.representanteTipoDocumento, pr.representanteTipoDocumentoNombre, pr.representanteNumeroDocumento) : '—'}</Dato>
                  <Dato rotulo="Accionistas con más del 25%">{textoOGuion(pr.accionistasMayores25)}</Dato>
                  <Dato rotulo="Domicilio fiscal">{textoOGuion(pr.domicilioFiscal)}</Dato>
                </div>
              ) : (
                <div className={FILA3}>
                  <Dato rotulo="Nombre">{textoOGuion(nombreDe(pr))}</Dato>
                  <Dato rotulo="Documento">{documentoDe(pr.tipoDocumento, pr.tipoDocumentoNombre, pr.numeroDocumento, pr.motivoSinDocumento)}</Dato>
                </div>
              )
            ) : (
              <p className="text-sm leading-[normal] text-ink/50">No aplica para este registro.</p>
            )}
          </Tarjeta>

          <Tarjeta espacio="gap-[18px]" titulo="Operación">
            <div className="flex flex-col gap-4">
              <div className={FILA3}>
                <Dato rotulo="Fecha de la operación">{fechaCorta(op.fechaOperacion) ?? '—'}</Dato>
                <Dato rotulo="Lugar">{textoOGuion(op.lugar)}</Dato>
                <Dato rotulo="Tipo de operación">{textoOGuion(op.tipoOperacionNombre ?? op.tipoOperacion)}</Dato>
                <Dato rotulo="Modalidad de pago">{conTexto(op.modalidadPagoNombre, op.modalidadPago, op.modalidadPagoTexto)}</Dato>
                <Dato rotulo="Moneda y monto">{`${op.monedaCodigo ?? op.moneda ?? ''} ${montoTexto(op.monto)}`.trim()}</Dato>
                <Dato rotulo="Origen de los fondos">{conTexto(op.origenFondosNombre, op.origenFondos, op.origenFondosTexto)}</Dato>
              </div>
              <div className={FILA2}>
                <Dato rotulo="N.º de comprobante">{textoOGuion(op.numeroComprobante)}</Dato>
                <Dato rotulo="Cuenta involucrada">{cuentas.length > 0 ? cuentas.join(' · ') : '—'}</Dato>
              </div>
              {/* El diseño del detalle no trae la descripción; se muestra solo si el registro la tiene (el formulario la pide). */}
              {op.descripcion && <Dato rotulo="Descripción">{op.descripcion}</Dato>}
            </div>
          </Tarjeta>

          <Tarjeta espacio="gap-[18px]" titulo="Beneficiarios">
            <ul className="flex flex-col gap-[18px]">
              {detalle.beneficiarios.map((b, i) => (
                <li key={`${b.nombre}-${i}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-line bg-paper px-3.5 py-3">
                  <span className="min-w-0 break-words text-[15px] font-medium leading-[normal] text-ink">{b.nombre}</span>
                  <span className="font-mono text-xs leading-[normal] tracking-[0.02em] text-muted">{documentoDe(b.tipoDocumento, b.tipoDocumentoNombre, b.numeroDocumento)}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>

        <div className="flex flex-col gap-4">
          <Tarjeta espacio="gap-[14px]" titulo="Estado" descripcion="Cómo va este registro." derecha={<InsigniaEstado estado={detalle.estado} largo />}>
            <div className="h-px bg-line" />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-ink" aria-hidden="true"><IconoUsuario className="h-[18px] w-[18px]" /></span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="font-mono text-[11px] leading-[normal] tracking-[0.04em] text-muted">Responsable</p>
                <p className={`break-words text-[15px] font-semibold leading-[normal] ${detalle.responsable ? 'text-ink' : 'text-warn'}`}>{detalle.responsable?.nombreCompleto ?? 'Sin asignar'}</p>
              </div>
              <button type="button" onClick={() => setCambiando(true)} className={`btn btn-secondary ${BTN}`}><IconoUsuario className="h-4 w-4" aria-hidden="true" /> {detalle.responsable ? 'Cambiar' : 'Asignar'}</button>
            </div>
            <FilaValor etiqueta="Umbral aplicable"><Pronto /></FilaValor>
            <FilaValor etiqueta="Monto">{montoConMoneda(op)}</FilaValor>
          </Tarjeta>

          <Tarjeta espacio="gap-3" titulo="Análisis de inusualidad" derecha={<Pronto />}>
            <p className="text-[15px] leading-[22px] text-muted">Esta operación no tiene análisis. Si notas una señal de alerta, regístrala y documenta tu decisión.</p>
            <div><BotonPronto icono={IconoTriangulo} className={BTN}>Marcar como inusual</BotonPronto></div>
          </Tarjeta>

          <Tarjeta espacio="gap-3" titulo="Historial reciente">
            {detalle.historialReciente.length > 0 && (
              <ul className="flex flex-col gap-3">
                {detalle.historialReciente.map((e, i) => (
                  <li key={`${e.id ?? 'anterior'}-${i}`} className="flex items-center gap-2.5">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                    <div className="flex min-w-0 flex-col gap-px">
                      <p className="text-[15px] font-medium leading-[normal] text-ink">{e.titulo}</p>
                      <p className="font-mono text-[11px] leading-[normal] tracking-[0.02em] text-muted">{fechaCorta(e.fecha)} · {e.usuario?.usuario ?? 'Sistema'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div><Link href={`/operaciones/${id}/historial`} className={`btn btn-secondary ${BTN}`}><IconoHistorial className="h-4 w-4" aria-hidden="true" /> Ver todo el historial</Link></div>
          </Tarjeta>
        </div>
      </div>

      {cambiando && (
        <CambiarResponsableModal
          id={id}
          numero={detalle.numeroRegistro}
          onCerrar={() => setCambiando(false)}
          onGuardado={(r) => {
            setAviso({ tipo: 'ok', texto: `${r.nombreCompleto} quedó como responsable de este registro.` });
            setCambiando(false);
            setVersion((v) => v + 1);
          }}
        />
      )}

      {elementoPdf}
    </PageShell>
  );
}
