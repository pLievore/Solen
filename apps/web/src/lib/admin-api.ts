import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/lib/api";

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const j = await res.json();
      detail = j.message ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === "string" ? detail : "Erro na requisicao");
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export const adminApi = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

/** Upload de icone (multipart) — retorna a URL publica. */
export async function uploadIcon(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE_URL}/api/admin/uploads/icon`, {
    method: "POST",
    headers: { ...(await authHeader()) },
    body: form,
  });
  if (!res.ok) throw new Error("Falha no upload");
  const j = (await res.json()) as { url: string };
  return j.url;
}
