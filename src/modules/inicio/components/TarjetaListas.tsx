import { IconoLupa } from '@/shared/ui/iconos';
import { Etiqueta } from '@/shared/ui/kit';
import type { CriticasSinDecidir, ResumenListas } from '../services/inicioService';
import { entero, esNumero, plural, porcentaje } from '../lib/formato';
import {
  BarraApilada,
  BarrasHorizontales,
  Cifra,
  Cifras,
  EnlaceModulo,
  EsqueletoTarjeta,
  ErrorTarjeta,
  FONDO,
  Franja,
  Subtitulo,
  Tarjeta,
  Tendencia,
  VacioTarjeta,
  type PropsBloque,
  type Segmento,
} from './piezas';

/** Frase de las coincidencias críticas sin decidir: roja si hay, verde si no queda ninguna. */
function AvisoCriticas({ criticas }: { criticas: CriticasSinDecidir | null }) {
  if (!criticas || !esNumero(criticas.cantidad)) return null;
  if (criticas.cantidad <= 0) return <Franja tono="ok">No hay coincidencias críticas sin decidir</Franja>;
  const antiguedad = !esNumero(criticas.masAntiguaDias)
    ? ''
    : criticas.masAntiguaDias <= 0
      ? ' · la más antigua es de hoy'
      : ` · la más antigua, ${plural(criticas.masAntiguaDias, 'día', 'días')}`;
  return <Franja tono="bad">{plural(criticas.cantidad, 'coincidencia crítica', 'coincidencias críticas')} sin decidir{antiguedad}</Franja>;
}

/** Contenido de la tarjeta cuando ya hay consultas: cuatro cifras con su serie, el reparto del resultado y las fuentes. */
function ContenidoListas({ b }: { b: ResumenListas }) {
  const r = b.resultado;
  const segmentosResultado: Segmento[] | null = r
    ? [
        { clave: 'critica', etiqueta: 'Crítica', valor: r.criticaPct, fondo: FONDO.critica },
        { clave: 'alta', etiqueta: 'Alta', valor: r.altaPct, fondo: FONDO.alta },
        { clave: 'media', etiqueta: 'Media', valor: r.mediaPct, fondo: FONDO.media },
        { clave: 'sin', etiqueta: 'Sin coincidencia', valor: r.sinCoincidenciaPct, fondo: FONDO.verde },
      ]
    : null;
  const fuentes = (b.porFuente ?? []).filter((f) => f && typeof f.fuente === 'string' && esNumero(f.coincidencias));

  return (
    <>
      <Cifras>
        <Cifra
          conSerie
          rotulo="Consultas"
          valor={entero(b.consultas)}
          detalle={<Tendencia valor={b.consultasVariacionPct} contra="vs. periodo anterior" />}
          serie={{ valores: b.consultasSerie, color: 'marino', etiqueta: 'Consultas por día, últimos 14 días' }}
        />
        <Cifra
          conSerie
          rotulo="Con coincidencia"
          valor={porcentaje(b.conCoincidenciaPct)}
          unidad={esNumero(b.conCoincidenciaPct) ? '%' : undefined}
          detalle="de las consultas"
          serie={{ valores: b.conCoincidenciaSerie, color: 'ambar', etiqueta: 'Porcentaje de consultas con coincidencia por día, últimos 14 días' }}
        />
        <Cifra
          conSerie
          rotulo="PEP detectados"
          valor={entero(b.pepDetectados)}
          detalle="clientes o contrapartes"
          serie={{ valores: b.pepSerie, color: 'marino', etiqueta: 'PEP detectados por día, últimos 14 días' }}
        />
        <Cifra
          conSerie
          rotulo="Homónimos descartados"
          valor={entero(b.homonimosDescartados)}
          detalle="revisados por el analista"
          serie={{ valores: b.homonimosSerie, color: 'marino', etiqueta: 'Homónimos descartados por día, últimos 14 días' }}
        />
      </Cifras>

      <div className="grid gap-x-7 gap-y-5 @[38rem]:grid-cols-2">
        <div className="min-w-0">
          <Subtitulo>Resultado de las consultas</Subtitulo>
          {segmentosResultado && segmentosResultado.some((s) => esNumero(s.valor)) ? (
            <BarraApilada etiqueta="Resultado de las consultas" segmentos={segmentosResultado} />
          ) : (
            <p className="text-[13px] text-muted">Sin datos del resultado de las consultas.</p>
          )}
          <div className="mt-3.5">
            <AvisoCriticas criticas={b.criticasSinDecidir} />
          </div>
        </div>

        <div className="min-w-0">
          <Subtitulo>Coincidencias por fuente</Subtitulo>
          {fuentes.length > 0 ? (
            <BarrasHorizontales etiqueta="Coincidencias por fuente" filas={fuentes.map((f) => ({ clave: f.fuente, etiqueta: f.fuente, valor: f.coincidencias }))} />
          ) : (
            <p className="text-[13px] text-muted">Ninguna fuente tuvo coincidencias en este periodo.</p>
          )}
        </div>
      </div>
    </>
  );
}

/** Tarjeta «Listas negativas» de Inicio: cómo van las consultas del periodo, sus coincidencias y lo crítico por decidir. */
export function TarjetaListas({ estado, bloque, periodoEtiqueta, onReintentar }: PropsBloque<ResumenListas>) {
  const titulo = 'Listas negativas';
  const marco = { id: 'inicio-listas', icono: IconoLupa, titulo, subtitulo: periodoEtiqueta };

  // Con la respuesta ya en mano, un bloque null es «no lo puede ver esta cuenta»: el tablero ni arma la tarjeta.
  if (estado === 'listo' && !bloque) return null;
  if (estado === 'cargando') return <Tarjeta {...marco}><EsqueletoTarjeta /></Tarjeta>;
  if (estado === 'error' || !bloque) return <Tarjeta {...marco}><ErrorTarjeta onReintentar={onReintentar} /></Tarjeta>;

  const sinConsultas = !esNumero(bloque.consultas) || bloque.consultas <= 0;
  return (
    <Tarjeta
      {...marco}
      derecha={
        sinConsultas ? undefined : (
          <>
            <Etiqueta tono="brand">{plural(bloque.consultas as number, 'consulta', 'consultas')}</Etiqueta>
            <EnlaceModulo href="/listas-negativas/historial">Ver todas</EnlaceModulo>
          </>
        )
      }
    >
      {sinConsultas ? (
        <VacioTarjeta
          texto={`Todavía no hay consultas${periodoEtiqueta ? ` en ${periodoEtiqueta}` : ' en este periodo'}. La primera que hagas en Listas Negativas aparecerá aquí.`}
          href="/listas-negativas"
          enlace="Ir a Listas negativas"
        />
      ) : (
        <ContenidoListas b={bloque} />
      )}
    </Tarjeta>
  );
}
