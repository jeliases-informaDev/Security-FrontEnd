'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Check, Lock } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { DEPENDIENTES_UIF, aSolicitudComunicacion, crearEsquemaComunicacion, resultadosPermitidos, rutaDeCampoComunicacion, valoresInicialesComunicacion, type FormularioComunicacion } from '../../lib/comunicacion';
import { textoDeFalla } from '../../lib/errores';
import { diasTexto, hoyIso } from '../../lib/formato';
import { enfocarPrimerError, subirAlInicio } from '../../lib/pantalla';
import { AMBITO_ADJUNTO, camposDeError, esCifradoNoConfigurado, oficialService, type CatalogosOficial, type FichaOficial } from '../../services/oficialService';
import { FilaAdjunto } from '../ArchivoDescargable';
import { CuerpoPaso } from '../asistente/CuerpoPaso';
import { CampoArchivo, CampoFecha, CampoSeleccion, CampoTexto, CampoTextoLargo } from '../campos';
import { BTN, FilaCheck, NotaLateral, RUTA_OFICIAL, Tarjeta } from '../piezas';
import { CampoCodigo } from './CampoCodigo';

/** Lo que cambia al guardar, según la respuesta que se registra (el diseño dibuja «Procedente»; las otras salen del contrato §9). */
function queCambia(resultado: string, ficha: FichaOficial): string[] {
  const plazo = ficha.plazoComunicacion;
  const cierraPlazo = plazo ? [`Se cierra el plazo de ${diasTexto(plazo.total, plazo.unidad)}`] : [];
  const historial = 'Se anota en el historial del oficial';
  if (resultado === 'PROCEDENTE') {
    return ficha.estado === 'VIGENTE'
      ? ['Se actualizan los códigos o la constancia', 'Los códigos quedan ocultos en la ficha', historial]
      : ['El estado pasa a «Vigente»', 'Los códigos quedan ocultos en la ficha', historial, ...cierraPlazo];
  }
  if (resultado === 'NO_PROCEDENTE') {
    return ['La designación vuelve a estar pendiente de comunicar', 'El motivo queda anotado en el historial del oficial', 'Después corriges los datos y la vuelves a comunicar'];
  }
  return [
    ficha.estado === 'EN_EVALUACION' ? 'El estado sigue en «En evaluación»' : 'El estado pasa a «En evaluación»',
    'La designación sigue en el cargo mientras la UIF responde',
    historial,
    ...cierraPlazo,
  ];
}

/** Subtítulo de la tarjeta de la constancia (la primera frase es la del diseño para «Procedente»). */
function ayudaConstancia(resultado: string): string {
  if (resultado === 'PROCEDENTE') return 'Notificación de designación procedente. Es opcional.';
  if (resultado === 'NO_PROCEDENTE') return 'Notificación con la observación de la UIF. Es opcional.';
  return 'Constancia de la solicitud presentada. Es opcional.';
}

/**
 * OC 8 · Comunicación a la UIF: se registra lo que ya se hizo en SISDEL (la solicitud) y cómo respondió la UIF, con los códigos secretos
 * y la constancia. Sirve para tres momentos (presentada, respuesta, y corregir códigos o constancia ya vigente): el servidor decide qué cabe.
 */
