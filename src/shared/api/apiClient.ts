// src/shared/api/apiClient.ts

import axios from "axios";

// ============================================================
// INSTANCIA BASE
// ============================================================

export const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8081/api",

  /*
   * 60 segundos para permitir cargas de documentos.
   * El backend sigue controlando tamaño y seguridad.
   */
  timeout: 60000,

  /*
   * IMPORTANTE:
   *
   * NO establecer Content-Type globalmente.
   * Axios lo determina automáticamente:
   * JSON: application/json
   * FormData: multipart/form-data; boundary=...
   */
  headers: {
    Accept: "application/json",
  },
});


// ============================================================
// INTERCEPTOR DE PETICIONES (JWT)
// ============================================================

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("tenant_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ============================================================
// INTERCEPTOR DE RESPUESTAS
// ============================================================

apiClient.interceptors.response.use(
  (response) => {
    // Si la petición es una acción que consume créditos, actualizar la bolsa en el frontend
    if (typeof window !== "undefined" && response.config?.url) {
      const url = response.config.url.toLowerCase();
      const method = response.config.method?.toLowerCase();
      const esAccionConCobro =
        url.includes('/listas-negativas/buscar') ||
        url.includes('/scoring/evaluar') ||
        url.includes('/matrices') ||
        url.includes('/denuncias') ||
        url.includes('/operaciones');

      if (
        esAccionConCobro &&
        (method === 'post' || method === 'put' || url.includes('/buscar') || url.includes('/pdf'))
      ) {
        window.dispatchEvent(new CustomEvent('licencia:actualizar'));
      }
    }
    return response;
  },
  (error) => {
    /*
     * Si el backend devuelve 401, eliminamos la sesión local.
     */
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("tenant_token");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    /*
     * HTTP 402 (PAYMENT_REQUIRED):
     * Saldo de créditos insuficiente (bolsa + 10% tolerancia agotada).
     */
    if (error.response?.status === 402) {
      if (typeof window !== "undefined") {
        const mensaje =
          error.response?.data?.message ||
          error.response?.data?.mensaje ||
          "La empresa ha agotado los créditos disponibles y el margen de tolerancia. Por favor, solicita una recarga o ampliación de plan.";

        window.dispatchEvent(
          new CustomEvent("licencia:saldo-insuficiente", {
            detail: { mensaje, data: error.response?.data },
          })
        );
      }
    }

    /*
     * HTTP 403 (FORBIDDEN):
     * Licencia vencida en estado SOLO_LECTURA o SUSPENDIDA.
     */
    if (error.response?.status === 403) {
      if (typeof window !== "undefined") {
        const data = error.response?.data;
        const mensaje = data?.message || data?.mensaje || "";
        const esErrorLicencia =
          /licencia|vencid|gracia|solo.?lectura|suspendid/i.test(mensaje) ||
          data?.error === "LicenciaVencidaException";

        if (esErrorLicencia) {
          window.dispatchEvent(
            new CustomEvent("licencia:vencida", {
              detail: {
                mensaje:
                  mensaje ||
                  "La licencia de su empresa ha vencido y las acciones que descuentan créditos están deshabilitadas.",
              },
            })
          );
        }
      }
    }

    return Promise.reject(error);
  }
);
