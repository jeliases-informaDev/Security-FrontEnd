'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { StyledSelect } from '@/shared/ui/StyledSelect';
import { Boton } from '@/shared/ui/kit';
import type { CatalogosOperacion, UsuarioEmpresa } from '../services/operacionesService';
import { Interruptor, Pronto, Segmentado } from './piezas';

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

const SECCION = 'text-sm font-semibold text-ink';
const CHIP = 'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors';

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
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/55" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <aside role="dialog" aria-modal="true" aria-labelledby="titulo-filtros-ro" className="flex h-full w-full max-w-[420px] flex-col bg-white shadow-lg" style={{ overscrollBehavior: 'contain' }}>
        <div className="flex items-start gap-3 px-6 pb-4 pt-6">
          <div className="min-w-0 flex-1">
            <h2 id="titulo-filtros-ro" className="text-xl font-semibold tracking-[-0.01em] text-ink">Filtros</h2>
            <p className="rotulo mt-0.5 !normal-case">Registro de operaciones</p>
          </div>
          <button ref={cerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar los filtros" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white transition-colors hover:bg-paper">
            <X className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6">
          <fieldset className="flex flex-col gap-2.5">
            <legend className={`${SECCION} mb-2.5`}>Estado</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={borrador.estado === 'PENDIENTE'} onClick={() => poner({ estado: borrador.estado === 'PENDIENTE' ? '' : 'PENDIENTE' })} className={`${CHIP} ${borrador.estado === 'PENDIENTE' ? 'border-ink bg-ink text-paper' : 'border-line bg-white text-ink hover:bg-paper'}`}>
                Pendiente de envío
              </button>
              {['Enviado', 'Inusual'].map((texto) => (
                <button key={texto} type="button" aria-disabled="true" title="Próximamente" onClick={(e) => e.preventDefault()} className={`${CHIP} cursor-not-allowed border-line bg-white text-faint`}>
                  {texto} <Pronto />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className={`${SECCION} mb-2.5`}>Fecha de la operación</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ro-filtro-desde" className="label">Desde</label>
                <input id="ro-filtro-desde" type="date" className="input" value={borrador.desde} max={borrador.hasta || undefined} onChange={(e) => poner({ desde: e.target.value })} />
              </div>
              <div>
                <label htmlFor="ro-filtro-hasta" className="label">Hasta</label>
                <input id="ro-filtro-hasta" type="date" className="input" value={borrador.hasta} min={borrador.desde || undefined} onChange={(e) => poner({ hasta: e.target.value })} />
              </div>
            </div>
            {fechasMal && <p role="alert" className="error-text">La fecha «Desde» no puede ser posterior a «Hasta».</p>}
          </fieldset>

          <div>
            <p className={`${SECCION} mb-2.5`}>Operación</p>
            <label htmlFor="ro-filtro-tipo" className="label">Tipo de operación</label>
            <StyledSelect id="ro-filtro-tipo" value={borrador.tipoOperacion} options={tipos} onChange={(v) => poner({ tipoOperacion: v })} placeholder="Todas" disabled={!catalogos} />
          </div>

          <div>
            <p id="ro-filtro-moneda" className={`${SECCION} mb-2.5`}>Moneda</p>
            <Segmentado ariaLabel="Moneda" valor={borrador.moneda} opciones={monedas} onCambiar={(v) => poner({ moneda: v })} />
          </div>

          <fieldset>
            <legend className={`${SECCION} mb-2.5 flex items-center gap-2`}>Monto (US$ equivalente) <Pronto /></legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ro-filtro-min" className="label">Mínimo</label>
                <input id="ro-filtro-min" className="input" placeholder="Ej. 30,000" disabled />
              </div>
              <div>
                <label htmlFor="ro-filtro-max" className="label">Máximo</label>
                <input id="ro-filtro-max" className="input" placeholder="Ej. 150,000" disabled />
              </div>
            </div>
          </fieldset>

          <div>
            <p className={`${SECCION} mb-2.5`}>Responsable y oficina</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ro-filtro-responsable" className="label">Responsable</label>
                <StyledSelect id="ro-filtro-responsable" value={borrador.responsableId} options={responsables} onChange={(v) => poner({ responsableId: v })} placeholder="Todos" disabled={borrador.sinResponsable || usuarios === null} />
              </div>
              <div>
                <label htmlFor="ro-filtro-oficina" className="label flex items-center gap-2">Oficina <Pronto /></label>
                <StyledSelect id="ro-filtro-oficina" value="" options={[{ value: '', label: 'Todas' }]} onChange={() => undefined} placeholder="Todas" disabled />
              </div>
            </div>
            {usuarios !== null && usuarios.length === 0 && <p className="hint">No se pudo cargar la lista de responsables.</p>}
          </div>

          <Interruptor id="ro-filtro-sin-responsable" activo={borrador.sinResponsable} onCambiar={(v) => poner({ sinResponsable: v, responsableId: v ? '' : borrador.responsableId })} etiqueta="Mostrar solo registros sin responsable" />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">
          <Boton variante="secundario" onClick={() => setBorrador(SIN_FILTROS)}>Limpiar</Boton>
          <Boton icono={Check} disabled={fechasMal} onClick={() => onAplicar(borrador)}>Aplicar filtros</Boton>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
