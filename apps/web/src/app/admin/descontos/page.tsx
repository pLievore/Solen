"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../_components/PageHeader";

type Model = { id: string; name: string; category?: { name: string } };
type ApiItem = {
  detailedStateId: string;
  question: string;
  helpText: string | null;
  globalYesDelta: number;
  globalNoDelta: number;
  assigned: boolean;
  yesDelta: number;
  noDelta: number;
};
type ApiResp = { model: { id: string; name: string }; versionsCount: number; items: ApiItem[] };

type EditItem = {
  detailedStateId: string;
  question: string;
  helpText: string | null;
  assigned: boolean;
  yesReais: string;
  noReais: string;
};

const reais = (cents: number) => (cents / 100).toFixed(2);

export default function ModelDiscountsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [modelId, setModelId] = useState<string>("");
  const [versionsCount, setVersionsCount] = useState<number>(0);
  const [items, setItems] = useState<EditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .get<Model[]>("/admin/models")
      .then(setModels)
      .catch((e) => setError(e.message));
  }, []);

  async function loadModel(id: string) {
    setModelId(id);
    setItems([]);
    setMsg(null);
    if (!id) return;
    setLoading(true);
    try {
      const data = await adminApi.get<ApiResp>(`/admin/models/${id}/detailed-states`);
      setVersionsCount(data.versionsCount);
      setItems(
        data.items.map((it) => ({
          detailedStateId: it.detailedStateId,
          question: it.question,
          helpText: it.helpText,
          assigned: it.assigned,
          yesReais: reais(it.yesDelta),
          noReais: reais(it.noDelta),
        })),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function patch(idx: number, data: Partial<EditItem>) {
    setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...data } : it)));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      await adminApi.put(`/admin/models/${modelId}/detailed-states`, {
        items: items.map((it) => ({
          detailedStateId: it.detailedStateId,
          assigned: it.assigned,
          yesDelta: Math.round(Number(it.yesReais || 0) * 100),
          noDelta: Math.round(Number(it.noReais || 0) * 100),
        })),
      });
      setMsg("Descontos salvos para todas as versoes deste modelo.");
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Descontos por modelo"
        subtitle="Defina o quanto cada pergunta desconta. O valor vale para todas as versões do modelo escolhido. Valores negativos = desconto."
        icon={<Icon.percent size={20} />}
      />

      <div className={cls.card + " space-y-2"}>
        <label className={cls.label}>Modelo</label>
        <select className={cls.input} value={modelId} onChange={(e) => loadModel(e.target.value)}>
          <option value="">Selecione um modelo...</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.category?.name ? `${m.category.name} · ` : ""}
              {m.name}
            </option>
          ))}
        </select>
        {modelId && (
          <p className="text-xs text-muted">{versionsCount} versao(oes) neste modelo.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {msg && (
        <p className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-subtle px-3 py-2 text-sm text-brand-subtle-fg">
          <Icon.check size={15} />
          {msg}
        </p>
      )}

      {loading && <p className="text-sm text-muted">Carregando…</p>}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={it.detailedStateId} className={cls.card + " space-y-3"}>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={it.assigned}
                  onChange={(e) => patch(idx, { assigned: e.target.checked })}
                />
                <span>
                  <span className="text-sm font-medium">{it.question}</span>
                  {it.helpText && <span className="block text-xs text-muted">{it.helpText}</span>}
                </span>
              </label>
              {it.assigned && (
                <div className="grid grid-cols-2 gap-3 pl-6">
                  <div>
                    <label className={cls.label}>Desconto se &quot;Sim&quot; (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={cls.input}
                      value={it.yesReais}
                      onChange={(e) => patch(idx, { yesReais: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={cls.label}>Desconto se &quot;Nao&quot; (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className={cls.input}
                      value={it.noReais}
                      onChange={(e) => patch(idx, { noReais: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button className={cls.btn} onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar descontos do modelo"}
          </button>
        </div>
      )}
    </div>
  );
}
