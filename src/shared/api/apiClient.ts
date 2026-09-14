// src/shared/api/apiClient.ts
import axios from 'axios';

// 1. Instancia Base Segura
// Deshabilitamos el rastreo de credenciales por defecto hasta que sea estrictamente necesario (XSS prevention)
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  timeout: 10000, // Previene ataques de agotamiento de recursos (Slowloris)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Aquí podemos inyectar un API Key estática de seguridad si el backend lo requiere
    // 'x-api-key': process.env.NEXT_PUBLIC_SECURITY_KEY
  },
});

// 2. Interceptor de Peticiones (Inyecta el JWT para Multitenancy de forma segura)
apiClient.interceptors.request.use(
  (config) => {
    // IMPORTANTE: En producción, es más seguro usar Cookies HTTPOnly para el token
    // Por ahora, para el MVP, usaremos localStorage, pero aislando la lógica.
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('tenant_token');
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

// 3. Interceptor de Respuestas (Manejo global de errores y auditoría)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend (Supabase/Java) nos devuelve un 401, forzamos cierre de sesión por seguridad
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tenant_token');
        // Redirigir al login (solo si no estamos ya en él)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);