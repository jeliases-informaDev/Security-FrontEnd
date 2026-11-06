'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import type { FormularioDesignacion } from '../../lib/designacion';
import { hoyIso } from '../../lib/formato';
import { AMBITO_ADJUNTO, type CatalogosOficial } from '../../services/oficialService';
import { CampoArchivo, CampoFecha, CampoInterruptor, CampoSeleccion, CampoTexto, FilaInterruptor } from '../campos';
import { Tarjeta } from '../piezas';
import { CuerpoPaso } from './CuerpoPaso';
import { TarjetaPlazoUif, TarjetaReserva } from './PlazoDesignacion';

const aOpciones = (lista: { codigo: string; nombre: string }[]) => lista.map((o) => ({ value: o.codigo, label: o.nombre }));

/** Paso 2 · Designación (OC 3): quién designa, el documento que lo acredita y la situación del cargo. */
export function PasoDesignacion({ catalogos, pie }: { catalogos: CatalogosOficial; pie: ReactNode }) {
  const { control } = useFormContext<FormularioDesignacion>();
  const [hoy] = useState(hoyIso);
  const [tipoEmpresa, designa, fechaDesignacion] = useWatch({ control, name: ['tipoEmpresa', 'designacion.designa', 'designacion.fechaDesignacion'] });

  // Quién puede designar depende del tipo de empresa que se eligió en el paso 1 (art. 7.1; el servidor valida lo mismo).
  const quienes = useMemo(() => {
    const permitidos = catalogos.tiposEmpresa.find((t) => t.codigo === tipoEmpresa)?.designantesPermitidos ?? [];
    return aOpciones(catalogos.quienDesigna.filter((q) => permitidos.includes(q.codigo)));
  }, [catalogos, tipoEmpresa]);
  const documentos = useMemo(() => aOpciones(catalogos.documentosDesignacion), [catalogos.documentosDesignacion]);
  const rotuloActa = catalogos.ambitosAdjunto.find((a) => a.codigo === AMBITO_ADJUNTO.ACTA_DESIGNACION)?.nombre ?? 'Acta o documento de designación';

  return (
    <CuerpoPaso
      pie={pie}
      lateral={
        <>
          <TarjetaPlazoUif desde={fechaDesignacion} catalogos={catalogos} />
          <TarjetaReserva />
        </>
      }
    >
      <Tarjeta titulo="Quién designa" descripcion="Art. 7.1.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoSeleccion ruta="designacion.designa" texto="Persona u órgano que designa" opciones={quienes} placeholder="Elige quién designa" />
          <CampoTexto
            ruta="designacion.nombreOrgano"
            texto="Nombre del órgano"
            maxLength={255}
            ayuda={designa === 'SUJETO_OBLIGADO' ? 'Si designa la propia persona, escribe su nombre.' : undefined}
          />
        </div>
      </Tarjeta>

      <Tarjeta titulo="Documento de designación" descripcion="Copia del acta o del documento que acredita la designación.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CampoSeleccion ruta="designacion.documentoTipo" texto="Tipo de documento" opciones={documentos} placeholder="Elige el documento" />
          <CampoFecha ruta="designacion.documentoFecha" texto="Fecha del documento" max={hoy} />
          <CampoFecha ruta="designacion.fechaDesignacion" texto="Fecha de designación" max={hoy} />
        </div>
        <CampoArchivo ruta="designacion.adjunto" ambito={AMBITO_ADJUNTO.ACTA_DESIGNACION} rotulo={rotuloActa} reglas={catalogos.adjuntos} />
      </Tarjeta>

      <Tarjeta titulo="Situación del cargo" className="!gap-5">
        {/* Solo el oficial corporativo puede serlo de otra empresa y «Corporativo» todavía no está disponible: queda apagado. */}
        <FilaInterruptor
          id="oc-esOficialOtraEmpresa"
          titulo="¿Es oficial de cumplimiento de otra empresa?"
          descripcion="Solo se permite si es un oficial corporativo autorizado."
          activo={false}
          onCambiar={() => undefined}
          deshabilitado
          pronto
        />
        <CampoInterruptor ruta="designacion.reemplazaOficialAnterior" titulo="¿Reemplaza a un oficial anterior?" descripcion="Si hay un oficial vigente, queda en el historial." />
      </Tarjeta>
    </CuerpoPaso>
  );
}
