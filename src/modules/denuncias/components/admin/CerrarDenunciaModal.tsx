"use client";

import {
  useState,
} from "react";

import {
  Modal,
} from "@/shared/ui/Modal";

import {
  Aviso,
  Boton,
} from "@/shared/ui/kit";

import {
  fallaDe,
} from "../../lib/denuncias";

import {
  denunciaService,
} from "../../services/denuncia.service";

import type {
  DenunciaDetalle,
  ResultadoCierre,
  ResultadoCierreCatalogo,
} from "../../types/denuncia.types";


const MAXIMO_MOTIVO = 1000;


/** Lo que significa cada resultado, en palabras simples (el nombre y si pide motivo salen del catálogo del servidor). */
const AYUDA_RESULTADO: Record<string, string> = {
  FUNDADA: "Se comprobaron los hechos denunciados.",
  INFUNDADA: "No se comprobaron los hechos denunciados.",
  ARCHIVADA: "Se cierra sin continuar con la investigación. Debes escribir el motivo.",
};


interface Errores {
  resultado?: string;
  motivo?: string;
  general?: string;
}


/** Cada error del servidor se muestra en su campo (el servidor manda el código y el mensaje en español). */
function erroresDe(
  error: unknown
): Errores {

  const falla =
    fallaDe(error);

  switch (falla.code) {

    case "DENUNCIA_RESULTADO_OBLIGATORIO":
      return {
        resultado:
          falla.mensaje ||
          "Elige el resultado del cierre.",
      };

    case "DENUNCIA_MOTIVO_OBLIGATORIO":
      return {
        motivo:
          falla.mensaje ||
          "Para archivar la denuncia escribe el motivo.",
      };

    case "DENUNCIA_MOTIVO_LARGO":
      return {
        motivo:
          falla.mensaje ||
          `El motivo puede tener hasta ${MAXIMO_MOTIVO} caracteres.`,
      };

    default:
      return {
        general:
          falla.status === 400 &&
          falla.mensaje
            ? falla.mensaje
            : "No se pudo cerrar la denuncia. Inténtalo de nuevo.",
      };
  }
}


/**
 * Ventana para cerrar una denuncia: se elige el resultado (Fundada, Infundada o Archivada) y se escribe el motivo, que es
 * obligatorio solo al archivar. El servidor valida y sus errores salen en el campo que corresponde.
 */
