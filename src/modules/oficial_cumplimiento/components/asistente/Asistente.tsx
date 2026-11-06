'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { IconoOficial } from '@/shared/ui/iconos';
import { CAMPOS_PASO, DEPENDIENTES, crearEsquema, datosVistaPrevia, valoresIniciales, type FormularioDesignacion } from '../../lib/designacion';
import { enfocarPrimerError, subirAlInicio } from '../../lib/pantalla';
import { oficialService, type CatalogosOficial, type DatosVistaPrevia, type EstadoOficial } from '../../services/oficialService';
import { BTN, BarraGuia, RUTA_OFICIAL, Tarjeta } from '../piezas';
import { PasoDatos } from './PasoDatos';
import { PasoDeclaraciones } from './PasoDeclaraciones';
import { PasoDesignacion } from './PasoDesignacion';
import { PasosAsistente } from './PasosAsistente';
import { VistaPreviaDeclaracion } from './VistaPreviaDeclaracion';

/** Los cuatro pasos del asistente: el título sale del diseño; «Revisión y guardado» es el nombre que usa la lista de pasos de OC 0. */
const PASOS = [
  { titulo: 'Datos de la persona', descripcion: 'Completa los datos de la persona. Son los mismos que se piden en la solicitud a la UIF.' },
  { titulo: 'Designación', descripcion: 'Indica quién designa al oficial y adjunta el documento que lo acredita.' },
  { titulo: 'Declaraciones juradas', descripcion: 'Son dos declaraciones: una de la persona designada y otra de quien la designa.' },
  { titulo: 'Revisión y guardado', descripcion: '' },
];

/** Asistente «Designar oficial de cumplimiento» (OC 2 a OC 6): un solo formulario con cuatro pasos. */
export function Asistente({ estado, catalogos }: { estado: EstadoOficial; catalogos: CatalogosOficial }) {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  // Datos con los que se abrió la vista previa de la declaración (null = cerrada). Se arman al abrir, así la ventana no cambia mientras se lee.
  const [vistaPrevia, setVistaPrevia] = useState<DatosVistaPrevia | null>(null);
  const inicio = useRef<HTMLDivElement>(null);
  const esquema = useMemo(() => crearEsquema(catalogos), [catalogos]);
  const metodos = useForm<FormularioDesignacion>({
    resolver: zodResolver(esquema),
    defaultValues: valoresIniciales(catalogos, estado),
    mode: 'onTouched',
  });
  const { handleSubmit, trigger, subscribe, getFieldState, getValues } = metodos;

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

  const alEnviar = handleSubmit(() => undefined);

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
        <button type="button" onClick={() => irAlPaso(paso - 1)} className={`btn btn-secondary ${BTN}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Atrás
        </button>
      )}
      <Boton type="submit" icono={ArrowRight} className={BTN}>Continuar</Boton>
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
            void (paso < PASOS.length - 1 ? continuar() : alEnviar());
          }}
          className="flex flex-col gap-[18px]"
        >
          <BarraGuia />
          <PasosAsistente pasos={PASOS.map((p) => p.titulo)} actual={paso} />
          {aviso && <div className="scroll-mt-6"><Aviso aviso={aviso} onCerrar={() => setAviso(null)} /></div>}

          {paso === 0 && <PasoDatos catalogos={catalogos} estado={estado} pie={pie} />}
          {paso === 1 && <PasoDesignacion catalogos={catalogos} pie={pie} />}
          {paso === 2 && <PasoDeclaraciones catalogos={catalogos} pie={pie} alVerVistaPrevia={() => setVistaPrevia(datosVistaPrevia(getValues()))} />}
          {paso > 2 && <Tarjeta titulo="Este paso está en construcción" />}
        </form>

        {vistaPrevia && <VistaPreviaDeclaracion datos={vistaPrevia} onCerrar={() => setVistaPrevia(null)} />}
      </PageShell>
    </FormProvider>
  );
}
