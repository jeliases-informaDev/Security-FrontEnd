'use client';

import { IconoMedidor } from '@/shared/ui/iconos';
import { calcularLuces, estadoGeneral } from '../../lib/luces';
import type { CabinaInicio, ResumenInicio } from '../../services/inicioService';
import { CombustibleTokens } from './CombustibleTokens';
import { ChipEstado } from './Instrumento';
import { LucesAlerta } from './LucesAlerta';
import { MapaPeru } from './MapaPeru';
import { MedidorAguja } from './MedidorAguja';
import { PulsoLineas } from './PulsoLineas';
import { RadarPerfil } from './RadarPerfil';

/*
 * «Cabina de mando» de Inicio: una banda oscura con instrumentos de panel de avión (aguja, radar, líneas, mapa, combustible, luces
 * de alerta y vencimientos) sobre las cuatro tarjetas. Todo sale de `resumen.cabina` y de los bloques que el resumen ya trae.
 *
 * REGLA: la banda solo existe cuando llega un objeto `cabina` con algo adentro. Si `cabina` falta (el backend desplegado todavía no
 * la manda) o es null (la cuenta no ve ningún módulo), no se dibuja NADA: ni luces, ni chip de estado, ni cajas «Sin dato», ni
 * esqueleto de carga, ni margen. El Inicio queda exactamente como antes de la cabina.
 */

/** ¿Llegó algo en la cabina? Con todo null (o vacía) no hay nada que dibujar. */
function hayAlgo(cabina: CabinaInicio): boolean {
  return [cabina.scoring, cabina.tendencia, cabina.mapa, cabina.plazos, cabina.licencia].some((bloque) => bloque != null);
}

interface Props {
  /** El resumen ya cargado (null mientras llega o si falló: en ese caso no se dibuja nada). */
  resumen: ResumenInicio | null;
}

export function CabinaDeMando({ resumen }: Props) {
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
              <RadarPerfil scoring={cabina.scoring} className="@[72rem]:col-span-4" />
              <PulsoLineas tendencia={cabina.tendencia} className="@[40rem]:col-span-2 @[72rem]:col-span-7" />
              <CombustibleTokens licencia={cabina.licencia} className="@[40rem]:col-span-2 @[72rem]:col-span-7" />
            </div>
            <div className="grid gap-3 @[40rem]:grid-cols-2 @[72rem]:grid-cols-1 @[72rem]:content-start">
              <MapaPeru mapa={cabina.mapa} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
