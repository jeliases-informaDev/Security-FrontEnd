import Link from 'next/link';
import { esNumero, fechaConAnio, legible, plural } from '../../lib/formato';
import { diasTexto, estadoDePlazo, rutaInterna, type EstadoLuz } from '../../lib/luces';
import type { PlazoCabina } from '../../services/inicioService';
import { ChipEstado, Instrumento, SinDato } from './Instrumento';
import { FONDO_ESTADO } from './tonos';

/*
 * Próximos vencimientos, como un «plan de vuelo»: una lista en vertical con un punto por plazo, el más urgente arriba. Cada punto lleva el
 * color del plazo (vencido, por vencer o con tiempo) y SIEMPRE su frase («Vence en 3 días», «Venció hace 2 días»): el color solo refuerza.
 * Los plazos vienen de `cabina.plazos` (los 6 más cercanos, ya ordenados por el servidor; aquí se ordenan igual por días). Un plazo es un
 * enlace solo si el servidor manda una ruta interna del front; cualquier otra cosa se muestra sin enlace.
 */

/** Cómo se llama cada tipo de plazo que manda hoy el servidor. Un tipo nuevo se escribe legible («TIPO_NUEVO» → «Tipo nuevo»). */
const TIPOS: Record<string, string> = {
  COMUNICACION_UIF: 'Comunicación a la UIF',
  VACANCIA_OFICIAL: 'Oficial de cumplimiento vacante',
  DECLARACION: 'Declaración jurada · revisión sugerida',
  DENUNCIA: 'Canal de denuncias',
  REGISTRO_MENSUAL: 'Registro de operaciones · fecha estimada',
};

function etiquetaDeTipo(tipo: string | null | undefined): string {
  const limpio = (tipo ?? '').toString().trim();
  if (!limpio) return 'Plazo';
  return TIPOS[limpio] ?? legible(limpio);
}

interface Fila {
  clave: string;
  titulo: string;
  etiqueta: string;
  fecha: string | null;
  dias: number | null;
  estado: EstadoLuz;
  frase: string;
  ruta: string | null;
}

/** «Venció hace 2 días», «Vence hoy», «Vence en 3 días»; sin días, «Sin fecha». */
function fraseDe(dias: number | null): string {
  if (dias == null) return 'Sin fecha';
  if (dias < 0) return `Venció ${diasTexto(dias)}`;
  return `Vence ${diasTexto(dias)}`;
}

function filasDe(plazos: readonly (PlazoCabina | null)[]): Fila[] {
  return plazos
    .filter((p): p is PlazoCabina => !!p)
    .map((p, i) => {
      const dias = esNumero(p.dias) ? p.dias : null;
      return {
        clave: `${p.tipo ?? 'plazo'}-${p.vence ?? 'sin-fecha'}-${p.titulo ?? ''}-${i}`,
        titulo: (p.titulo ?? '').trim() || 'Plazo sin título',
        etiqueta: etiquetaDeTipo(p.tipo),
        fecha: fechaConAnio(p.vence ?? null),
        dias,
        estado: dias == null ? ('gris' as const) : estadoDePlazo(p.tipo, dias),
        frase: fraseDe(dias),
        ruta: rutaInterna(p.enlace),
      };
    })
    .sort((a, b) => (a.dias ?? Number.MAX_SAFE_INTEGER) - (b.dias ?? Number.MAX_SAFE_INTEGER));
}

function FilaPlazo({ fila, ultima }: { fila: Fila; ultima: boolean }) {
  const contenido = (
    <>
      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <ChipEstado estado={fila.estado}>{fila.frase}</ChipEstado>
        {fila.fecha && <span className="font-mono text-[11px] text-cabina-tenue">{fila.fecha}</span>}
      </span>
      <span className="mt-1.5 block break-words text-[13px] leading-snug text-cabina-texto">{fila.titulo}</span>
      <span className="cabina-rotulo mt-1 block break-words">{fila.etiqueta}</span>
    </>
  );

  return (
    <li className="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3">
      {/* El riel del plan de vuelo: un punto por plazo y la línea que lo une con el siguiente. */}
      <span className="relative flex justify-center" aria-hidden="true">
        <span className={`relative z-10 mt-3 h-2.5 w-2.5 rounded-full ${FONDO_ESTADO[fila.estado]}`} />
        {!ultima && <span className="absolute bottom-0 left-1/2 top-5 w-px -translate-x-1/2 bg-cabina-borde-fuerte" />}
      </span>
      <div className={ultima ? '' : 'pb-1.5'}>
        {fila.ruta ? (
          <Link href={fila.ruta} className="-mx-2 block rounded-lg px-2 py-2 transition-colors hover:bg-cabina-panel-2">
            {contenido}
          </Link>
        ) : (
          <div className="-mx-2 px-2 py-2">{contenido}</div>
        )}
      </div>
    </li>
  );
}

export function ProximosVencimientos({ plazos, className = '' }: { plazos: readonly (PlazoCabina | null)[] | null | undefined; className?: string }) {
  const marco = { id: 'cabina-vencimientos', titulo: 'Próximos vencimientos', className };
  if (!plazos) {
    return (
      <Instrumento {...marco}>
        <SinDato texto="Tu cuenta no ve estos plazos, o todavía no hay datos." />
      </Instrumento>
    );
  }

  const filas = filasDe(plazos);
  if (filas.length === 0) {
    return (
      <Instrumento {...marco} subtitulo="Lo que vence primero va arriba">
        <p className="flex items-start gap-2.5 text-[13px] leading-snug text-cabina-texto-2">
          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${FONDO_ESTADO.verde}`} aria-hidden="true" />
          <span className="min-w-0 break-words">
            <span className="block font-medium text-cabina-texto">Sin vencimientos cercanos</span>
            No hay plazos por vencer en lo que ve tu cuenta.
          </span>
        </p>
      </Instrumento>
    );
  }

  return (
    <Instrumento {...marco} subtitulo="Lo que vence primero va arriba" derecha={<span className="cabina-rotulo">{plural(filas.length, 'plazo', 'plazos')}</span>}>
      <ol className="flex flex-col" aria-label="Plazos, del más urgente al más lejano">
        {filas.map((fila, i) => (
          <FilaPlazo key={fila.clave} fila={fila} ultima={i === filas.length - 1} />
        ))}
      </ol>
    </Instrumento>
  );
}
