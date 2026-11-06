'use client';

import { useEffect, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import Link from 'next/link';
import { History } from 'lucide-react';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoDescargar, IconoHistorial, IconoLapiz, IconoOjo, IconoReloj, IconoUsuario, IconoVisto } from '@/shared/ui/iconos';
import { EstadoVacio } from '@/shared/ui/kit';
import { fechaCorta, fechaHora } from '../lib/formato';
import { esNoEncontrada, operacionesService, type EventoHistorial, type HistorialRegistro as Historial, type TipoHistorial } from '../services/operacionesService';
import { BTN, ErrorPagina, FilaValor, Pronto, Tarjeta } from './piezas';

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

const PESTANAS: { valor: TipoHistorial; etiqueta: string; pronto?: boolean }[] = [
  { valor: 'TODO', etiqueta: 'Todo' },
  { valor: 'EDICION', etiqueta: 'Ediciones' },
  { valor: 'RESPONSABLE', etiqueta: 'Responsable' },
  { valor: 'DESCARGA', etiqueta: 'Descargas' },
  { valor: 'ANALISIS', etiqueta: 'Análisis', pronto: true },
];

const ICONO_DE_TIPO: Record<string, { icono: Icono; clase: string }> = {
  CREACION: { icono: IconoVisto, clase: 'bg-ok-soft text-ok' },
  EDICION: { icono: IconoLapiz, clase: 'bg-brand-soft text-brand' },
  RESPONSABLE: { icono: IconoUsuario, clase: 'border border-line bg-paper text-ink' },
  DESCARGA: { icono: IconoDescargar, clase: 'border border-line bg-paper text-ink' },
};

const PROTECCION = ['No se pueden borrar ni excluir registros', 'Cada cambio guarda el valor anterior y el motivo', 'Cada descarga queda anotada', 'Copia de seguridad del registro'];

function Evento({ e }: { e: EventoHistorial }) {
  const { icono: Icono, clase } = ICONO_DE_TIPO[e.tipo] ?? { icono: IconoReloj, clase: 'border border-line bg-paper text-muted' };
  const quien = e.sistema || !e.usuario ? 'Sistema' : e.usuario.nombreCompleto || e.usuario.usuario;
  return (
    <li className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-x-4 gap-y-2 border-t border-line py-[18px] pl-5 pr-6 first:border-t-0 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto]">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${clase}`} aria-hidden="true"><Icono className="h-[18px] w-[18px]" /></span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-base font-semibold leading-[normal] text-ink">{e.titulo}</p>
        {e.detalle && <p className="break-words text-sm leading-[21px] text-ink/80">{e.detalle}</p>}
        {e.motivo && <p className="break-words text-sm leading-[21px] text-muted">Motivo: {e.motivo}</p>}
      </div>
      <div className="col-start-2 flex min-w-0 flex-col items-start gap-0.5 sm:col-start-3 sm:max-w-[16rem] sm:items-end sm:text-right">
        <p className="break-words text-sm font-medium leading-[normal] text-ink">{quien}</p>
        <p className="font-mono text-[11px] leading-[normal] tracking-[0.02em] text-muted">{fechaHora(e.fecha)}</p>
      </div>
    </li>
  );
}

