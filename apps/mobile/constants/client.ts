import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

/**
 * Cliente HTTP único de la app. Adjunta el token en cada request para no
 * repetir la cabecera Authorization en cada pantalla.
 */
export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Se dispara cuando el backend responde 401, para que la app vuelva al login. */
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user', 'activeBabyId']);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** Mensaje de error legible, priorizando el que manda el backend. */
export function errorMessage(error: any, fallback = 'Algo salió mal. Intenta de nuevo.') {
  if (error?.response?.data?.error) return String(error.response.data.error);
  if (error?.code === 'ECONNABORTED') return 'El servidor tardó demasiado. Revisa tu conexión.';
  if (error?.message === 'Network Error') return 'Sin conexión. Revisa tu internet.';
  return fallback;
}
