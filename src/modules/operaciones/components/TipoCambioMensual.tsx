'use client';

import { useState } from 'react';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { Aviso, Boton, Esqueleto, type AvisoDatos } from '@/shared/ui/kit';
import { textoDeFalla } from '../lib/errores';
import { hoyIso, mesLargo } from '../lib/formato';
import { numeroDecimal, tipoCambioTexto } from '../lib/formatoB';
import { useCarga } from '../lib/useCarga';
import { camposDeError, operacionesService } from '../services/operacionesService';
import { CAMPO, CAMPO_BORDE } from './piezas';
import { BTN_B, CampoB, SELECT_B } from './piezasB';

const CAMPO_SELECT = `${SELECT_B} ${CAMPO_BORDE}`;

/** Los meses de un año que ya se pueden cargar (hasta el mes actual si es este año), el más nuevo primero. */
function mesesDe(anio: number, hoy: string): { valor: string; etiqueta: string }[] {
  const [anioHoy, mesHoy] = hoy.split('-').map(Number);
  const ultimo = anio === anioHoy ? mesHoy : 12;
  return Array.from({ length: ultimo }, (_, i) => {
    const valor = `${anio}-${String(i + 1).padStart(2, '0')}`;
    return { valor, etiqueta: mesLargo(valor) };
  }).reverse();
}