/** RO 7 · Historial de cambios: solo lectura, con pestañas por tipo de evento. */
export function HistorialRegistro({ id }: { id: number }) {
  const [tipo, setTipo] = useState<TipoHistorial>('TODO');
  const [intento, setIntento] = useState(0);
  const [respuesta, setRespuesta] = useState<{ clave: string; datos: Historial | null; error: string | null; noEncontrada: boolean } | null>(null);
  const clave = `${id}|${tipo}|${intento}`;
  const cargando = respuesta?.clave !== clave;
  const datos = respuesta?.datos ?? null;
  const error = respuesta && respuesta.clave === clave ? respuesta.error : null;

  useEffect(() => {
    let vigente = true;
    const pedida = `${id}|${tipo}|${intento}`;
    operacionesService
      .historial(id, tipo)
      .then((d) => { if (vigente) setRespuesta({ clave: pedida, datos: d, error: null, noEncontrada: false }); })
      .catch((err: unknown) => {
        if (!vigente) return;
        const noEncontrada = esNoEncontrada(err);
        setRespuesta((anterior) => ({ clave: pedida, datos: anterior?.datos ?? null, noEncontrada, error: noEncontrada ? 'No encontramos ese registro. Puede que no exista o que no sea de tu empresa.' : mensajeDe(err, 'No se pudo cargar el historial.') }));
      });
    return () => { vigente = false; };
  }, [id, tipo, intento]);

  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo={datos?.numeroRegistro ?? 'Registro de operaciones'}
        titulo="Historial de cambios"
        descripcion="Todo lo que se hizo con este registro: quién, cuándo y por qué. No se puede editar ni borrar."
        icono={IconoHistorial}
        sinLinea
        acciones={<Link href={`/operaciones/${id}`} className={`btn btn-secondary ${BTN}`}><IconoOjo className="h-4 w-4" aria-hidden="true" /> Volver al registro</Link>}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_clamp(21.25rem,24vw,28.75rem)]">
        <div className="flex min-w-0 flex-col gap-4">
          <div role="tablist" aria-label="Tipo de evento" className="flex flex-wrap items-start gap-2">
            {PESTANAS.map((p) => {
              const activa = p.valor === tipo;
              return (
                <button
                  key={p.valor}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  aria-disabled={p.pronto || undefined}
                  title={p.pronto ? 'Próximamente' : undefined}
                  onClick={() => { if (!p.pronto) setTipo(p.valor); }}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[13px] font-semibold leading-[normal] transition-colors ${activa ? 'bg-ink text-paper' : p.pronto ? 'cursor-not-allowed border border-line bg-white text-faint' : 'border border-line bg-white text-ink/80 hover:bg-paper'}`}
                >
                  {p.etiqueta}
                  {p.pronto && <Pronto />}
                </button>
              );
            })}
          </div>

          {error && !datos?.eventos ? (
            <ErrorPagina mensaje={error} onReintentar={respuesta?.noEncontrada ? undefined : () => setIntento((n) => n + 1)} volverHref={`/operaciones/${id}`} volverTexto="Volver al registro" />
          ) : (
            <section className="card overflow-hidden" aria-label="Eventos del registro" aria-busy={cargando}>
              {datos ? (
                datos.eventos.length > 0 ? (
                  <ul className={cargando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                    {datos.eventos.map((e, i) => <Evento key={`${e.id ?? 'anterior'}-${i}`} e={e} />)}
                  </ul>
                ) : (
                  <EstadoVacio icono={History} titulo="No hay eventos de este tipo" texto="Cuando haya movimientos de este tipo aparecerán aquí." />
                )
              ) : (
                <div className="space-y-px" role="status" aria-live="polite" aria-label="Cargando…">
                  {[0, 1, 2].map((i) => <div key={i} className="px-6 py-5"><div className="skeleton h-5 w-2/3" /><div className="skeleton mt-3 h-4 w-1/2" /></div>)}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Tarjeta espacio="gap-3" titulo="Cómo se protege">
            <ul className="flex flex-col gap-3">
              {PROTECCION.map((t) => (
                <li key={t} className="flex items-center gap-2.5 text-[15px] font-medium leading-[normal] text-ink">
                  <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand" aria-hidden="true"><IconoVisto className="h-3 w-3" /></span>
                  {t}
                </li>
              ))}
            </ul>
          </Tarjeta>
          <Tarjeta espacio="gap-3" titulo="Conservación" descripcion="Se conserva 5 años desde la operación.">
            {datos ? (
              <>
                <FilaValor etiqueta="Fecha de la operación">{fechaCorta(datos.fechaOperacion) ?? '—'}</FilaValor>
                <FilaValor etiqueta="Se conserva hasta">{fechaCorta(datos.conservarHasta) ?? '—'}</FilaValor>
              </>
            ) : (
              <div className="skeleton h-10 w-full" />
            )}
          </Tarjeta>
        </div>
      </div>
    </PageShell>
  );
}
