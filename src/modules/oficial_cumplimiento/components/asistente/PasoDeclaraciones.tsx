'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Controller, get, useFormContext, useWatch } from 'react-hook-form';
import { Check, Eye } from 'lucide-react';
import { Etiqueta } from '@/shared/ui/kit';
import { designanteCompleto, documentoQueAcredita, puntosDeRequisitos, requisitosCompletos, type FormularioDesignacion } from '../../lib/designacion';
import { hoyIso, reglaTexto } from '../../lib/formato';
import { AMBITO_ADJUNTO, type CatalogosOficial } from '../../services/oficialService';
import { CampoArchivo, CampoFecha, CampoTexto } from '../campos';
import { BTN, NotaLateral, Tarjeta } from '../piezas';
import { CuerpoPaso } from './CuerpoPaso';

/** Una declaración con su casilla: la fila entera se puede pulsar y la casilla es una casilla de verdad (teclado y lector de pantalla). */
function FilaDeclaracion({ id, texto, marcada, onCambiar, invalida = false }: { id: string; texto: string; marcada: boolean; onCambiar: (marcada: boolean) => void; invalida?: boolean }) {
  return (
    <label htmlFor={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border py-3 pl-3.5 pr-4 transition-colors ${marcada ? 'border-line bg-brand-soft/60' : invalida ? 'border-bad bg-white' : 'border-line bg-white hover:border-line-strong'}`}>
      <input id={id} type="checkbox" checked={marcada} aria-invalid={invalida ? true : undefined} onChange={(e) => onCambiar(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand ${marcada ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-transparent'}`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      <span className="text-[15px] leading-[22px] text-ink">{texto}</span>
    </label>
  );
}

/** Valor de solo lectura con la forma de un campo (los datos que ya se escribieron en el paso 2). */
function CampoLectura({ id, texto, valor }: { id: string; texto: string; valor: string }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="label">{texto}</label>
      <input id={id} type="text" readOnly value={valor} className="input cursor-default bg-paper" />
    </div>
  );
}

function FilaEstado({ rotulo, completa }: { rotulo: string; completa: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="min-w-0 flex-1 text-[15px] font-medium text-ink">{rotulo}</span>
      <Etiqueta tono={completa ? 'ok' : 'warn'}>{completa ? 'Completa' : 'Pendiente'}</Etiqueta>
    </div>
  );
}

