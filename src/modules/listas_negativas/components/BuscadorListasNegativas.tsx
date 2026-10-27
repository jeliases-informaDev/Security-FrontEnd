'use client';

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, User, IdCard, ShieldAlert, CalendarClock, UploadCloud, ChevronRight, SearchX } from 'lucide-react';
import {
  listasNegativasService,
  PaginaResultados,
  ResultadoBusquedaResponse,
  TipoDocumentoCodigo,
} from '@/modules/listas_negativas/services/listasNegativasService';
import { ManchaCard } from '@/modules/listas_negativas/components/ManchaCard';
import { DetalleEntidadModal } from '@/modules/listas_negativas/components/DetalleEntidadModal';
import { HistorialBusquedas } from '@/modules/listas_negativas/components/HistorialBusquedas';
import { TrabajandoEnElloModal } from '@/shared/ui/TrabajandoEnElloModal';
import { PageHeader, PageShell, Panel } from '@/shared/ui/PageShell';
import { Avatar, Aviso, Boton, EstadoVacio, Paginacion } from '@/shared/ui/kit';

// Formato real de cada documento peruano: largo exacto/máximo y los caracteres que acepta,
// para restringir la escritura y no dejar pasar valores con el formato incorrecto.
const FORMATO_DOCUMENTO: Record<
  TipoDocumentoCodigo,
  { label: string; maxLength: number; pattern: RegExp; soloDigitos: boolean; ejemplo: string }
> = {
  DNI: { label: 'DNI', maxLength: 8, pattern: /^\d{8}$/, soloDigitos: true, ejemplo: '12345678' },
  RUC: { label: 'RUC', maxLength: 11, pattern: /^\d{11}$/, soloDigitos: true, ejemplo: '20123456789' },
  CE: { label: 'CE', maxLength: 12, pattern: /^[A-Za-z0-9]{6,12}$/, soloDigitos: false, ejemplo: '001234567' },
  PASAPORTE: { label: 'Pasaporte', maxLength: 12, pattern: /^[A-Za-z0-9]{5,12}$/, soloDigitos: false, ejemplo: 'AB123456' },
};

// Igual que en el backend: sin documento, un texto de 1 o 2 letras coincide con media base de datos.
const LETRAS_MINIMAS = 3;
// Con más coincidencias que esto se sugiere afinar la búsqueda en vez de ir página por página.
const UMBRAL_AFINAR = 200;

const cuentaLetras = (texto?: string) =>
  Array.from(texto ?? '').filter((c) => c.toLowerCase() !== c.toUpperCase() || (c >= '0' && c <= '9')).length;

const busquedaSchema = z
  .object({
    nombres: z.string().optional(),
    apellidoPaterno: z.string().optional(),
    apellidoMaterno: z.string().optional(),
    tipoDocumento: z.union([z.literal('DNI'), z.literal('CE'), z.literal('RUC'), z.literal('PASAPORTE'), z.literal('')]).optional(),
    documento: z.string().optional(),
  })
  .refine(
    (values) => [values.nombres, values.apellidoPaterno, values.apellidoMaterno, values.documento].some((v) => v && v.trim().length > 0),
    { message: 'Ingresa al menos un criterio de búsqueda', path: ['nombres'] }
  )
  .refine(
    (values) => {
      const textos = [values.nombres, values.apellidoPaterno, values.apellidoMaterno];
      const sinCriterios = ![...textos, values.documento].some((v) => v && v.trim().length > 0);
      // Sin criterios ya avisa la regla anterior; con documento, los nombres solo afinan
      if (sinCriterios || (values.documento && values.documento.trim())) return true;
      return textos.some((v) => cuentaLetras(v) >= LETRAS_MINIMAS);
    },
    { message: `Escribe al menos ${LETRAS_MINIMAS} letras en el nombre o en un apellido, o indica el documento`, path: ['nombres'] }
  )
  .refine(
    (values) => {
      if (!values.documento || !values.documento.trim()) return true;
      if (!values.tipoDocumento) return true;
      return FORMATO_DOCUMENTO[values.tipoDocumento as TipoDocumentoCodigo].pattern.test(values.documento.trim());
    },
    { message: 'El documento no tiene el formato esperado para el tipo seleccionado', path: ['documento'] }
  );

type BusquedaFormValues = z.infer<typeof busquedaSchema>;

/** Campo de texto con un icono a la izquierda. */
function CampoIcono({ icono: Icono, children }: { icono: typeof Search; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icono className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" aria-hidden="true" />
      {children}
    </div>
  );
}

