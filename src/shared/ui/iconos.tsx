// Iconos del diseño «Propuesta suave» (Figma, archivo PLAFT). Las formas son exactamente las del diseño; el color sale de
// `currentColor`, así cada icono toma el color del texto donde se usa (activo, apagado, sobre fondo oscuro).
// Archivo generado desde los SVG exportados de Figma: las formas no se retocan a mano.
import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

function Base({ lado, grosor, children, ...resto }: Props & { lado: number; grosor: number }) {
  return (
    <svg
      width={lado}
      height={lado}
      viewBox={`0 0 ${lado} ${lado}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...resto}
    >
      {children}
    </svg>
  );
}

/** Escudo con visto bueno: la marca. */
export function IconoEscudo(props: Props) {
  return (
    <Base lado={22} grosor={1.60417} {...props}>
      <path d="M11 2.75L18.3333 5.5V11C18.3333 15.5833 15.125 18.3333 11 19.25C6.875 18.3333 3.66667 15.5833 3.66667 11V5.5L11 2.75Z" />
      <path d="M8.25 11L10.0833 12.8333L13.75 9.16667" />
    </Base>
  );
}

/** Casa: página principal. */
export function IconoInicio(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <path d="M2.5 9.58333L10 3.33333L17.5 9.58333" />
      <path d="M4.16667 8.33333V16.6667H15.8333V8.33333" />
    </Base>
  );
}

/** Birrete: cursos. */
export function IconoBirrete(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <path d="M1.66667 7.5L10 3.33333L18.3333 7.5L10 11.6667L1.66667 7.5Z" />
      <path d="M5 9.16667V13.3333C7.5 15 12.5 15 15 13.3333V9.16667" />
    </Base>
  );
}

/** Lupa: búsquedas y listas negativas. */
export function IconoLupa(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <path d="M15 9.16667C15 12.3883 12.3883 15 9.16667 15C5.94501 15 3.33333 12.3883 3.33333 9.16667C3.33333 5.94501 5.94501 3.33333 9.16667 3.33333C12.3883 3.33333 15 5.94501 15 9.16667Z" />
      <path d="M16.6667 16.6667L13.75 13.75" />
    </Base>
  );
}

/** Globo con aviso: canal de denuncias. */
export function IconoMensaje(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <path d="M3.33333 3.33333H16.6667V13.3333H6.66667L3.33333 16.6667V3.33333Z" />
      <path d="M10 6.66667V9.16667" />
      <path d="M10 11.25V11.2583" />
    </Base>
  );
}

/** Medidor: scoring de riesgo. */
export function IconoMedidor(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <path d="M3.33333 13.3333C3.33333 11.5652 4.03571 9.86953 5.28595 8.61929C6.5362 7.36905 8.23189 6.66667 10 6.66667C11.7681 6.66667 13.4638 7.36905 14.714 8.61929C15.9643 9.86953 16.6667 11.5652 16.6667 13.3333" />
      <path d="M10 13.3333L13.3333 9.16667" />
    </Base>
  );
}

/** Cuadrícula: matrices de riesgo. */
export function IconoCuadricula(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <path d="M4.58333 3.33333H7.5C8.19036 3.33333 8.75 3.89298 8.75 4.58333V7.5C8.75 8.19036 8.19036 8.75 7.5 8.75H4.58333C3.89298 8.75 3.33333 8.19036 3.33333 7.5V4.58333C3.33333 3.89298 3.89298 3.33333 4.58333 3.33333Z" />
      <path d="M12.5 3.33333H15.4167C16.107 3.33333 16.6667 3.89298 16.6667 4.58333V7.5C16.6667 8.19036 16.107 8.75 15.4167 8.75H12.5C11.8096 8.75 11.25 8.19036 11.25 7.5V4.58333C11.25 3.89298 11.8096 3.33333 12.5 3.33333Z" />
      <path d="M4.58333 11.25H7.5C8.19036 11.25 8.75 11.8096 8.75 12.5V15.4167C8.75 16.107 8.19036 16.6667 7.5 16.6667H4.58333C3.89298 16.6667 3.33333 16.107 3.33333 15.4167V12.5C3.33333 11.8096 3.89298 11.25 4.58333 11.25Z" />
      <path d="M12.5 11.25H15.4167C16.107 11.25 16.6667 11.8096 16.6667 12.5V15.4167C16.6667 16.107 16.107 16.6667 15.4167 16.6667H12.5C11.8096 16.6667 11.25 16.107 11.25 15.4167V12.5C11.25 11.8096 11.8096 11.25 12.5 11.25Z" />
    </Base>
  );
}

/** Persona con visto bueno: oficial de cumplimiento. */
export function IconoOficial(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <circle cx="9" cy="6" r="2.27083" />
      <path d="M3 17C3 13 5.5 11.5 9 11.5C10.4 11.5 11.5 11.8 12.4 12.3" />
      <path d="M12.3 15.3L14.4 17.3L17.8 13.4" />
    </Base>
  );
}

/** Dos personas: clientes. */
export function IconoClientes(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <circle cx="8" cy="6.5" r="2.27083" />
      <path d="M2.5 17C2.5 13.4 5 11.8 8 11.8C11 11.8 13.5 13.4 13.5 17" />
      <circle cx="14.2" cy="7.4" r="1.57083" />
      <path d="M14.6 12.2C16.6 12.4 17.7 13.8 17.7 16.4" />
    </Base>
  );
}

/** Recibo: registro de operaciones. */
export function IconoRecibo(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <path d="M5 2.5H15V17.5L12.5 15.8333L10 17.5L7.5 15.8333L5 17.5V2.5Z" />
      <path d="M7.5 6.66667H12.5M7.5 10H12.5" />
    </Base>
  );
}

/** Deslizadores: administración. */
export function IconoAjustes(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <path d="M3.33333 5.83333H11.6667M15 5.83333H16.6667M3.33333 14.1667H5M8.33333 14.1667H16.6667" />
      <path d="M15 5.83333C15 6.75381 14.2538 7.5 13.3333 7.5C12.4129 7.5 11.6667 6.75381 11.6667 5.83333C11.6667 4.91286 12.4129 4.16667 13.3333 4.16667C14.2538 4.16667 15 4.91286 15 5.83333Z" />
      <path d="M8.33333 14.1667C8.33333 15.0871 7.58714 15.8333 6.66667 15.8333C5.74619 15.8333 5 15.0871 5 14.1667C5 13.2462 5.74619 12.5 6.66667 12.5C7.58714 12.5 8.33333 13.2462 8.33333 14.1667Z" />
    </Base>
  );
}

/** Destellos: Indira. */
export function IconoDestellos(props: Props) {
  return (
    <Base lado={20} grosor={1.45833} {...props}>
      <path d="M10 2.5L11.5 6.41667L15.4167 7.91667L11.5 9.41667L10 13.3333L8.5 9.41667L4.58333 7.91667L8.5 6.41667L10 2.5Z" />
      <path d="M15.8333 12.5V14.1667M15.8333 14.1667V15.8333M15.8333 14.1667H14.1667M15.8333 14.1667H17.5" />
    </Base>
  );
}

/** Destello único: tarjeta de Indira. */
export function IconoDestello(props: Props) {
  return (
    <Base lado={20} grosor={1.66667} {...props}>
      <path d="M8.28083 12.9167C8.20643 12.6283 8.05612 12.3651 7.84551 12.1545C7.63491 11.9439 7.37173 11.7936 7.08333 11.7192L1.97083 10.4008C1.88361 10.3761 1.80684 10.3235 1.75218 10.2512C1.69751 10.1789 1.66794 10.0907 1.66794 10C1.66794 9.90933 1.69751 9.82113 1.75218 9.7488C1.80684 9.67646 1.88361 9.62392 1.97083 9.59917L7.08333 8.28C7.37162 8.20567 7.63474 8.05548 7.84533 7.84503C8.05593 7.63459 8.2063 7.37157 8.28083 7.08333L9.59917 1.97083C9.62367 1.88327 9.67615 1.80612 9.7486 1.75116C9.82105 1.69621 9.90948 1.66646 10.0004 1.66646C10.0913 1.66646 10.1798 1.69621 10.2522 1.75116C10.3247 1.80612 10.3772 1.88327 10.4017 1.97083L11.7192 7.08333C11.7936 7.37173 11.9439 7.63491 12.1545 7.84551C12.3651 8.05612 12.6283 8.20643 12.9167 8.28083L18.0292 9.59833C18.1171 9.62258 18.1946 9.67501 18.2499 9.74756C18.3051 9.82012 18.335 9.9088 18.335 10C18.335 10.0912 18.3051 10.1799 18.2499 10.2524C18.1946 10.325 18.1171 10.3774 18.0292 10.4017L12.9167 11.7192C12.6283 11.7936 12.3651 11.9439 12.1545 12.1545C11.9439 12.3651 11.7936 12.6283 11.7192 12.9167L10.4008 18.0292C10.3763 18.1167 10.3238 18.1939 10.2514 18.2488C10.179 18.3038 10.0905 18.3335 9.99958 18.3335C9.90865 18.3335 9.82021 18.3038 9.74777 18.2488C9.67532 18.1939 9.62284 18.1167 9.59833 18.0292L8.28083 12.9167Z" />
    </Base>
  );
}

/** Galón hacia la derecha. */
export function IconoGalon(props: Props) {
  return (
    <Base lado={16} grosor={1.16667} {...props}>
      <path d="M6 4L10 8L6 12" />
    </Base>
  );
}

/** Salir de la sesión. */
export function IconoSalir(props: Props) {
  return (
    <Base lado={18} grosor={1.3125} {...props}>
      <path d="M6.75 3H3.75V15H6.75" />
      <path d="M12 12L15 9L12 6M15 9H6.75" />
    </Base>
  );
}

/** Flecha fina hacia la derecha («Abrir»). */
export function IconoFlecha(props: Props) {
  return (
    <Base lado={16} grosor={1.16667} {...props}>
      <path d="M3.33333 8H12.6667M8.66667 12L12.6667 8L8.66667 4" />
    </Base>
  );
}

/** Flecha hacia la derecha (botones). */
export function IconoDerecha(props: Props) {
  return (
    <Base lado={18} grosor={1.5} {...props}>
      <path d="M3.75 9H14.25" />
      <path d="M9 3.75L14.25 9L9 14.25" />
    </Base>
  );
}

/** Triángulo de alerta. */
export function IconoAlerta(props: Props) {
  return (
    <Base lado={12} grosor={1} {...props}>
      <path d="M10.865 9L6.865 2C6.77778 1.8461 6.6513 1.71809 6.49846 1.62903C6.34562 1.53997 6.17189 1.49305 5.995 1.49305C5.81811 1.49305 5.64438 1.53997 5.49154 1.62903C5.3387 1.71809 5.21222 1.8461 5.125 2L1.125 9C1.03684 9.15268 0.990614 9.32595 0.991004 9.50225C0.991395 9.67856 1.03839 9.85162 1.12722 10.0039C1.21606 10.1562 1.34357 10.2823 1.49685 10.3694C1.65012 10.4565 1.8237 10.5016 2 10.5H10C10.1754 10.4998 10.3478 10.4535 10.4996 10.3656C10.6515 10.2778 10.7776 10.1515 10.8653 9.99956C10.9529 9.84757 10.999 9.67519 10.999 9.49974C10.9989 9.32429 10.9527 9.15194 10.865 9Z" />
      <path d="M6 4.5V6.5" />
      <path d="M6 8.5H6.005" />
    </Base>
  );
}

/** Más: nueva operación. */
export function IconoMas(props: Props) {
  return (
    <Base lado={16} grosor={1.28} {...props}>
      <path d="M8 3.2V12.8" />
      <path d="M3.2 8H12.8" />
    </Base>
  );
}

/** Círculo con i: información. */
export function IconoInfo(props: Props) {
  return (
    <Base lado={16} grosor={1.28} {...props}>
      <path d="M12.8 8C12.8 10.651 10.651 12.8 8 12.8C5.34903 12.8 3.2 10.651 3.2 8C3.2 5.34903 5.34903 3.2 8 3.2C10.651 3.2 12.8 5.34903 12.8 8Z" />
      <path d="M8 7.2V10.8" />
      <path d="M8 5.44V5.52" />
    </Base>
  );
}

/** Reloj: «el mismo día». */
export function IconoReloj(props: Props) {
  return (
    <Base lado={20} grosor={1.66667} {...props}>
      <path d="M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z" />
      <path d="M10 5V10L13.3333 11.6667" />
    </Base>
  );
}

/** Candado: confidencialidad. */
export function IconoCandado(props: Props) {
  return (
    <Base lado={20} grosor={1.6} {...props}>
      <path d="M5 9H15V16.5H5V9Z" />
      <path d="M7 9V7C7 3.5 13 3.5 13 7V9" />
    </Base>
  );
}

/** Reloj fino en círculo: historial y conservación. */
export function IconoHistorial(props: Props) {
  return (
    <Base lado={20} grosor={1.6} {...props}>
      <path d="M15.7 10C15.7 13.148 13.148 15.7 10 15.7C6.85198 15.7 4.3 13.148 4.3 10C4.3 6.85198 6.85198 4.3 10 4.3C13.148 4.3 15.7 6.85198 15.7 10Z" />
      <path d="M10 6.5V10L12.5 11.5" />
    </Base>
  );
}

/** Visto bueno pequeño (reglas del registro). */
export function IconoVisto(props: Props) {
  return (
    <Base lado={12} grosor={0.96} {...props}>
      <path d="M2.4 6.3L4.92 8.7L9.6 3.3" />
    </Base>
  );
}

/** Embudo: filtros. */
export function IconoFiltro(props: Props) {
  return (
    <Base lado={16} grosor={1.28} {...props}>
      <path d="M2.8 4H13.2L9.2 8.4V12.8L6.8 11.6V8.4L2.8 4Z" />
    </Base>
  );
}

/** Ojo: ver el detalle. */
export function IconoOjo(props: Props) {
  return (
    <Base lado={18} grosor={1.44} {...props}>
      <path d="M1.8 9C4.5 4.5 13.5 4.5 16.2 9C13.5 13.5 4.5 13.5 1.8 9Z" />
      <circle cx="9" cy="9" r="1.35" />
    </Base>
  );
}

/** Hoja con líneas: PDF o documento. */
export function IconoDocumento(props: Props) {
  return (
    <Base lado={18} grosor={1.44} {...props}>
      <path d="M4.5 2.7H10.8L13.5 5.4V15.3H4.5V2.7Z" />
      <path d="M10.8 2.7V5.4H13.5" />
      <path d="M6.75 9H11.25" />
      <path d="M6.75 11.7H11.25" />
    </Base>
  );
}

/** Persona: responsable. */
export function IconoUsuario(props: Props) {
  return (
    <Base lado={18} grosor={1.5} {...props}>
      <path d="M14.25 15.75V14.25C14.25 13.4544 13.9339 12.6913 13.3713 12.1287C12.8087 11.5661 12.0456 11.25 11.25 11.25H6.75C5.95435 11.25 5.19129 11.5661 4.62868 12.1287C4.06607 12.6913 3.75 13.4544 3.75 14.25V15.75" />
      <path d="M12 5.25C12 6.90685 10.6569 8.25 9 8.25C7.34315 8.25 6 6.90685 6 5.25C6 3.59315 7.34315 2.25 9 2.25C10.6569 2.25 12 3.59315 12 5.25Z" />
    </Base>
  );
}

/** Flecha hacia arriba sobre una base: exportar. */
export function IconoSubir(props: Props) {
  return (
    <Base lado={16} grosor={1.33333} {...props}>
      <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" />
      <path d="M11.3333 5.33333L8 2L4.66667 5.33333" />
      <path d="M8 2V10" />
    </Base>
  );
}

/** Círculo con i, de 16 px: ayuda junto a un título. */
export function IconoAyuda(props: Props) {
  return (
    <Base lado={16} grosor={1.33333} {...props}>
      <path d="M14.6667 8C14.6667 11.6819 11.6819 14.6667 8 14.6667C4.3181 14.6667 1.33333 11.6819 1.33333 8C1.33333 4.3181 4.3181 1.33333 8 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z" />
      <path d="M8 10.6667V8M8 5.33333H8.00667" />
    </Base>
  );
}
