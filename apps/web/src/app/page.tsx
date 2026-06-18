import { apiGet, type HealthResponse } from "@/lib/api";

// Placeholder das categorias (Fase 2 puxa do catalogo via API).
const CATEGORIES = [
  "iPhones",
  "Apple Watches",
  "iPads",
  "AirPods",
  "Acessorios",
  "Consoles",
  "Colecionaveis",
];

async function getHealth(): Promise<HealthResponse | null> {
  try {
    return await apiGet<HealthResponse>("/health", { cache: "no-store" });
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="space-y-3">
        <span className="inline-block rounded-full bg-brand px-3 py-1 text-sm font-medium text-brand-fg">
          Solen
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Venda seus usados
        </h1>
        <p className="text-muted">
          iPhones, iPads, Apple Watch, consoles e mais — usados, quebrados ou
          seminovos. Avaliacao rapida e proposta na hora.
        </p>
      </div>

      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        {CATEGORIES.map((c) => (
          <div
            key={c}
            className="rounded border border-border bg-bg px-4 py-6 text-sm font-medium shadow-sm transition hover:border-brand"
          >
            {c}
          </div>
        ))}
      </div>

      <div className="text-xs text-muted">
        <span className="font-semibold">Fase 0</span> — fundacao do projeto.{" "}
        {health ? (
          <span className="text-brand">
            API {health.status} · banco {health.db}
          </span>
        ) : (
          <span className="text-red-500">API offline (suba @solen/api)</span>
        )}
      </div>
    </main>
  );
}
