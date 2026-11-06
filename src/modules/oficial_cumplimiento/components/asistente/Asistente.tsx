'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { IconoOficial } from '@/shared/ui/iconos';
import { CAMPOS_PASO, DEPENDIENTES, aSolicitud, crearEsquema, datosVistaPrevia, pasoDeCampo, rutaDeCampo, valoresIniciales, type FormularioDesignacion } from '../../lib/designacion';
import { textoDeFalla } from '../../lib/errores';
import { enfocarPrimerError, subirAlInicio } from '../../lib/pantalla';
import { camposDeError, esTitularActivo, oficialService, type CatalogosOficial, type DatosVistaPrevia, type EstadoOficial } from '../../services/oficialService';
import { BTN, BarraGuia, RUTA_OFICIAL } from '../piezas';
import { PasoDatos } from './PasoDatos';
import { PasoDeclaraciones } from './PasoDeclaraciones';
import { PasoDesignacion } from './PasoDesignacion';
import { PasoRevision } from './PasoRevision';
import { PasosAsistente } from './PasosAsistente';
import { VistaPreviaDeclaracion } from './VistaPreviaDeclaracion';

/** Los cuatro pasos del asistente: el título sale del diseño; «Revisión y guardado» es el nombre que usa la lista de pasos de OC 0. */
const PASOS = [
  { titulo: 'Datos de la persona', descripcion: 'Completa los datos de la persona. Son los mismos que se piden en la solicitud a la UIF.' },
  { titulo: 'Designación', descripcion: 'Indica quién designa al oficial y adjunta el documento que lo acredita.' },
  { titulo: 'Declaraciones juradas', descripcion: 'Son dos declaraciones: una de la persona designada y otra de quien la designa.' },
  { titulo: 'Revisión y guardado', descripcion: 'Revisa todo antes de guardar. Puedes volver a cualquier paso para corregir.' },
];

