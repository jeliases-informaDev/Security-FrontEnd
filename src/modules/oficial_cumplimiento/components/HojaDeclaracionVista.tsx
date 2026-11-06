import type { HojaDeclaracion } from '../services/oficialService';

/**
 * La hoja de la declaración jurada de requisitos, tal como la arma el servidor (título, encabezado con los datos de la persona,
 * puntos, lugar y fecha, y la línea de firma). Sirve para la vista previa del asistente y para «Ver» en la ficha.
 * Se centra en la ventana: en el diseño queda pegada a la izquierda, lo que parece un descuido.
 */
export function HojaDeclaracionVista({ hoja }: { hoja: HojaDeclaracion }) {
  return (
    <article aria-label={hoja.titulo} className="mx-auto flex w-full max-w-[680px] flex-col gap-3.5 border border-ink/[0.14] bg-white px-6 pb-9 pt-10 sm:px-11">
      <h3 className="text-center text-[15px] font-bold leading-[21px] text-ink">{hoja.titulo}</h3>
      <p className="text-[13px] leading-5 text-ink">{hoja.encabezado}</p>
      {hoja.puntos.map((punto) => (
        <p key={punto.letra} className="text-[12.5px] leading-[19px] text-ink/85">
          {punto.letra}) {punto.texto}
        </p>
      ))}
      <p className="text-[13px] text-ink">{hoja.lugarFecha}</p>
      <div className="flex w-[260px] max-w-full flex-col gap-1">
        <div className="h-px bg-ink/50" />
        <p className="break-words text-xs text-ink/70">{hoja.firmaNombre} · {hoja.firmaDocumento}</p>
      </div>
    </article>
  );
}

/** Esqueleto de la hoja mientras llega del servidor. */
export function EsqueletoHoja() {
  return (
    <div role="status" aria-label="Cargando la hoja de la declaración…" className="mx-auto flex w-full max-w-[680px] flex-col gap-3.5 border border-ink/[0.14] bg-white px-6 pb-9 pt-10 sm:px-11">
      <div className="skeleton mx-auto h-4 w-3/4" />
      <div className="skeleton h-3.5 w-full" />
      <div className="skeleton h-3.5 w-5/6" />
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton h-3 w-full" />)}
      <div className="skeleton h-3.5 w-1/3" />
      <div className="skeleton mt-4 h-3 w-[260px] max-w-full" />
    </div>
  );
}
