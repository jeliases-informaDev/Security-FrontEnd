/**
 * Semirrueda del porcentaje de coincidencia (página principal, diseño «Propuesta suave»): 61 marcas que van del verde al rojo,
 * una aguja y la cifra al centro. Las medidas son las del diseño (392 × 282) y todo se escala junto.
 *
 * Muestra el mayor porcentaje de las últimas consultas de Listas Negativas. Sin valor, la rueda queda apagada y sin cifra inventada.
 * Si además se sabe que no hay consultas, lo dice con una insignia.
 */

// Colores de las 61 marcas, de «bajo» (verde) a «alto» (rojo), tal como están en el diseño: es la escala del medidor.
export const COLORES_MEDIDOR = [
  '#2db757', '#35b954', '#3dbb51', '#45be4e', '#4dc04b', '#55c248', '#5dc445', '#65c642', '#6ec940', '#76cb3d',
  '#7ecd3a', '#86cf37', '#8ed134', '#96d431', '#9ed62e', '#a6d82b', '#abd72b', '#b1d62b', '#b6d52a', '#bcd42a',
  '#c1d32a', '#c6d22a', '#ccd12a', '#d1d029', '#d7cf29', '#dcce29', '#e1cd29', '#e7cc29', '#eccb28', '#f2ca28',
  '#f7c928', '#f7c527', '#f6c127', '#f6bc26', '#f6b825', '#f5b425', '#f5b024', '#f5ac23', '#f4a723', '#f4a322',
  '#f49f21', '#f39b21', '#f39720', '#f3921f', '#f28e1f', '#f28a1e', '#f0841e', '#ee7e1e', '#ec781e', '#eb721e',
  '#e96c1e', '#e7661e', '#e5601e', '#e3591f', '#e1531f', '#df4d1f', '#dd471f', '#dc411f', '#da3b1f', '#d8351f',
  '#d62f1f',
];
const ULTIMA = COLORES_MEDIDOR.length - 1;

const ROTULO = 'fill-muted font-mono text-[11px] uppercase tracking-[0.12em]';

interface MedidorCoincidenciaProps {
  /** Porcentaje de coincidencia, de 0 a 100. Sin valor, la rueda queda apagada. */
  valor?: number | null;
  /** Ya se sabe que no hay consultas: la rueda apagada lo dice con una insignia. */
  sinConsultas?: boolean;
}

export function MedidorCoincidencia({ valor = null, sinConsultas = false }: MedidorCoincidenciaProps) {
  const hayValor = typeof valor === 'number' && Number.isFinite(valor);
  const v = hayValor ? Math.min(100, Math.max(0, valor)) : 0;
  const ultimaEncendida = Math.round((v / 100) * ULTIMA);

  return (
    <div className="min-w-0">
      <div className="flex min-h-[22px] items-center justify-between gap-3 pl-6 pr-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Porcentaje de coincidencia</p>
        {!hayValor && sinConsultas && <span className="badge badge-neutral px-2.5 py-[3px]">Sin consultas</span>}
      </div>
      <svg
        viewBox="0 0 392 282"
        className="mx-auto mt-[22px] block h-auto w-full max-w-[392px]"
        role="img"
        aria-label={hayValor ? `Coincidencia: ${Math.round(v)} por ciento` : 'Porcentaje de coincidencia: sin datos'}
      >
        {/* Marcas: de la izquierda (bajo) a la derecha (alto), una cada 3 grados alrededor del centro (196, 196) */}
        {COLORES_MEDIDOR.map((color, i) => (
          <rect
            key={color}
            x={-2.5}
            y={-196}
            width={5}
            height={46}
            rx={2.5}
            fill={color}
            opacity={hayValor ? (i <= ultimaEncendida ? 1 : 0.15) : 0.28}
            transform={`translate(196 196) rotate(${-90 + 3 * i})`}
          />
        ))}
        <text x={2} y={220} className={ROTULO}>Bajo</text>
        <text x={390} y={220} textAnchor="end" className={ROTULO}>Alto</text>
        <text x={198.5} y={246} textAnchor="middle" className="fill-brand font-sans text-[52px] font-bold">
          {hayValor ? `${Math.round(v)}%` : '—'}
        </text>
        <text x={196} y={275} textAnchor="middle" className={ROTULO}>Determina las coincidencias de tus clientes</text>
        {/* Aguja: nace en el eje (196, 168) y apunta según el valor (0 % a la izquierda, 100 % a la derecha) */}
        {hayValor && <path d="M0 -4.3L119.5 0L0 4.3Z" className="fill-brand" transform={`translate(196 168) rotate(${1.8 * v - 180})`} />}
        <circle cx={196} cy={168} r={12} className="fill-brand" />
        <circle cx={196} cy={168} r={4} className="fill-paper" />
      </svg>
    </div>
  );
}