/** Asistente «Designar oficial de cumplimiento» (OC 2 a OC 6): un solo formulario con cuatro pasos. */
export function Asistente({ estado, catalogos }: { estado: EstadoOficial; catalogos: CatalogosOficial }) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  // Datos con los que se abrió la vista previa de la declaración (null = cerrada). Se arman al abrir, así la ventana no cambia mientras se lee.
  const [vistaPrevia, setVistaPrevia] = useState<DatosVistaPrevia | null>(null);
  const [guardando, setGuardando] = useState(false);
  // El servidor dijo que ya hay un titular: además del aviso, se ofrece ir a verlo.
  const [titularActivo, setTitularActivo] = useState(false);
  const inicio = useRef<HTMLDivElement>(null);
  const esquema = useMemo(() => crearEsquema(catalogos), [catalogos]);
  const metodos = useForm<FormularioDesignacion>({
    resolver: zodResolver(esquema),
    defaultValues: valoresIniciales(catalogos, estado),
    mode: 'onTouched',
  });
  const { trigger, subscribe, getFieldState, getValues, setError } = metodos;

  // Un campo que ya tiene error se vuelve a validar mientras se corrige, para que el rojo se quite apenas queda bien.
  useEffect(
    () => subscribe({
      formState: { values: true },
      callback: ({ name }) => {
        if (!name) return;
        const campo = name as FieldPath<FormularioDesignacion>;
        const afectados = [campo, ...(DEPENDIENTES[campo] ?? [])].filter((c) => getFieldState(c).error);
        if (afectados.length > 0) void trigger(afectados);
      },
    }),
    [subscribe, trigger, getFieldState],
  );

  const irAlPaso = useCallback((nuevo: number) => {
    setPaso(nuevo);
    setAviso(null);
    // El que se desplaza es el panel principal: se sube hasta el inicio del asistente.
    requestAnimationFrame(() => subirAlInicio(inicio.current));
  }, []);

  const continuar = async () => {
    setAviso(null);
    const bien = await trigger(CAMPOS_PASO[paso]);
    if (!bien) {
      setAviso({ tipo: 'error', texto: 'Revisa los campos marcados en rojo.' });
      enfocarPrimerError();
      return;
    }
    irAlPaso(paso + 1);
  };

  // Guardar la designación: se revisa todo el formulario una vez más y, si el servidor rechaza algo, se marca el campo y se vuelve a su paso.
  const guardar = async () => {
    if (guardando) return;
    setAviso(null);
    setTitularActivo(false);
    const falla = (texto: string) => {
      setAviso({ tipo: 'error', texto });
      requestAnimationFrame(() => subirAlInicio(inicio.current));
    };

    if (!(await trigger())) {
      irAlPaso(Math.max(0, CAMPOS_PASO.findIndex((campos) => campos.some((c) => getFieldState(c).error))));
      setAviso({ tipo: 'error', texto: 'Falta completar o corregir algunos datos. Revisa los campos marcados en rojo.' });
      enfocarPrimerError();
      return;
    }

    setGuardando(true);
    try {
      await oficialService.designar(aSolicitud(getValues(), catalogos));
      // Ya guardada: los archivos quedaron ligados a la designación y la pantalla raíz pasa a mostrarla.
      router.push(RUTA_OFICIAL);
    } catch (error) {
      setGuardando(false);
      const texto = textoDeFalla(error, 'No se pudo guardar la designación. Inténtalo de nuevo.');
      if (esTitularActivo(error)) {
        setTitularActivo(true);
        return falla(texto ?? 'Ya hay un oficial de cumplimiento titular designado.');
      }
      const campos = camposDeError(error);
      if (campos) {
        const pasos: number[] = [];
        let sinCampo: string | null = null;
        for (const [clave, mensaje] of Object.entries(campos)) {
          const ruta = rutaDeCampo(clave);
          if (ruta) {
            setError(ruta, { type: 'servidor', message: mensaje });
            pasos.push(pasoDeCampo(ruta));
          } else {
            sinCampo ??= mensaje;
          }
        }
        if (pasos.length > 0) {
          irAlPaso(Math.min(...pasos));
          setAviso({ tipo: 'error', texto: 'El servidor no aceptó algunos datos. Revisa los campos marcados en rojo.' });
          enfocarPrimerError();
          return;
        }
        return falla(sinCampo ?? texto ?? 'No se pudo guardar la designación.');
      }
      falla(texto ?? 'No se pudo guardar la designación.');
    }
  };

  // Cancelar: los archivos que ya se subieron quedaron sueltos en el servidor; se pide borrarlos (sin esperar) y se vuelve al módulo.
  const cancelar = () => {
    const v = getValues();
    const subidos = [v.designacion.adjunto, v.declaraciones.requisitos.adjunto, v.declaraciones.designante.adjunto];
    for (const adjunto of subidos) if (adjunto) void oficialService.borrarAdjunto(adjunto.id).catch(() => undefined);
    router.push(RUTA_OFICIAL);
  };

  // Botones al pie de cada paso: en el primero se puede cancelar; en los demás, volver al paso anterior.
  const pie = (
    <>
      {paso === 0 ? (
        <button type="button" onClick={cancelar} className={`btn btn-secondary ${BTN}`}>Cancelar</button>
      ) : (
        <button type="button" onClick={() => irAlPaso(paso - 1)} disabled={guardando} className={`btn btn-secondary ${BTN}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Atrás
        </button>
      )}
      {paso < PASOS.length - 1 ? (
        <Boton type="submit" icono={ArrowRight} className={BTN}>Continuar</Boton>
      ) : (
        <Boton type="submit" icono={Check} cargando={guardando} className={BTN}>{guardando ? 'Guardando…' : 'Guardar designación'}</Boton>
      )}
    </>
  );

  return (
    <FormProvider {...metodos}>
      <PageShell ancho="amplio">
        <div ref={inicio} className="scroll-mt-4">
          <PageHeader
            antetitulo={`Paso ${paso + 1} de ${PASOS.length} · ${PASOS[paso].titulo}`}
            icono={IconoOficial}
            titulo="Designar oficial de cumplimiento"
            descripcion={PASOS[paso].descripcion}
            sinLinea
          />
          {/* Avisa a los lectores de pantalla en qué paso está la persona. */}
          <p className="sr-only" role="status" aria-live="polite">Paso {paso + 1} de {PASOS.length}: {PASOS[paso].titulo}</p>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void (paso < PASOS.length - 1 ? continuar() : guardar());
          }}
          className="flex flex-col gap-[18px]"
        >
          <BarraGuia />
          <PasosAsistente pasos={PASOS.map((p) => p.titulo)} actual={paso} />
          {aviso && (
            <div className="scroll-mt-6">
              <Aviso aviso={aviso} onCerrar={() => setAviso(null)}>
                {titularActivo && <Link href={RUTA_OFICIAL} className="mt-1.5 inline-block font-semibold underline underline-offset-2">Ver el oficial de cumplimiento</Link>}
              </Aviso>
            </div>
          )}

          {paso === 0 && <PasoDatos catalogos={catalogos} estado={estado} pie={pie} />}
          {paso === 1 && <PasoDesignacion catalogos={catalogos} pie={pie} />}
          {paso === 2 && <PasoDeclaraciones catalogos={catalogos} pie={pie} alVerVistaPrevia={() => setVistaPrevia(datosVistaPrevia(getValues()))} />}
          {paso === 3 && <PasoRevision catalogos={catalogos} pie={pie} alEditar={irAlPaso} deshabilitado={guardando} />}
        </form>

        {vistaPrevia && <VistaPreviaDeclaracion datos={vistaPrevia} onCerrar={() => setVistaPrevia(null)} />}
      </PageShell>
    </FormProvider>
  );
}
