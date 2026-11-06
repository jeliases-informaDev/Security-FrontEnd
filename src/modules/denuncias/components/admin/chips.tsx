import {
  Clock3,
  Lock,
} from "lucide-react";

import type {
  ReactNode,
} from "react";

import {
  nombreDe,
  plazoDe,
} from "../../lib/denuncias";

import type {
  TonoChip,
} from "../../lib/denuncias";

import type {
  CamposGestionDenuncia,
  EstadoDenuncia,
  OpcionCatalogoDenuncia,
} from "../../types/denuncia.types";


const TONOS: Record<TonoChip, string> = {
  ok: "border-ok/20 bg-ok-soft text-ok",
  warn: "border-warn/20 bg-warn-soft text-warn",
  bad: "border-bad/20 bg-bad-soft text-bad",
  info: "border-blue-100 bg-blue-50 text-blue-700",
  lila: "border-accent/20 bg-accent-soft text-accent",
  reserva: "border-ink bg-ink text-paper",
  neutral: "border-line bg-surface-2 text-muted",
};


/**
 * Insignia redonda de la pantalla de denuncias. El texto puede pasar a otra línea (nunca se corta): los nombres vienen
 * del servidor y pueden ser largos.
 */
export function Chip({
  tono,
  grande = false,
  children,
}: {
  tono: TonoChip;
  grande?: boolean;
  children: ReactNode;
}) {

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 break-words rounded-full border font-bold ${
        grande
          ? "px-3 py-1 text-xs"
          : "px-2.5 py-1 text-[10px]"
      } ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}


/** Estado de la denuncia con el nombre que manda el servidor (catálogo). */
export function ChipEstado({
  estado,
  etiqueta,
  estados,
  grande,
}: {
  estado: EstadoDenuncia;
  etiqueta?: string | null;
  estados: OpcionCatalogoDenuncia[];
  grande?: boolean;
}) {

  const tono: TonoChip =
    estado === "RECIBIDO"
      ? "info"
      : estado === "EN_PROCESO"
        ? "warn"
        : "ok";

  return (
    <Chip
      tono={tono}
      grande={grande}
    >
      {etiqueta ||
        nombreDe(
          estados,
          estado
        )}
    </Chip>
  );
}


/** Plazo de atención: «Vence en N días», «Vencida hace N días», «Cerrada a tiempo»… No sale con el servidor anterior. */
export function ChipPlazo({
  denuncia,
  grande,
}: {
  denuncia: CamposGestionDenuncia & {
    estado: EstadoDenuncia;
  };
  grande?: boolean;
}) {

  const plazo =
    plazoDe(denuncia);

  if (!plazo) {
    return null;
  }

  return (
    <Chip
      tono={plazo.tono}
      grande={grande}
    >
      <Clock3
        size={grande ? 13 : 11}
        className="shrink-0"
        aria-hidden="true"
      />

      {plazo.texto}
    </Chip>
  );
}


/** Resultado del cierre: Fundada (verde), Infundada (gris) o Archivada (lila). */
export function ChipResultado({
  resultado,
  etiqueta,
  grande,
}: {
  resultado: string;
  etiqueta?: string | null;
  grande?: boolean;
}) {

  const tono: TonoChip =
    resultado === "FUNDADA"
      ? "ok"
      : resultado === "ARCHIVADA"
        ? "lila"
        : "neutral";

  return (
    <Chip
      tono={tono}
      grande={grande}
    >
      {etiqueta ||
        nombreDe(
          [],
          resultado
        )}
    </Chip>
  );
}


/** Solo se muestra a quien el servidor deja ver lo reservado. */
export function ChipDerivada({
  grande,
}: {
  grande?: boolean;
}) {

  return (
    <Chip
      tono="reserva"
      grande={grande}
    >
      <Lock
        size={grande ? 13 : 11}
        className="shrink-0"
        aria-hidden="true"
      />

      Derivada · en reserva
    </Chip>
  );
}
