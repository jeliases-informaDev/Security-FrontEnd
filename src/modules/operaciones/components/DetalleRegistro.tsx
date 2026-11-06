'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, FileText, Pencil, Receipt, UserRound } from 'lucide-react';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso } from '@/shared/ui/kit';
import { useAvisoPendiente } from '../lib/aviso';
import { fechaCorta, montoConMoneda, montoTexto, soloHora, textoOGuion } from '../lib/formato';
import { esNoEncontrada, operacionesService, type DetalleOperacion, type PersonaDetalle } from '../services/operacionesService';
import { CambiarResponsableModal } from './CambiarResponsableModal';
import { usePdfOperacion } from './PdfOperacion';
import { BTN, BotonPronto, Dato, ErrorPagina, EsqueletoPagina, FilaValor, InsigniaEstado, Pronto, Tarjeta } from './piezas';

/** «Av. Larco 1301, Miraflores, Lima»: junta lo que haya sin repetir (provincia y departamento suelen llamarse igual). */
function direccion(p: PersonaDetalle): string {
  const partes = [p.domicilio, p.distrito, p.provincia, p.departamento].map((x) => x?.trim()).filter((x): x is string => !!x);
  return partes.filter((x, i) => x !== partes[i - 1]).join(', ');
}

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
        <PageHeader antetitulo="Detalle del registro" titulo="Registro" icono={Receipt} sinLinea />
        {actual?.error ? <ErrorPagina mensaje={actual.error} onReintentar={actual.noEncontrada ? undefined : () => setVersion((v) => v + 1)} /> : <EsqueletoPagina />}
      </PageShell>
    );
  }

  const { personaFisica: pf, personaRepresentada: pr, operacion: op, registro } = detalle;
  const hora = soloHora(registro.creadoEn);
  const quien = registro.usuarioNombre ?? registro.usuario;
  const cuentas = [op.cuenta1, op.cuenta2, op.cuenta3].filter((c): c is string => !!c && c.trim() !== '');

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Detalle del registro"
        titulo={detalle.numeroRegistro}
        descripcion={`Registrado el ${fechaCorta(registro.fechaRegistro) ?? ''}${hora ? ` a las ${hora}` : ''} por ${quien} · Oficina ${registro.oficina}.`}
        icono={Receipt}
        sinLinea
        acciones={
          <>
            <Link href={`/operaciones/${id}/historial`} className={`btn btn-secondary ${BTN}`}><Clock className="h-4 w-4" aria-hidden="true" /> Historial</Link>
            <button type="button" onClick={() => abrirPdf(id, detalle.numeroRegistro)} className={`btn btn-secondary ${BTN}`}><FileText className="h-4 w-4" aria-hidden="true" /> PDF</button>
            <Link href={`/operaciones/${id}/editar`} className={`btn btn-primary ${BTN}`}><Pencil className="h-4 w-4" aria-hidden="true" /> Editar</Link>
          </>
        }
      />

      {aviso && <Aviso aviso={aviso} onCerrar={() => setAviso(null)} className="mb-5" />}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Tarjeta titulo="Persona que realiza la operación">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <Dato rotulo="Nombre">{textoOGuion(nombreDe(pf))}</Dato>
              <Dato rotulo="Documento">{documentoDe(pf.tipoDocumento, pf.tipoDocumentoNombre, pf.numeroDocumento, pf.motivoSinDocumento)}</Dato>
              <Dato rotulo="Fecha de nacimiento">{fechaCorta(pf.fechaNacimiento) ?? '—'}</Dato>
              <Dato rotulo="Nacionalidad">{textoOGuion(pf.nacionalidad)}</Dato>
              <Dato rotulo="Teléfono">{textoOGuion(pf.telefono)}</Dato>
              <Dato rotulo="Ocupación">{textoOGuion(pf.ocupacion)}</Dato>
              <Dato rotulo="Estado civil">{textoOGuion(pf.estadoCivilNombre ?? pf.estadoCivil)}</Dato>
              <Dato rotulo="Domicilio" className="sm:col-span-1 lg:col-span-2">{textoOGuion(direccion(pf))}</Dato>
            </div>
          </Tarjeta>

          <Tarjeta titulo="Persona representada" descripcion="En nombre de quien se hizo la operación.">
            {pr ? (
              pr.tipoPersona === 'JURIDICA' ? (
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Dato rotulo="Razón social">{textoOGuion(pr.razonSocial)}</Dato>
                  <Dato rotulo={pr.tipoDocumentoNombre ?? pr.tipoDocumento ?? 'Documento'}>{textoOGuion(pr.numeroDocumento) === '—' ? textoOGuion(pr.motivoSinDocumento) : pr.numeroDocumento}</Dato>
                  <Dato rotulo="Representante legal">{textoOGuion(pr.representanteLegal)}</Dato>
                  <Dato rotulo="Documento del representante">{pr.representanteNumeroDocumento ? documentoDe(pr.representanteTipoDocumento, pr.representanteTipoDocumentoNombre, pr.representanteNumeroDocumento) : '—'}</Dato>
                  <Dato rotulo="Accionistas con más del 25 %">{textoOGuion(pr.accionistasMayores25)}</Dato>
                  <Dato rotulo="Domicilio fiscal">{textoOGuion(pr.domicilioFiscal)}</Dato>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Dato rotulo="Nombre">{textoOGuion(nombreDe(pr))}</Dato>
                  <Dato rotulo="Documento">{documentoDe(pr.tipoDocumento, pr.tipoDocumentoNombre, pr.numeroDocumento, pr.motivoSinDocumento)}</Dato>
                </div>
              )
            ) : (
              <p className="text-sm text-muted">No aplica para este registro.</p>
            )}
          </Tarjeta>

          <Tarjeta titulo="Operación">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <Dato rotulo="Fecha de la operación">{fechaCorta(op.fechaOperacion) ?? '—'}</Dato>
              <Dato rotulo="Lugar">{textoOGuion(op.lugar)}</Dato>
              <Dato rotulo="Tipo de operación">{textoOGuion(op.tipoOperacionNombre ?? op.tipoOperacion)}</Dato>
              <Dato rotulo="Modalidad de pago">{conTexto(op.modalidadPagoNombre, op.modalidadPago, op.modalidadPagoTexto)}</Dato>
              <Dato rotulo="Moneda y monto">{`${op.monedaCodigo ?? op.moneda ?? ''} ${montoTexto(op.monto)}`.trim()}</Dato>
              <Dato rotulo="Origen de los fondos">{conTexto(op.origenFondosNombre, op.origenFondos, op.origenFondosTexto)}</Dato>
              <Dato rotulo="N.º de comprobante">{textoOGuion(op.numeroComprobante)}</Dato>
              <Dato rotulo="Cuenta involucrada" className="lg:col-span-2">{cuentas.length > 0 ? cuentas.join(' · ') : '—'}</Dato>
              {op.descripcion && <Dato rotulo="Descripción" className="sm:col-span-2 lg:col-span-3">{op.descripcion}</Dato>}
            </div>
          </Tarjeta>

          <Tarjeta titulo="Beneficiarios">
            <ul className="flex flex-col gap-3">
              {detalle.beneficiarios.map((b, i) => (
                <li key={`${b.nombre}-${i}`} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-line bg-white px-4 py-3">
                  <span className="min-w-0 break-words text-sm font-medium text-ink">{b.nombre}</span>
                  <span className="font-mono text-xs text-muted">{documentoDe(b.tipoDocumento, b.tipoDocumentoNombre, b.numeroDocumento)}</span>
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>

        <div className="flex flex-col gap-5">
          <Tarjeta titulo="Estado" descripcion="Cómo va este registro." derecha={<InsigniaEstado estado={detalle.estado} largo />}>
            <div className="flex items-center gap-3 border-t border-line pt-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-muted" aria-hidden="true"><UserRound className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="rotulo !normal-case">Responsable</p>
                <p className={`truncate text-sm font-semibold ${detalle.responsable ? 'text-ink' : 'text-warn'}`}>{detalle.responsable?.nombreCompleto ?? 'Sin asignar'}</p>
              </div>
              <button type="button" onClick={() => setCambiando(true)} className="btn btn-secondary btn-sm"><UserRound className="h-4 w-4" aria-hidden="true" /> {detalle.responsable ? 'Cambiar' : 'Asignar'}</button>
            </div>
            <div className="flex flex-col gap-2.5">
              <FilaValor etiqueta="Umbral aplicable"><Pronto /></FilaValor>
              <FilaValor etiqueta="Monto">{montoConMoneda(op)}</FilaValor>
            </div>
          </Tarjeta>

          <Tarjeta titulo="Análisis de inusualidad" derecha={<Pronto />}>
            <p className="text-sm leading-relaxed text-muted">Esta operación no tiene análisis. Si notas una señal de alerta, regístrala y documenta tu decisión.</p>
            <div><BotonPronto icono={AlertTriangle}>Marcar como inusual</BotonPronto></div>
          </Tarjeta>

          <Tarjeta titulo="Historial reciente">
            {detalle.historialReciente.length > 0 && (
              <ul className="flex flex-col gap-3">
                {detalle.historialReciente.map((e, i) => (
                  <li key={`${e.id ?? 'anterior'}-${i}`} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{e.titulo}</p>
                      <p className="font-mono text-[11px] text-muted">{fechaCorta(e.fecha)} · {e.usuario?.usuario ?? 'Sistema'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div><Link href={`/operaciones/${id}/historial`} className="btn btn-secondary btn-sm"><Clock className="h-4 w-4" aria-hidden="true" /> Ver todo el historial</Link></div>
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
