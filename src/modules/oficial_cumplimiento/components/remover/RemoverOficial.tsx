'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { IconoAlerta } from '@/shared/ui/iconos';
import { textoDeFalla } from '../../lib/errores';
import { fechaCorta, hoyIso, reglaTexto } from '../../lib/formato';
import { enfocarPrimerError, subirAlInicio } from '../../lib/pantalla';
import { DEPENDIENTES_REMOCION, MOTIVO_DECISION_EMPRESA, aSolicitudRemocion, crearEsquemaRemocion, rutaDeCampoRemocion, valoresInicialesRemocion, type FormularioRemocion } from '../../lib/remocion';
import { AMBITO_ADJUNTO, camposDeError, oficialService, type CatalogosOficial, type FichaOficial } from '../../services/oficialService';
import { CuerpoPaso } from '../asistente/CuerpoPaso';
import { CampoArchivo, CampoFecha, CampoTexto, CampoTextoLargo } from '../campos';
import { CampoOpciones } from '../CampoOpciones';
import { BTN, FilaCheck, RUTA_OFICIAL, Tarjeta } from '../piezas';
import { Ventana } from '../Ventana';
import { TarjetaPlazosRemocion } from './TarjetaPlazosRemocion';

const REGLA_COMUNICAR_REMOCION = 'PLAZO_COMUNICAR_REMOCION';

/**
 * OC 12 · Reemplazar o remover: la empresa registra por qué el oficial deja el cargo (decisión de la empresa, incumplimiento de un
 * requisito o vacancia), con el sustento, quién lo aprobó y el acta. El cargo queda vacante y se abre el pendiente de comunicarlo a la UIF.
 * «Reemplazar» es remover y, ya con el cargo vacante, designar a un nuevo oficial. Como no se puede deshacer, antes de guardar se pide confirmar.
 */
