'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, User, IdCard, ShieldAlert, CalendarClock, UploadCloud } from 'lucide-react';
import {
  listasNegativasService,
  ResultadoBusquedaResponse,
} from '@/modules/listas_negativas/services/listasNegativasService';
import { ManchaCard } from '@/modules/listas_negativas/components/ManchaCard';
import { DetalleEntidadModal } from '@/modules/listas_negativas/components/DetalleEntidadModal';
import { HistorialBusquedas } from '@/modules/listas_negativas/components/HistorialBusquedas';
import { TrabajandoEnElloModal } from '@/shared/ui/TrabajandoEnElloModal';

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

const inputClass =
  'w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 transition';

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
  const [personaDetalle, setPersonaDetalle] = useState<ResultadoBusquedaResponse | null>(null);
  const [modalEnConstruccion, setModalEnConstruccion] = useState<string | null>(null);
  const [recargarHistorial, setRecargarHistorial] = useState(0);

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
      if (data.length > 0) {
        setRecargarHistorial((n) => n + 1);
      }
    } catch (err: unknown) {
      const mensaje =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo completar la búsqueda. Verifica que el backend esté disponible.';
      setErrorServidor(mensaje);
      setResultados(null);
    }
  };

  const abrirDetallePorId = async (entidadId: number) => {
    try {
      const detalle = await listasNegativasService.obtenerDetalle(entidadId);
      setPersonaDetalle(detalle);
    } catch {
      setErrorServidor('No se pudo cargar el detalle del registro.');
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
        className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-4"
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

      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setModalEnConstruccion('Programar búsqueda')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-navy bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
        >
          <CalendarClock className="w-4 h-4" />
          Programar búsqueda
        </button>
        <button
          onClick={() => setModalEnConstruccion('Consulta masiva')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-navy bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
        >
          <UploadCloud className="w-4 h-4" />
          Consulta masiva
        </button>
      </div>

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
              <button
                key={persona.entidadId}
                onClick={() => setPersonaDetalle(persona)}
                className="w-full text-left bg-white p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:border-brand-amber/40 transition"
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
                      {persona.manchas.slice(0, 1).map((mancha) => (
                        <ManchaCard key={mancha.id} mancha={mancha} />
                      ))}
                      {persona.manchas.length > 1 && (
                        <p className="text-xs text-brand-navy font-medium">
                          Ver {persona.manchas.length - 1} registro
                          {persona.manchas.length - 1 === 1 ? '' : 's'} más →
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      <HistorialBusquedas onVerDetalle={abrirDetallePorId} recargarClave={recargarHistorial} />

      {personaDetalle && (
        <DetalleEntidadModal persona={personaDetalle} onClose={() => setPersonaDetalle(null)} />
      )}

      {modalEnConstruccion && (
        <TrabajandoEnElloModal
          titulo={modalEnConstruccion}
          onClose={() => setModalEnConstruccion(null)}
        />
      )}
    </main>
  );
}
