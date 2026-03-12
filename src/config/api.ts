export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8888';
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
