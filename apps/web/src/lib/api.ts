/**
 * Cliente HTTP minimo para a API do Vendy.
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

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(`API ${path} respondeu ${res.status}`), {
      status: res.status,
      body: text,
    });
  }
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(`API ${path} respondeu ${res.status}`), {
      status: res.status,
      body: text,
    });
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
