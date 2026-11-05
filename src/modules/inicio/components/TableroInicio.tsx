'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { esAdministrador, modulosVisibles, type ModuloDashboard } from '@/shared/lib/modulos';
import { useIndira } from '@/shared/ui/IndiraContexto';
import { IconoDerecha, IconoDestello, IconoDestellos, IconoFlecha } from '@/shared/ui/iconos';
import { listasNegativasService, type InicioListas } from '@/modules/listas_negativas/services/listasNegativasService';
import { MedidorCoincidencia } from './MedidorCoincidencia';
import { UltimasBusquedas, type EstadoUltimas } from './UltimasBusquedas';

/** Tarjeta de un módulo: icono, rótulos de lo que hay dentro, nombre, descripción y «Abrir». */
function TarjetaModulo({ modulo }: { modulo: ModuloDashboard }) {
  const Icono = modulo.icono;
  return (
    <Link href={modulo.href} className="card card-hover group flex h-full min-h-[188px] flex-col gap-3.5 px-6 py-[22px]">
      <span className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-brand-soft text-ink" aria-hidden="true">
          <Icono />
        </span>
        {modulo.etiquetas && (
          <span className="flex flex-wrap justify-end gap-1.5">
            {modulo.etiquetas.map((etiqueta) => <span key={etiqueta} className="badge badge-neutral">{etiqueta}</span>)}
          </span>
        )}
      </span>
      <span className="block">
        <span className="block text-[17px] font-semibold leading-[1.5] tracking-[-0.01em] text-ink">{modulo.nombre}</span>
        <span className="mt-1 block text-[15px] leading-[22px] text-muted">{modulo.descripcion}</span>
      </span>
      <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold leading-5 text-ink">
        Abrir <IconoFlecha className="transition-transform duration-150 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

/**
 * Página principal (diseño «Propuesta suave», Figma PLAFT 167:704): bienvenida, tarjeta de Listas Negativas con la rueda de
 * coincidencia, últimas búsquedas (historial real) y una tarjeta por módulo, con Indira al final.
 */
export function TableroInicio() {
  const { usuario } = useAuth();
  const { alternar: alternarIndira } = useIndira();
  const [inicio, setInicio] = useState<InicioListas | null>(null);
  const [falloInicio, setFalloInicio] = useState(false);

  // Una sola lectura alimenta la rueda (el mayor porcentaje de las tres últimas consultas) y «Últimas búsquedas».
  useEffect(() => {
    let vigente = true;
    listasNegativasService
      .inicio()
      .then((datos) => { if (vigente) setInicio(datos); })
      .catch(() => { if (vigente) setFalloInicio(true); });
    return () => { vigente = false; };
  }, []);

  if (!usuario) return null;

  const ultimas: EstadoUltimas = inicio ? { fase: 'listo', items: inicio.ultimas } : falloInicio ? { fase: 'error' } : { fase: 'cargando' };

  const nombre = (usuario.nombreCompleto || usuario.usuario).split(' ')[0];
  const fecha = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  // Listas Negativas tiene su propia tarjeta grande; los módulos que aún no existen no se muestran aquí.
  const modulos = modulosVisibles(usuario).filter((modulo) => modulo.disponible && modulo.codigo !== 'listas-negativas');

  return (
    <main className="px-4 pb-10 pt-4 sm:px-6 lg:pb-12 lg:pl-[clamp(1.5rem,2.03vw,2.4375rem)] lg:pr-[clamp(1.5rem,3.33vw,4rem)] lg:pt-[35px]">
      {/* Bienvenida */}
      <section className="aparece flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <div className="min-w-0 lg:pl-1">
          <p className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] text-muted">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
            {fecha}
          </p>
          <h1 className="titulo-serif mt-2 text-[clamp(2.75rem,4.17vw,5rem)]">Bienvenido, {nombre}</h1>
          <p className="mt-3.5 text-[clamp(1rem,0.94vw,1.125rem)] text-muted">
            {esAdministrador(usuario) ? 'Tienes acceso a todos los módulos y a la administración de cuentas.' : 'Elige un módulo para empezar. Todo lo que hagas queda registrado.'}
          </p>
        </div>
        <button type="button" onClick={alternarIndira} className="btn btn-noche btn-lg lg:mb-1.5">
          <IconoDestellos className="h-[18px] w-[18px]" /> Preguntarle a Indira
        </button>
      </section>

      <div className="mt-9 grid gap-6 xl:grid-cols-[minmax(0,800fr)_minmax(0,654fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          {/* Listas Negativas */}
          <section className="aparece sombra-calida relative overflow-hidden rounded-[28px] border border-white/90 bg-white/95 sm:rounded-[34px]" aria-labelledby="titulo-listas">
            {/* Brillo suave bajo la rueda */}
            <div className="pointer-events-none absolute -bottom-12 right-5 h-[260px] w-[620px] max-w-full rounded-[50%] bg-white/60 blur-[30px]" aria-hidden="true" />
            <div className="relative grid gap-x-1 gap-y-8 p-[27px] md:grid-cols-[minmax(0,324fr)_minmax(0,424fr)] md:items-center">
              <div className="flex min-w-0 flex-col items-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/60 py-[7px] pl-3.5 pr-4 text-[13px] font-medium text-muted">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-vivo" aria-hidden="true" />
                  Listas negativas · datos en vivo
                </span>
                <h2 id="titulo-listas" className="mt-[22px] max-w-[5.95em] font-serif text-[clamp(2.25rem,2.81vw,3.375rem)] leading-[0.98] tracking-[-0.015em] text-ink">
                  Revisa las listas <em>negativas</em> de tus clientes
                </h2>
                <p className="mt-3.5 max-w-[290px] text-[15px] leading-snug text-ink/65">Busca PEP, sanciones y noticias en una sola consulta.</p>
                <Link href="/listas-negativas" className="btn btn-primary btn-lg mt-5">
                  Ir a Listas Negativas <IconoDerecha />
                </Link>
              </div>
              <MedidorCoincidencia valor={inicio?.rueda.porcentaje ?? null} sinConsultas={inicio != null && inicio.rueda.porcentaje == null} />
            </div>
          </section>

          <div className="aparece" style={{ animationDelay: '60ms' }}>
            <UltimasBusquedas estado={ultimas} />
          </div>
        </div>

        {/* Módulos */}
        <ul className="grid min-w-0 gap-6 sm:grid-cols-2 xl:auto-rows-fr" aria-label="Módulos">
          {modulos.map((modulo, i) => (
            <li key={modulo.codigo} className="aparece" style={{ animationDelay: `${80 + i * 40}ms` }}>
              <TarjetaModulo modulo={modulo} />
            </li>
          ))}
          <li className="aparece" style={{ animationDelay: `${80 + modulos.length * 40}ms` }}>
            <button
              type="button"
              onClick={alternarIndira}
              className="card-hover group flex h-full min-h-[188px] w-full flex-col gap-3.5 rounded-[20px] bg-noche px-6 py-[22px] text-left shadow-[0_18px_36px_-14px_rgb(51_36_13/0.28)] sm:rounded-[28px]"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-paper" aria-hidden="true">
                  <IconoDestello />
                </span>
                <span className="flex flex-wrap justify-end gap-1.5">
                  <span className="badge badge-noche">Asistente</span>
                  <span className="badge badge-noche">IA</span>
                </span>
              </span>
              <span className="block">
                <span className="block text-[17px] font-semibold leading-[1.5] tracking-[-0.01em] text-paper">Preguntarle a Indira</span>
                <span className="mt-1 block text-[15px] leading-[22px] text-paper/70">Resuelve dudas sobre la norma y tus evaluaciones</span>
              </span>
              <span className="mt-auto flex items-center gap-1.5 text-sm font-semibold leading-5 text-paper">
                Abrir <IconoFlecha className="transition-transform duration-150 group-hover:translate-x-0.5" />
              </span>
            </button>
          </li>
        </ul>
      </div>
    </main>
  );
}
