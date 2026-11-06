'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Check } from 'lucide-react';
import { hoyIso, minusculaInicial } from '../../lib/formato';
import { designanteUnico, type FormularioDesignacion } from '../../lib/designacion';
import type { CatalogosOficial, EstadoOficial } from '../../services/oficialService';
import { CampoFecha, CampoSegmentado, CampoSeleccion, CampoTexto } from '../campos';
import { Tarjeta } from '../piezas';
import { CuerpoPaso } from './CuerpoPaso';

/** Lo que se le pide confirmar a quien designa (texto del diseño; es informativo, no se guarda). */
const ANTES_DE_CONTINUAR = [
  'Es una persona natural',
  'No es oficial de cumplimiento de otra empresa (salvo corporativo)',
  'Tiene vínculo directo con la empresa',
  'Actuará con autonomía e independencia',
];

const aOpciones = (lista: { codigo: string; nombre: string }[]) => lista.map((o) => ({ value: o.codigo, label: o.nombre }));

/** Paso 1 · Datos de la persona (OC 2). */
export function PasoDatos({ catalogos, estado, pie }: { catalogos: CatalogosOficial; estado: EstadoOficial; pie: ReactNode }) {
  const { control, setValue } = useFormContext<FormularioDesignacion>();
  const [hoy] = useState(hoyIso);
  const tipoEmpresa = useWatch({ control, name: 'tipoEmpresa' });
  const tipo = catalogos.tiposEmpresa.find((t) => t.codigo === tipoEmpresa);

  const nacionalidades = useMemo(() => aOpciones(catalogos.nacionalidades), [catalogos.nacionalidades]);
  const tiposDocumento = useMemo(() => aOpciones(catalogos.tiposDocumento), [catalogos.tiposDocumento]);
  const vinculos = useMemo(() => aOpciones(catalogos.vinculos), [catalogos.vinculos]);
  const tiposEmpresa = useMemo(() => aOpciones(catalogos.tiposEmpresa), [catalogos.tiposEmpresa]);
  const cargos = useMemo(() => catalogos.tiposCargo.map((c) => ({ valor: c.codigo, etiqueta: c.nombre, pronto: !c.disponible })), [catalogos.tiposCargo]);
  const dedicaciones = useMemo(() => catalogos.dedicaciones.map((d) => ({ valor: d.codigo, etiqueta: d.nombre })), [catalogos.dedicaciones]);

  // Al cambiar el tipo de empresa, el que designa se decide solo si solo hay una opción permitida (si no, se vuelve a elegir en el paso 2).
  const alCambiarTipoEmpresa = (codigo: string) => {
    setValue('designacion.designa', designanteUnico(catalogos, codigo), { shouldDirty: true });
  };

  return (
    <CuerpoPaso
      pie={pie}
      lateral={
        <>
          <Tarjeta titulo="Antes de continuar" descripcion="Confirma que la persona:" className="!gap-3">
            <ul className="flex flex-col gap-2.5">
              {ANTES_DE_CONTINUAR.map((linea) => (
                <li key={linea} className="flex items-start gap-3 text-[14px] leading-5 text-ink">
                  <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink" aria-hidden="true">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {linea}
                </li>
              ))}
            </ul>
          </Tarjeta>

          <Tarjeta
            titulo="Quién designa en tu empresa"
            descripcion={`${estado.empresa.nombre}${tipo ? ` · ${tipo.nombre.toLowerCase()}.` : '.'}`}
            className="!gap-3"
          >
            <CampoSeleccion ruta="tipoEmpresa" texto="Tipo de empresa" opciones={tiposEmpresa} placeholder="Elige el tipo de empresa" alCambiar={alCambiarTipoEmpresa} />
            <p className="text-sm leading-5 text-muted" aria-live="polite">
              {tipo
                ? `La designación la hace ${minusculaInicial(tipo.quienDesigna)} En el siguiente paso adjuntas el acta.`
                : 'Elige el tipo de empresa para ver quién hace la designación.'}
            </p>
          </Tarjeta>
        </>
      }
    >
      <Tarjeta titulo="Tipo de cargo" descripcion="Qué función va a cumplir.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoSegmentado ruta="tipoCargo" texto="Cargo a designar" opciones={cargos} />
          <CampoSegmentado ruta="dedicacion" texto="Dedicación" opciones={dedicaciones} />
        </div>
      </Tarjeta>

      <Tarjeta titulo="Datos de la persona">
        {/* Seis columnas en pantallas anchas: tres campos por fila (de a dos columnas), el domicilio entero y teléfono con correo a mitades. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <CampoTexto ruta="persona.nombres" texto="Nombres" maxLength={150} className="lg:col-span-2" />
          <CampoTexto ruta="persona.apellidos" texto="Apellidos" maxLength={150} className="lg:col-span-2" />
          <CampoSeleccion ruta="persona.nacionalidad" texto="Nacionalidad" opciones={nacionalidades} placeholder="Elige un país" className="lg:col-span-2" />
          <CampoSeleccion ruta="persona.tipoDocumento" texto="Tipo de documento" opciones={tiposDocumento} className="lg:col-span-2" />
          <CampoTexto ruta="persona.numeroDocumento" texto="N.º de documento" maxLength={20} className="lg:col-span-2" />
          <CampoFecha ruta="persona.fechaNacimiento" texto="Fecha de nacimiento" max={hoy} className="lg:col-span-2" />
          <CampoTexto ruta="persona.domicilio" texto="Domicilio" placeholder="Calle, número y distrito" maxLength={255} className="sm:col-span-2 lg:col-span-6" />
          <CampoTexto ruta="persona.telefono" texto="Teléfono" tipo="tel" opcional maxLength={30} className="lg:col-span-3" />
          <CampoTexto ruta="persona.correo" texto="Correo electrónico" tipo="email" maxLength={150} className="lg:col-span-3" />
        </div>
      </Tarjeta>

      <Tarjeta titulo="Cargo en la empresa" descripcion="Su relación con la empresa que designa.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CampoTexto ruta="cargo.cargo" texto="Cargo que desempeña" maxLength={150} />
          <CampoFecha ruta="cargo.fechaIngreso" texto="Fecha de ingreso" max={hoy} />
          <CampoSeleccion ruta="cargo.vinculo" texto="Vínculo con la empresa" opciones={vinculos} placeholder="Elige el vínculo" />
          <CampoTexto ruta="cargo.direccionOficina" texto="Dirección de la oficina donde trabaja" placeholder="Calle, número y distrito" maxLength={255} className="sm:col-span-2 lg:col-span-3" />
        </div>
      </Tarjeta>
    </CuerpoPaso>
  );
}
