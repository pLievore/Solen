/**
 * Cliente HTTP minimo para a API do Solen.
 * O frontend NUNCA acessa o banco direto — sempre via API.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3333";

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    throw new Error(`API ${path} respondeu ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** GET autenticado: envia o access token do Supabase no header Authorization. */
export async function apiGetAuthed<T>(path: string, token: string): Promise<T> {
  return apiGet<T>(path, { headers: { Authorization: `Bearer ${token}` } });
}

export type HealthResponse = {
  status: string;
  service: string;
  db: string;
  timestamp: string;
};
