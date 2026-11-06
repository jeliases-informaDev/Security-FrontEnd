import { isAxiosError } from "axios";

import type {
  CamposGestionDenuncia,
  CatalogoDenuncias,
  EstadoDenuncia,
  OpcionCatalogoDenuncia,
} from "../types/denuncia.types";


// ============================================================
// CATÁLOGO DE RESPALDO
// ============================================================

/**
 * Lo que se usa mientras llega el catálogo del servidor, o si el servidor todavía no lo tiene (responde 404):
 * así el formulario y las listas nunca se quedan sin opciones. Los nombres son los mismos que manda el servidor.
 */
export const CATALOGO_LOCAL: CatalogoDenuncias = {
  situaciones: [
    { codigo: "SOBORNO", nombre: "Soborno o corrupción" },
    { codigo: "CONFLICTO", nombre: "Conflicto de intereses" },
    { codigo: "ACOSO", nombre: "Hostigamiento sexual y acoso" },
    { codigo: "FRAUDE", nombre: "Fraude" },
    { codigo: "OPERACION_SOSPECHOSA", nombre: "Operación sospechosa" },
    { codigo: "OTRAS", nombre: "Otras situaciones" },
  ],
  estados: [
    { codigo: "RECIBIDO", nombre: "Recibida" },
    { codigo: "EN_PROCESO", nombre: "En proceso" },
    { codigo: "CERRADO", nombre: "Cerrada" },
  ],
  resultadosCierre: [
    { codigo: "FUNDADA", nombre: "Fundada", pideMotivo: false },
    { codigo: "INFUNDADA", nombre: "Infundada", pideMotivo: false },
    { codigo: "ARCHIVADA", nombre: "Archivada", pideMotivo: true },
  ],
  plazoAtencionDias: null,
};


function legible(codigo: string): string {

  const texto =
    codigo
      .replace(/_/g, " ")
      .toLowerCase();

  return (
    texto.charAt(0).toUpperCase() +
    texto.slice(1)
  );
}


/** Nombre para mostrar de un código del catálogo (si el código es desconocido, lo deja legible en vez de romper). */
export function nombreDe(
  opciones: OpcionCatalogoDenuncia[],
  codigo: string | null | undefined
): string {

  if (!codigo) {
    return "—";
  }

  return (
    opciones.find(
      (opcion) =>
        opcion.codigo === codigo
    )?.nombre ?? legible(codigo)
  );
}


// ============================================================
// SERVIDOR NUEVO / ANTERIOR
// ============================================================

/**
 * El servidor nuevo manda `vencida` (true/false) siempre; el anterior no la manda. Sirve para saber si el resto de los
 * campos nuevos existen y mostrar solo lo que el servidor sabe hacer.
 */
export function conCamposNuevos(
  denuncia: CamposGestionDenuncia
): boolean {

  return (
    typeof denuncia.vencida ===
    "boolean"
  );
}


/**
 * ¿La cuenta puede ver lo reservado? El servidor manda `derivadaAlOficial` como true/false solo a quien puede; a los
 * demás (por ejemplo el supervisor) llega null, y con el servidor anterior no llega: en ambos casos no se muestra nada.
 */
export function puedeVerReservado(
  denuncia: CamposGestionDenuncia
): boolean {

  return (
    typeof denuncia.derivadaAlOficial ===
    "boolean"
  );
}


// ============================================================
// PLAZO DE ATENCIÓN
// ============================================================

export type TonoChip =
  | "ok"
  | "warn"
  | "bad"
  | "info"
  | "lila"
  | "reserva"
  | "neutral";

export interface ChipDatos {
  tono: TonoChip;
  texto: string;
}


function diasTexto(
  cantidad: number
): string {

  return cantidad === 1
    ? "1 día"
    : `${cantidad} días`;
}


/**
 * Chip del plazo: verde si quedan más de 3 días, ámbar de 0 a 3, rojo si está vencida. Si ya se cerró dice si fue a tiempo
 * o fuera de plazo. Devuelve null cuando el servidor no manda el dato (servidor anterior).
 */
