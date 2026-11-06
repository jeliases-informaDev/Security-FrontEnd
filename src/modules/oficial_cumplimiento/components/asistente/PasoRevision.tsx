'use client';

import type { ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import { documentoQueAcredita, textoFirma, type FormularioDesignacion } from '../../lib/designacion';
import { fechaCorta, reglaTexto, textoOGuion } from '../../lib/formato';
import type { CatalogosOficial } from '../../services/oficialService';
import { CampoTextoLargo } from '../campos';
import { Dato, FilaCheck, Tarjeta } from '../piezas';
import { CuerpoPaso } from './CuerpoPaso';
import { REGLA_COMUNICAR_DESIGNACION, TarjetaPlazoUif } from './PlazoDesignacion';

const nombreDe = (lista: { codigo: string; nombre: string }[], codigo: string): string => lista.find((o) => o.codigo === codigo)?.nombre ?? '';

/** «Editar» de una tarjeta de la revisión: vuelve al paso donde se escribió ese dato. */
function BotonEditar({ paso, de, alEditar, deshabilitado }: { paso: number; de: string; alEditar: (paso: number) => void; deshabilitado: boolean }) {
  return (
    <button type="button" onClick={() => alEditar(paso)} disabled={deshabilitado} className="btn btn-secondary h-auto min-h-11 py-2 text-sm">
      <Pencil className="h-4 w-4" aria-hidden="true" /> Editar<span className="sr-only"> {de}</span>
    </button>
  );
}

function Datos({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

/**
 * Paso 4 · Revisión y guardado (OC 6): resumen de todo lo escrito, con «Editar» por bloque, y lo que pasará al guardar.
 * Al corregir una designación (`correccion`) pide además el motivo, que queda en el historial junto con lo que cambió.
 */
export function PasoRevision({ catalogos, pie, alEditar, deshabilitado, correccion = false }: { catalogos: CatalogosOficial; pie: ReactNode; alEditar: (paso: number) => void; deshabilitado: boolean; correccion?: boolean }) {
  const { control } = useFormContext<FormularioDesignacion>();
  const v = useWatch({ control }) as FormularioDesignacion;
  const persona = v.persona;
  const regla = reglaTexto(catalogos.reglas.find((r) => r.codigo === REGLA_COMUNICAR_DESIGNACION));

  return (
    <CuerpoPaso
      pie={pie}
      lateral={
        <>
          <Tarjeta titulo="Qué pasará al guardar" centrada className="!gap-3">
            {correccion ? (
              <>
                <FilaCheck>Se guardan los cambios con sello de fecha y hora</FilaCheck>
                <FilaCheck>Queda anotado en el historial, con el motivo y lo que cambió</FilaCheck>
                <FilaCheck>Después comunicas la designación a la UIF {regla ? `(plazo de ${regla})` : ''}</FilaCheck>
              </>
            ) : (
              <>
                <FilaCheck>Se guarda con sello de fecha y hora</FilaCheck>
                <FilaCheck>Corre el plazo {regla ? `de ${regla} ` : ''}para comunicarla a la UIF</FilaCheck>
                <FilaCheck>Queda anotado en el historial del oficial</FilaCheck>
              </>
            )}
          </Tarjeta>
          <TarjetaPlazoUif desde={v.designacion.fechaDesignacion} catalogos={catalogos} variante="resumen" />
        </>
      }
    >
      <Tarjeta titulo="Datos de la persona" centrada className="!gap-[18px]" derecha={<BotonEditar paso={0} de="los datos de la persona" alEditar={alEditar} deshabilitado={deshabilitado} />}>
        <Datos>
          <Dato rotulo="Nombre">{`${persona.nombres.trim()} ${persona.apellidos.trim()}`}</Dato>
          <Dato rotulo="Documento">{`${persona.tipoDocumento} ${persona.numeroDocumento.trim()}`}</Dato>
          <Dato rotulo="Nacionalidad">{textoOGuion(nombreDe(catalogos.nacionalidades, persona.nacionalidad))}</Dato>
          <Dato rotulo="Teléfono">{textoOGuion(persona.telefono)}</Dato>
          <Dato rotulo="Correo">{persona.correo.trim()}</Dato>
          <Dato rotulo="Cargo">{v.cargo.cargo.trim()}</Dato>
          <Dato rotulo="Cargo a designar">{textoOGuion(nombreDe(catalogos.tiposCargo, v.tipoCargo))}</Dato>
          <Dato rotulo="Dedicación">{textoOGuion(nombreDe(catalogos.dedicaciones, v.dedicacion))}</Dato>
          <Dato rotulo="Vínculo">{textoOGuion(nombreDe(catalogos.vinculos, v.cargo.vinculo))}</Dato>
        </Datos>
      </Tarjeta>

      <Tarjeta titulo="Designación" centrada className="!gap-[18px]" derecha={<BotonEditar paso={1} de="la designación" alEditar={alEditar} deshabilitado={deshabilitado} />}>
        <Datos>
          <Dato rotulo="Designa">{v.designacion.nombreOrgano.trim()}</Dato>
          <Dato rotulo="Fecha de designación">{fechaCorta(v.designacion.fechaDesignacion)}</Dato>
          <Dato rotulo="Documento">{textoOGuion(documentoQueAcredita(catalogos, v))}</Dato>
        </Datos>
      </Tarjeta>

      <Tarjeta titulo="Declaraciones juradas" centrada className="!gap-[18px]" derecha={<BotonEditar paso={2} de="las declaraciones juradas" alEditar={alEditar} deshabilitado={deshabilitado} />}>
        <FilaCheck>Declaración jurada de requisitos · {textoFirma(v.declaraciones.requisitos)}</FilaCheck>
        <FilaCheck>Declaración jurada de quién designó · {textoFirma(v.declaraciones.designante)}</FilaCheck>
      </Tarjeta>

      {correccion && (
        <Tarjeta titulo="Motivo de la corrección" descripcion="Queda en el historial del oficial, junto con lo que cambió." className="!gap-[18px]">
          <CampoTextoLargo ruta="motivoCorreccion" texto="¿Por qué se corrige la designación?" maxLength={500} filas={3} />
        </Tarjeta>
      )}
    </CuerpoPaso>
  );
}
