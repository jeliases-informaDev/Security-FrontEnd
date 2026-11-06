"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  CATALOGO_LOCAL,
} from "../lib/denuncias";

import {
  denunciaService,
} from "../services/denuncia.service";

import type {
  CatalogoDenuncias,
} from "../types/denuncia.types";


/**
 * Situaciones, estados y resultados del cierre con sus nombres. Parte del catálogo local (para que nunca falten
 * opciones) y lo cambia por el del servidor cuando llega; si el servidor no lo tiene, se queda el local.
 */
export function useCatalogoDenuncias():
  CatalogoDenuncias {

  const [
    catalogo,
    setCatalogo,
  ] = useState<CatalogoDenuncias>(
    CATALOGO_LOCAL
  );

  useEffect(
    () => {

      let vigente = true;

      void denunciaService
        .obtenerCatalogo()
        .then(
          (recibido) => {

            if (vigente) {
              setCatalogo(
                recibido
              );
            }
          }
        );

      return () => {
        vigente = false;
      };
    },
    []
  );

  return catalogo;
}