/** Paso 3 · Declaraciones juradas (OC 4): la de requisitos de la persona, la de quien designó y las firmas. */
export function PasoDeclaraciones({ catalogos, pie, alVerVistaPrevia }: { catalogos: CatalogosOficial; pie: ReactNode; alVerVistaPrevia: () => void }) {
  const { control, formState: { errors } } = useFormContext<FormularioDesignacion>();
  const [hoy] = useState(hoyIso);
  const valores = useWatch({ control }) as FormularioDesignacion;

  const puntos = useMemo(() => puntosDeRequisitos(catalogos, valores.cargo?.vinculo ?? ''), [catalogos, valores.cargo?.vinculo]);
  const marcados = valores.declaraciones?.requisitos?.puntos ?? [];
  const requisitosListos = requisitosCompletos(valores, catalogos);
  const designanteListo = designanteCompleto(valores);
  const aviso = reglaTexto(catalogos.reglas.find((r) => r.codigo === 'AVISO_PERDIDA_REQUISITO'));
  const errorPuntos = get(errors, 'declaraciones.requisitos.puntos')?.message as string | undefined;
  const errorAceptada = get(errors, 'declaraciones.designante.aceptada')?.message as string | undefined;
  const nombreAmbito = (codigo: string, respaldo: string) => catalogos.ambitosAdjunto.find((a) => a.codigo === codigo)?.nombre ?? respaldo;

  return (
    <CuerpoPaso
      pie={pie}
      lateral={
        <>
          <Tarjeta titulo="Declaraciones" className="!gap-3">
            <FilaEstado rotulo="Requisitos del oficial" completa={requisitosListos} />
            <FilaEstado rotulo="Quién designó" completa={designanteListo} />
            <button type="button" onClick={alVerVistaPrevia} className={`btn btn-secondary self-start ${BTN}`}>
              <Eye className="h-4 w-4" aria-hidden="true" /> Ver declaración jurada
            </button>
          </Tarjeta>
          <NotaLateral rotulo="Importante">
            Estos requisitos pueden acreditarse con declaración jurada. Si dejan de cumplirse, el oficial debe avisarlo por escrito{aviso ? ` en ${aviso}` : ''}.
          </NotaLateral>
        </>
      }
    >
      <Tarjeta
        titulo="Declaración jurada de requisitos"
        descripcion="De la persona designada (art. 6.1)."
        className="!gap-2.5"
        derecha={
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5">
            <button type="button" onClick={alVerVistaPrevia} className="btn btn-secondary btn-sm !h-10 !px-4 !text-sm">
              <Eye className="h-4 w-4" aria-hidden="true" /> Ver vista previa
            </button>
            <Etiqueta tono={marcados.length >= puntos.length && puntos.length > 0 ? 'ok' : 'neutral'}>{marcados.length} de {puntos.length}</Etiqueta>
          </div>
        }
      >
        <Controller
          control={control}
          name="declaraciones.requisitos.puntos"
          render={({ field }) => {
            const actuales = (field.value as string[] | undefined) ?? [];
            const primeraSinMarcar = puntos.find((p) => !actuales.includes(p.letra))?.letra;
            return (
              <div role="group" aria-label="Declaraciones de requisitos del oficial" className="flex flex-col gap-2.5">
                {puntos.map((p) => (
                  <FilaDeclaracion
                    key={p.letra}
                    id={`oc-requisito-${p.letra}`}
                    texto={p.texto}
                    marcada={actuales.includes(p.letra)}
                    invalida={!!errorPuntos && p.letra === primeraSinMarcar}
                    onCambiar={(marcar) => field.onChange(marcar ? [...actuales, p.letra] : actuales.filter((l) => l !== p.letra))}
                  />
                ))}
              </div>
            );
          }}
        />
        {errorPuntos && <p role="alert" className="error-text">{errorPuntos}</p>}
      </Tarjeta>

      <Tarjeta titulo="Declaración jurada de quién designó" descripcion="Art. 7.3.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoLectura id="oc-designo-organo" texto="Persona u órgano que designó" valor={valores.designacion?.nombreOrgano ?? ''} />
          <CampoLectura id="oc-designo-documento" texto="Documento que acredita" valor={documentoQueAcredita(catalogos, valores)} />
        </div>
        <Controller
          control={control}
          name="declaraciones.designante.aceptada"
          render={({ field }) => (
            <FilaDeclaracion id="oc-designante-aceptada" texto={catalogos.declaracionDesignante.texto} marcada={field.value === true} invalida={!!errorAceptada} onCambiar={field.onChange} />
          )}
        />
        {errorAceptada && <p role="alert" className="error-text">{errorAceptada}</p>}
      </Tarjeta>

      <Tarjeta titulo="Firmas y fechas" descripcion="Escribe el nombre completo para firmar, o sube las declaraciones firmadas.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CampoTexto ruta="declaraciones.requisitos.firmaNombre" texto="Firma del oficial designado" maxLength={255} />
          <CampoFecha ruta="declaraciones.requisitos.fechaFirma" texto="Fecha" lector="de la firma del oficial designado" max={hoy} />
          <CampoTexto ruta="declaraciones.designante.firmaNombre" texto="Firma de quien designa (representante legal)" maxLength={255} />
          <CampoFecha ruta="declaraciones.designante.fechaFirma" texto="Fecha" lector="de la firma de quien designa" max={hoy} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <CampoArchivo
            ruta="declaraciones.requisitos.adjunto"
            ambito={AMBITO_ADJUNTO.DJ_REQUISITOS_FIRMADA}
            rotulo={nombreAmbito(AMBITO_ADJUNTO.DJ_REQUISITOS_FIRMADA, 'Declaración de requisitos firmada')}
            reglas={catalogos.adjuntos}
          />
          <CampoArchivo
            ruta="declaraciones.designante.adjunto"
            ambito={AMBITO_ADJUNTO.DJ_DESIGNANTE_FIRMADA}
            rotulo={nombreAmbito(AMBITO_ADJUNTO.DJ_DESIGNANTE_FIRMADA, 'Declaración de quién designó firmada')}
            reglas={catalogos.adjuntos}
          />
        </div>
      </Tarjeta>
    </CuerpoPaso>
  );
}
