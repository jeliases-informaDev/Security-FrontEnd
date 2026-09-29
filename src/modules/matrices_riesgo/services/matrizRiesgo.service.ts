import { apiClient } from "@/shared/api/apiClient";

import type {
  CalcularRiesgoInherenteRequest,
  CalcularRiesgoInherenteResponse,
  CalcularRiesgoResidualRequest,
  CalcularRiesgoResidualResponse,
  CatalogoMatriz,
  CrearCatalogoMatrizRequest,
  GuardarMatrizRiesgoRequest,
  HeatmapMatrizResponse,
  MatrizRiesgoDetalle,
  MatrizRiesgoRegistroResponse,
  MatrizRiesgoResumen,
} from "../types/matrizRiesgo.types";

const BASE_URL =
  "/matrices";


// ============================================================
// CATÁLOGOS
// ============================================================

async function listarAreas():
  Promise<CatalogoMatriz[]> {

  const { data } =
    await apiClient.get<
      CatalogoMatriz[]
    >(
      `${BASE_URL}/areas`
    );

  return data;
}


async function crearArea(
  request:
    CrearCatalogoMatrizRequest
): Promise<CatalogoMatriz> {

  const { data } =
    await apiClient.post<
      CatalogoMatriz
    >(
      `${BASE_URL}/areas`,
      request
    );

  return data;
}


async function listarProcesos():
  Promise<CatalogoMatriz[]> {

  const { data } =
    await apiClient.get<
      CatalogoMatriz[]
    >(
      `${BASE_URL}/procesos`
    );

  return data;
}


async function crearProceso(
  request:
    CrearCatalogoMatrizRequest
): Promise<CatalogoMatriz> {

  const { data } =
    await apiClient.post<
      CatalogoMatriz
    >(
      `${BASE_URL}/procesos`,
      request
    );

  return data;
}


async function vincularProcesoArea(
  areaId: number,
  procesoId: number
): Promise<void> {

  await apiClient.post(
    `${BASE_URL}/areas/${areaId}/procesos/${procesoId}`
  );
}


async function listarProcesosPorArea(
  areaId: number
): Promise<CatalogoMatriz[]> {

  const { data } =
    await apiClient.get<
      CatalogoMatriz[]
    >(
      `${BASE_URL}/areas/${areaId}/procesos`
    );

  return data;
}


// ============================================================
// HEATMAP
// ============================================================

export async function obtenerHeatmap(): Promise<HeatmapMatrizResponse> {
  const response = await apiClient.get<HeatmapMatrizResponse>(
    `${BASE_URL}/heatmap`
  );

  return response.data;
}


// ============================================================
// CÁLCULOS
// ============================================================

async function calcularRiesgoInherente(
  request:
    CalcularRiesgoInherenteRequest
): Promise<CalcularRiesgoInherenteResponse> {

  const { data } =
    await apiClient.post<
      CalcularRiesgoInherenteResponse
    >(
      `${BASE_URL}/calcular-inherente`,
      request
    );

  return data;
}


async function calcularRiesgoResidual(
  request:
    CalcularRiesgoResidualRequest
): Promise<CalcularRiesgoResidualResponse> {

  const { data } =
    await apiClient.post<
      CalcularRiesgoResidualResponse
    >(
      `${BASE_URL}/calcular-residual`,
      request
    );

  return data;
}


// ============================================================
// ANÁLISIS
// ============================================================

async function listarAnalisis():
  Promise<MatrizRiesgoResumen[]> {

  const { data } =
    await apiClient.get<
      MatrizRiesgoResumen[]
    >(
      `${BASE_URL}/analisis`
    );

  return data;
}


async function obtenerAnalisis(
  id: number
): Promise<MatrizRiesgoDetalle> {

  const { data } =
    await apiClient.get<
      MatrizRiesgoDetalle
    >(
      `${BASE_URL}/analisis/${id}`
    );

  return data;
}


async function guardarBorrador(
  request:
    GuardarMatrizRiesgoRequest
): Promise<MatrizRiesgoRegistroResponse> {

  const { data } =
    await apiClient.post<
      MatrizRiesgoRegistroResponse
    >(
      `${BASE_URL}/analisis/guardar`,
      request
    );

  return data;
}


async function registrarAnalisis(
  request:
    GuardarMatrizRiesgoRequest
): Promise<MatrizRiesgoRegistroResponse> {

  const { data } =
    await apiClient.post<
      MatrizRiesgoRegistroResponse
    >(
      `${BASE_URL}/analisis/registrar`,
      request
    );

  return data;
}


async function actualizarAnalisis(
  id: number,
  request:
    GuardarMatrizRiesgoRequest
): Promise<MatrizRiesgoRegistroResponse> {

  const { data } =
    await apiClient.put<
      MatrizRiesgoRegistroResponse
    >(
      `${BASE_URL}/analisis/${id}`,
      request
    );

  return data;
}


// ============================================================
// PDF
// ============================================================

async function descargarPdf(
  id: number
): Promise<Blob> {

  const { data } =
    await apiClient.get<Blob>(
      `${BASE_URL}/analisis/${id}/pdf`,
      {
        responseType: "blob",
      }
    );

  return data;
}


// ============================================================
// EXPORT
// ============================================================

export const matrizRiesgoService = {

  // Catálogos
  listarAreas,
  crearArea,

  listarProcesos,
  crearProceso,

  vincularProcesoArea,
  listarProcesosPorArea,


  // Heatmap
  obtenerHeatmap,


  // Cálculos
  calcularRiesgoInherente,
  calcularRiesgoResidual,


  // Análisis
  listarAnalisis,
  obtenerAnalisis,

  guardarBorrador,
  registrarAnalisis,
  actualizarAnalisis,


  // PDF
  descargarPdf,
};