'use client';

import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { IconoAlerta, IconoFlecha, IconoVisto } from '@/shared/ui/iconos';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { useAvisoPendiente } from '../lib/aviso';
import { textoDeFalla } from '../lib/errores';
import { fechaHora } from '../lib/formato';
import { ahoraLocal, tiempoRestante } from '../lib/formatoB';
import { useCarga } from '../lib/useCarga';
import { camposDeError, codigoDeError, operacionesService, type Ros } from '../services/operacionesService';
import { CAMPO, CAMPO_BORDE, Dato, ErrorPagina, EsqueletoPagina, Tarjeta } from './piezas';
import { BTN_B, BTN_PB, CampoB, NotaLateral, REJILLA_B } from './piezasB';

/** Dirección de ROSEL tal como la escribe el diseño en el paso 3 («plaft.sbs.gob.pe»). Hay que confirmarla con la SBS antes de publicar. */
const ROSEL_URL = 'https://plaft.sbs.gob.pe';
/** El plazo de la norma: 24 horas desde la calificación (el servidor cuenta lo mismo en `venceEn`). */
const PLAZO_SEGUNDOS = 24 * 60 * 60;

const DESCRIPCION = 'Sigue los pasos para comunicarlo a la UIF-Perú por ROSEL. Tienes 24 horas desde la calificación.';
const MAX_NUMERO_ROS = 50;
const SIN_ROS = 'Este registro todavía no está calificado como sospechoso, por eso no tiene un ROS que preparar.';

const ahoraMs = () => Date.now();

/** «03/11/2026 · 11:30». */
const fechaYHora = (iso: string | null): string => fechaHora(iso).replace(' ', ' · ');

function Marco({ antetitulo, id, children }: { antetitulo?: string; id: number; children: ReactNode }) {
  return (
    <PageShell ancho="amplio">
      <PageHeader
        antetitulo={antetitulo ?? 'Registro de operaciones'}
        titulo="Preparar el ROS"
        descripcion={DESCRIPCION}
        icono={IconoAlerta}
        sinLinea
        acciones={<Link href={`/operaciones/${id}/inusual`} className={`btn btn-secondary ${BTN_B}`}>Volver al análisis</Link>}
      />
      {children}
    </PageShell>
  );
}

/** RO 13 · /operaciones/{id}/ros — los pasos para comunicar el ROS por ROSEL y dejar aquí la constancia del número. */
export function PrepararRos({ id }: { id: number }) {
  const carga = useCarga(`ros-${id}`, () => operacionesService.ros(id), 'No se pudo cargar el ROS de este registro.');
  const [avisoInicial, setAvisoInicial] = useAvisoPendiente();
  if (!carga.datos) {
    const sinRos = carga.codigo === 'OPERACIONES_SIN_ROS';
    return (
      <Marco id={id}>
        {carga.error
          ? (
            <ErrorPagina
              mensaje={sinRos ? SIN_ROS : carga.error}
              onReintentar={carga.noEncontrada || sinRos ? undefined : carga.recargar}
              volverHref={sinRos ? `/operaciones/${id}/inusual` : `/operaciones/${id}`}
              volverTexto={sinRos ? 'Ir al análisis' : 'Volver al registro'}
            />
          )
          : <EsqueletoPagina />}
      </Marco>
    );
  }
  return <ContenidoRos id={id} inicial={carga.datos} avisoInicial={avisoInicial} onCerrarAvisoInicial={() => setAvisoInicial(null)} />;
}

type EstadoPaso = 'hecho' | 'activo' | 'pendiente';

