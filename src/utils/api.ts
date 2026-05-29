// Dev: Vite proxy handles /api → localhost:3002
// Prod: frontend needs absolute backend URL
const API_BASE = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || ''
  : '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = apiUrl(path);
  return fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      // Always send auth header from settings store if available
    },
  });
}
