"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../../_components/PageHeader";

type ConditionState = { id: string; key: string; label: string; order: number };
type DetailedState = { id: string; question: string; yesDelta: number; noDelta: number };
type VariantDetail = {
  id: string;
  name: string;
  scrapPrice: number | null;
  model: { name: string; category: { name: string } };
  prices: { conditionStateId: string; price: number }[];
  detailedStates: { detailedStateId: string }[];
};

const reais = (cents: number) => (cents / 100).toFixed(2);

export default function VariantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [variant, setVariant] = useState<VariantDetail | null>(null);
  const [states, setStates] = useState<ConditionState[]>([]);
  const [allDetailed, setAllDetailed] = useState<DetailedState[]>([]);
  const [priceMap, setPriceMap] = useState<Record<string, string>>({});
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [scrap, setScrap] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [v, cs, ds] = await Promise.all([
      adminApi.get<VariantDetail>(`/admin/variants/${id}`),
      adminApi.get<ConditionState[]>("/admin/condition-states"),
      adminApi.get<DetailedState[]>("/admin/detailed-states"),
    ]);
    setVariant(v);
    setStates(cs);
    setAllDetailed(ds);
    const pm: Record<string, string> = {};
    for (const s of cs) {
      const p = v.prices.find((x) => x.conditionStateId === s.id);
      pm[s.id] = p ? reais(p.price) : "";
    }
    setPriceMap(pm);
    setAssigned(new Set(v.detailedStates.map((d) => d.detailedStateId)));
    setScrap(v.scrapPrice != null ? reais(v.scrapPrice) : "");
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  }

  async function savePrices() {
    setError(null);
    try {
      const prices = states.map((s) => ({
        conditionStateId: s.id,
        price: Math.round(Number(priceMap[s.id] || 0) * 100),
      }));
      await adminApi.put(`/admin/variants/${id}/prices`, { prices });
      flash("Precos salvos.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function saveScrap() {
    setError(null);
    try {
      await adminApi.patch(`/admin/variants/${id}`, {
        scrapPrice: scrap ? Math.round(Number(scrap) * 100) : null,
      });
      flash("Sucata salva.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function saveAssignment() {
    setError(null);
    try {
      const items = Array.from(assigned).map((detailedStateId) => ({ detailedStateId }));
      await adminApi.put(`/admin/variants/${id}/detailed-states`, { items });
      flash("Estados detalhados atualizados.");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function toggle(dsId: string) {
    setAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(dsId)) next.delete(dsId);
      else next.add(dsId);
      return next;
    });
  }

  if (!variant) {
    return <p className="text-muted">{error ?? "Carregando..."}</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={variant.name}
        subtitle={`${variant.model.category.name} · ${variant.model.name}`}
        icon={<Icon.layers size={20} />}
        back={{ href: "/admin/variants", label: "Versões" }}
      />

      {msg && (
        <p className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-subtle px-3 py-2 text-sm text-brand-subtle-fg">
          <Icon.check size={15} />
          {msg}
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Precos base por estado */}
      <div className={cls.card + " space-y-3"}>
        <p className="font-medium">Precos base por estado (R$)</p>
        <div className="space-y-2">
          {states.map((s) => (
            <div key={s.id} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <label className="flex-1 text-sm">{s.label}</label>
              <input
                type="number"
                step="0.01"
                className={cls.input + " sm:w-32"}
                value={priceMap[s.id] ?? ""}
                onChange={(e) => setPriceMap((m) => ({ ...m, [s.id]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <button className={cls.btn} onClick={savePrices}>Salvar precos</button>
      </div>

      {/* Valor de sucata */}
      <div className={cls.card + " space-y-3"}>
        <p className="font-medium">Valor de sucata (R$)</p>
        <p className="text-xs text-muted">
          Usado quando uma pergunta eliminatoria e acionada. Vazio = usa o padrao global.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="number"
            step="0.01"
            className={cls.input + " sm:w-32"}
            value={scrap}
            onChange={(e) => setScrap(e.target.value)}
          />
          <button className={cls.btn} onClick={saveScrap}>Salvar sucata</button>
        </div>
      </div>

      {/* Estados detalhados atribuidos */}
      <div className={cls.card + " space-y-3"}>
        <p className="font-medium">Estados detalhados aplicados a esta versao</p>
        <div className="space-y-2">
          {allDetailed.map((d) => (
            <label key={d.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={assigned.has(d.id)}
                onChange={() => toggle(d.id)}
                className="mt-1"
              />
              <span>
                {d.question}{" "}
                <span className="text-muted">
                  (Sim {reais(d.yesDelta)} · Nao {reais(d.noDelta)})
                </span>
              </span>
            </label>
          ))}
        </div>
        <button className={cls.btn} onClick={saveAssignment}>Salvar atribuicao</button>
      </div>
    </div>
  );
}
