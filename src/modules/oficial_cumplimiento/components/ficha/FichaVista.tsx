'use client';

import Link from 'next/link';
import { ArrowRight, History, Pencil, Plus } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Etiqueta } from '@/shared/ui/kit';
import { IconoOficial } from '@/shared/ui/iconos';
import { fechaCorta, minusculaInicial, reglaTexto, textoOGuion } from '../../lib/formato';
import type { CatalogosOficial, ComunicacionFicha, FichaOficial } from '../../services/oficialService';
import { FilaAdjunto } from '../ArchivoDescargable';
import { TarjetaPendientes } from '../comunicacion/TarjetaPendientes';
import { BTN, BotonPronto, Dato, EtiquetaServidor, FilaCheck, NotaLateral, NotaSoloLectura, RUTA_OFICIAL, Tarjeta } from '../piezas';
import { TarjetaDeclaraciones } from './TarjetaDeclaraciones';

const GRILLA = 'grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3';

/** Lo que dice la bajada de la cabecera, según en qué punto está la designación (todo sale de la ficha; no se calcula nada). */
function descripcionDeFicha(ficha: FichaOficial): string {
  const partes = [`Designación del ${fechaCorta(ficha.designacion.fechaDesignacion)} por ${ficha.designacion.nombreOrgano}.`];
  const comunicacion = ficha.comunicacion;
  switch (ficha.estado) {
    case 'VIGENTE':
      if (comunicacion?.fechaNotificacion) partes.push(`La UIF-Perú respondió que la designación es procedente el ${fechaCorta(comunicacion.fechaNotificacion)}.`);
      break;
    case 'EN_EVALUACION':
      if (comunicacion) partes.push(`Se presentó a la UIF-Perú el ${fechaCorta(comunicacion.fechaComunicacion)} y está en evaluación.`);
      break;
    case 'PENDIENTE_COMUNICAR':
      partes.push(
        ficha.observacionUif
          ? `La UIF-Perú respondió que no es procedente el ${fechaCorta(ficha.observacionUif.fechaNotificacion)}. Corrige los datos y vuelve a comunicarla.`
          : 'Falta comunicarla a la UIF-Perú.',
      );
      break;
    case 'REMOVIDA':
      if (ficha.remocion) partes.push(`Se removió el ${fechaCorta(ficha.remocion.fechaDecision)}.`);
      break;
  }
  return partes.join(' ');
}

/** Respuesta de la UIF como etiqueta: «Procedente · 12/11/2026». */
function RespuestaUif({ comunicacion }: { comunicacion: ComunicacionFicha | null }) {
  if (!comunicacion) return <Etiqueta>Sin comunicar</Etiqueta>;
  const tono = comunicacion.resultado === 'PROCEDENTE' ? 'ok' : comunicacion.resultado === 'NO_PROCEDENTE' ? 'bad' : 'brand';
  return <Etiqueta tono={tono}>{comunicacion.resultadoNombre}{comunicacion.fechaNotificacion ? ` · ${fechaCorta(comunicacion.fechaNotificacion)}` : ''}</Etiqueta>;
}

/** Los códigos secretos nunca vuelven del servidor: solo se dice si hay guardados. */
function textoCodigos(comunicacion: ComunicacionFicha | null): string {
  if (!comunicacion) return '—';
  if (comunicacion.codigos.reservados) return '•••••••• (reservados)';
  return comunicacion.codigos.cifradoDisponible ? 'Sin registrar' : 'No disponible';
}

/** Fila «nombre ··· frecuencia» de las obligaciones del cargo. */
function FilaObligacion({ nombre, frecuencia }: { nombre: string; frecuencia: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="min-w-0 flex-1 break-words text-[15px] font-medium text-ink">{nombre}</p>
      <p className="max-w-[45%] break-words text-right font-mono text-[11px] uppercase tracking-[0.04em] text-muted">{frecuencia}</p>
    </div>
  );
}

