"use client";

import {
  Lock,
} from "lucide-react";

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
} from "../../types/denuncia.types";


const MAXIMO_MOTIVO = 500;


/**
 * Confirmación de «Derivar al oficial de cumplimiento». Es una acción reservada y no se deshace; el motivo es opcional
 * (hasta 500). El servidor devuelve el detalle ya derivado.
 */
export function DerivarOficialModal({
  id,
  onCerrar,
  onDerivada,
}: {
  id: number;
  onCerrar: () => void;

  /** Recibe el detalle ya derivado. */
  onDerivada: (detalle: DenunciaDetalle) => void;
}) {

  const [
    motivo,
    setMotivo,
  ] = useState("");

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    errorMotivo,
    setErrorMotivo,
  ] = useState<string | null>(
    null
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  async function derivar() {

    if (enviando) {
      return;
    }

    setEnviando(true);
    setError(null);
    setErrorMotivo(null);

    try {

      const detalle =
        await denunciaService
          .derivarAlOficial(
            id,
            motivo
          );

      onDerivada(detalle);

    } catch (falla) {

      const datos =
        fallaDe(falla);

      if (
        datos.code ===
        "DENUNCIA_MOTIVO_LARGO"
      ) {

        setErrorMotivo(
          datos.mensaje ||
            `El motivo puede tener hasta ${MAXIMO_MOTIVO} caracteres.`
        );

      } else {

        setError(
          datos.status === 400 &&
            datos.mensaje
            ? datos.mensaje
            : "No se pudo derivar la denuncia. Inténtalo de nuevo."
        );
      }

      setEnviando(false);
    }
  }


  return (
    <Modal
      variante="suave"
      tamano="md"
      titulo="Derivar al oficial de cumplimiento"
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
            icono={Lock}
            onClick={() =>
              void derivar()
            }
            cargando={enviando}
          >
            Derivar en reserva
          </Boton>
        </>
      }
    >

      <div className="flex items-start gap-3 rounded-xl bg-paper p-4">

        <Lock
          size={18}
          className="mt-0.5 shrink-0 text-brand"
          aria-hidden="true"
        />

        <p className="min-w-0 break-words text-[15px] leading-6 text-ink">
          Quedará en reserva. Solo quienes pueden ver lo reservado verán que esta
          denuncia fue derivada, quién la derivó y el motivo. No se puede deshacer.
        </p>

      </div>


      {error && (
        <Aviso
          aviso={{
            tipo: "error",
            texto: error,
          }}
        />
      )}


      <div className="mt-1">

        <label
          htmlFor={`derivar-${id}-motivo`}
          className="label"
        >
          Motivo{" "}
          <span className="font-normal text-muted">
            (opcional)
          </span>
        </label>

        <textarea
          id={`derivar-${id}-motivo`}
          value={motivo}
          onChange={(event) => {
            setMotivo(
              event.target.value
            );
            setErrorMotivo(null);
          }}
          rows={4}
          maxLength={MAXIMO_MOTIVO}
          disabled={enviando}
          aria-invalid={
            errorMotivo
              ? true
              : undefined
          }
          placeholder="Por qué se deriva al oficial de cumplimiento"
          className={`input h-auto min-h-28 resize-y py-3 leading-6 ${
            errorMotivo
              ? "input-error"
              : ""
          }`}
        />

        <div className="mt-1 flex items-start justify-between gap-3">

          <p
            role={
              errorMotivo
                ? "alert"
                : undefined
            }
            className="error-text min-w-0 flex-1 break-words"
          >
            {errorMotivo}
          </p>

          <p className="shrink-0 text-xs tabular-nums text-muted">
            {motivo.length}/{MAXIMO_MOTIVO}
          </p>

        </div>

      </div>

    </Modal>
  );
}
