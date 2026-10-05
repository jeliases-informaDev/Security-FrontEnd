import { apiClient } from '@/shared/api/apiClient';

export type CanalIndira = 'web' | 'app';
export type FeedbackIndira = 'positivo' | 'negativo';

export interface IndiraChatRequest {
  mensaje: string;
  conversacionId?: string | null;
  canal?: CanalIndira;
}

export interface IndiraChatResponse {
  conversacionId: string;
  mensajeId: string;
  respuesta: string;
}

// Indira usa un modelo de lenguaje local que puede tardar bastante más que
// el resto de la API, así que se amplía el timeout solo para esta llamada
// (el apiClient corta en 10 s por defecto).
const TIMEOUT_CHAT_MS = 130_000;

export const indiraService = {
  async enviarMensaje(params: IndiraChatRequest): Promise<IndiraChatResponse> {
    const { data } = await apiClient.post<IndiraChatResponse>(
      '/ml/indira/chat',
      { canal: 'web', ...params },
      { timeout: TIMEOUT_CHAT_MS },
    );
    return data;
  },

  async enviarFeedback(mensajeId: string, feedback: FeedbackIndira): Promise<void> {
    await apiClient.post(`/ml/indira/mensajes/${mensajeId}/feedback`, { feedback });
  },
};
