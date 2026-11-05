import { Fragment } from 'react';
import { CalendarDays } from 'lucide-react';
import { Esqueleto } from '@/shared/ui/kit';
import type { CatalogoListas, ResultadoConsulta } from '../services/listasNegativasService';
import { diaYMes, fechaConAnio } from '../lib/formato';
import { PuntoEstado } from './piezas';

interface FilaVista {
  clave: string;
  nombre: string;
  peso: number;
  subtitulo: string | null;
  actualizada: string | null;
  estado: 'COINCIDENCIA' | 'SIN_COINCIDENCIAS' | 'PRONTO' | 'SIN_CONSULTAR';
  etiqueta: string;
  motivo: string | null;
  otraLista: boolean;
}

function FilaDeLista({ fila }: { fila: FilaVista }) {
  const act = diaYMes(fila.actualizada);
  const subtitulo = [fila.subtitulo, act ? `act. ${act}` : null].filter(Boolean).join(' · ');
  const apagada = fila.estado === 'PRONTO';
  const clase =
    fila.estado === 'COINCIDENCIA' ? 'badge-bad' : fila.estado === 'SIN_COINCIDENCIAS' ? 'badge-ok' : 'badge-neutral';
  return (
    <li className={`flex items-center gap-3 py-[11px] ${apagada ? 'opacity-70' : ''}`} title={fila.motivo ?? undefined}>
      <PuntoEstado estado={fila.estado === 'PRONTO' ? 'SIN_CONSULTAR' : fila.estado} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium leading-[22px] text-ink">
          {fila.nombre}
          {fila.peso > 0 && <span className="text-muted"> · {fila.peso}%</span>}
        </p>
        {subtitulo && <p className="rotulo break-words">{subtitulo}</p>}
      </div>
      <span className={`badge shrink-0 ${clase}`}>{fila.etiqueta}</span>
    </li>
  );
}

interface Props {
  /** Catálogo (antes de consultar). Sin él ni resultado, se muestra la carga. */
  catalogo: CatalogoListas | null;
  /** Resultado de la consulta abierta: si existe, manda sobre el catálogo. */
  resultado: ResultadoConsulta | null;
}

/** Tarjeta «Detalle por lista»: una fila por lista con su peso y su estado, y las «Otras listas» cuando existan. */
export function DetalleLista({ catalogo, resultado }: Props) {
  let filas: FilaVista[] = [];
  let leyenda: string | null = null;
  let fechaBase: string | null = null;

  if (resultado) {
    leyenda = resultado.leyenda;
    fechaBase = resultado.fechaBase;
    filas = resultado.filas.map((f) => ({
      clave: f.codigo,
      nombre: f.nombre,
      peso: f.peso,
      subtitulo: f.subtitulo,
      actualizada: f.actualizada,
      estado: f.estado,
      etiqueta: f.etiquetaConteo,
      motivo: f.motivo,
      otraLista: f.otraLista,
    }));
  } else if (catalogo) {
    leyenda = catalogo.leyenda;
    fechaBase = catalogo.fechaBase;
    filas = catalogo.filas.map((f) => ({
      clave: f.codigo,
      nombre: f.nombre,
      peso: f.peso,
      subtitulo: f.subtitulo,
      actualizada: f.actualizada,
      estado: f.disponible ? 'SIN_CONSULTAR' : 'PRONTO',
      etiqueta: f.disponible ? 'Sin consultar' : 'Pronto',
      motivo: f.motivo,
      otraLista: false,
    }));
  }

  const base = fechaConAnio(fechaBase);
  const primeraOtra = filas.findIndex((f) => f.otraLista);

  return (
    <section className="card flex flex-col gap-1.5 p-6" aria-labelledby="titulo-detalle-lista">
      <div className="flex items-center gap-2.5 pb-1.5">
        <h2 id="titulo-detalle-lista" className="min-w-0 flex-1 text-[17px] font-semibold leading-[25.5px] tracking-[-0.01em] text-ink">Detalle por lista</h2>
        {base && (
          <span className="badge badge-neutral gap-1.5">
            <CalendarDays className="h-3 w-3" aria-hidden="true" />
            {base}
          </span>
        )}
      </div>
      {leyenda && <p className="text-[13px] leading-[22px] text-muted">{leyenda}</p>}
      <div className="h-px w-full bg-line" />

      {filas.length === 0 ? (
        <Esqueleto lineas={6} className="py-3" />
      ) : (
        <ul>
          {filas.map((fila, i) => (
            <Fragment key={fila.clave}>
              {i === primeraOtra && (
                <li className="rotulo border-t border-line pb-0.5 pt-4">Otras listas</li>
              )}
              <FilaDeLista fila={fila} />
            </Fragment>
          ))}
        </ul>
      )}
    </section>
  );
}
