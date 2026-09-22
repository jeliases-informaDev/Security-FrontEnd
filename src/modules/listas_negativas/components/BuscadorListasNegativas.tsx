'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, User, IdCard, ExternalLink, ShieldAlert } from 'lucide-react';
import {
  listasNegativasService,
  ResultadoBusquedaResponse,
} from '@/modules/listas_negativas/services/listasNegativasService';

const busquedaSchema = z
  .object({
    nombres: z.string().optional(),
    apellidoPaterno: z.string().optional(),
    apellidoMaterno: z.string().optional(),
    documento: z.string().optional(),
  })
  .refine(
    (values) =>
      [values.nombres, values.apellidoPaterno, values.apellidoMaterno, values.documento].some(
        (v) => v && v.trim().length > 0
      ),
    { message: 'Ingresa al menos un criterio de búsqueda', path: ['nombres'] }
  );

type BusquedaFormValues = z.infer<typeof busquedaSchema>;

const TIPO_LISTA_STYLES: Record<string, string> = {
  PEP: 'bg-blue-50 text-blue-700 border-blue-100',
  ACTOS_ILICITOS: 'bg-red-50 text-red-700 border-red-100',
  NOTICIAS: 'bg-amber-50 text-amber-700 border-amber-100',
  INTERNACIONAL: 'bg-purple-50 text-purple-700 border-purple-100',
};

const inputClass =
  'w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 transition';

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function BuscadorListasNegativas() {
  const [resultados, setResultados] = useState<ResultadoBusquedaResponse[] | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BusquedaFormValues>({
    resolver: zodResolver(busquedaSchema),
  });

  const onSubmit = async (values: BusquedaFormValues) => {
    setErrorServidor(null);
    try {
      const data = await listasNegativasService.buscar(values);
      setResultados(data);
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo completar la búsqueda. Verifica que el backend esté disponible.';
      setErrorServidor(mensaje);
      setResultados(null);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-ink tracking-tight">Listas Negativas</h1>
        <p className="text-brand-muted text-sm mt-1">
          Busca coincidencias en PEP, Actos Ilícitos, Noticias y Listas Internacionales.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-brand-muted mb-1.5">
              Nombres / Razón Social
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className={inputClass}
                placeholder="Ej. Juan Carlos"
                {...register('nombres')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">
              Apellido paterno
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className={inputClass}
                placeholder="Ej. Garcia"
                {...register('apellidoPaterno')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-brand-muted mb-1.5">
              Apellido materno
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className={inputClass}
                placeholder="Ej. Lopez"
                {...register('apellidoMaterno')}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-brand-muted mb-1.5">
              DNI / RUC / Pasaporte
            </label>
            <div className="relative">
              <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                className={inputClass}
                placeholder="Ej. 12345678"
                {...register('documento')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="lg:col-start-4 px-6 py-2.5 bg-brand-navy text-white text-sm font-semibold rounded-xl hover:bg-brand-navy-2 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Buscando…' : 'Realizar búsqueda'}
          </button>
        </div>

        {errors.nombres && (
          <p className="mt-3 text-xs text-red-600">{errors.nombres.message}</p>
        )}
        {errorServidor && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {errorServidor}
          </div>
        )}
      </form>

      {resultados === null && (
        <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center">
          <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            Ingresa un nombre, apellido o documento para empezar a buscar.
          </p>
        </div>
      )}

      {resultados !== null && (
        <div className="space-y-4">
          {resultados.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center text-brand-muted text-sm">
              No se encontraron coincidencias para los criterios ingresados.
            </div>
          ) : (
            resultados.map((persona) => (
              <div
                key={persona.entidadId}
                className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-11 h-11 rounded-full bg-brand-navy text-white text-sm font-semibold flex items-center justify-center shrink-0">
                    {iniciales(persona.nombreCompleto) || '·'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h2 className="text-base font-semibold text-brand-ink">
                        {persona.nombreCompleto}
                      </h2>
                      <span className="text-xs font-medium text-brand-muted shrink-0">
                        {persona.manchas.length} registro
                        {persona.manchas.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {persona.tipoDocumento ?? 'Documento'}: {persona.documento}
                      {persona.pais ? ` · ${persona.pais}` : ''}
                      {' · '}
                      {persona.tipoEntidad === 'JURIDICA' ? 'Persona jurídica' : 'Persona natural'}
                    </p>

                    <div className="mt-4 space-y-3">
                      {persona.manchas.map((mancha) => (
                        <div
                          key={mancha.id}
                          className="border border-slate-100 rounded-xl p-4 bg-slate-50/60"
                        >
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span
                              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                                TIPO_LISTA_STYLES[mancha.tipoListaCodigo ?? ''] ??
                                'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {mancha.tipoListaNombre ?? mancha.tipoListaCodigo}
                            </span>
                            <span className="text-xs text-brand-muted">
                              {formatearFecha(mancha.fechaRegistro)}
                              {mancha.fechaHasta ? ` – ${formatearFecha(mancha.fechaHasta)}` : ''}
                            </span>
                          </div>

                          {mancha.cargo || mancha.institucion ? (
                            <p className="text-sm text-brand-ink">
                              {[mancha.cargo, mancha.institucion].filter(Boolean).join(' — ')}
                              {mancha.periodoDesde && mancha.periodoHasta
                                ? ` (periodo: ${mancha.periodoDesde} – ${mancha.periodoHasta})`
                                : ''}
                            </p>
                          ) : (
                            <p className="text-sm text-brand-ink">{mancha.descripcion}</p>
                          )}

                          {mancha.link && (
                            <a
                              href={mancha.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1.5 inline-flex items-center gap-1 text-xs text-brand-navy hover:underline"
                            >
                              Ver fuente
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
