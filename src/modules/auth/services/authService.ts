import { apiClient } from '@/shared/api/apiClient';

export interface UsuarioLoginResponse {
  nombreCompleto: string;
  usuario: string;
  codigo: string;
  rol: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  usuario: UsuarioLoginResponse;
}

export interface LoginCredentials {
  usuario: string;
  clave: string;
}

const TOKEN_KEY = 'tenant_token';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, data.accessToken);
    }
    return data;
  },

  async me(): Promise<UsuarioLoginResponse> {
    const { data } = await apiClient.get<UsuarioLoginResponse>('/auth/me');
    return data;
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem(TOKEN_KEY));
  },
};