/** Un paso de la lista: círculo con el número (o el visto si ya está hecho), título y el contenido del paso. */
function Paso({ numero, estado, titulo, children }: { numero: number; estado: EstadoPaso; titulo: string; children: ReactNode }) {
  const circulo = estado === 'hecho' ? 'bg-ok-soft text-ok' : estado === 'activo' ? 'bg-brand text-white' : 'border border-line bg-white text-ink/50';
  const lectura = estado === 'hecho' ? 'completado' : estado === 'activo' ? 'en curso' : 'pendiente';
  return (
    <li aria-current={estado === 'activo' ? 'step' : undefined} className={`flex items-start gap-4 px-5 py-[22px] sm:px-6 ${estado === 'activo' ? 'bg-paper' : ''}`}>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${circulo}`} aria-hidden="true">
        {estado === 'hecho' ? <IconoVisto className="h-4 w-4" /> : numero}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 className="text-[17px] font-semibold leading-[normal] text-ink">
          <span className="sr-only">Paso {numero}, {lectura}: </span>
          {titulo}
        </h2>
        {children}
      </div>
    </li>
  );
}

const TEXTO_PASO = 'text-[15px] leading-[22px] text-muted';

function ContenidoRos({ id, inicial, avisoInicial, onCerrarAvisoInicial }: { id: number; inicial: Ros; avisoInicial: AvisoDatos | null; onCerrarAvisoInicial: () => void }) {
  const [ros, setRos] = useState<Ros>(inicial);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const cerrado = ros.estadoPlazo === 'CERRADO' || ros.numeroRos !== null;
  const listos = ros.datosListos;

  const guardado = (nuevo: Ros) => {
    setRos(nuevo);
    setAviso({ tipo: 'ok', texto: 'Número de ROS guardado. Quedó anotado en el historial del registro.' });
    requestAnimationFrame(() => document.getElementById('aviso-ros')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  };

  return (
    <Marco id={id} antetitulo={`${ros.numeroRegistro} · Operación sospechosa`}>
      <div className={REJILLA_B}>
        <div className="flex min-w-0 flex-col gap-5">
          {avisoInicial && !aviso && <Aviso aviso={avisoInicial} onCerrar={onCerrarAvisoInicial} />}
          {aviso && <div id="aviso-ros" className="scroll-mt-6"><Aviso aviso={aviso} onCerrar={() => setAviso(null)} /></div>}

          <section aria-label="Pasos para preparar el ROS" className="card">
            <ol className="divide-y divide-line">
              <Paso numero={1} estado="hecho" titulo="Operación calificada como sospechosa">
                <p className={TEXTO_PASO}>
                  {fechaYHora(ros.calificadaEn)}{ros.calificadaPor ? ` · por ${ros.calificadaPor}` : ''}. El análisis quedó guardado como constancia.
                </p>
              </Paso>

              <Paso numero={2} estado={listos ? 'hecho' : 'activo'} titulo={listos ? 'Datos listos para el ROS' : 'Faltan datos para el ROS'}>
                <p className={TEXTO_PASO}>
                  {listos
                    ? 'Fecha, tipo, monto, moneda, medio y forma de pago, origen de los fondos, comprobante, descripción y participantes.'
                    : 'Completa en el registro los datos que faltan (mira «Datos mínimos» a la derecha) antes de enviar el ROS.'}
                </p>
                {!listos && (
                  <div className="mt-1.5">
                    <Link href={`/operaciones/${id}/editar`} className={`btn btn-secondary ${BTN_B}`}>Completar el registro</Link>
                  </div>
                )}
              </Paso>

              <Paso numero={3} estado={cerrado ? 'hecho' : listos ? 'activo' : 'pendiente'} titulo="Envía el ROS por ROSEL">
                <p className={TEXTO_PASO}>Entra a ROSEL en plaft.sbs.gob.pe con el usuario del oficial de cumplimiento y carga la plantilla ROSEL con estos datos.</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                  <a href={ROSEL_URL} target="_blank" rel="noopener noreferrer" className={`btn btn-primary ${BTN_PB}`}>
                    <IconoFlecha className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Abrir ROSEL (sitio de la SBS)
                    <span className="sr-only"> (se abre en otra pestaña)</span>
                  </a>
                  <span className="badge badge-brand !leading-[normal]">Se abre fuera de PLAFT</span>
                </div>
              </Paso>

              <Paso numero={4} estado={cerrado ? 'hecho' : 'pendiente'} titulo="Registra el número de ROS">
                {cerrado
                  ? <ConstanciaRos ros={ros} />
                  : <FormularioNumero id={id} ros={ros} onGuardado={guardado} onError={(texto) => setAviso({ tipo: 'error', texto })} />}
              </Paso>
            </ol>
          </section>
        </div>

        <div className="flex flex-col gap-4 xl:sticky xl:top-4">
          <TarjetaPlazo key={`${ros.estadoPlazo}|${ros.restanteSegundos}`} ros={ros} />

          <Tarjeta titulo="Datos mínimos" descripcion={listos ? 'Todos completos.' : 'Faltan algunos datos.'} espacio="gap-3">
            <ul className="flex flex-col gap-2.5">
              {ros.datosMinimos.map((d) => (
                <li key={d.codigo} className="flex items-center gap-2.5">
                  <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full ${d.completo ? 'bg-brand-soft text-brand' : 'bg-warn-soft text-warn'}`} aria-hidden="true">
                    {d.completo ? <IconoVisto className="h-3 w-3" /> : <IconoAlerta className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1 text-[15px] font-medium leading-[normal] text-ink">
                    {d.nombre}
                    <span className="sr-only">{d.completo ? ': completo' : ': falta'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Tarjeta>

          <NotaLateral rotulo="Reserva">El ROS es confidencial: no se avisa al cliente ni a terceros, y no es una denuncia penal ni administrativa.</NotaLateral>
        </div>
      </div>
    </Marco>
  );
}

/** «Tiempo restante»: cuenta regresiva con los segundos que mandó el servidor (se refresca sola cada pocos segundos). */
function TarjetaPlazo({ ros }: { ros: Ros }) {
  const [inicio] = useState(ahoraMs);
  const [ahora, setAhora] = useState(inicio);
  const enCurso = ros.estadoPlazo === 'EN_PLAZO';

  useEffect(() => {
    if (!enCurso) return undefined;
    const reloj = setInterval(() => setAhora(ahoraMs()), 15_000);
    return () => clearInterval(reloj);
  }, [enCurso]);

  const restante = enCurso ? Math.max(0, ros.restanteSegundos - Math.floor((ahora - inicio) / 1000)) : 0;
  const vencido = ros.estadoPlazo === 'VENCIDO' || (enCurso && restante === 0);
  const cerrado = ros.estadoPlazo === 'CERRADO';
  const transcurrido = vencido ? 100 : Math.min(100, Math.max(0, ((PLAZO_SEGUNDOS - restante) / PLAZO_SEGUNDOS) * 100));

  const etiqueta = cerrado
    ? <span className={`badge ${ros.enviadoFueraDePlazo ? 'badge-bad' : 'badge-ok'} !leading-[normal]`}>{ros.enviadoFueraDePlazo ? 'Fuera de plazo' : 'Enviado'}</span>
    : vencido
      ? <span className="badge badge-bad !leading-[normal]">Vencido</span>
      : <span className="badge badge-ok !leading-[normal]">En plazo</span>;

  return (
    <Tarjeta titulo={cerrado ? 'Plazo del ROS' : 'Tiempo restante'} descripcion={cerrado ? 'Con el número de ROS ya registrado.' : 'Desde la calificación.'} derecha={etiqueta} espacio="gap-3">
      <p className={`break-words text-[40px] font-bold leading-[normal] tracking-[-0.02em] ${vencido ? 'text-bad' : 'text-ink'}`}>
        {cerrado ? 'Cerrado' : vencido ? 'Plazo vencido' : tiempoRestante(restante)}
      </p>
      {!cerrado && (
        <div
          role="progressbar"
          aria-label="Parte del plazo de 24 horas que ya pasó"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(transcurrido)}
          className="flex h-2 overflow-hidden rounded-full bg-ink/8"
        >
          <div className={`h-2 rounded-full ${vencido ? 'bg-bad' : 'bg-brand'}`} style={{ width: `${transcurrido}%` }} />
        </div>
      )}
      <p className="text-sm leading-[21px] text-muted">
        {cerrado
          ? (ros.enviadoFueraDePlazo ? 'El ROS se envió pasadas las 24 horas del plazo de la norma.' : 'El ROS se envió dentro del plazo de 24 horas.')
          : vencido
            ? 'Pasaron más de 24 horas desde la calificación sin registrar el número de ROS.'
            : 'Si pasan 24 horas sin enviarlo, el plazo de la norma se incumple.'}
      </p>
    </Tarjeta>
  );
}

