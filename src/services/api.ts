// Expo reemplaza esta variable al iniciar el proyecto. No debe contener secretos.
import { Platform } from 'react-native';

const useExpoProxy = Platform.OS === 'web' && __DEV__;
export const API_URL = useExpoProxy ? '/api' : (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message: string, public readonly status: number = 0) {
    super(message);
    this.name = 'ApiError';
  }
}

type Options = { method?: string; body?: unknown };

export async function apiRequest<T>(path: string, options: Options = {}): Promise<T> {
  if (!useExpoProxy && !/^https?:\/\//.test(API_URL)) {
    throw new ApiError('Configurá EXPO_PUBLIC_API_URL en el archivo .env y reiniciá Expo.');
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(API_URL + path, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = data?.detail;
      const message = typeof detail === 'string' ? detail
        : response.status === 422 ? 'Revisá los datos ingresados. Algún campo está vacío, excede el límite permitido o tiene un valor inválido.'
        : response.status >= 500 ? 'El servidor no pudo completar la operación. Intentá nuevamente.'
        : `La solicitud falló (HTTP ${response.status}).`;
      throw new ApiError(message, response.status);
    }
    if (data === null) throw new ApiError('El servidor respondió con un formato inesperado.');
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError('El servidor tardó demasiado. Recargá la lista antes de repetir la operación.');
    throw new ApiError('No se pudo conectar con el servidor. Verificá tu conexión a Internet. Si estabas guardando, recargá antes de repetir.');
  } finally {
    clearTimeout(timeout);
  }
}
