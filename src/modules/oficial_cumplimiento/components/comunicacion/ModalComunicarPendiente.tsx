'use client';

import { useId, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { Boton } from '@/shared/ui/kit';
import { aSolicitudPendiente, crearEsquemaPendiente, rutaDeCampoPendiente, valoresInicialesPendiente, type FormularioPendiente } from '../../lib/comunicacion';
import { textoDeFalla } from '../../lib/errores';
import { fechaCorta, hoyIso } from '../../lib/formato';
import { enfocarPrimerError } from '../../lib/pantalla';
import { AMBITO_ADJUNTO, camposDeError, codigoDeError, oficialService, type CatalogosOficial, type Pendiente } from '../../services/oficialService';
import { CampoArchivo, CampoFecha, CampoTexto, CampoTextoLargo } from '../campos';
import { BTN } from '../piezas';
import { Ventana } from '../Ventana';

/**
 * «Registrar comunicación» de un pendiente (cambio de datos o remoción): se anota cuándo se le comunicó a la UIF, con el número de la
 * solicitud, una nota y la constancia, que son opcionales. Al guardar, el pendiente se cierra y queda anotado en el historial.
 */
export function ModalComunicarPendiente({ pendiente, catalogos, onCerrar, onGuardado }: { pendiente: Pendiente; catalogos: CatalogosOficial; onCerrar: () => void; onGuardado: () => void }) {
  const idFormulario = useId();
  const [hoy] = useState(hoyIso);
  const [guardando, setGuardando] = useState(false);
  const [falla, setFalla] = useState<string | null>(null);
  const desde = pendiente.plazo?.desde ?? null;
  const esquema = useMemo(() => crearEsquemaPendiente(desde), [desde]);
  const metodos = useForm<FormularioPendiente>({ resolver: zodResolver(esquema), defaultValues: valoresInicialesPendiente(), mode: 'onTouched' });
  const { handleSubmit, setError, getValues } = metodos;

  const guardar = handleSubmit(async (valores) => {
    if (guardando) return;
    setGuardando(true);
    setFalla(null);
    try {
      await oficialService.registrarComunicacionPendiente(pendiente.id, aSolicitudPendiente(valores));
      onGuardado();
    } catch (error) {
      // Otra persona ya lo comunicó: no hay nada más que hacer, se actualiza la lista.
      if (codigoDeError(error) === 'OC_YA_COMUNICADO') return onGuardado();
      setGuardando(false);
      const texto = textoDeFalla(error, 'No se pudo guardar la comunicación. Inténtalo de nuevo.');
      const campos = camposDeError(error);
      let sinCampo: string | null = null;
      let hayCampo = false;
      for (const [clave, mensaje] of Object.entries(campos ?? {})) {
        const ruta = rutaDeCampoPendiente(clave);
        if (ruta) {
          setError(ruta, { type: 'servidor', message: mensaje });
          hayCampo = true;
        } else {
          sinCampo ??= mensaje;
        }
      }
      if (hayCampo) {
        setFalla('El servidor no aceptó algunos datos. Revisa los campos marcados en rojo.');
        enfocarPrimerError();
        return;
      }
      setFalla(sinCampo ?? texto ?? 'No se pudo guardar la comunicación.');
    }
  });

  // Cancelar: la constancia que ya se subió quedó suelta en el servidor; se pide borrarla (sin esperar).
  const cancelar = () => {
    const constancia = getValues('constancia');
    if (constancia) void oficialService.borrarAdjunto(constancia.id).catch(() => undefined);
    onCerrar();
  };

  return (
    <FormProvider {...metodos}>
      <Ventana
        titulo="Registrar comunicación"
        rotulo={pendiente.titulo}
        ancho={640}
        fondo="blanco"
        cerrarAlPulsarFuera={false}
        onCerrar={cancelar}
        pie={
          <>
            <button type="button" onClick={cancelar} disabled={guardando} className={`btn btn-secondary ${BTN}`}>Cancelar</button>
            <Boton type="submit" form={idFormulario} icono={Check} cargando={guardando} className={BTN}>{guardando ? 'Guardando…' : 'Guardar comunicación'}</Boton>
          </>
        }
      >
        <form id={idFormulario} noValidate onSubmit={(e) => { e.preventDefault(); void guardar(); }} className="flex flex-col gap-4">
          {pendiente.detalle && (
            <div className="rounded-xl border border-line bg-paper px-4 py-3">
              <p className="rotulo">Qué hay que comunicar</p>
              <p className="mt-1 whitespace-pre-line break-words text-[15px] leading-[22px] text-ink">{pendiente.detalle}</p>
            </div>
          )}
          {pendiente.plazo && <p className="text-sm text-muted">El plazo corre desde el {fechaCorta(pendiente.plazo.desde)} y vence el {fechaCorta(pendiente.plazo.vence)}.</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoFecha ruta="fecha" texto="Fecha en que lo comunicaste" min={desde ?? undefined} max={hoy} />
            <CampoTexto ruta="numeroSolicitud" texto="N.º de solicitud en SISDEL" opcional maxLength={50} />
            <CampoTextoLargo ruta="nota" texto="Nota" opcional maxLength={500} filas={3} placeholder="Por ejemplo: presentado por SISDEL" className="sm:col-span-2" />
          </div>
          <div>
            <p className="label">Constancia <span className="font-normal text-muted">(opcional)</span></p>
            <CampoArchivo ruta="constancia" ambito={AMBITO_ADJUNTO.CONSTANCIA_COMUNICACION} rotulo="Constancia de la comunicación" reglas={catalogos.adjuntos} deshabilitado={guardando} />
          </div>
          {falla && <p role="alert" className="error-text">{falla}</p>}
        </form>
      </Ventana>
    </FormProvider>
  );
}