export function CerrarDenunciaModal({
  id,
  resultados,
  comentario,
  onCerrar,
  onCerrada,
}: {
  id: number;
  resultados: ResultadoCierreCatalogo[];

  /** Comentario de gestión que ya se escribió en la pantalla: viaja con el cierre. */
  comentario: string;

  onCerrar: () => void;

  /** Recibe el detalle ya cerrado. */
  onCerrada: (detalle: DenunciaDetalle) => void;
}) {

  const [
    resultado,
    setResultado,
  ] = useState<ResultadoCierre | "">(
    ""
  );

  const [
    motivo,
    setMotivo,
  ] = useState("");

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    errores,
    setErrores,
  ] = useState<Errores>(
    {}
  );

  const elegido =
    resultados.find(
      (opcion) =>
        opcion.codigo === resultado
    );

  const comentarioLimpio =
    comentario.trim();


  async function cerrar() {

    if (
      !resultado ||
      enviando
    ) {
      return;
    }

    setEnviando(true);
    setErrores({});

    try {

      const detalle =
        await denunciaService
          .actualizarEstado(
            id,
            {
              estado: "CERRADO",
              resultadoCierre:
                resultado,
              motivoCierre:
                motivo.trim() ||
                null,
              comentario:
                comentarioLimpio ||
                null,
            }
          );

      onCerrada(detalle);

    } catch (error) {

      setErrores(
        erroresDe(error)
      );

      setEnviando(false);
    }
  }


  return (
    <Modal
      variante="suave"
      tamano="md"
      titulo="Cerrar la denuncia"
      subtitulo={`Denuncia #${id}`}
      onCerrar={
        enviando
          ? () => undefined
          : onCerrar
      }
      pie={
        <>
          <Boton
            variante="secundario"
            onClick={onCerrar}
            disabled={enviando}
          >
            Cancelar
          </Boton>

          <Boton
            onClick={() =>
              void cerrar()
            }
            disabled={!resultado}
            cargando={enviando}
          >
            Cerrar denuncia
          </Boton>
        </>
      }
    >

      <p
        id={`cierre-${id}-ayuda`}
        className="text-[15px] leading-6 text-muted"
      >
        Elige cómo se cierra. Una denuncia cerrada ya no puede cambiar de estado.
      </p>


      {errores.general && (
        <Aviso
          aviso={{
            tipo: "error",
            texto: errores.general,
          }}
        />
      )}


      <div
        role="radiogroup"
        aria-labelledby={`cierre-${id}-ayuda`}
        className="flex flex-col gap-2.5"
      >

        {resultados.map(
          (opcion) => {

            const marcada =
              resultado ===
              opcion.codigo;

            return (

              <label
                key={opcion.codigo}
                className={`flex cursor-pointer items-start gap-3.5 rounded-xl px-4 py-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${
                  marcada
                    ? "border-[1.5px] border-brand bg-brand-soft"
                    : "border border-line bg-white hover:bg-paper"
                }`}
              >

                <input
                  type="radio"
                  name={`cierre-${id}`}
                  value={opcion.codigo}
                  checked={marcada}
                  disabled={enviando}
                  onChange={() => {
                    setResultado(
                      opcion.codigo as ResultadoCierre
                    );
                    setErrores({});
                  }}
                  className="sr-only"
                />

                <span
                  className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    marcada
                      ? "border-[1.5px] border-brand bg-white"
                      : "border border-line-strong bg-white"
                  }`}
                  aria-hidden="true"
                >
                  {marcada && (
                    <span className="h-2.5 w-2.5 rounded-full bg-brand" />
                  )}
                </span>

                <span className="min-w-0 flex-1">

                  <span className="block break-words text-[15px] font-semibold text-ink">
                    {opcion.nombre}
                  </span>

                  {AYUDA_RESULTADO[
                    opcion.codigo
                  ] && (
                    <span className="mt-0.5 block break-words text-sm leading-[21px] text-muted">
                      {
                        AYUDA_RESULTADO[
                          opcion.codigo
                        ]
                      }
                    </span>
                  )}

                </span>

              </label>
            );
          }
        )}

      </div>


      {errores.resultado && (
        <p
          role="alert"
          className="error-text"
        >
          {errores.resultado}
        </p>
      )}


      <div className="mt-2">

        <label
          htmlFor={`cierre-${id}-motivo`}
          className="label"
        >
          Motivo del cierre{" "}
          <span className="font-normal text-muted">
            {elegido?.pideMotivo
              ? "(obligatorio al archivar)"
              : "(opcional)"}
          </span>
        </label>

        <textarea
          id={`cierre-${id}-motivo`}
          value={motivo}
          onChange={(event) => {
            setMotivo(
              event.target.value
            );
            setErrores(
              (anteriores) => ({
                ...anteriores,
                motivo: undefined,
              })
            );
          }}
          rows={4}
          maxLength={MAXIMO_MOTIVO}
          disabled={enviando}
          aria-invalid={
            errores.motivo
              ? true
              : undefined
          }
          placeholder="Explica por qué se cierra así la denuncia"
          className={`input h-auto min-h-28 resize-y py-3 leading-6 ${
            errores.motivo
              ? "input-error"
              : ""
          }`}
        />

        <div className="mt-1 flex items-start justify-between gap-3">

          <p
            role={
              errores.motivo
                ? "alert"
                : undefined
            }
            className="error-text min-w-0 flex-1 break-words"
          >
            {errores.motivo}
          </p>

          <p className="shrink-0 text-xs tabular-nums text-muted">
            {motivo.length}/{MAXIMO_MOTIVO}
          </p>

        </div>

      </div>


      {comentarioLimpio && (
        <p className="break-words rounded-xl bg-paper p-3 text-sm leading-6 text-muted">
          Se guardará con este comentario de gestión:{" "}
          <span className="text-ink">
            {comentarioLimpio}
          </span>
        </p>
      )}

    </Modal>
  );
}
