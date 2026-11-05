'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { scoringService, type FilaHistorial, type PageResponse } from '../services/scoringService';
import { mensajeDe } from '@/modules/licencias/lib/errores';
import { Panel } from '@/shared/ui/PageShell';
import { Aviso, Boton, Esqueleto, EstadoVacio, Paginacion } from '@/shared/ui/kit';
import { NIVEL, badgeCategoriaAntigua, decisionTexto, fechaCortaDe, puntajeTexto } from '../lib/formato';

const TAMANO = 10;

/** Una fila es de la versión 1 si lo dice, o si solo trae la categoría de entonces. */
export function esAntigua(fila: FilaHistorial): boolean {
  return fila.version === 1 || (fila.version == null && !fila.nivel && !!fila.categoria);
}

export function NivelFila({ fila }: { fila: FilaHistorial }) {
  if (fila.nivel && !esAntigua(fila)) return <span className={`badge ${NIVEL[fila.nivel].badge}`}>{NIVEL[fila.nivel].etiqueta}</span>;
  return <span className={`badge ${badgeCategoriaAntigua(fila.categoria)}`}>{fila.categoria ?? '—'}</span>;
}

/** Lista de evaluaciones hechas: nivel, puntaje, fecha y decisión. Abrir una muestra su resultado. */
export function HistorialScoring({ onAbrir, onVolver, abriendoId }: { onAbrir: (fila: FilaHistorial) => void; onVolver: () => void; abriendoId: number | null }) {
  const [pagina, setPagina] = useState(0);
  const [carga, setCarga] = useState<{ pagina: number; datos: PageResponse<FilaHistorial> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    scoringService
      .obtenerHistorial(pagina, TAMANO)
      .then((d) => { if (!cancelado) { setCarga({ pagina, datos: d }); setError(null); } })
      .catch((err: unknown) => { if (!cancelado) setError(mensajeDe(err, 'No se pudo cargar el historial.')); });
    return () => { cancelado = true; };
  }, [pagina]);

  const datos = carga?.datos ?? null;
  const cargando = carga?.pagina !== pagina && !error;

  const filas = datos?.content ?? [];
  const desde = filas.length ? pagina * TAMANO + 1 : 0;

  return (
    <div className="space-y-4">
      <div><Boton variante="secundario" icono={ArrowLeft} onClick={onVolver}>Volver a la evaluación</Boton></div>
      {error && <Aviso aviso={{ tipo: 'error', texto: error }} onCerrar={() => setError(null)} />}
      <Panel className="aparece" titulo="Historial de evaluaciones" descripcion="Las evaluaciones antiguas conservan la categoría que tenían.">
        {cargando && !datos ? (
          <div className="p-6"><Esqueleto lineas={5} /></div>
        ) : filas.length === 0 ? (
          <EstadoVacio icono={History} titulo="Todavía no hay evaluaciones" texto="Cuando evalúes a un cliente, aparecerá aquí." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="tabla min-w-[40rem]">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Nivel</th>
                    <th scope="col" className="num">Puntaje</th>
                    <th scope="col">Decisión</th>
                    <th scope="col"><span className="sr-only">Abrir</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.id}>
                      <td className="whitespace-nowrap text-muted">{fechaCortaDe(f.fechaCreacion)}</td>
                      <td>
                        <p className="font-medium">{f.nombreCompleto}</p>
                        <p className="rotulo">{f.documento}</p>
                      </td>
                      <td><NivelFila fila={f} /></td>
                      <td className="num font-medium">{puntajeTexto(f.puntajeTotal)}</td>
                      <td className="text-muted">{esAntigua(f) ? '—' : decisionTexto(f.decision)}</td>
                      <td className="text-right"><Boton variante="secundario" tamano="sm" cargando={abriendoId === f.id} onClick={() => onAbrir(f)}>Ver</Boton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Paginacion desde={desde} hasta={desde + filas.length - 1} total={datos?.totalElements ?? filas.length} pagina={pagina} totalPaginas={datos?.totalPages ?? 1} onCambiar={setPagina} cargando={cargando} />
          </>
        )}
      </Panel>
    </div>
  );
}

/** Resultado de una evaluación de la versión 1: solo se muestra con la categoría y el puntaje de entonces. */
export function EvaluacionAntigua({ fila, onVolver }: { fila: FilaHistorial; onVolver: () => void }) {
  return (
    <div className="space-y-4">
      <div><Boton variante="secundario" icono={ArrowLeft} onClick={onVolver}>Volver al historial</Boton></div>
      <Panel className="aparece max-w-3xl" relleno>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-ink">{fila.nombreCompleto}</p>
            <p className="rotulo mt-0.5">{fila.documento} · {fechaCortaDe(fila.fechaCreacion)}</p>
          </div>
          <div className="text-right">
            <NivelFila fila={fila} />
            <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">{puntajeTexto(fila.puntajeTotal)}</p>
          </div>
        </div>
        <p className="mt-5 rounded-2xl bg-surface-2/70 p-4 text-sm text-muted">
          Esta evaluación se hizo con la metodología anterior (versión 1). Se conserva tal como quedó: no se vuelve a calcular.
        </p>
      </Panel>
    </div>
  );
}