/** RO 16 · Tipo de cambio mensual (DS 020-2017-JUS, art. 24.4 b): lo cargado para el año y, para el administrador, el formulario para cargarlo o corregirlo. */
export function TipoCambioMensual() {
  const [hoy] = useState(hoyIso);
  const anioHoy = Number(hoy.slice(0, 4));
  const [anio, setAnio] = useState(anioHoy);
  const [moneda, setMoneda] = useState('');
  const [mes, setMes] = useState('');
  const [valor, setValor] = useState('');
  const [fuente, setFuente] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<AvisoDatos | null>(null);
  const [guardando, setGuardando] = useState(false);

  const carga = useCarga(`tipos-cambio-${anio}`, () => operacionesService.tiposCambio(anio), 'No se pudieron cargar los tipos de cambio.');
  // `useCarga` conserva lo último que llegó: solo vale si es del año que se está viendo.
  const datos = !carga.cargando && !carga.error && carga.datos?.anio === anio ? carga.datos : null;

  const meses = mesesDe(anio, hoy);
  const mesHoy = Number(hoy.slice(5, 7));
  const mesPrevio = mesHoy === 1 ? `${anioHoy - 1}-12` : `${anioHoy}-${String(mesHoy - 1).padStart(2, '0')}`;
  // Una operación de un mes usa el valor del mes anterior: por eso lo más útil de cargar es, por defecto, el mes pasado.
  const mesElegido = mes && meses.some((m) => m.valor === mes) ? mes : (meses.find((m) => m.valor === mesPrevio)?.valor ?? meses[0].valor);
  const monedaElegida = datos ? (moneda && datos.monedas.includes(moneda) ? moneda : (datos.monedas[0] ?? '')) : '';

  const anios = [anioHoy, anioHoy - 1, anioHoy - 2].map((a) => ({ value: String(a), label: String(a) }));
  const lista = datos ? [...datos.valores].sort((a, b) => (a.mes === b.mes ? a.moneda.localeCompare(b.moneda) : b.mes.localeCompare(a.mes))) : [];

  const guardar = async () => {
    if (!datos || guardando) return;
    setAviso(null);
    const numero = numeroDecimal(valor);
    const faltas: Record<string, string> = {};
    if (!monedaElegida) faltas.moneda = 'Elige una moneda.';
    if (!numero) faltas.valor = 'Escribe el tipo de cambio, por ejemplo 3.512345.';
    else if (numero.valor <= 0) faltas.valor = 'El tipo de cambio debe ser mayor que cero.';
    else if (numero.decimales > 6) faltas.valor = 'Hasta 6 decimales.';
    else if (numero.enteros > 4) faltas.valor = 'Hasta 4 enteros.';
    setErrores(faltas);
    if (Object.keys(faltas).length > 0 || !numero) return;
    setGuardando(true);
    try {
      await operacionesService.guardarTipoCambio({ moneda: monedaElegida, mes: mesElegido, valor: numero.valor, fuente: fuente.trim() || null });
      setAviso({ tipo: 'ok', texto: `Guardado: ${monedaElegida} de ${mesLargo(mesElegido)} = S/ ${tipoCambioTexto(numero.valor)}.` });
      setValor('');
      setFuente('');
      carga.recargar();
    } catch (err) {
      const campos = camposDeError(err);
      if (campos) setErrores(campos);
      const texto = textoDeFalla(err, 'No se pudo guardar el tipo de cambio. Revisa los datos e inténtalo de nuevo.');
      if (texto) setAviso({ tipo: 'error', texto });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col gap-3.5 border-t border-line pt-4">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <p className="min-w-0 text-sm font-semibold leading-[normal] text-ink">Valores cargados</p>
        <CampoB id="tc-anio" texto="Año" className="w-[120px] max-w-full">
          <StyledSelect id="tc-anio" value={String(anio)} options={anios} onChange={(v) => { setAnio(Number(v)); setMes(''); setAviso(null); setErrores({}); }} ajustar className={CAMPO_SELECT} />
        </CampoB>
      </div>

      {carga.cargando && <Esqueleto lineas={3} />}
      {!carga.cargando && carga.error && (
        <div className="flex flex-col items-start gap-3">
          <Aviso aviso={{ tipo: 'error', texto: carga.error }} className="w-full" />
          <button type="button" onClick={carga.recargar} className={`btn btn-secondary ${BTN_B}`}>Reintentar</button>
        </div>
      )}

      {datos && (
        <>
          {lista.length === 0 ? (
            <p className="text-sm leading-[21px] text-muted">Todavía no hay tipos de cambio cargados para {anio}. Sin el del mes anterior, las operaciones en soles o en euros quedan sin equivalente en dólares.</p>
          ) : (
            <ul className="flex flex-col gap-2.5" aria-label={`Tipos de cambio de ${anio}`}>
              {lista.map((v) => (
                <li key={`${v.mes}-${v.moneda}`} className="flex flex-col gap-0.5">
                  <div className="flex items-start justify-between gap-3 text-sm leading-[normal]">
                    <span className="min-w-0 flex-1 text-muted">{mesLargo(v.mes)} · {v.moneda}</span>
                    <span className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-right font-semibold tabular-nums text-ink">
                      S/ {tipoCambioTexto(v.valor)}
                      <span className={`badge ${v.ambito === 'EMPRESA' ? 'badge-brand' : 'badge-neutral'} !leading-[normal]`}>{v.ambito === 'EMPRESA' ? 'Tu empresa' : 'Sulotec'}</span>
                    </span>
                  </div>
                  {v.fuente && <p className="break-words text-xs leading-[normal] text-muted">{v.fuente}</p>}
                </li>
              ))}
            </ul>
          )}

          {datos.puedeEditar ? (
            <form onSubmit={(e) => { e.preventDefault(); void guardar(); }} noValidate className="flex flex-col gap-3.5 border-t border-line pt-4">
              <p className="text-sm font-semibold leading-[normal] text-ink">Cargar o corregir un valor</p>
              {aviso && <Aviso aviso={aviso} onCerrar={() => setAviso(null)} />}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <CampoB id="tc-moneda" texto="Moneda" error={errores.moneda}>
                  <StyledSelect id="tc-moneda" value={monedaElegida} options={datos.monedas.map((m) => ({ value: m, label: m }))} onChange={setMoneda} placeholder="Elige una moneda" disabled={guardando} error={!!errores.moneda} ajustar className={`${SELECT_B} ${errores.moneda ? '' : CAMPO_BORDE}`} />
                </CampoB>
                <CampoB id="tc-mes" texto="Mes" error={errores.mes}>
                  <StyledSelect id="tc-mes" value={mesElegido} options={meses.map((m) => ({ value: m.valor, label: m.etiqueta }))} onChange={setMes} disabled={guardando} error={!!errores.mes} ajustar className={`${SELECT_B} ${errores.mes ? '' : CAMPO_BORDE}`} />
                </CampoB>
              </div>
              <CampoB id="tc-valor" texto="Soles por 1 unidad de la moneda" ayuda="Promedio de venta de la SBS del mes, hasta 6 decimales." error={errores.valor}>
                <input id="tc-valor" type="text" inputMode="decimal" autoComplete="off" placeholder="Ej. 3.512345" value={valor} onChange={(e) => setValor(e.target.value)} disabled={guardando} className={`input ${CAMPO} ${errores.valor ? 'input-error' : CAMPO_BORDE}`} aria-invalid={errores.valor ? true : undefined} aria-describedby={errores.valor ? 'tc-valor-error' : 'tc-valor-ayuda'} />
              </CampoB>
              <CampoB id="tc-fuente" texto="Fuente" opcional error={errores.fuente}>
                <input id="tc-fuente" type="text" maxLength={200} autoComplete="off" placeholder="Ej. SBS · promedio venta" value={fuente} onChange={(e) => setFuente(e.target.value)} disabled={guardando} className={`input ${CAMPO} ${errores.fuente ? 'input-error' : CAMPO_BORDE}`} aria-invalid={errores.fuente ? true : undefined} aria-describedby={errores.fuente ? 'tc-fuente-error' : undefined} />
              </CampoB>
              <div>
                <Boton type="submit" variante="secundario" className={BTN_B} cargando={guardando}>Guardar tipo de cambio</Boton>
              </div>
            </form>
          ) : (
            <p className="text-sm leading-[21px] text-muted">Solo el administrador de tu empresa puede cargar el tipo de cambio.</p>
          )}
        </>
      )}
    </div>
  );
}
