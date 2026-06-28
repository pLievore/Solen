"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../_components/PageHeader";
import { Panel, StatCard, brl, pct } from "../_components/charts";

type ProposalRow = {
  id: string;
  token: string;
  status: string;
  calculatedValue: number;
  overriddenValue: number | null;
  isScrap: boolean;
  sellerName: string;
  sellerWhatsapp: string;
  city: string | null;
  pickupPoint: string | null;
  createdAt: string;
  variant: {
    name: string;
    model: { name: string; category: { name: string } };
  };
};

type PageData = {
  total: number;
  skip: number;
  take: number;
  items: ProposalRow[];
  summary: {
    totalValue: number;
    avgTicket: number;
    closed: number;
    conversionRate: number;
  };
  filters: {
    categories: string[];
    pickupPoints: { value: string; label: string }[];
  };
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Em contato",
  CLOSED: "Fechado",
  LOST: "Perdido",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-sky-100 text-sky-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  CLOSED: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

const PERIODS = [
  { value: "all", label: "Todo o período" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Últimos 12 meses" },
];

const PAGE_SIZE = 20;
const ANALYTICS_INVALIDATED_AT_KEY = "vendy_admin_analytics_invalidated_at";

export default function ProposalsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando propostas...</p>}>
      <ProposalsPageContent />
    </Suspense>
  );
}

function ProposalsPageContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PageData | null>(null);
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [model, setModel] = useState(searchParams.get("model") ?? "");
  const [pickup, setPickup] = useState(searchParams.get("pickup") ?? "");
  const [days, setDays] = useState(searchParams.get("days") ?? "all");
  const [minValue, setMinValue] = useState(searchParams.get("minValue") ?? "");
  const [maxValue, setMaxValue] = useState(searchParams.get("maxValue") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "createdAt");
  const [order, setOrder] = useState(searchParams.get("order") ?? "desc");
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buildParams = useCallback(
    (pagination: boolean) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (token.trim()) params.set("token", token.trim());
      if (category) params.set("category", category);
      if (model) params.set("model", model);
      if (pickup) params.set("pickup", pickup);
      if (days) params.set("days", days);
      if (minValue) params.set("minValue", minValue);
      if (maxValue) params.set("maxValue", maxValue);
      params.set("sort", sort);
      params.set("order", order);
      if (pagination) {
        params.set("skip", String(skip));
        params.set("take", String(PAGE_SIZE));
      }
      return params;
    },
    [category, days, maxValue, minValue, model, order, pickup, skip, sort, status, token],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await adminApi.get<PageData>(
        `/admin/proposals?${buildParams(true).toString()}`,
      );
      setData(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    load();
  }, [load]);

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setSkip(0);
  }

  function toggleSort(column: string) {
    if (sort === column) setOrder((current) => (current === "asc" ? "desc" : "asc"));
    else {
      setSort(column);
      setOrder("desc");
    }
    setSkip(0);
  }

  function clearFilters() {
    setStatus("");
    setToken("");
    setCategory("");
    setModel("");
    setPickup("");
    setDays("all");
    setMinValue("");
    setMaxValue("");
    setSkip(0);
  }

  async function exportCsv() {
    setExporting(true);
    setError(null);
    try {
      const result = await adminApi.get<{ csv: string; filename: string }>(
        `/admin/proposals/export?${buildParams(false).toString()}`,
      );
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function updateStatus(proposal: ProposalRow, nextStatus: string) {
    if (nextStatus === proposal.status) return;
    setUpdatingStatusId(proposal.id);
    setError(null);
    try {
      await adminApi.patch(`/admin/proposals/${proposal.id}`, { status: nextStatus });
      localStorage.setItem(ANALYTICS_INVALIDATED_AT_KEY, String(Date.now()));
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUpdatingStatusId(null);
    }
  }

  async function removeProposal(proposal: ProposalRow) {
    const device = `${proposal.variant.model.name} ${proposal.variant.name}`;
    if (
      !confirm(
        `Excluir definitivamente a proposta ${proposal.token} de ${proposal.sellerName} (${device})?`,
      )
    ) {
      return;
    }

    setDeletingId(proposal.id);
    setError(null);
    try {
      await adminApi.del(`/admin/proposals/${proposal.id}`);
      localStorage.setItem(ANALYTICS_INVALIDATED_AT_KEY, String(Date.now()));
      if (data?.items.length === 1 && skip > 0) {
        setSkip((current) => Math.max(0, current - PAGE_SIZE));
      } else {
        await load();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const currentPage = Math.floor(skip / PAGE_SIZE) + 1;
  const hasFilters = Boolean(
    status ||
      token ||
      category ||
      model ||
      pickup ||
      days !== "all" ||
      minValue ||
      maxValue,
  );
  const rangeLabel = valueRangeLabel(minValue, maxValue);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propostas"
        subtitle="Acompanhe, filtre e exporte os leads da operação."
        icon={<Icon.inbox size={20} />}
        actions={
          <button className={cls.btnGhost} onClick={exportCsv} disabled={exporting || loading}>
            <Icon.upload size={15} />
            {exporting ? "Gerando CSV…" : "Exportar CSV"}
          </button>
        }
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard title="Leads filtrados" value={String(data.total)} accent />
          <StatCard title="Valor em pipeline" value={brl(data.summary.totalValue)} />
          <StatCard title="Ticket médio" value={brl(data.summary.avgTicket)} />
          <StatCard
            title="Conversão"
            value={pct(data.summary.conversionRate)}
            sub={`${data.summary.closed} fechado(s)`}
          />
        </div>
      )}

      <Panel
        title="Filtros"
        action={
          hasFilters ? (
            <button onClick={clearFilters} className="text-xs font-medium text-brand hover:underline">
              Limpar filtros
            </button>
          ) : null
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <input
            type="text"
            placeholder="Buscar por token..."
            value={token}
            onChange={(event) => changeFilter(setToken, event.target.value)}
            className={cls.input}
          />
          <select
            value={status}
            onChange={(event) => changeFilter(setStatus, event.target.value)}
            className={cls.input}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(event) => {
              changeFilter(setCategory, event.target.value);
              setModel("");
            }}
            className={cls.input}
          >
            <option value="">Todas as categorias</option>
            {data?.filters.categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={pickup}
            onChange={(event) => changeFilter(setPickup, event.target.value)}
            className={cls.input}
          >
            <option value="">Todos os pontos</option>
            {data?.filters.pickupPoints.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={days}
            onChange={(event) => changeFilter(setDays, event.target.value)}
            className={cls.input}
          >
            {PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          <select
            value={`${sort}:${order}`}
            onChange={(event) => {
              const [nextSort, nextOrder] = event.target.value.split(":");
              setSort(nextSort);
              setOrder(nextOrder);
              setSkip(0);
            }}
            className={cls.input}
          >
            <option value="createdAt:desc">Mais recentes</option>
            <option value="createdAt:asc">Mais antigas</option>
            <option value="calculatedValue:desc">Maior valor</option>
            <option value="calculatedValue:asc">Menor valor</option>
          </select>
        </div>

        {(model || rangeLabel) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {model && (
              <button
                onClick={() => changeFilter(setModel, "")}
                className="rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand-subtle-fg"
              >
                Modelo: {model} ×
              </button>
            )}
            {rangeLabel && (
              <button
                onClick={() => {
                  setMinValue("");
                  setMaxValue("");
                  setSkip(0);
                }}
                className="rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand-subtle-fg"
              >
                Faixa: {rangeLabel} ×
              </button>
            )}
          </div>
        )}
      </Panel>

      <Panel
        title={data ? `${data.total} proposta(s) encontrada(s)` : "Propostas encontradas"}
        action={loading ? <span className="text-xs text-muted">Atualizando...</span> : null}
      >
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead>
              <tr className="bg-surface-2/70">
                <th className={cls.th}>Token</th>
                <th className={cls.th}>Aparelho</th>
                <th className={cls.th}>Vendedor</th>
                <th
                  className={`${cls.th} cursor-pointer select-none`}
                  onClick={() => toggleSort("calculatedValue")}
                >
                  Valor {sortArrow(sort, order, "calculatedValue")}
                </th>
                <th className={cls.th}>Coleta</th>
                <th className={cls.th}>Status</th>
                <th
                  className={`${cls.th} cursor-pointer select-none`}
                  onClick={() => toggleSort("createdAt")}
                >
                  Data {sortArrow(sort, order, "createdAt")}
                </th>
                <th className={cls.th}></th>
              </tr>
            </thead>
            <tbody className={loading ? "opacity-60" : ""}>
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">
                    Nenhuma proposta encontrada para estes filtros.
                  </td>
                </tr>
              )}
              {data?.items.map((proposal) => (
                <tr key={proposal.id} className="transition hover:bg-surface-2/60">
                  <td className={cls.td}>
                    <span className="font-mono text-xs">{proposal.token}</span>
                  </td>
                  <td className={cls.td}>
                    <p className="font-medium">
                      {proposal.variant.model.name} {proposal.variant.name}
                    </p>
                    <p className="text-xs text-muted">{proposal.variant.model.category.name}</p>
                  </td>
                  <td className={cls.td}>
                    <p>{proposal.sellerName}</p>
                    <p className="text-xs text-muted">
                      {proposal.sellerWhatsapp}
                      {proposal.city ? ` · ${proposal.city}` : ""}
                    </p>
                  </td>
                  <td className={`${cls.td} font-semibold`}>
                    {brl(proposal.overriddenValue ?? proposal.calculatedValue)}
                    {proposal.overriddenValue != null && (
                      <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
                        ajustado
                      </span>
                    )}
                    {proposal.isScrap && (
                      <span className="ml-1.5 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
                        sucata
                      </span>
                    )}
                  </td>
                  <td className={`${cls.td} max-w-48 text-xs text-muted`}>
                    {proposal.pickupPoint ?? "Não informado"}
                  </td>
                  <td className={cls.td}>
                    <select
                      value={proposal.status}
                      onChange={(event) => updateStatus(proposal, event.target.value)}
                      disabled={updatingStatusId === proposal.id || deletingId === proposal.id}
                      aria-label={`Alterar status da proposta ${proposal.token}`}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium outline-none ring-1 ring-inset ring-black/5 disabled:cursor-wait disabled:opacity-60 ${
                        STATUS_COLORS[proposal.status] ?? "bg-surface-2 text-muted"
                      }`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={`${cls.td} text-muted`}>
                    {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className={cls.td}>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/proposals/${proposal.id}`}
                        className="text-xs font-medium text-brand hover:underline"
                      >
                        Ver →
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeProposal(proposal)}
                        disabled={
                          deletingId === proposal.id || updatingStatusId === proposal.id
                        }
                        className={`${cls.btnDanger} disabled:cursor-wait disabled:opacity-50`}
                      >
                        {deletingId === proposal.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={skip === 0 || loading}
              onClick={() => setSkip((current) => Math.max(0, current - PAGE_SIZE))}
              className={`${cls.btnGhost} disabled:opacity-40`}
            >
              ← Anterior
            </button>
            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setSkip((current) => current + PAGE_SIZE)}
              className={`${cls.btnGhost} disabled:opacity-40`}
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function sortArrow(sort: string, order: string, column: string) {
  if (sort !== column) return "";
  return order === "desc" ? "↓" : "↑";
}

function valueRangeLabel(minValue: string, maxValue: string) {
  const min = minValue ? Number(minValue) : null;
  const max = maxValue ? Number(maxValue) : null;
  if (min === null && max === null) return "";
  if ((min ?? 0) === 0 && max !== null) return `até ${brl(max)}`;
  if (min !== null && max === null) return `acima de ${brl(min)}`;
  return `${brl(min ?? 0)} a ${brl(max ?? 0)}`;
}