export function RemoverOficial({ ficha, catalogos }: { ficha: FichaOficial; catalogos: CatalogosOficial }) {
  const router = useRouter();
  const idMotivo = useId();
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [hoy] = useState(hoyIso);
  const inicio = useRef<HTMLDivElement>(null);
  const esquema = useMemo(() => crearEsquemaRemocion(catalogos, ficha), [catalogos, ficha]);
  const metodos = useForm<FormularioRemocion>({
    resolver: zodResolver(esquema),
    defaultValues: valoresInicialesRemocion(catalogos),
    mode: 'onTouched',
  });
  const { control, subscribe, getFieldState, trigger, getValues, setError } = metodos;
  const [motivo, fechaDecision] = useWatch({ control, name: ['motivo', 'fechaDecision'] });
  const esDecision = motivo === MOTIVO_DECISION_EMPRESA;

  // Un campo que ya tiene error (de la validación o del servidor) se vuelve a validar mientras se corrige (y los que dependen de él).
  useEffect(
    () => subscribe({
      formState: { values: true },
      callback: ({ name }) => {
        if (!name) return;
        const campo = name as keyof FormularioRemocion;
        const afectados = [campo, ...(DEPENDIENTES_REMOCION[campo] ?? [])].filter((c) => getFieldState(c).error);
        if (afectados.length > 0) void trigger(afectados);
      },
    }),
    [subscribe, trigger, getFieldState],
  );

  const falla = (texto: string) => {
    setAviso({ tipo: 'error', texto });
    requestAnimationFrame(() => subirAlInicio(inicio.current));
  };

  // «Registrar remoción»: se revisan los campos y, si están bien, se pide confirmar.
  const revisar = async () => {
    if (guardando) return;
    setAviso(null);
    if (!(await trigger())) {
      falla('Revisa los campos marcados en rojo.');
      enfocarPrimerError();
      return;
    }
    setConfirmando(true);
  };

  const registrar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      await oficialService.remover(ficha.id, aSolicitudRemocion(getValues()));
      // Ya registrada: la pantalla raíz muestra el cargo vacante, con lo que falta comunicar y el botón para designar a otro oficial.
      router.push(RUTA_OFICIAL);
    } catch (error) {
      setGuardando(false);
      setConfirmando(false);
      const texto = textoDeFalla(error, 'No se pudo registrar la remoción. Inténtalo de nuevo.');
      const campos = camposDeError(error);
      if (campos) {
        let sinCampo: string | null = null;
        let hayCampo = false;
        for (const [clave, mensaje] of Object.entries(campos)) {
          const ruta = rutaDeCampoRemocion(clave);
          if (ruta) {
            setError(ruta, { type: 'servidor', message: mensaje });
            hayCampo = true;
          } else {
            sinCampo ??= mensaje;
          }
        }
        if (hayCampo) {
          falla('El servidor no aceptó algunos datos. Revisa los campos marcados en rojo.');
          enfocarPrimerError();
          return;
        }
        return falla(sinCampo ?? texto ?? 'No se pudo registrar la remoción.');
      }
      falla(texto ?? 'No se pudo registrar la remoción.');
    }
  };

  // Cancelar: el acta que ya se subió quedó suelta en el servidor; se pide borrarla (sin esperar) y se vuelve al módulo.
  const cancelar = () => {
    const acta = getValues('acta');
    if (acta) void oficialService.borrarAdjunto(acta.id).catch(() => undefined);
    router.push(RUTA_OFICIAL);
  };

  const opciones = catalogos.motivosRemocion.map((m) => ({ valor: m.codigo, titulo: m.nombre, ayuda: m.ayuda, pronto: !m.disponible }));
  const plazoComunicar = reglaTexto(catalogos.reglas.find((r) => r.codigo === REGLA_COMUNICAR_REMOCION));
  const motivoElegido = catalogos.motivosRemocion.find((m) => m.codigo === motivo);

  const pie = (
    <>
      <button type="button" onClick={cancelar} disabled={guardando} className={`btn btn-secondary ${BTN}`}>Cancelar</button>
      <Boton type="submit" icono={AlertTriangle} className={BTN}>Registrar remoción</Boton>
    </>
  );

  return (
    <FormProvider {...metodos}>
      <PageShell ancho="amplio">
        <div ref={inicio} className="scroll-mt-4">
          <PageHeader
            antetitulo={ficha.nombreCompleto}
            icono={IconoAlerta}
            titulo="Reemplazar o remover"
            descripcion={
              plazoComunicar
                ? `La remoción necesita sustento, la aprueba quien designó al oficial y se comunica a la UIF en ${plazoComunicar}.`
                : 'La remoción necesita sustento, la aprueba quien designó al oficial y se comunica a la UIF dentro del plazo que fija la norma.'
            }
            sinLinea
          />
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void revisar();
          }}
          className="flex flex-col gap-[18px]"
        >
          {aviso && (
            <div className="scroll-mt-6">
              <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />
            </div>
          )}

          <CuerpoPaso
            pie={pie}
            lateral={
              <>
                <TarjetaPlazosRemocion fechaDecision={fechaDecision} catalogos={catalogos} />
                <Tarjeta titulo="Después de la remoción" className="!gap-3">
                  <FilaCheck>El cargo queda vacante</FilaCheck>
                  <FilaCheck>Debes comunicar la remoción a la UIF</FilaCheck>
                  <FilaCheck>Designas a un nuevo oficial con los pasos de siempre</FilaCheck>
                </Tarjeta>
              </>
            }
          >
            <section className="card flex flex-col gap-[18px] p-5 sm:p-6" aria-labelledby={idMotivo}>
              <div>
                <h2 id={idMotivo} className="text-[17px] font-semibold leading-[25px] tracking-[-0.01em] text-ink">Motivo</h2>
                <p className="mt-0.5 text-sm text-muted">Elige qué ocurrió.</p>
              </div>
              <CampoOpciones ruta="motivo" opciones={opciones} etiquetadoPor={idMotivo} />
            </section>

            <Tarjeta titulo="Sustento y aprobación" className="!gap-[18px]">
              <CampoTextoLargo ruta="razones" texto="Razones que justifican la medida" maxLength={2000} filas={4} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CampoTexto ruta="aprobadaPor" texto="Aprobada por" opcional={!esDecision} maxLength={255} />
                <CampoFecha ruta="fechaDecision" texto="Fecha de la decisión" min={ficha.designacion.fechaDesignacion} max={hoy} />
              </div>
              <CampoArchivo
                ruta="acta"
                ambito={AMBITO_ADJUNTO.ACTA_REMOCION}
                rotulo={esDecision ? 'Acta o documento de la decisión' : 'Acta o documento de la decisión (opcional)'}
                reglas={catalogos.adjuntos}
                deshabilitado={guardando}
              />
            </Tarjeta>
          </CuerpoPaso>
        </form>

        {confirmando && (
          <Ventana
            titulo="¿Registrar la remoción?"
            rotulo="Esta acción no se puede deshacer"
            ancho={560}
            fondo="blanco"
            cerrarAlPulsarFuera={!guardando}
            onCerrar={() => { if (!guardando) setConfirmando(false); }}
            pie={
              <>
                <button type="button" onClick={() => setConfirmando(false)} disabled={guardando} className={`btn btn-secondary ${BTN}`}>Volver al formulario</button>
                <Boton variante="peligro" icono={AlertTriangle} cargando={guardando} onClick={() => void registrar()} className={BTN}>
                  {guardando ? 'Registrando…' : 'Registrar remoción'}
                </Boton>
              </>
            }
          >
            <div className="flex flex-col gap-3 text-[15px] leading-[22px] text-ink">
              <p className="break-words">
                <strong className="font-semibold">{ficha.nombreCompleto}</strong> dejará de ser oficial de cumplimiento y el cargo quedará vacante.
                {plazoComunicar && ` Tendrás ${plazoComunicar} para comunicarlo a la UIF.`}
              </p>
              <dl className="flex flex-col gap-2 rounded-xl border border-line bg-paper px-4 py-3 text-sm">
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted">Motivo</dt>
                  <dd className="min-w-0 break-words text-right font-semibold text-ink">{motivoElegido?.nombre ?? '—'}</dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted">Fecha de la decisión</dt>
                  <dd className="font-semibold tabular-nums text-ink">{fechaCorta(fechaDecision) || '—'}</dd>
                </div>
              </dl>
            </div>
          </Ventana>
        )}
      </PageShell>
    </FormProvider>
  );
}
