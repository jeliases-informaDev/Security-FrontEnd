'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FormProvider, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { PageHeader, PageShell } from '@/shared/ui/PageShell';
import { Aviso, Boton, type AvisoDatos } from '@/shared/ui/kit';
import { IconoOficial } from '@/shared/ui/iconos';
import { CAMPOS_PASO, crearEsquema, valoresIniciales, type FormularioDesignacion } from '../../lib/designacion';
import { enfocarPrimerError, subirAlInicio } from '../../lib/pantalla';
import type { CatalogosOficial, EstadoOficial } from '../../services/oficialService';
import { BTN, BarraGuia, RUTA_OFICIAL, Tarjeta } from '../piezas';
import { PasoDatos } from './PasoDatos';
import { PasosAsistente } from './PasosAsistente';

/** Los cuatro pasos del asistente: el título sale del diseño; «Revisión y guardado» es el nombre que usa la lista de pasos de OC 0. */
const PASOS = [
  { titulo: 'Datos de la persona', descripcion: 'Completa los datos de la persona. Son los mismos que se piden en la solicitud a la UIF.' },
  { titulo: 'Designación', descripcion: '' },
  { titulo: 'Declaraciones juradas', descripcion: '' },
  { titulo: 'Revisión y guardado', descripcion: '' },
];

/** Asistente «Designar oficial de cumplimiento» (OC 2 a OC 6): un solo formulario con cuatro pasos. */
export function Asistente({ estado, catalogos }: { estado: EstadoOficial; catalogos: CatalogosOficial }) {
  const [paso, setPaso] = useState(0);
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const inicio = useRef<HTMLDivElement>(null);
  const esquema = useMemo(() => crearEsquema(catalogos), [catalogos]);
  const metodos = useForm<FormularioDesignacion>({
    resolver: zodResolver(esquema),
    defaultValues: valoresIniciales(catalogos, estado),
    mode: 'onTouched',
  });
  const { handleSubmit, trigger, subscribe, getFieldState } = metodos;

  // Un campo que ya tiene error se vuelve a validar mientras se corrige, para que el rojo se quite apenas queda bien.
  useEffect(
    () => subscribe({
      formState: { values: true },
      callback: ({ name }) => {
        if (name && getFieldState(name as FieldPath<FormularioDesignacion>).error) void trigger(name as FieldPath<FormularioDesignacion>);
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

  const pie = (
    <>
      <Link href={RUTA_OFICIAL} className={`btn btn-secondary ${BTN}`}>Cancelar</Link>
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
          {paso === 0 && <BarraGuia />}
          <PasosAsistente pasos={PASOS.map((p) => p.titulo)} actual={paso} />
          {aviso && <div className="scroll-mt-6"><Aviso aviso={aviso} onCerrar={() => setAviso(null)} /></div>}

          {paso === 0 && <PasoDatos catalogos={catalogos} estado={estado} pie={pie} />}
          {paso > 0 && <Tarjeta titulo="Este paso está en construcción" />}
        </form>
      </PageShell>
    </FormProvider>
  );
}
