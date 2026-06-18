"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";

type ProposalRow = {
  id: string;
  token: string;
  status: string;
  calculatedValue: number;
  sellerName: string;
  sellerWhatsapp: string;
  city: string;
  createdAt: string;
  variant: { name: string; model: { name: string } };
};

type PageData = { total: number; skip: number; take: number; items: ProposalRow[] };

const STATUS_LABELS: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Em contato",
  CLOSED: "Fechado",
  LOST: "Perdido",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  CLOSED: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 20;

function fmt(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProposalsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [status, setStatus] = useState("");
  const [token, setToken] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [skip, setSkip] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (token.trim()) params.set("token", token.trim());
      params.set("sort", sort);
      params.set("order", order);
      params.set("skip", String(skip));
      params.set("take", String(PAGE_SIZE));
      const d = await adminApi.get<PageData>(`/admin/proposals?${params.toString()}`);
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [status, token, sort, order, skip]);

  useEffect(() => { load(); }, [load]);

  function toggleSort(col: string) {
    if (sort === col) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSort(col); setOrder("desc"); }
    setSkip(0);
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Propostas</h1>
          {data && <p className="text-sm text-muted">{data.total} lead(s) no total</p>}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por token…"
          value={token}
          onChange={(e) => { setToken(e.target.value); setSkip(0); }}
          className={cls.input + " max-w-[180px]"}
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setSkip(0); }}
          className={cls.input + " max-w-[160px]"}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={`${sort}:${order}`}
          onChange={(e) => {
            const [s, o] = e.target.value.split(":");
            setSort(s); setOrder(o); setSkip(0);
          }}
          className={cls.input + " max-w-[200px]"}
        >
          <option value="createdAt:desc">Data ↓</option>
          <option value="createdAt:asc">Data ↑</option>
          <option value="calculatedValue:desc">Valor ↓</option>
          <option value="calculatedValue:asc">Valor ↑</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Tabela */}
      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="bg-border/20">
              <th className={cls.th}>Token</th>
              <th className={cls.th}>Aparelho</th>
              <th className={cls.th}>Vendedor</th>
              <th
                className={cls.th + " cursor-pointer select-none"}
                onClick={() => toggleSort("calculatedValue")}
              >
                Valor {sort === "calculatedValue" ? (order === "desc" ? "↓" : "↑") : ""}
              </th>
              <th className={cls.th}>Status</th>
              <th
                className={cls.th + " cursor-pointer select-none"}
                onClick={() => toggleSort("createdAt")}
              >
                Data {sort === "createdAt" ? (order === "desc" ? "↓" : "↑") : ""}
              </th>
              <th className={cls.th}></th>
            </tr>
          </thead>
          <tbody>
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted">
                  Nenhuma proposta encontrada.
                </td>
              </tr>
            )}
            {data?.items.map((p) => (
              <tr key={p.id} className="hover:bg-border/10">
                <td className={cls.td}>
                  <span className="font-mono text-xs">{p.token}</span>
                </td>
                <td className={cls.td}>
                  {p.variant.model.name} {p.variant.name}
                </td>
                <td className={cls.td}>
                  <p>{p.sellerName}</p>
                  <p className="text-xs text-muted">{p.sellerWhatsapp} · {p.city}</p>
                </td>
                <td className={cls.td + " font-medium"}>{fmt(p.calculatedValue)}</td>
                <td className={cls.td}>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? ""}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                <td className={cls.td + " text-muted"}>
                  {new Date(p.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className={cls.td}>
                  <Link href={`/admin/proposals/${p.id}`} className="text-brand hover:underline text-xs">
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <button
            disabled={skip === 0}
            onClick={() => setSkip((s) => Math.max(0, s - PAGE_SIZE))}
            className={cls.btnGhost + " disabled:opacity-40"}
          >
            ← Anterior
          </button>
          <span className="text-muted">
            Página {currentPage} de {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setSkip((s) => s + PAGE_SIZE)}
            className={cls.btnGhost + " disabled:opacity-40"}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
