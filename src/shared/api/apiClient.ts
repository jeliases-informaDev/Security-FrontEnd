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
   *
   * Axios lo determina automáticamente:
   *
   * JSON:
   * application/json
   *
   * FormData:
   * multipart/form-data; boundary=...
   */
  headers: {
    Accept: "application/json",
  },
});


// ============================================================
// INTERCEPTOR DE PETICIONES
// JWT
// ============================================================

apiClient.interceptors.request.use(
  (config) => {

    if (
      typeof window !== "undefined"
    ) {

      const token =
        localStorage.getItem(
          "tenant_token"
        );

      if (
        token
      ) {

        config.headers.Authorization =
          `Bearer ${token}`;

      }

    }

    return config;

  },

  (error) => {

    return Promise.reject(
      error
    );

  }
);


// ============================================================
// INTERCEPTOR DE RESPUESTAS
// ============================================================

apiClient.interceptors.response.use(

  (response) =>
    response,

  (error) => {

    /*
     * Si el backend devuelve 401,
     * eliminamos la sesión local.
     */
    if (
      error.response?.status === 401
    ) {

      if (
        typeof window !== "undefined"
      ) {

        localStorage.removeItem(
          "tenant_token"
        );

        if (
          window.location.pathname !==
          "/login"
        ) {

          window.location.href =
            "/login";

        }

      }

    }

    return Promise.reject(
      error
    );

  }
);