/** Paso 4 ya hecho: el número y la hora de envío guardados, y quién los registró. */
function ConstanciaRos({ ros }: { ros: Ros }) {
  return (
    <>
      <p className={TEXTO_PASO}>El número de ROS quedó guardado como constancia en este registro.</p>
      <div className="mt-1.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Dato rotulo="N.º de ROS">{ros.numeroRos ?? '—'}</Dato>
        <Dato rotulo="Fecha y hora de envío">{fechaYHora(ros.enviadoEn) || '—'}</Dato>
      </div>
      {(ros.registradoPor || ros.registradoEn) && (
        <p className="text-sm leading-[21px] text-muted">
          Registrado{ros.registradoPor ? ` por ${ros.registradoPor}` : ''}{ros.registradoEn ? ` el ${fechaYHora(ros.registradoEn)}` : ''}.
        </p>
      )}
    </>
  );
}

/** Paso 4 pendiente: N.º de ROS y fecha-hora de envío. Solo el administrador puede guardarlos (`puedeRegistrar`). */
function FormularioNumero({ id, ros, onGuardado, onError }: { id: number; ros: Ros; onGuardado: (ros: Ros) => void; onError: (texto: string) => void }) {
  const [numero, setNumero] = useState('');
  const [enviadoEn, setEnviadoEn] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const bloqueado = !ros.puedeRegistrar || guardando;
  const claseCampo = (campo: string) => `input ${CAMPO} ${errores[campo] ? 'input-error' : CAMPO_BORDE}`;
  const ariaError = (campo: string) => (errores[campo] ? { 'aria-invalid': true as const, 'aria-describedby': `ros-${campo}-error` } : {});

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const faltas: Record<string, string> = {};
    const limpio = numero.trim();
    if (!limpio) faltas.numeroRos = 'Escribe el número de ROS que te dio ROSEL.';
    else if (limpio.length > MAX_NUMERO_ROS) faltas.numeroRos = `El número de ROS admite hasta ${MAX_NUMERO_ROS} caracteres.`;
    if (!enviadoEn) faltas.enviadoEn = 'Indica la fecha y la hora en que enviaste el ROS.';
    else if (enviadoEn > ahoraLocal()) faltas.enviadoEn = 'La fecha y hora de envío no pueden ser futuras.';
    else if (enviadoEn < ros.calificadaEn.slice(0, 16)) faltas.enviadoEn = 'El envío no puede ser anterior a la calificación como sospechosa.';
    setErrores(faltas);
    if (Object.keys(faltas).length > 0) return;

    setGuardando(true);
    try {
      onGuardado(await operacionesService.guardarRos(id, { numeroRos: limpio, enviadoEn: enviadoEn.length === 16 ? `${enviadoEn}:00` : enviadoEn }));
    } catch (err) {
      const campos = camposDeError(err);
      if (campos) setErrores(Object.fromEntries(Object.entries(campos).map(([clave, mensaje]) => [clave.split('.').pop() ?? clave, mensaje])));
      const texto = textoDeFalla(err, codigoDeError(err) === 'OPERACIONES_ROS_YA_REGISTRADO' ? 'Este ROS ya tiene un número registrado. Recarga la página para verlo.' : 'No se pudo guardar el número de ROS. Revisa los datos e inténtalo de nuevo.');
      if (texto) onError(texto);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
      <p className={TEXTO_PASO}>Cuando ROSEL te dé el número, anótalo aquí para dejar la constancia en este registro.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CampoB id="ros-numeroRos" texto="N.º de ROS" error={errores.numeroRos}>
          <input
            id="ros-numeroRos"
            type="text"
            autoComplete="off"
            placeholder="Ej. ROS-2026-001234"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            disabled={bloqueado}
            className={claseCampo('numeroRos')}
            {...ariaError('numeroRos')}
          />
        </CampoB>
        <CampoB id="ros-enviadoEn" texto="Fecha y hora de envío" error={errores.enviadoEn}>
          <input
            id="ros-enviadoEn"
            type="datetime-local"
            value={enviadoEn}
            onChange={(e) => setEnviadoEn(e.target.value)}
            disabled={bloqueado}
            className={claseCampo('enviadoEn')}
            {...ariaError('enviadoEn')}
          />
        </CampoB>
      </div>
      {ros.puedeRegistrar
        ? (
          <div>
            <Boton type="submit" icono={IconoVisto} className={BTN_PB} cargando={guardando}>Guardar número de ROS</Boton>
          </div>
        )
        : <p className="text-sm leading-[21px] text-muted">Solo el administrador de tu empresa puede registrar el número de ROS.</p>}
    </form>
  );
}