/**
 * OC 9 · Ficha del oficial de cumplimiento (también para los estados «Pendiente de comunicar» y «En evaluación», y para una designación
 * anterior). Los botones de la cabecera salen de los permisos que manda el servidor; lo que todavía no existe (alterno) queda «Pronto».
 */
export function FichaVista({ ficha, catalogos, recargar, idExplicito }: { ficha: FichaOficial; catalogos: CatalogosOficial; recargar: () => void; idExplicito?: string | null }) {
  const p = ficha.permisos;
  const { persona, cargo, designacion: d, comunicacion } = ficha;
  const sufijo = idExplicito ? `?id=${encodeURIComponent(idExplicito)}` : '';
  const maximoAlterno = reglaTexto(catalogos.reglas.find((r) => r.codigo === 'ALTERNO_MAXIMO'));
  const archivos = [d.adjunto, d.hojaVida, d.documentoVinculo, comunicacion?.constancia ?? null].filter((a) => a !== null);

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo={`Oficial de cumplimiento ${minusculaInicial(ficha.tipoCargoNombre)} · ${ficha.estadoEtiqueta}`}
        icono={IconoOficial}
        titulo={ficha.nombreCompleto}
        descripcion={descripcionDeFicha(ficha)}
        sinLinea
        acciones={
          <>
            <Link href={`${RUTA_OFICIAL}/historial${sufijo}`} className={`btn btn-secondary ${BTN}`}>
              <History className="h-4 w-4" aria-hidden="true" /> Historial
            </Link>
            {p.puedeCambiarDatos && (
              <Link href={`${RUTA_OFICIAL}/cambiar-datos`} className={`btn btn-secondary ${BTN}`}>
                <Pencil className="h-4 w-4" aria-hidden="true" /> Cambiar datos
              </Link>
            )}
            {p.puedeCorregir && <BotonPronto icono={Pencil} className={BTN}>Corregir los datos</BotonPronto>}
            {p.puedeRemover && <Link href={`${RUTA_OFICIAL}/remover`} className={`btn btn-secondary ${BTN}`}>Reemplazar o remover</Link>}
            {ficha.estado === 'VIGENTE' && <BotonPronto icono={Plus} className={BTN}>Designar alterno</BotonPronto>}
            {p.puedeComunicar && ficha.estado !== 'VIGENTE' && (
              <Link href={`${RUTA_OFICIAL}/comunicacion`} className={`btn btn-primary ${BTN}`}>
                <ArrowRight className="h-4 w-4" aria-hidden="true" /> {ficha.estado === 'EN_EVALUACION' ? 'Registrar respuesta' : 'Registrar comunicación'}
              </Link>
            )}
          </>
        }
      />
      {!p.puedeRegistrarPendientes && <NotaSoloLectura className="mb-5" />}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_clamp(19rem,33%,28.75rem)]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="card flex flex-wrap gap-2 !rounded-[18px] px-5 py-[18px]" aria-label="Estado del oficial">
            {ficha.etiquetas.map((etiqueta) => <EtiquetaServidor key={etiqueta.codigo} etiqueta={etiqueta} />)}
          </section>

          <TarjetaPendientes pendientes={ficha.pendientes} catalogos={catalogos} puedeRegistrar={p.puedeRegistrarPendientes} alGuardar={recargar} />

          <Tarjeta titulo="Datos de la persona" className="!gap-[18px]">
            <div className={GRILLA}>
              <Dato rotulo="Nombre">{ficha.nombreCompleto}</Dato>
              <Dato rotulo="Documento">{persona.documento}</Dato>
              <Dato rotulo="Nacionalidad">{persona.nacionalidadNombre}</Dato>
              <Dato rotulo="Teléfono">{textoOGuion(persona.telefono)}</Dato>
              <Dato rotulo="Correo">{persona.correo}</Dato>
              <Dato rotulo="Cargo">{cargo.cargo}</Dato>
              <Dato rotulo="Fecha de ingreso">{fechaCorta(cargo.fechaIngreso)}</Dato>
              <Dato rotulo="Vínculo">{cargo.vinculoNombre}</Dato>
              <Dato rotulo="Oficina">{cargo.direccionOficina}</Dato>
              <Dato rotulo="Fecha de nacimiento">{fechaCorta(persona.fechaNacimiento)}</Dato>
              <Dato rotulo="Domicilio" className="sm:col-span-2">{persona.domicilio}</Dato>
            </div>
          </Tarjeta>

          <Tarjeta
            titulo="Designación y comunicación a la UIF"
            className="!gap-[18px]"
            derecha={
              ficha.estado === 'VIGENTE' && p.puedeComunicar ? (
                <Link href={`${RUTA_OFICIAL}/comunicacion`} className="btn btn-secondary h-auto min-h-11 py-2 text-sm">
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Actualizar códigos o constancia
                </Link>
              ) : undefined
            }
            centrada
          >
            <div className={GRILLA}>
              <Dato rotulo="Designa">{d.nombreOrgano}</Dato>
              <Dato rotulo="Fecha de designación">{fechaCorta(d.fechaDesignacion)}</Dato>
              <Dato rotulo="Documento">{d.documentoTexto}</Dato>
              <Dato rotulo="Solicitud en SISDEL">{textoOGuion(comunicacion?.numeroSolicitud)}</Dato>
              <div className="min-w-0">
                <p className="rotulo !tracking-[0.04em]">Respuesta de la UIF</p>
                <div className="mt-1.5"><RespuestaUif comunicacion={comunicacion} /></div>
              </div>
              <Dato rotulo="Códigos secretos">{textoCodigos(comunicacion)}</Dato>
              {comunicacion?.resultado === 'NO_PROCEDENTE' && comunicacion.motivoNoProcedente && (
                <Dato rotulo="Motivo que dio la UIF" className="sm:col-span-2 lg:col-span-3">
                  <span className="whitespace-pre-line">{comunicacion.motivoNoProcedente}</span>
                </Dato>
              )}
            </div>
            {archivos.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <p className="rotulo">Archivos guardados</p>
                {archivos.map((archivo) => (
                  <FilaAdjunto key={archivo.id} rotulo={catalogos.ambitosAdjunto.find((o) => o.codigo === archivo.ambito)?.nombre ?? 'Archivo adjunto'} adjunto={archivo} />
                ))}
              </div>
            )}
          </Tarjeta>

          <TarjetaDeclaraciones ficha={ficha} />

          <Tarjeta
            titulo="Requisitos del cargo"
            descripcion="Declarados y revisados."
            derecha={ficha.revisionSugerida ? <Etiqueta tono="brand" className="shrink-0">Revisión sugerida {fechaCorta(ficha.revisionSugerida)}</Etiqueta> : undefined}
            centrada
            className="!gap-2.5"
          >
            {ficha.requisitosCargo.map((requisito) => <FilaCheck key={requisito}>{requisito}</FilaCheck>)}
          </Tarjeta>
        </div>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Obligaciones y oficial alterno">
          <Tarjeta titulo="Obligaciones del cargo" descripcion="Art. 12." className="!gap-3">
            {catalogos.obligaciones.map((obligacion) => <FilaObligacion key={obligacion.nombre} nombre={obligacion.nombre} frecuencia={obligacion.frecuencia} />)}
          </Tarjeta>

          <Tarjeta titulo="Oficial alterno" descripcion="Cubre ausencias o vacancia del titular." derecha={<Etiqueta tono="warn" className="shrink-0">Sin alterno</Etiqueta>} centrada className="!gap-3">
            <p className="text-sm leading-[21px] text-ink/80">
              Si el titular se ausenta, el alterno cumple sus funciones{maximoAlterno ? ` hasta ${maximoAlterno}` : ''}. Debe estar designado y comunicado a la UIF antes.
            </p>
            <BotonPronto icono={Plus} className={`self-start ${BTN}`}>Designar alterno</BotonPronto>
          </Tarjeta>

          <NotaLateral rotulo="Identidad reservada">
            En todas las comunicaciones con la UIF se usan los códigos secretos, no el nombre. La designación no se inscribe en Registros Públicos.
          </NotaLateral>
        </aside>
      </div>
    </PageShell>
  );
}