export function ComunicacionUif({ ficha, catalogos }: { ficha: FichaOficial; catalogos: CatalogosOficial }) {
  const router = useRouter();
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [hoy] = useState(hoyIso);
  const inicio = useRef<HTMLDivElement>(null);
  const esquema = useMemo(() => crearEsquemaComunicacion(catalogos, ficha), [catalogos, ficha]);
  const metodos = useForm<FormularioComunicacion>({
    resolver: zodResolver(esquema),
    defaultValues: valoresInicialesComunicacion(ficha),
    mode: 'onTouched',
  });
  const { control, subscribe, getFieldState, trigger, getValues, setError } = metodos;
  const resultado = useWatch({ control, name: 'resultado' });

  // Un campo que ya tiene error se vuelve a validar mientras se corrige (y los que dependen de él).
  useEffect(
    () => subscribe({
      formState: { values: true },
      callback: ({ name }) => {
        if (!name) return;
        const campo = name as keyof FormularioComunicacion;
        const afectados = [campo, ...(DEPENDIENTES_UIF[campo] ?? [])].filter((c) => getFieldState(c).error);
        if (afectados.length > 0) void trigger(afectados);
      },
    }),
    [subscribe, trigger, getFieldState],
  );

  const opciones = useMemo(() => {
    const permitidos = resultadosPermitidos(ficha.estado);
    return catalogos.resultadosUif.filter((r) => permitidos.includes(r.codigo)).map((r) => ({ value: r.codigo, label: r.nombre }));
  }, [catalogos.resultadosUif, ficha.estado]);
  const previa = ficha.comunicacion;
  const codigos = previa?.codigos;
  const cifradoNoDisponible = codigos ? !codigos.cifradoDisponible : false;

  const falla = (texto: string) => {
    setAviso({ tipo: 'error', texto });
    requestAnimationFrame(() => subirAlInicio(inicio.current));
  };

  const guardar = async () => {
    if (guardando) return;
    setAviso(null);
    if (!(await trigger())) {
      falla('Revisa los campos marcados en rojo.');
      enfocarPrimerError();
      return;
    }
    setGuardando(true);
    try {
      await oficialService.comunicar(ficha.id, aSolicitudComunicacion(getValues()));
      // Ya guardada: la pantalla raíz muestra el estado nuevo (vigente, en evaluación o pendiente con la observación).
      router.push(RUTA_OFICIAL);
    } catch (error) {
      setGuardando(false);
      const texto = textoDeFalla(error, 'No se pudo guardar la comunicación. Inténtalo de nuevo.');
      if (esCifradoNoConfigurado(error)) {
        return falla(texto ?? 'El servidor no puede guardar códigos secretos todavía. Guarda la comunicación sin los códigos y avisa a Sulotec.');
      }
      const campos = camposDeError(error);
      if (campos) {
        let sinCampo: string | null = null;
        let hayCampo = false;
        for (const [clave, mensaje] of Object.entries(campos)) {
          const ruta = rutaDeCampoComunicacion(clave);
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
        return falla(sinCampo ?? texto ?? 'No se pudo guardar la comunicación.');
      }
      falla(texto ?? 'No se pudo guardar la comunicación.');
    }
  };

  // Cancelar: la constancia que ya se subió quedó suelta en el servidor; se pide borrarla (sin esperar) y se vuelve al módulo.
  const cancelar = () => {
    const constancia = getValues('constancia');
    if (constancia) void oficialService.borrarAdjunto(constancia.id).catch(() => undefined);
    router.push(RUTA_OFICIAL);
  };

  const pie = (
    <>
      <button type="button" onClick={cancelar} disabled={guardando} className={`btn btn-secondary ${BTN}`}>Cancelar</button>
      <Boton type="submit" icono={Check} cargando={guardando} className={BTN}>{guardando ? 'Guardando…' : 'Guardar comunicación'}</Boton>
    </>
  );

  return (
    <FormProvider {...metodos}>
      <PageShell ancho="amplio">
        <div ref={inicio} className="scroll-mt-4">
          <PageHeader
            antetitulo="Oficial de cumplimiento"
            icono={Lock}
            titulo="Comunicación a la UIF"
            descripcion="Registra cómo respondió la UIF y guarda los códigos secretos. Son reservados: no los compartas."
            sinLinea
          />
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void guardar();
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
                <Tarjeta titulo="Qué cambia al guardar" className="!gap-3">
                  <div aria-live="polite" className="flex flex-col gap-3">
                    {queCambia(resultado, ficha).map((linea) => <FilaCheck key={linea}>{linea}</FilaCheck>)}
                  </div>
                </Tarjeta>
                <NotaLateral rotulo="Si la UIF lo observa">
                  Elige «No procedente», anota el motivo y corrige los datos. La designación vuelve a estar pendiente de comunicar.
                </NotaLateral>
              </>
            }
          >
            <Tarjeta titulo="Solicitud de designación" descripcion="Presentada por SISDEL.">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CampoFecha ruta="fechaComunicacion" texto="Fecha de comunicación" min={ficha.designacion.fechaDesignacion} max={hoy} />
                <CampoTexto ruta="numeroSolicitud" texto="N.º de solicitud en SISDEL" maxLength={50} />
                <CampoSeleccion
                  ruta="resultado"
                  texto="Resultado de la UIF"
                  opciones={opciones}
                  deshabilitado={opciones.length <= 1}
                  ayuda={ficha.estado === 'VIGENTE' ? 'La designación ya está vigente: aquí solo puedes agregar o cambiar los códigos y la constancia.' : undefined}
                />
                {resultado !== 'EN_EVALUACION' && <CampoFecha ruta="fechaNotificacion" texto="Fecha de notificación" min={ficha.designacion.fechaDesignacion} max={hoy} />}
                {resultado === 'NO_PROCEDENTE' && (
                  <CampoTextoLargo
                    ruta="motivoNoProcedente"
                    texto="Motivo que dio la UIF"
                    placeholder="Copia aquí lo que observó la UIF"
                    maxLength={1000}
                    className="sm:col-span-2"
                  />
                )}
              </div>
            </Tarjeta>

            {resultado === 'PROCEDENTE' && (
              <Tarjeta
                titulo="Códigos secretos"
                descripcion="Los asigna la UIF y sirven para identificar al oficial en todas las comunicaciones."
                derecha={<span className="badge badge-bad-solid shrink-0">Reservado</span>}
                centrada
              >
                <div className="flex items-start gap-3 rounded-xl bg-warn-soft/50 px-3.5 py-3">
                  <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warn" aria-hidden="true" />
                  <p className="min-w-0 flex-1 text-sm leading-[21px] text-ink">
                    Guárdalos solo aquí. No los compartas por correo ni mensajes. La UIF los envía al domicilio de la empresa registrado en la solicitud.
                  </p>
                </div>
                {cifradoNoDisponible ? (
                  <p role="status" className="rounded-xl border border-line bg-paper px-3.5 py-3 text-sm text-muted">
                    Códigos: no disponible. El servidor todavía no puede guardarlos de forma segura; avisa a Sulotec. Puedes guardar la comunicación sin ellos.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-muted">
                      {codigos?.reservados
                        ? 'Ya hay códigos guardados. Déjalos vacíos para conservarlos o escribe los nuevos para cambiarlos.'
                        : 'Son opcionales: puedes guardarlos ahora o agregarlos después desde la ficha.'}
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <CampoCodigo ruta="codigoEmpresa" texto="Código de la empresa" />
                      <CampoCodigo ruta="codigoOficial" texto="Código del oficial de cumplimiento" />
                    </div>
                  </>
                )}
              </Tarjeta>
            )}

            <Tarjeta titulo="Constancia de la UIF" descripcion={ayudaConstancia(resultado)}>
              {previa?.constancia && <FilaAdjunto rotulo="Constancia guardada" adjunto={previa.constancia} />}
              <CampoArchivo
                ruta="constancia"
                ambito={AMBITO_ADJUNTO.CONSTANCIA_UIF}
                rotulo={previa?.constancia ? 'Constancia nueva (reemplaza a la guardada)' : 'Constancia de la UIF'}
                reglas={catalogos.adjuntos}
                deshabilitado={guardando}
              />
            </Tarjeta>
          </CuerpoPaso>
        </form>
      </PageShell>
    </FormProvider>
  );
}
