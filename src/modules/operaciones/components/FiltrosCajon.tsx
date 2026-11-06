'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconoCerrar, IconoVisto } from '@/shared/ui/iconos';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { Boton } from '@/shared/ui/kit';
import type { CatalogosOperacion, UsuarioEmpresa } from '../services/operacionesService';
import { BTN, BTN_P, CAMPO, CAMPO_BORDE, ETIQUETA, Interruptor, Pronto, Segmentado } from './piezas';

/** Filtros de la lista (todos se resuelven en el servidor). El estado lo comparten las pestañas y el panel. */
export interface FiltrosLista {
  estado: '' | 'PENDIENTE';
  desde: string;
  hasta: string;
  tipoOperacion: string;
  moneda: string;
  responsableId: string;
  sinResponsable: boolean;
}

export const SIN_FILTROS: FiltrosLista = { estado: '', desde: '', hasta: '', tipoOperacion: '', moneda: '', responsableId: '', sinResponsable: false };

/** Cuántos filtros del panel están puestos (el estado cuenta). */
export const cuantosFiltros = (f: FiltrosLista): number =>
  [f.estado, f.desde, f.hasta, f.tipoOperacion, f.moneda, f.responsableId].filter(Boolean).length + (f.sinResponsable ? 1 : 0);

interface Props {
  filtros: FiltrosLista;
  catalogos: CatalogosOperacion | null;
  /** Usuarios activos de la empresa; `null` mientras cargan y `[]` si falló. */
  usuarios: UsuarioEmpresa[] | null;
  onAplicar: (filtros: FiltrosLista) => void;
  onCerrar: () => void;
}

const SECCION = 'text-sm font-semibold leading-[normal] text-ink';
/** Fichas de estado: la elegida va rellena y sin borde; las demás llevan borde de 1 px (como en el diseño). */
const CHIP = 'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold leading-[normal] transition-colors';
/** Un grupo del panel: su título y debajo los campos, a 10 px. */
const GRUPO = 'flex flex-col gap-2.5';
const CAMPO_FILTRO = `input ${CAMPO} ${CAMPO_BORDE}`;