export function plazoDe(
  denuncia: CamposGestionDenuncia & {
    estado: EstadoDenuncia;
  }
): ChipDatos | null {

  if (
    denuncia.estado === "CERRADO"
  ) {

    if (
      denuncia.atendidaATiempo === true
    ) {
      return {
        tono: "ok",
        texto: "Cerrada a tiempo",
      };
    }

    if (
      denuncia.atendidaATiempo === false
    ) {
      return {
        tono: "bad",
        texto: "Cerrada fuera de plazo",
      };
    }

    return conCamposNuevos(denuncia)
      ? {
          tono: "neutral",
          texto: "Plazo sin dato",
        }
      : null;
  }


  const restantes =
    denuncia.diasParaVencer;

  if (
    restantes === undefined ||
    restantes === null
  ) {

    return denuncia.vencida === true
      ? {
          tono: "bad",
          texto: "Vencida",
        }
      : null;
  }

  if (restantes < 0) {
    return {
      tono: "bad",
      texto: `Vencida hace ${diasTexto(
        -restantes
      )}`,
    };
  }

  if (restantes === 0) {
    return {
      tono: "warn",
      texto: "Vence hoy",
    };
  }

  return {
    tono:
      restantes <= 3
        ? "warn"
        : "ok",
    texto: `Vence en ${diasTexto(
      restantes
    )}`,
  };
}


// ============================================================
// RESERVADO / PÚBLICO
// ============================================================

/** Línea neutra que el servidor deja en el historial al derivar (con usuario null). */
export const LINEA_DERIVACION =
  "Derivada para revisión reservada";

const MARCA_RESULTADO =
  "Resultado del cierre:";


function sinTildes(
  texto: string
): string {

  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}


export function esLineaDerivacion(
  comentario: string | null | undefined
): boolean {

  return (
    !!comentario &&
    sinTildes(comentario) ===
      sinTildes(LINEA_DERIVACION)
  );
}


/**
 * Comentario de un movimiento tal como lo puede ver quien hizo la denuncia: sin el resultado del cierre (todavía no está
 * decidido que el denunciante lo vea). El servidor lo agrega al final del comentario como «· Resultado del cierre: …».
 */
export function comentarioPublico(
  comentario: string | null
): string | null {

  if (!comentario) {
    return null;
  }

  const posicion =
    comentario.indexOf(
      MARCA_RESULTADO
    );

  const texto =
    (posicion >= 0
      ? comentario.slice(
          0,
          posicion
        )
      : comentario
    )
      .replace(/[\s·]+$/u, "")
      .trim();

  return texto || null;
}


// ============================================================
// FECHAS
// ============================================================

/**
 * Fecha sin hora (AAAA-MM-DD) mostrada como día local. `new Date("2026-12-06")` la toma como medianoche UTC y en Perú
 * saldría el día anterior.
 */
export function fechaDia(
  valor: string | null | undefined
): string {

  if (!valor) {
    return "—";
  }

  const partes =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      valor
    );

  const fecha = partes
    ? new Date(
        Number(partes[1]),
        Number(partes[2]) - 1,
        Number(partes[3])
      )
    : new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "es-PE",
    {
      dateStyle: "medium",
    }
  ).format(fecha);
}


// ============================================================
// ERRORES DEL SERVIDOR
// ============================================================

export interface FallaServidor {
  status?: number;
  code?: string;
  mensaje?: string;
}


/** Estado, código (por ejemplo DENUNCIA_MOTIVO_OBLIGATORIO) y mensaje que mandó el servidor. */
export function fallaDe(
  error: unknown
): FallaServidor {

  if (!isAxiosError(error)) {
    return {};
  }

  const datos =
    error.response?.data as
      | {
          code?: string;
          message?: string;
          mensaje?: string;
        }
      | undefined;

  return {
    status:
      error.response?.status,

    code:
      typeof datos?.code === "string"
        ? datos.code
        : undefined,

    mensaje:
      datos?.message ||
      datos?.mensaje ||
      undefined,
  };
}
