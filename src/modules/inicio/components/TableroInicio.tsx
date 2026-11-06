'use client';

import type { ComponentType, CSSProperties, ReactNode, SVGProps } from 'react';
import Link from 'next/link';
import { useAuth } from '@/modules/auth/hooks/AuthProvider';
import { useIndira } from '@/shared/ui/IndiraContexto';
import { IconoDestellos, IconoLupa, IconoMas, IconoMensaje, IconoOficial, IconoRecibo } from '@/shared/ui/iconos';
import { useResumenInicio } from '../hooks/useResumenInicio';
import { LimiteError } from './LimiteError';
import { ErrorTarjeta, Tarjeta } from './piezas';
import { TarjetaDenuncias } from './TarjetaDenuncias';
import { TarjetaListas } from './TarjetaListas';
import { TarjetaOficial } from './TarjetaOficial';
import { TarjetaOperaciones } from './TarjetaOperaciones';

/**
 * Turno de un bloque en la entrada de la página (`.inicio-entra` en globals.css, Figma 109:153): primero la bienvenida y
 * después una tarjeta tras otra, en el orden en que se leen.
 */
const turno = (paso: number) => ({ '--paso': paso }) as CSSProperties;

type Icono = ComponentType<SVGProps<SVGSVGElement>>;

/** Una tarjeta con su propia red: si al dibujarla algo falla, solo ella muestra el error (y deja reintentar). */
function Bloque({ id, icono, titulo, onReintentar, children }: { id: string; icono: Icono; titulo: string; onReintentar: () => void; children: ReactNode }) {
  return (
    <LimiteError respaldo={<Tarjeta id={id} icono={icono} titulo={titulo}><ErrorTarjeta onReintentar={onReintentar} /></Tarjeta>}>
      {children}
    </LimiteError>
  );
}

/** «tus listas negativas, tus operaciones y el canal de denuncias»: solo nombra lo que la cuenta ve en la página. */
function frase(visibles: { listas: boolean; operaciones: boolean; oficial: boolean; denuncias: boolean }): string {
  const partes = [
    visibles.listas && 'tus listas negativas',
    visibles.operaciones && 'tus operaciones',
    visibles.oficial && 'tu oficial de cumplimiento',
    visibles.denuncias && 'el canal de denuncias',
  ].filter((parte): parte is string => typeof parte === 'string');
  if (partes.length === 0) return 'Elige un módulo del menú para empezar. Todo lo que hagas queda registrado.';
  const lista = partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
  return `Lo urgente va primero. Aquí tienes cómo van ${lista}.`;
}

/**
 * Página principal (diseño «Propuesta suave»): bienvenida y cuatro tarjetas con datos reales del servidor
 * (GET /api/inicio/resumen): listas negativas y registro de operaciones a la izquierda, oficial de cumplimiento y
 * canal de denuncias a la derecha. Debajo de 1024 px todo va en una sola columna. Una tarjeta que el servidor manda null no se muestra.
 */
export function TableroInicio() {
  const { usuario } = useAuth();
  const { alternar: alternarIndira } = useIndira();
  const { datos, estado, version, recargar } = useResumenInicio();

  if (!usuario) return null;

  const nombre = (usuario.nombreCompleto || usuario.usuario).split(' ')[0];
  const fecha = new Intl.DateTimeFormat('es-PE', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  // Mientras llega la respuesta (o si falla) se arman las cuatro tarjetas; con la respuesta, solo las que no vienen null.
  const resumen = estado === 'listo' ? datos : null;
  const ve = {
    listas: !resumen || resumen.listas != null,
    operaciones: !resumen || resumen.operaciones != null,
    oficial: !resumen || resumen.oficial != null,
    denuncias: !resumen || resumen.denuncias != null,
  };
  const hayIzquierda = ve.listas || ve.operaciones;
  const hayDerecha = ve.oficial || ve.denuncias;
  const periodo = datos?.periodoEtiqueta ?? null;
  const propiedades = { estado, periodoEtiqueta: periodo, onReintentar: recargar };

  return (
    <main className="px-4 pb-10 pt-4 sm:px-6 lg:pb-12 lg:pl-[clamp(1.5rem,2.03vw,2.4375rem)] lg:pr-[clamp(1.5rem,3.33vw,4rem)] lg:pt-[35px]">
      {/* Bienvenida */}
      <section className="inicio-entra flex flex-wrap items-end justify-between gap-x-8 gap-y-5" style={turno(0)}>
        <div className="min-w-0 lg:pl-1">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
            {fecha}
          </p>
          <h1 className="titulo-serif mt-2 break-words text-[clamp(2.25rem,3.3vw,4rem)]">Bienvenido, {nombre}</h1>
          <p className="mt-3 max-w-[42rem] text-[clamp(0.9375rem,0.94vw,1.0625rem)] leading-relaxed text-muted">{frase(ve)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:mb-1.5">
          {/* «Nueva evaluación» lleva a Scoring de riesgo, donde se evalúa a un cliente. */}
          <Link href="/scoring" className="btn btn-primary btn-lg">
            <IconoMas /> Nueva evaluación
          </Link>
          <button type="button" onClick={alternarIndira} className="btn btn-secondary btn-lg">
            <IconoDestellos className="h-[18px] w-[18px]" /> Preguntarle a Indira
          </button>
        </div>
      </section>

      {!hayIzquierda && !hayDerecha ? (
        <p className="card mt-7 px-6 py-10 text-center text-sm text-muted">Con tu cuenta no hay resúmenes para mostrar aquí. Elige un módulo en el menú para empezar.</p>
      ) : (
        <div className={`mt-7 grid items-start gap-4 lg:gap-[17px] ${hayIzquierda && hayDerecha ? 'lg:grid-cols-[minmax(0,1.96fr)_minmax(0,1fr)]' : ''}`}>
          {hayIzquierda && (
            <div className="flex min-w-0 flex-col gap-4 lg:gap-[17px]">
              {ve.listas && (
                <div className="inicio-entra" style={turno(1)}>
                  <Bloque key={`listas-${version}`} id="inicio-listas" icono={IconoLupa} titulo="Listas negativas" onReintentar={recargar}>
                    <TarjetaListas bloque={datos?.listas} {...propiedades} />
                  </Bloque>
                </div>
              )}
              {ve.operaciones && (
                <div className="inicio-entra" style={turno(2)}>
                  <Bloque key={`operaciones-${version}`} id="inicio-operaciones" icono={IconoRecibo} titulo="Registro de operaciones" onReintentar={recargar}>
                    <TarjetaOperaciones bloque={datos?.operaciones} {...propiedades} />
                  </Bloque>
                </div>
              )}
            </div>
          )}
          {hayDerecha && (
            <div className="flex min-w-0 flex-col gap-4 lg:gap-[17px]">
              {ve.oficial && (
                <div className="inicio-entra" style={turno(3)}>
                  <Bloque key={`oficial-${version}`} id="inicio-oficial" icono={IconoOficial} titulo="Oficial de cumplimiento" onReintentar={recargar}>
                    <TarjetaOficial bloque={datos?.oficial} {...propiedades} />
                  </Bloque>
                </div>
              )}
              {ve.denuncias && (
                <div className="inicio-entra" style={turno(4)}>
                  <Bloque key={`denuncias-${version}`} id="inicio-denuncias" icono={IconoMensaje} titulo="Canal de denuncias" onReintentar={recargar}>
                    <TarjetaDenuncias bloque={datos?.denuncias} {...propiedades} />
                  </Bloque>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