/** RO 11 · Panel lateral de filtros. Se monta solo después de un clic, así que `document` ya existe. */
export function FiltrosCajon({ filtros, catalogos, usuarios, onAplicar, onCerrar }: Props) {
  const [borrador, setBorrador] = useState<FiltrosLista>(filtros);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const poner = (parche: Partial<FiltrosLista>) => setBorrador((b) => ({ ...b, ...parche }));

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alPresionar);
    cerrarRef.current?.focus();
    return () => document.removeEventListener('keydown', alPresionar);
  }, [onCerrar]);

  const tipos = [{ value: '', label: 'Todas' }, ...(catalogos?.tiposOperacion ?? []).map((t) => ({ value: t.codigo, label: t.nombre }))];
  const responsables = [{ value: '', label: 'Todos' }, ...(usuarios ?? []).map((u) => ({ value: String(u.id), label: u.nombreCompleto }))];
  const monedas = [{ valor: '', etiqueta: 'Todas' }, ...(catalogos?.monedas ?? []).map((m) => ({ valor: m.codigo, etiqueta: `${m.simbolo ?? ''} ${m.codigo}`.trim() }))];
  const fechasMal = borrador.desde !== '' && borrador.hasta !== '' && borrador.desde > borrador.hasta;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/45" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <aside role="dialog" aria-modal="true" aria-labelledby="titulo-filtros-ro" className="flex h-full w-full max-w-[520px] flex-col bg-white shadow-[-16px_0_60px_-20px_rgba(14,17,22,0.25)]" style={{ overscrollBehavior: 'contain' }}>
        <div className="flex items-center gap-3 pb-[18px] pl-7 pr-6 pt-6">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h2 id="titulo-filtros-ro" className="text-[22px] font-bold leading-[normal] text-ink">Filtros</h2>
            <p className="font-mono text-xs leading-[normal] tracking-[0.04em] text-muted">Registro de operaciones</p>
          </div>
          <button ref={cerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar los filtros" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-line bg-white text-ink/80 transition-colors hover:bg-paper">
            <IconoCerrar className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="h-px shrink-0 bg-line" />

        <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-7 py-6">
          <fieldset>
            <legend className={`${SECCION} mb-2.5`}>Estado</legend>
            <div className="flex flex-wrap items-start gap-2">
              <button type="button" aria-pressed={borrador.estado === 'PENDIENTE'} onClick={() => poner({ estado: borrador.estado === 'PENDIENTE' ? '' : 'PENDIENTE' })} className={`${CHIP} ${borrador.estado === 'PENDIENTE' ? 'bg-ink text-paper' : 'border border-line bg-white text-ink/80 hover:bg-paper'}`}>
                Pendiente de envío
              </button>
              {['Enviado', 'Inusual'].map((texto) => (
                <button key={texto} type="button" aria-disabled="true" title="Próximamente" onClick={(e) => e.preventDefault()} className={`${CHIP} cursor-not-allowed border border-line bg-white text-faint`}>
                  {texto} <Pronto />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={`${SECCION} mb-2.5`}>Fecha de la operación</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ro-filtro-desde" className={ETIQUETA}>Desde</label>
                <input id="ro-filtro-desde" type="date" className={CAMPO_FILTRO} value={borrador.desde} max={borrador.hasta || undefined} onChange={(e) => poner({ desde: e.target.value })} />
              </div>
              <div>
                <label htmlFor="ro-filtro-hasta" className={ETIQUETA}>Hasta</label>
                <input id="ro-filtro-hasta" type="date" className={CAMPO_FILTRO} value={borrador.hasta} min={borrador.desde || undefined} onChange={(e) => poner({ hasta: e.target.value })} />
              </div>
            </div>
            {fechasMal && <p role="alert" className="error-text">La fecha «Desde» no puede ser posterior a «Hasta».</p>}
          </fieldset>

          <div className={GRUPO}>
            <p className={SECCION}>Operación</p>
            <div>
              <label htmlFor="ro-filtro-tipo" className={ETIQUETA}>Tipo de operación</label>
              <StyledSelect id="ro-filtro-tipo" value={borrador.tipoOperacion} options={tipos} onChange={(v) => poner({ tipoOperacion: v })} placeholder="Todas" disabled={!catalogos} className={`${CAMPO} ${CAMPO_BORDE}`} />
            </div>
          </div>

          <div className={GRUPO}>
            <p id="ro-filtro-moneda" className={SECCION}>Moneda</p>
            <Segmentado grande ariaLabel="Moneda" valor={borrador.moneda} opciones={monedas} onCambiar={(v) => poner({ moneda: v })} />
          </div>

          <fieldset>
            <legend className={`${SECCION} mb-2.5 flex items-center gap-2`}>Monto (US$ equivalente) <Pronto /></legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ro-filtro-min" className={ETIQUETA}>Mínimo</label>
                <input id="ro-filtro-min" className={CAMPO_FILTRO} placeholder="Ej. 30,000" disabled />
              </div>
              <div>
                <label htmlFor="ro-filtro-max" className={ETIQUETA}>Máximo</label>
                <input id="ro-filtro-max" className={CAMPO_FILTRO} placeholder="Ej. 150,000" disabled />
              </div>
            </div>
          </fieldset>

          <div className={GRUPO}>
            <p className={SECCION}>Responsable y oficina</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="ro-filtro-responsable" className={ETIQUETA}>Responsable</label>
                <StyledSelect id="ro-filtro-responsable" value={borrador.responsableId} options={responsables} onChange={(v) => poner({ responsableId: v })} placeholder="Todos" disabled={borrador.sinResponsable || usuarios === null} className={`${CAMPO} ${CAMPO_BORDE}`} />
              </div>
              <div>
                <label htmlFor="ro-filtro-oficina" className={ETIQUETA}>Oficina <Pronto /></label>
                <StyledSelect id="ro-filtro-oficina" value="" options={[{ value: '', label: 'Todas' }]} onChange={() => undefined} placeholder="Todas" disabled className={`${CAMPO} ${CAMPO_BORDE}`} />
              </div>
            </div>
            {usuarios !== null && usuarios.length === 0 && <p className="hint">No se pudo cargar la lista de responsables.</p>}
          </div>

          <Interruptor fila id="ro-filtro-sin-responsable" activo={borrador.sinResponsable} onCambiar={(v) => poner({ sinResponsable: v, responsableId: v ? '' : borrador.responsableId })} etiqueta="Mostrar solo registros sin responsable" />
        </div>

        <div className="h-px shrink-0 bg-line" />
        <div className="flex items-center justify-end gap-2.5 px-7 pb-5 pt-4">
          <Boton variante="secundario" onClick={() => setBorrador(SIN_FILTROS)} className={BTN}>Limpiar</Boton>
          <Boton icono={IconoVisto} disabled={fechasMal} onClick={() => onAplicar(borrador)} className={BTN_P}>Aplicar filtros</Boton>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
