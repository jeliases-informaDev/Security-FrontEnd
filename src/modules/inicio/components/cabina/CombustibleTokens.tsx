import { ExternalLink } from 'lucide-react';
import { ENLACE_LICENCIA } from '@/modules/licencias/lib/errores';
import { entero, esNumero, fechaConAnio } from '../../lib/formato';
import { DIAS_LICENCIA_AVISO, RESTANTE_BAJO_PCT, RESTANTE_CRITICO_PCT, diasTexto, estadoRestante, porcentajeRestante, type EstadoLuz } from '../../lib/luces';
import type { CabinaLicencia } from '../../services/inicioService';
import { ChipEstado, Instrumento, SinDato } from './Instrumento';
import { FONDO_ESTADO, PALABRA_ESTADO } from './tonos';

/*
 * Combustible «Tokens y usuarios»: dos barras de celdas, como el indicador de combustible de un tablero. La barra muestra lo que QUEDA
 * (llena = nada gastado): ámbar con menos del 20 % y rojo con menos del 5 %, los mismos cortes de la luz «Licencia». Debajo, el plan y
 * cuándo vence la licencia. Todo se dice también con números y palabras (la barra es solo el dibujo): por eso va oculta al lector de pantalla.
 * Los datos son los del servicio de licencias de Sulotec; aquí solo se leen (la licencia se maneja en el portal, no en PLAFT).
 */

const CELDAS = 20;

interface BarraProps {
  titulo: string;
  /** Lo que se consumió y el total (o el cupo). */
  usados: number | null | undefined;
  total: number | null | undefined;
  /** Lo que se mide, en plural, para las frases («tokens», «usuarios»). */
  cosa: string;
  /** Cómo se llama lo consumido («usados», «en uso»). */
  consumido: string;
}

function Barra({ titulo, usados, total, cosa, consumido }: BarraProps) {
  const restante = porcentajeRestante(usados, total);
  if (restante == null || !esNumero(usados) || !esNumero(total)) {
    return (
      <div className="min-w-0">
        <p className="cabina-rotulo !text-cabina-texto-2">{titulo}</p>
        <SinDato texto={`El servicio de licencias no mandó los ${cosa}.`} />
      </div>
    );
  }
  const estado = estadoRestante(restante);
  const quedan = Math.max(0, total - usados);
  // Si queda algo, al menos una celda encendida (una barra vacía diría «nada»). El porcentaje se redondea hacia abajo: 4,6 % es rojo y no puede leerse «5 %».
  const encendidas = restante <= 0 ? 0 : Math.max(1, Math.round((restante / 100) * CELDAS));
  const porCiento = Math.floor(restante + 1e-9);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="cabina-rotulo !text-cabina-texto-2">{titulo}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[1.125rem] font-medium leading-none tabular-nums text-cabina-texto">{porCiento} %</span>
          <span className="text-[12px] text-cabina-tenue">restante</span>
          {(estado === 'ambar' || estado === 'rojo') && <ChipEstado estado={estado}>{PALABRA_ESTADO[estado]}</ChipEstado>}
        </p>
      </div>
      <div className="mt-2 flex h-3 gap-[2px]" aria-hidden="true">
        {Array.from({ length: CELDAS }, (_, i) => (
          <span key={i} className={`h-full min-w-0 flex-1 rounded-[2px] ${i < encendidas ? FONDO_ESTADO[estado] : 'bg-cabina-panel-2'}`} />
        ))}
      </div>
      <p className="mt-2 break-words text-[12px] leading-snug text-cabina-texto-2">
        Quedan {entero(quedan)} de {entero(total)} · {entero(usados)} {consumido}
      </p>
    </div>
  );
}

/** Cuándo vence la licencia, en una frase, y de qué color (vencida: rojo; en 30 días o menos: ámbar). Null si el servidor no manda fecha ni días. */
function vencimiento(vence: string | null | undefined, dias: number | null | undefined): { texto: string; estado: EstadoLuz } | null {
  const fecha = fechaConAnio(vence ?? null);
  if (!esNumero(dias)) return fecha ? { texto: `Vence el ${fecha}`, estado: 'gris' } : null;
  const estado: EstadoLuz = dias < 0 ? 'rojo' : dias <= DIAS_LICENCIA_AVISO ? 'ambar' : 'verde';
  if (dias < 0) return { texto: `Venció ${fecha ? `el ${fecha} · ` : ''}${diasTexto(dias)}`, estado };
  if (dias === 0) return { texto: `Vence hoy${fecha ? ` (${fecha})` : ''}`, estado };
  return { texto: `Vence ${fecha ? `el ${fecha} · ` : ''}${diasTexto(dias)}`, estado };
}

const PALABRA_VENCIMIENTO: Partial<Record<EstadoLuz, string>> = { ambar: 'Por vencer', rojo: 'Vencida' };

export function CombustibleTokens({ licencia, className = '' }: { licencia: CabinaLicencia | null | undefined; className?: string }) {
  const marco = { id: 'cabina-combustible', titulo: 'Tokens y usuarios', className };
  const hayAlgo = !!licencia && [licencia.plan, licencia.tokens, licencia.usuarios, licencia.vence, licencia.diasRestantes].some((v) => v != null);
  if (!licencia || !hayAlgo) {
    return (
      <Instrumento {...marco}>
        <SinDato texto="No hay datos de la licencia: puede estar apagada, la empresa puede no tener una, o el servicio no respondió a tiempo." />
      </Instrumento>
    );
  }

  const nombrePlan = (licencia.plan ?? '').trim();
  // «Profesional» → «Plan Profesional»; si el nombre ya empieza con «Plan», se deja como viene.
  const plan = nombrePlan && !/^plan\b/i.test(nombrePlan) ? `Plan ${nombrePlan}` : nombrePlan;
  const vence = vencimiento(licencia.vence, licencia.diasRestantes);

  return (
    <Instrumento {...marco} subtitulo="Lo que queda de la licencia" derecha={plan ? <span className="cabina-rotulo break-words">{plan}</span> : null}>
      <div className="grid gap-x-8 gap-y-5 @[32rem]:grid-cols-2">
        <Barra titulo="Tokens" usados={licencia.tokens?.usados} total={licencia.tokens?.total} cosa="tokens" consumido="usados" />
        <Barra titulo="Usuarios" usados={licencia.usuarios?.usados} total={licencia.usuarios?.cupo} cosa="usuarios" consumido="en uso" />
      </div>

      <p className="text-[11px] leading-snug text-cabina-tenue">
        La barra muestra lo que queda. Se pone ámbar con menos del {RESTANTE_BAJO_PCT} % y roja con menos del {RESTANTE_CRITICO_PCT} %.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-cabina-borde pt-3">
        <p className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] leading-snug text-cabina-texto-2">
          <span className="break-words">{vence ? vence.texto : 'Sin fecha de vencimiento'}</span>
          {vence && PALABRA_VENCIMIENTO[vence.estado] && <ChipEstado estado={vence.estado}>{PALABRA_VENCIMIENTO[vence.estado]}</ChipEstado>}
        </p>
        {/* La licencia se maneja en el portal de Sulotec: se abre en otra pestaña. */}
        <a href={ENLACE_LICENCIA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12px] text-cabina-texto-2 underline-offset-4 transition-colors hover:text-cabina-texto hover:underline">
          Ver mi licencia
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="sr-only">(se abre en otra pestaña)</span>
        </a>
      </div>
    </Instrumento>
  );
}
