'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Check, Pencil } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { ETIQUETAS_DATOS, aSolicitudCambio, cambiosDetectados, crearEsquemaCambio, datosActuales, rutaDeCampoCambio, valoresInicialesCambio, type FormularioCambioDatos } from '../../lib/cambioDatos';
import { textoDeFalla } from '../../lib/errores';
import { hoyIso, plural, reglaTexto } from '../../lib/formato';
import { enfocarPrimerError, subirAlInicio } from '../../lib/pantalla';
import { camposDeError, oficialService, type CatalogosOficial, type FichaOficial } from '../../services/oficialService';
import { AvisoLila } from '../AvisoLila';
import { CuerpoPaso } from '../asistente/CuerpoPaso';
import { CampoFecha, CampoTextoLargo } from '../campos';
import { BTN, RUTA_OFICIAL, Tarjeta } from '../piezas';
import { TarjetaPlazoCalculado } from '../TarjetaPlazoCalculado';
import { CampoDato } from './CampoDato';

/** Regla del plazo para comunicar un cambio de datos a la UIF (el valor y la unidad los fija el servidor). */
const REGLA_COMUNICAR_CAMBIO = 'PLAZO_COMUNICAR_CAMBIO';

/**
 * OC 10 · Cambiar datos: corrige el contacto y el cargo de un oficial ya comunicado a la UIF. El valor anterior se conserva en el
 * historial y el servidor abre un pendiente «Comunicar el cambio a la UIF» con su plazo. Quien no puede escribir ni llega aquí.
 */
