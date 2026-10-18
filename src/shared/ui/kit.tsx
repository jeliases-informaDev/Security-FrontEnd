import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

/** Iniciales de una persona o institución (dos letras) en un círculo de color de marca. */
export function Avatar({ nombre, tamano = 'md', className = '' }: { nombre: string; tamano?: 'sm' | 'md' | 'lg'; className?: string }) {
  const iniciales = nombre.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '·';
  const medida = tamano === 'sm' ? 'h-8 w-8 text-[11px]' : tamano === 'lg' ? 'h-12 w-12 text-sm' : 'h-10 w-10 text-xs';
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-hover font-semibold text-white ${medida} ${className}`} aria-hidden="true">
      {iniciales}
    </span>
  );
}

export interface AvisoDatos { tipo: 'ok' | 'error' | 'info'; texto: ReactNode }

/** Franja de confirmación (verde), de error (roja) o informativa (azul) con botón para cerrarla. */
export function Aviso({ aviso, onCerrar, children, className = '' }: { aviso: AvisoDatos; onCerrar?: () => void; children?: ReactNode; className?: string }) {
  const estilo = aviso.tipo === 'error' ? 'border-bad/20 bg-bad-soft text-bad' : aviso.tipo === 'info' ? 'border-info/20 bg-info-soft text-info' : 'border-ok/20 bg-ok-soft text-ok';
  const Icono = aviso.tipo === 'error' ? AlertCircle : aviso.tipo === 'info' ? Info : CheckCircle2;
  return (
    <div role={aviso.tipo === 'error' ? 'alert' : 'status'} className={`aparece flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${estilo} ${className}`}>
      <Icono className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p>{aviso.texto}</p>
        {children}
      </div>
      {onCerrar && (
        <button type="button" onClick={onCerrar} aria-label="Cerrar el aviso" className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-70 transition hover:bg-black/5 hover:opacity-100">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Paginación simple: texto «Mostrando a–b de n» y botones Anterior / Siguiente. */
export function Paginacion({ desde, hasta, total, pagina, totalPaginas, onCambiar, cargando = false, extra }: { desde: number; hasta: number; total: number; pagina: number; totalPaginas: number; onCambiar: (pagina: number) => void; cargando?: boolean; extra?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-2/40 px-5 py-3 text-sm text-muted">
      <p aria-live="polite" className="tabular-nums">Mostrando {desde}–{hasta} de {total}{extra}</p>
      {totalPaginas > 1 && (
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-xs">Página {pagina + 1} de {totalPaginas}</span>
          <button type="button" onClick={() => onCambiar(Math.max(0, pagina - 1))} disabled={pagina === 0 || cargando} className="btn btn-secondary btn-sm">Anterior</button>
          <button type="button" onClick={() => onCambiar(pagina + 1)} disabled={pagina + 1 >= totalPaginas || cargando} className="btn btn-secondary btn-sm">Siguiente</button>
        </div>
      )}
    </div>
  );
}

// Piezas pequeñas del sistema visual, compartidas por todos los módulos.

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';
type Tamano = 'sm' | 'md' | 'lg';
const VARIANTE: Record<Variante, string> = { primario: 'btn-primary', secundario: 'btn-secondary', fantasma: 'btn-ghost', peligro: 'btn-danger' };
const TAMANO: Record<Tamano, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' };

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  icono?: LucideIcon;
  /** Muestra un girador y deshabilita el botón mientras se espera (el texto se mantiene). */
  cargando?: boolean;
}

export function Boton({ variante = 'primario', tamano = 'md', icono: Icono, cargando = false, className = '', children, disabled, type = 'button', ...resto }: BotonProps) {
  return (
    <button type={type} className={`btn ${VARIANTE[variante]} ${TAMANO[tamano]} ${className}`} disabled={disabled || cargando} aria-busy={cargando || undefined} {...resto}>
      {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : Icono ? <Icono className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

type Tono = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad' | 'info';
export function Etiqueta({ tono = 'neutral', children, className = '', punto = false }: { tono?: Tono; children: ReactNode; className?: string; punto?: boolean }) {
  return (
    <span className={`badge badge-${tono} ${className}`}>
      {punto && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Estado vacío con icono, título, texto y acción opcional. Sirve para listas sin datos, sin resultados o sin permiso. */
export function EstadoVacio({ icono: Icono, titulo, texto, accion, className = '' }: { icono: LucideIcon; titulo: string; texto?: ReactNode; accion?: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center px-6 py-12 text-center ${className}`}>
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink" aria-hidden="true">
        <Icono className="h-6 w-6" />
      </span>
      <p className="text-base font-semibold text-ink">{titulo}</p>
      {texto && <p className="mt-1 max-w-md text-sm text-muted">{texto}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

/** Cifra destacada (totales, conteos, porcentajes) con su etiqueta y, si hay, un detalle o tendencia. */
export function Cifra({ etiqueta, valor, detalle, icono: Icono, tono = 'brand', className = '' }: { etiqueta: string; valor: ReactNode; detalle?: ReactNode; icono?: LucideIcon; tono?: Tono; className?: string }) {
  return (
    <div className={`card flex items-start gap-4 p-5 ${className}`}>
      {Icono && (
        <span className={`badge-${tono} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`} aria-hidden="true">
          <Icono className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted">{etiqueta}</p>
        <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-ink">{valor}</p>
        {detalle && <p className="mt-0.5 text-xs text-muted">{detalle}</p>}
      </div>
    </div>
  );
}

/** Esqueleto de carga: bloques grises del tamaño del contenido que viene. */
export function Esqueleto({ lineas = 3, className = '' }: { lineas?: number; className?: string }) {
  return (
    <div className={`space-y-2.5 ${className}`} role="status" aria-live="polite" aria-label="Cargando…">
      {Array.from({ length: lineas }).map((_, i) => (
        <div key={i} className="skeleton h-4" style={{ width: `${100 - (i % 3) * 18}%` }} />
      ))}
    </div>
  );
}

/** Pestañas de una pantalla (botones, no enlaces): la pestaña activa lleva aria-selected. */
export function Pestanas<T extends string>({ valor, opciones, onCambiar, ariaLabel }: { valor: T; opciones: { valor: T; etiqueta: string; conteo?: number }[]; onCambiar: (valor: T) => void; ariaLabel: string }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
      {opciones.map((o) => {
        const activa = o.valor === valor;
        return (
          <button
            key={o.valor}
            role="tab"
            type="button"
            aria-selected={activa}
            onClick={() => onCambiar(o.valor)}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${activa ? 'border-brand text-brand-ink' : 'border-transparent text-muted hover:border-line-strong hover:text-ink'}`}
          >
            {o.etiqueta}
            {o.conteo != null && <span className={`badge ${activa ? 'badge-brand' : 'badge-neutral'} px-2`}>{o.conteo}</span>}
          </button>
        );
      })}
    </div>
  );
}
