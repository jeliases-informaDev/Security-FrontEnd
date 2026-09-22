'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

function formatearFecha(fecha: string | null): string {
  if (!fecha) return '—';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Listas Negativas</h1>
        <p className="text-slate-500 text-sm mt-1">
          Busca coincidencias en PEP, Actos Ilícitos, Noticias y Listas Internacionales.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Nombres / Razón Social
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Buscar por Nombres / Razón Social"
              {...register('nombres')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Apellidos paterno y materno
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paterno"
                {...register('apellidoPaterno')}
              />
              <input
                type="text"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Materno"
                {...register('apellidoMaterno')}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">DNI / RUC</label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Buscar por DNI / RUC"
              {...register('documento')}
            />
          </div>
        </div>

        {errors.nombres && (
          <p className="mt-3 text-xs text-red-600">{errors.nombres.message}</p>
        )}
        {errorServidor && (
          <div className="mt-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
            {errorServidor}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 px-6 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Buscando…' : 'Realizar búsqueda'}
        </button>
      </form>

      {resultados !== null && (
        <div className="space-y-4">
          {resultados.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center text-slate-500 text-sm">
              No se encontraron coincidencias para los criterios ingresados.
            </div>
          ) : (
            resultados.map((persona) => (
              <div
                key={persona.entidadId}
                className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      {persona.nombreCompleto}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {persona.tipoDocumento ?? 'Documento'}: {persona.documento}
                      {persona.pais ? ` · ${persona.pais}` : ''}
                      {' · '}
                      {persona.tipoEntidad === 'JURIDICA' ? 'Persona jurídica' : 'Persona natural'}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-400">
                    {persona.manchas.length} registro{persona.manchas.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {persona.manchas.map((mancha) => (
                    <div
                      key={mancha.id}
                      className="border border-slate-100 rounded-xl p-4 bg-slate-50/50"
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
                        <span className="text-xs text-slate-400">
                          {formatearFecha(mancha.fechaRegistro)}
                          {mancha.fechaHasta ? ` – ${formatearFecha(mancha.fechaHasta)}` : ''}
                        </span>
                      </div>

                      {mancha.cargo || mancha.institucion ? (
                        <p className="text-sm text-slate-700">
                          {[mancha.cargo, mancha.institucion].filter(Boolean).join(' — ')}
                          {mancha.periodoDesde && mancha.periodoHasta
                            ? ` (periodo: ${mancha.periodoDesde} – ${mancha.periodoHasta})`
                            : ''}
                        </p>
                      ) : (
                        <p className="text-sm text-slate-700">{mancha.descripcion}</p>
                      )}

                      {mancha.link && (
                        <a
                          href={mancha.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                        >
                          Ver fuente
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
