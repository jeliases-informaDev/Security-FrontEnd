import { apiClient } from "@/shared/api/apiClient";
import { conConsumo } from "@/modules/licencias/lib/consumo";

import { CATALOGO_LOCAL } from "../lib/denuncias";

import type {
  ActualizarEstadoDenunciaRequest,
  CatalogoDenuncias,
  ConsultarDenunciaRequest,
  ConsultarDenunciaResponse,
  CrearDenunciaRequest,
  CrearDenunciaResponse,
  DenunciaArchivo,
  DenunciaDetalle,
  DenunciaResumen,
  EstadoDenuncia,
  ReceptorDenuncia,
} from "../types/denuncia.types";

const BASE_URL =
  "/denuncias";


// ============================================================
// CATÁLOGO (situaciones, estados y resultados del cierre)
// ============================================================

/** Se guarda solo lo que contestó el servidor: si falla, se vuelve a intentar la próxima vez. */
let catalogoDelServidor:
  CatalogoDenuncias | null = null;


function conRespaldo<T>(
  lista: T[] | undefined,
  respaldo: T[]
): T[] {

  return Array.isArray(lista) &&
    lista.length > 0
    ? lista
    : respaldo;
}


/**
 * GET /api/denuncias/catalogo. Si el servidor todavía no lo tiene (404) o falla, devuelve el catálogo local con las
 * 6 situaciones: nunca lanza error, para que el formulario y las listas no se rompan.
 */
async function obtenerCatalogo():
  Promise<CatalogoDenuncias> {

  if (catalogoDelServidor) {
    return catalogoDelServidor;
  }

  try {

    const { data } =
      await apiClient.get<
        Partial<CatalogoDenuncias>
      >(
        `${BASE_URL}/catalogo`
      );

    catalogoDelServidor = {

      situaciones:
        conRespaldo(
          data?.situaciones,
          CATALOGO_LOCAL.situaciones
        ),

      estados:
        conRespaldo(
          data?.estados,
          CATALOGO_LOCAL.estados
        ),

      resultadosCierre:
        conRespaldo(
          data?.resultadosCierre,
          CATALOGO_LOCAL.resultadosCierre
        ),

      plazoAtencionDias:
        typeof data?.plazoAtencionDias === "number"
          ? data.plazoAtencionDias
          : null,
    };

    return catalogoDelServidor;

  } catch {

    return CATALOGO_LOCAL;
  }
}


// ============================================================
// REGISTRAR DENUNCIA
// ============================================================

async function registrarDenuncia(
  request: CrearDenunciaRequest
): Promise<CrearDenunciaResponse> {

  // Registrar una denuncia descuenta tokens según la tarifa de Sulotec.
  return conConsumo(async () => {

    const { data } =
      await apiClient.post<
        CrearDenunciaResponse
      >(
        BASE_URL,
        request
      );

    return data;
  });
}


// ============================================================
// SUBIR DOCUMENTOS
// ============================================================

async function subirDocumentos(
  codigoSeguimiento: string,
  pin: string,
  archivos: File[]
): Promise<DenunciaArchivo[]> {

  const formData =
    new FormData();

  formData.append(
    "pin",
    pin
  );

  archivos.forEach(
    (archivo) => {

      formData.append(
        "archivos",
        archivo
      );

    }
  );

  const codigo =
    encodeURIComponent(
      codigoSeguimiento
    );

  // Subir los archivos de una denuncia descuenta tokens según la tarifa de Sulotec.
  return conConsumo(async () => {

    const { data } =
      await apiClient.post<
        DenunciaArchivo[]
      >(
        `${BASE_URL}/${codigo}/archivos`,
        formData
      );

    return data;
  });
}


// ============================================================
// CONSULTAR SEGUIMIENTO
// ============================================================

async function consultarSeguimiento(
  request: ConsultarDenunciaRequest
): Promise<ConsultarDenunciaResponse> {

  const { data } =
    await apiClient.post<
      ConsultarDenunciaResponse
    >(
      `${BASE_URL}/seguimiento`,
      request
    );

  return data;
}


// ============================================================
// LISTAR DENUNCIAS - ADMINISTRACIÓN
// ============================================================

async function listarDenuncias(
  estado?: EstadoDenuncia
): Promise<DenunciaResumen[]> {

  const { data } =
    await apiClient.get<
      DenunciaResumen[]
    >(
      BASE_URL,
      {
        params:
          estado
            ? { estado }
            : undefined,
      }
    );

  return data;
}


// ============================================================
// OBTENER DETALLE - ADMINISTRACIÓN
// ============================================================

async function obtenerDenuncia(
  id: number
): Promise<DenunciaDetalle> {

  const { data } =
    await apiClient.get<
      DenunciaDetalle
    >(
      `${BASE_URL}/${id}`
    );

  return data;
}


// ============================================================
// LISTAR RECEPTORES
// ============================================================

async function listarReceptores():
  Promise<ReceptorDenuncia[]> {

  const { data } =
    await apiClient.get<
      ReceptorDenuncia[]
    >(
      `${BASE_URL}/receptores`
    );

  return data;
}


// ============================================================
// ACTUALIZAR ESTADO - ADMINISTRACIÓN
// ============================================================

async function actualizarEstado(
  id: number,
  request: ActualizarEstadoDenunciaRequest
): Promise<DenunciaDetalle> {

  const { data } =
    await apiClient.patch<
      DenunciaDetalle
    >(
      `${BASE_URL}/${id}/estado`,
      request
    );

  return data;
}


// ============================================================
// DERIVAR AL OFICIAL DE CUMPLIMIENTO - ADMINISTRACIÓN (RESERVADO)
// ============================================================

/**
 * POST /api/denuncias/{id}/derivar-oficial. Es idempotente y se puede hacer en cualquier estado; devuelve el detalle.
 * El motivo es opcional (hasta 500).
 */
async function derivarAlOficial(
  id: number,
  motivo?: string | null
): Promise<DenunciaDetalle> {

  const texto =
    motivo?.trim() || null;

  const { data } =
    await apiClient.post<
      DenunciaDetalle
    >(
      `${BASE_URL}/${id}/derivar-oficial`,
      {
        motivo: texto,
      }
    );

  return data;
}


// ============================================================
// DESCARGAR DOCUMENTO - ADMINISTRACIÓN
// ============================================================

async function descargarDocumento(
  denunciaId: number,
  archivo: DenunciaArchivo
): Promise<void> {

  const response =
    await apiClient.get(
      `${BASE_URL}/${denunciaId}/archivos/${archivo.id}/descargar`,
      {
        responseType: "blob",
      }
    );


  const blob =
    new Blob(
      [response.data],
      {
        type:
          archivo.tipoContenido ||
          "application/octet-stream",
      }
    );


  const url =
    window.URL.createObjectURL(
      blob
    );


  const enlace =
    document.createElement(
      "a"
    );

  enlace.href =
    url;

  enlace.download =
    archivo.nombreOriginal;

  document.body.appendChild(
    enlace
  );

  enlace.click();

  enlace.remove();


  window.URL.revokeObjectURL(
    url
  );
}


// ============================================================
// EXPORT
// ============================================================

export const denunciaService = {

  registrarDenuncia,

  subirDocumentos,

  consultarSeguimiento,

  listarDenuncias,

  obtenerDenuncia,

  listarReceptores,

  actualizarEstado,

  derivarAlOficial,

  obtenerCatalogo,

  descargarDocumento,
};