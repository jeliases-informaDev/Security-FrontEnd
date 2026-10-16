// Clases compartidas de formularios y botones para las pantallas nuevas (mismas medidas y mismos colores de marca en todas).

export const etiqueta = 'mb-1.5 block text-sm font-medium text-slate-700';

export const campo =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-brand-ink placeholder:text-slate-400 ' +
  'focus:border-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-navy disabled:bg-slate-50 disabled:text-slate-500';

export const campoError = 'border-red-400 focus:border-red-500 focus:ring-red-500';

export const mensajeError = 'mt-1 text-xs text-red-600';

export const botonPrimario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-navy px-4 text-sm font-semibold text-white ' +
  'transition hover:bg-brand-navy-2 disabled:cursor-not-allowed disabled:opacity-50';

export const botonSecundario =
  'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium ' +
  'text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

export const botonTexto =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-brand-navy transition hover:bg-slate-100';
