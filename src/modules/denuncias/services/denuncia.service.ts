import { apiClient } from "@/shared/api/apiClient";

import type {
  ActualizarEstadoDenunciaRequest,
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
// REGISTRAR DENUNCIA
// ============================================================

async function registrarDenuncia(
  request: CrearDenunciaRequest
): Promise<CrearDenunciaResponse> {

  const { data } =
    await apiClient.post<
      CrearDenunciaResponse
    >(
      BASE_URL,
      request
    );

  return data;
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

  const { data } =
    await apiClient.post<
      DenunciaArchivo[]
    >(
      `${BASE_URL}/${codigo}/archivos`,
      formData
    );

  return data;
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

  descargarDocumento,
};