'use client';

import type { CSSProperties } from 'react';
import { IconoMedidor } from '@/shared/ui/iconos';
import type { EstadoResumen } from '../../hooks/useResumenInicio';
import { calcularLuces, estadoGeneral } from '../../lib/luces';
import type { CabinaInicio, ResumenInicio } from '../../services/inicioService';
import { ChipEstado } from './Instrumento';
import { LucesAlerta } from './LucesAlerta';
import { MedidorAguja } from './MedidorAguja';

/*
 * «Cabina de mando» de Inicio: una banda oscura con instrumentos de panel de avión (aguja, radar, líneas, mapa, combustible, luces
 * de alerta y vencimientos) sobre las cuatro tarjetas. Todo sale de `resumen.cabina` y de los bloques que el resumen ya trae; si
 * `cabina` no llega (backend anterior) o llega null (la cuenta no ve ningún módulo), la banda no se dibuja. Nunca un error.
 */

/**
 * Turno de entrada de la banda (como las tarjetas: `.inicio-entra` en globals.css). Solo lo lleva el esqueleto: cuando llegan los
 * datos, los instrumentos reemplazan al esqueleto en su sitio (sin que la banda entre dos veces) y cada uno hace su propia entrada.
 */
const TURNO = { '--paso': 1 } as CSSProperties;

/** ¿Llegó algo en la cabina? Con todo null (o vacía) no hay nada que dibujar. */
function hayAlgo(cabina: CabinaInicio): boolean {
  return [cabina.scoring, cabina.tendencia, cabina.mapa, cabina.plazos, cabina.licencia].some((bloque) => bloque != null);
}

/** Esqueleto mientras llega el resumen: la banda oscura con tres paneles, para que la página no salte cuando lleguen los instrumentos. */
function EsqueletoCabina() {
  return (
    <div className="inicio-entra mt-7" style={TURNO}>
      <section className="cabina @container p-4 sm:p-5" role="status" aria-live="polite" aria-busy="true" aria-label="Cargando la cabina de mando…">
        <div className="h-3 w-44 animate-pulse rounded-full bg-cabina-panel-2" />
        <div className="mt-4 grid gap-3 @[40rem]:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-cabina-panel" />
          ))}
        </div>
      </section>
    </div>
  );
}

interface Props {
  estado: EstadoResumen;
  /** El resumen ya cargado (null mientras llega o si falló). */
  resumen: ResumenInicio | null;
}

export function CabinaDeMando({ estado, resumen }: Props) {
  if (estado === 'cargando') return <EsqueletoCabina />;
  const cabina = resumen?.cabina;
  if (!resumen || !cabina || !hayAlgo(cabina)) return null;

  const luces = calcularLuces(resumen);
  const general = estadoGeneral(luces);
  const periodo = resumen.periodoEtiqueta;

  return (
    <div className="mt-7">
      <section className="cabina @container p-4 sm:p-5" aria-labelledby="cabina-titulo">
        <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <IconoMedidor className="h-[18px] w-[18px] shrink-0 text-cabina-texto-2" />
            <h2 id="cabina-titulo" className="break-words font-mono text-[13px] font-normal uppercase tracking-[0.22em] text-cabina-texto">
              Cabina de mando
            </h2>
            {periodo && <span className="cabina-rotulo break-words">{periodo}</span>}
          </div>
          {general && (
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="cabina-rotulo">Estado general</span>
              <ChipEstado estado={general.estado}>{general.texto}</ChipEstado>
            </p>
          )}
        </header>

        <div className="mt-4 flex flex-col gap-3">
          {luces.length > 0 && <LucesAlerta luces={luces} />}

          {/*
            Instrumentos. Ancho completo (≥ 72rem): dos columnas, 7/12 y 5/12. A la izquierda: aguja y radar, las líneas y, abajo, combustible
            e indicadores; a la derecha, el mapa (alto) y los vencimientos. De 40 a 72rem: dos columnas parejas. Debajo, uno tras otro.
            El orden del documento es el de lectura en el celular. Se mide el ancho de la banda, no el de la pantalla.
          */}
          <div className="grid gap-3 @[72rem]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div className="grid gap-3 @[40rem]:grid-cols-2 @[72rem]:grid-cols-7 @[72rem]:content-start">
              <MedidorAguja scoring={cabina.scoring} className="@[72rem]:col-span-3" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