export function BuscadorListasNegativas() {
  const [resultados, setResultados] = useState<PaginaResultados | null>(null);
  // Criterios de la última búsqueda: las páginas siguientes los reusan aunque después se edite el formulario
  const [criterios, setCriterios] = useState<BusquedaFormValues | null>(null);
  const [cambiandoPagina, setCambiandoPagina] = useState(false);
  const seccionResultados = useRef<HTMLElement>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [personaDetalle, setPersonaDetalle] = useState<ResultadoBusquedaResponse | null>(null);
  const [modalEnConstruccion, setModalEnConstruccion] = useState<string | null>(null);
  const [recargarHistorial, setRecargarHistorial] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BusquedaFormValues>({ resolver: zodResolver(busquedaSchema), defaultValues: { tipoDocumento: '' } });

  const tipoDocumentoSeleccionado = watch('tipoDocumento') as TipoDocumentoCodigo | '' | undefined;
  const formatoActivo = tipoDocumentoSeleccionado ? FORMATO_DOCUMENTO[tipoDocumentoSeleccionado] : null;

  const buscarPagina = async (valores: BusquedaFormValues, pagina: number) => {
    setErrorServidor(null);
    try {
      const data = await listasNegativasService.buscar(valores, pagina);
      setResultados(data);
      setCriterios(valores);
      if (data.items.length > 0) setRecargarHistorial((n) => n + 1);
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo completar la búsqueda. Inténtalo de nuevo en un momento.';
      setErrorServidor(mensaje);
      // Si falla la primera página no hay nada que mostrar; si falla una siguiente, se conserva la que ya se veía
      if (pagina === 0) setResultados(null);
    }
  };

  const onSubmit = (values: BusquedaFormValues) => buscarPagina(values, 0);

  const irAPagina = async (pagina: number) => {
    if (!criterios) return;
    setCambiandoPagina(true);
    await buscarPagina(criterios, pagina);
    setCambiandoPagina(false);
    seccionResultados.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const desde = resultados ? resultados.pagina * resultados.tamano + 1 : 0;
  const hasta = resultados ? desde + resultados.items.length - 1 : 0;

  const abrirDetallePorId = async (entidadId: number) => {
    try {
      const detalle = await listasNegativasService.obtenerDetalle(entidadId);
      setPersonaDetalle(detalle);
    } catch {
      setErrorServidor('No se pudo cargar el detalle del registro.');
    }
  };

  return (
    <PageShell>
      <PageHeader
        antetitulo="Debida diligencia"
        icono={Search}
        titulo="Listas Negativas"
        descripcion="Busca coincidencias en PEP y en el catálogo real de listas restrictivas, de LA/FT, sanciones administrativas y noticias."
        acciones={
          <>
            <Boton variante="secundario" icono={CalendarClock} onClick={() => setModalEnConstruccion('Programar búsqueda')}>Programar búsqueda</Boton>
            <Boton variante="secundario" icono={UploadCloud} onClick={() => setModalEnConstruccion('Consulta masiva')}>Consulta masiva</Boton>
          </>
        }
      />

      <Panel className="aparece mb-6" relleno>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label htmlFor="ln-nombres" className="label">Nombres / Razón social</label>
              <CampoIcono icono={Search}>
                <input id="ln-nombres" type="text" className="input pl-10" placeholder="Ej. Juan Carlos" autoComplete="off" {...register('nombres')} />
              </CampoIcono>
            </div>
            <div>
              <label htmlFor="ln-paterno" className="label">Apellido paterno</label>
              <CampoIcono icono={User}>
                <input id="ln-paterno" type="text" className="input pl-10" placeholder="Ej. García" autoComplete="off" {...register('apellidoPaterno')} />
              </CampoIcono>
            </div>
            <div>
              <label htmlFor="ln-materno" className="label">Apellido materno</label>
              <CampoIcono icono={User}>
                <input id="ln-materno" type="text" className="input pl-10" placeholder="Ej. López" autoComplete="off" {...register('apellidoMaterno')} />
              </CampoIcono>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="ln-tipo" className="label">Tipo de documento</label>
              <select
                id="ln-tipo"
                className="input"
                {...register('tipoDocumento', {
                  // al cambiar el tipo, se limpia el número para que no quede un valor válido para el tipo anterior pero inválido para el nuevo
                  onChange: () => setValue('documento', ''),
                })}
              >
                <option value="">Todos</option>
                {(Object.keys(FORMATO_DOCUMENTO) as TipoDocumentoCodigo[]).map((codigo) => (
                  <option key={codigo} value={codigo}>{FORMATO_DOCUMENTO[codigo].label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="ln-documento" className="label">N.º de documento</label>
              <CampoIcono icono={IdCard}>
                <input
                  id="ln-documento"
                  type="text"
                  className={`input pl-10 font-mono ${errors.documento ? 'input-error' : ''}`}
                  placeholder={formatoActivo ? `Ej. ${formatoActivo.ejemplo}` : 'DNI, CE, RUC o pasaporte'}
                  maxLength={formatoActivo?.maxLength}
                  inputMode={formatoActivo?.soloDigitos ? 'numeric' : 'text'}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(errors.documento)}
                  {...register('documento', {
                    onChange: (e) => {
                      if (!formatoActivo) return;
                      const crudo = e.target.value;
                      const limpio = formatoActivo.soloDigitos ? crudo.replace(/\D/g, '') : crudo.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                      setValue('documento', limpio.slice(0, formatoActivo.maxLength), { shouldValidate: true });
                    },
                  })}
                />
              </CampoIcono>
            </div>

            <Boton type="submit" icono={Search} cargando={isSubmitting} className="lg:col-start-4">
              {isSubmitting ? 'Buscando…' : 'Realizar búsqueda'}
            </Boton>
          </div>

          {errors.nombres && <p className="error-text mt-3">{errors.nombres.message}</p>}
          {errors.documento && <p className="error-text mt-3">{errors.documento.message}</p>}
          {errorServidor && <Aviso aviso={{ tipo: 'error', texto: errorServidor }} onCerrar={() => setErrorServidor(null)} className="mt-4" />}
        </form>
      </Panel>

      {resultados === null && (
        <Panel className="border-dashed">
          <EstadoVacio icono={ShieldAlert} titulo="Empieza con un nombre, apellido o documento" texto="Buscamos en PEP, listas restrictivas, sanciones y noticias, y guardamos cada consulta en tu historial." />
        </Panel>
      )}

      {resultados !== null && (
        <section ref={seccionResultados} aria-live="polite" className="scroll-mt-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-ink">Resultados</h2>
            <span className="text-sm tabular-nums text-muted">{resultados.total.toLocaleString('es-PE')} coincidencia{resultados.total === 1 ? '' : 's'}</span>
          </div>
          {resultados.total > UMBRAL_AFINAR && (
            <Aviso aviso={{ tipo: 'info', texto: `Hay ${resultados.total.toLocaleString('es-PE')} coincidencias: son demasiadas para revisarlas una por una. Agrega el nombre completo, el apellido materno o el documento para acotarlas.` }} />
          )}
          {resultados.items.length === 0 ? (
            <Panel>
              <EstadoVacio icono={SearchX} titulo="Sin coincidencias" texto="Ninguna persona o empresa coincide con los criterios ingresados. Prueba con menos datos o revisa el documento." />
            </Panel>
          ) : (
            resultados.items.map((persona, i) => (
              <button
                key={persona.entidadId}
                onClick={() => setPersonaDetalle(persona)}
                className="card card-hover aparece group w-full p-5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 sm:p-6"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <div className="flex items-start gap-4">
                  <Avatar nombre={persona.nombreCompleto} tamano="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-ink">{persona.nombreCompleto}</h3>
                      <span className="badge badge-brand">{persona.manchas.length} registro{persona.manchas.length === 1 ? '' : 's'}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {persona.tipoDocumento ?? 'Documento'}: <span className="font-mono">{persona.documento}</span>
                      {persona.pais ? ` · ${persona.pais}` : ''}
                      {' · '}
                      {persona.tipoEntidad === 'JURIDICA' ? 'Persona jurídica' : 'Persona natural'}
                    </p>

                    <div className="mt-4 space-y-3">
                      {persona.manchas.slice(0, 1).map((mancha) => <ManchaCard key={mancha.id} mancha={mancha} />)}
                      <p className="flex items-center gap-1 text-sm font-medium text-brand-ink">
                        {persona.manchas.length > 1 ? `Ver ${persona.manchas.length - 1} registro${persona.manchas.length - 1 === 1 ? '' : 's'} más` : 'Ver detalle'}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
          {resultados.totalPaginas > 1 && (
            <Panel>
              <Paginacion desde={desde} hasta={hasta} total={resultados.total} pagina={resultados.pagina} totalPaginas={resultados.totalPaginas} onCambiar={irAPagina} cargando={cambiandoPagina} />
            </Panel>
          )}
        </section>
      )}

      <HistorialBusquedas onVerDetalle={abrirDetallePorId} recargarClave={recargarHistorial} />

      {personaDetalle && <DetalleEntidadModal persona={personaDetalle} onClose={() => setPersonaDetalle(null)} />}
      {modalEnConstruccion && <TrabajandoEnElloModal titulo={modalEnConstruccion} onClose={() => setModalEnConstruccion(null)} />}
    </PageShell>
  );
}