export function CambiarDatos({ ficha, catalogos }: { ficha: FichaOficial; catalogos: CatalogosOficial }) {
  const router = useRouter();
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [hoy] = useState(hoyIso);
  const inicio = useRef<HTMLDivElement>(null);
  const actuales = useMemo(() => datosActuales(ficha), [ficha]);
  const esquema = useMemo(() => crearEsquemaCambio(ficha), [ficha]);
  const metodos = useForm<FormularioCambioDatos>({
    resolver: zodResolver(esquema),
    defaultValues: valoresInicialesCambio(ficha),
    mode: 'onTouched',
  });
  const { control, subscribe, getFieldState, trigger, getValues, setError } = metodos;
  const [telefono, correo, domicilio, cargo, direccionOficina, fechaCambio] = useWatch({ control, name: ['telefono', 'correo', 'domicilio', 'cargo', 'direccionOficina', 'fechaCambio'] });
  const cambios = cambiosDetectados({ telefono, correo, domicilio, cargo, direccionOficina }, actuales);

  // Un campo que ya tiene error (de la validación o del servidor) se vuelve a validar mientras se corrige.
  useEffect(
    () => subscribe({
      formState: { values: true },
      callback: ({ name }) => {
        if (!name) return;
        const campo = name as keyof FormularioCambioDatos;
        if (getFieldState(campo).error) void trigger(campo);
      },
    }),
    [subscribe, trigger, getFieldState],
  );

  const falla = (texto: string) => {
    setAviso({ tipo: 'error', texto });
    requestAnimationFrame(() => subirAlInicio(inicio.current));
  };

  const guardar = async () => {
    if (guardando) return;
    setAviso(null);
    if (cambiosDetectados(getValues(), actuales).length === 0) {
      falla('No cambiaste ningún dato. Modifica al menos uno para guardar.');
      return;
    }
    if (!(await trigger())) {
      falla('Revisa los campos marcados en rojo.');
      enfocarPrimerError();
      return;
    }
    setGuardando(true);
    try {
      await oficialService.cambiarDatos(ficha.id, aSolicitudCambio(getValues(), actuales));
      // Ya guardado: la ficha muestra los datos nuevos y el pendiente de comunicar el cambio a la UIF.
      router.push(RUTA_OFICIAL);
    } catch (error) {
      setGuardando(false);
      const texto = textoDeFalla(error, 'No se pudieron guardar los cambios. Inténtalo de nuevo.');
      const campos = camposDeError(error);
      if (campos) {
        let sinCampo: string | null = null;
        let hayCampo = false;
        for (const [clave, mensaje] of Object.entries(campos)) {
          const ruta = rutaDeCampoCambio(clave);
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
        return falla(sinCampo ?? texto ?? 'No se pudieron guardar los cambios.');
      }
      falla(texto ?? 'No se pudieron guardar los cambios.');
    }
  };

  const plazoCambio = reglaTexto(catalogos.reglas.find((r) => r.codigo === REGLA_COMUNICAR_CAMBIO));
  const ocurrioAntes = fechaCambio !== '' && fechaCambio !== hoy;

  const pie = (
    <>
      <Link href={RUTA_OFICIAL} className={`btn btn-secondary ${BTN}`}>Cancelar</Link>
      <Boton type="submit" icono={Check} cargando={guardando} className={BTN}>{guardando ? 'Guardando…' : 'Guardar cambios'}</Boton>
    </>
  );

  return (
    <FormProvider {...metodos}>
      <PageShell ancho="amplio">
        <div ref={inicio} className="scroll-mt-4">
          <PageHeader
            antetitulo={ficha.nombreCompleto}
            icono={Pencil}
            titulo="Cambiar datos"
            descripcion={
              plazoCambio
                ? `Cualquier cambio en los datos del oficial debe comunicarse al supervisor en un máximo de ${plazoCambio}.`
                : 'Cualquier cambio en los datos del oficial debe comunicarse al supervisor dentro del plazo que fija la norma.'
            }
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
                <Tarjeta
                  titulo="Cambios detectados"
                  descripcion={cambios.length === 0 ? 'Todavía no cambiaste ningún dato.' : `${plural(cambios.length, 'campo modificado', 'campos modificados')}.`}
                  className="!gap-3"
                >
                  {cambios.length > 0 && (
                    <ul aria-live="polite" className="flex flex-col gap-3">
                      {cambios.map((c) => (
                        <li key={c.campo} className="flex flex-col gap-1.5 rounded-xl border border-line bg-[#fbfbfc] px-3.5 py-3">
                          <p className="rotulo !tracking-[0.04em]">{ETIQUETAS_DATOS[c.campo]}</p>
                          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="sr-only">Antes: </span>
                            <span className="min-w-0 break-words text-sm text-muted [overflow-wrap:anywhere]">{c.antes || '(vacío)'}</span>
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                            <span className="sr-only">Ahora: </span>
                            <span className="min-w-0 break-words text-[15px] font-semibold text-brand-ink [overflow-wrap:anywhere]">{c.despues || '(vacío)'}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </Tarjeta>
                <TarjetaPlazoCalculado
                  regla={REGLA_COMUNICAR_CAMBIO}
                  desde={fechaCambio || hoy}
                  catalogos={catalogos}
                  titulo="Comunicar a la UIF"
                  descripcion={ocurrioAntes ? 'Desde la fecha en que ocurrió el cambio.' : 'Desde que guardas el cambio.'}
                  rotuloDesde={ocurrioAntes ? 'Cambio ocurrido el' : 'Cambio registrado'}
                />
              </>
            }
          >
            <AvisoLila titulo="El valor anterior se conserva">
              Puedes corregir los datos de contacto y del cargo. Para cambiar a la persona, usa «Reemplazar o remover».
            </AvisoLila>

            <Tarjeta titulo="Datos de contacto y del cargo">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CampoDato campo="telefono" texto="Teléfono" actuales={actuales} opcional tipo="tel" maxLength={30} autoComplete="tel" />
                <CampoDato campo="correo" texto="Correo electrónico" actuales={actuales} tipo="email" maxLength={150} autoComplete="email" />
                <CampoDato campo="domicilio" texto="Domicilio" actuales={actuales} maxLength={255} autoComplete="street-address" className="sm:col-span-2" />
                <CampoDato campo="cargo" texto="Cargo que desempeña" actuales={actuales} maxLength={150} />
                <CampoDato campo="direccionOficina" texto="Dirección de la oficina" actuales={actuales} maxLength={255} />
              </div>
            </Tarjeta>

            <Tarjeta titulo="Motivo del cambio" descripcion="Obligatorio." derecha={<span className="badge badge-bad-solid shrink-0">Obligatorio</span>} centrada>
              <CampoTextoLargo ruta="motivo" texto="Motivo del cambio" rotuloOculto placeholder="Explica por qué cambian los datos del oficial." maxLength={500} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <CampoFecha
                  ruta="fechaCambio"
                  texto="Fecha en que ocurrió el cambio"
                  opcional
                  min={ficha.designacion.fechaDesignacion}
                  max={hoy}
                  ayuda="Si la dejas vacía se usa la de hoy. El plazo para comunicar a la UIF cuenta desde esta fecha."
                />
              </div>
            </Tarjeta>
          </CuerpoPaso>
        </form>
      </PageShell>
    </FormProvider>
  );
}
