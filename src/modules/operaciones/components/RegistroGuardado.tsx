'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { IconoDescargar, IconoMas, IconoOjo, IconoRecibo, IconoSubir, IconoTriangulo, IconoVisto } from '@/shared/ui/iconos';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, type AvisoDatos } from '@/shared/ui/kit';
import { fechaCorta, montoConMoneda, soloHora } from '../lib/formato';
import { esNoEncontrada, operacionesService, type DetalleOperacion } from '../services/operacionesService';
import { usePdfOperacion } from './PdfOperacion';
import { BTN, BTN_P, BotonPronto, Dato, ErrorPagina, EsqueletoPagina, FilaValor, InsigniaEstado, Pronto, Tarjeta } from './piezas';

const QUE_SE_GUARDO = ['Sello de fecha y hora del registro', 'Copia de seguridad del registro', 'Anotación en el historial de cambios'];

/** RO 4 · Registro guardado. Lee el registro del servidor, así que sigue funcionando si se recarga la página. */
export function RegistroGuardado({ id }: { id: number }) {
  const { usuario } = useAuth();
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; detalle: DetalleOperacion | null; error: string | null; noEncontrada: boolean } | null>(null);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const clave = `${id}|${intento}`;
  const actual = respuesta?.clave === clave ? respuesta : null;
  const detalle = actual?.detalle ?? null;
  const { abrir: abrirPdf, elemento: elementoPdf } = usePdfOperacion(useCallback((t: string) => setAviso({ tipo: 'error', texto: t }), []));

  useEffect(() => {
    let vigente = true;
    const pedida = `${id}|${intento}`;
    operacionesService
      .detalle(id)
      .then((d) => { if (vigente) setRespuesta({ clave: pedida, detalle: d, error: null, noEncontrada: false }); })
      .catch((err: unknown) => {
        if (!vigente) return;
        const noEncontrada = esNoEncontrada(err);
        setRespuesta({ clave: pedida, detalle: null, noEncontrada, error: noEncontrada ? 'No encontramos ese registro. Puede que no exista o que no sea de tu empresa.' : mensajeDe(err, 'No se pudo cargar el registro.') });
      });
    return () => { vigente = false; };
  }, [id, intento]);

  const acciones = (
    <div className="flex flex-wrap items-start gap-2.5">
      <Link href="/operaciones" className={`btn btn-secondary ${BTN}`}>Volver a la lista</Link>
      <Link href="/operaciones/nueva" className={`btn btn-primary ${BTN_P}`}><IconoMas className="h-4 w-4" aria-hidden="true" /> Nueva operación</Link>
    </div>
  );

  if (!detalle) {
    return (
      <PageShell ancho="amplio">
        <PageHeader antetitulo="Registro de operaciones" titulo="Registro guardado" icono={IconoRecibo} sinLinea acciones={acciones} />
        {actual?.error ? <ErrorPagina mensaje={actual.error} onReintentar={actual.noEncontrada ? undefined : () => setIntento((n) => n + 1)} /> : <EsqueletoPagina />}
      </PageShell>
    );
  }

  const { personaFisica: pf, personaRepresentada: pr, operacion: op, registro } = detalle;
  const hora = soloHora(registro.creadoEn);
  const nombrePf = [pf.apellidos, pf.nombres].map((x) => x?.trim()).filter(Boolean).join(', ');
  const representada = pr ? (pr.tipoPersona === 'JURIDICA' ? pr.razonSocial : [pr.apellidos, pr.nombres].map((x) => x?.trim()).filter(Boolean).join(', ')) : null;
  const esTuyo = detalle.responsable !== null && registro.usuario === usuario?.usuario;

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo="Registro de operaciones"
        titulo="Registro guardado"
        descripcion={`${detalle.numeroRegistro} quedó registrado el ${fechaCorta(registro.fechaRegistro) ?? ''}${hora ? ` a las ${hora}` : ''}, con copia de seguridad.`}
        icono={IconoRecibo}
        sinLinea
        acciones={acciones}
      />

      {aviso && <Aviso aviso={aviso} onCerrar={() => setAviso(null)} className="mb-5" />}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(21.25rem,24vw,28.75rem)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Tarjeta espacio="gap-5" className="!p-6 sm:!p-8">
            <div className="flex items-center gap-[18px]">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-ok-soft text-ok" aria-hidden="true"><IconoVisto className="h-[30px] w-[30px]" /></span>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold leading-[normal] text-ink">El registro se guardó correctamente</h2>
                <p className="mt-1 text-[15px] leading-[normal] text-muted">Ya aparece en la lista, con su PDF y su historial.</p>
              </div>
            </div>
            <div className="h-px bg-line" />
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Dato rotulo="N.º de registro">{detalle.numeroRegistro}</Dato>
              <Dato rotulo="Estado"><InsigniaEstado estado={detalle.estado} largo /></Dato>
              <Dato rotulo="Persona que realiza">{nombrePf || '—'}</Dato>
              <Dato rotulo="Representada">{representada || '—'}</Dato>
              <Dato rotulo="Operación">{op.tipoOperacionNombre ?? op.tipoOperacion ?? '—'}</Dato>
              <Dato rotulo="Monto">{montoConMoneda(op)}</Dato>
              <Dato rotulo="Fecha de la operación">{fechaCorta(op.fechaOperacion) ?? '—'}</Dato>
              <Dato rotulo="Responsable">{detalle.responsable ? `${detalle.responsable.nombreCompleto}${esTuyo ? ' (tú)' : ''}` : 'Sin asignar'}</Dato>
            </div>
            <div className="h-px bg-line" />
            <div className="flex flex-wrap items-center gap-2.5">
              <Link href={`/operaciones/${id}`} className={`btn btn-primary ${BTN_P}`}><IconoOjo className="h-4 w-4" aria-hidden="true" /> Ver registro</Link>
              <button type="button" onClick={() => abrirPdf(id, detalle.numeroRegistro)} className={`btn btn-secondary ${BTN}`}><IconoDescargar className="h-4 w-4" aria-hidden="true" /> Descargar PDF</button>
              <BotonPronto icono={IconoTriangulo} className={BTN}>Marcar como inusual</BotonPronto>
            </div>
          </Tarjeta>

          <Tarjeta espacio="gap-3" titulo="Qué se guardó">
            <ul className="flex flex-col gap-3">
              {QUE_SE_GUARDO.map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[15px] font-medium leading-[normal] text-ink">
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden="true"><IconoVisto className="h-3 w-3" /></span>
                  {t}
                </li>
              ))}
            </ul>
          </Tarjeta>
        </div>

        <div className="flex flex-col gap-4">
          <Tarjeta espacio="gap-[14px]" titulo="Siguiente paso" descripcion="Envío a la UIF-Perú." derecha={<InsigniaEstado estado={detalle.estado} />}>
            <p className="text-[15px] leading-[22px] text-muted">Este registro está pendiente de envío. Expórtalo junto con los demás del periodo en el formato de tu sector.</p>
            <div><BotonPronto icono={IconoSubir} className={BTN}>Exportar a la UIF</BotonPronto></div>
          </Tarjeta>
          <Tarjeta espacio="gap-3" titulo="Umbral" derecha={<Pronto />}>
            <FilaValor etiqueta="Monto de la operación">{montoConMoneda(op)}</FilaValor>
          </Tarjeta>
        </div>
      </div>

      {elementoPdf}
    </PageShell>
  );
}
