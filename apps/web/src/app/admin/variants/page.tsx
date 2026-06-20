"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { cls, slugify } from "@/lib/ui";

type Model = { id: string; name: string };
type Variant = {
  id: string;
  modelId: string;
  name: string;
  storage: string | null;
  slug: string;
  scrapPrice: number | null;
  active: boolean;
  model?: { name: string };
};
type Draft = {
  modelId: string;
  name: string;
  storage: string;
  slug: string;
  scrapReais: string;
  active: boolean;
};

const empty: Draft = { modelId: "", name: "", storage: "", slug: "", scrapReais: "", active: true };

export default function VariantsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [items, setItems] = useState<Variant[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [ms, vs] = await Promise.all([
      adminApi.get<Model[]>("/admin/models"),
      adminApi.get<Variant[]>("/admin/variants"),
    ]);
    setModels(ms);
    setItems(vs);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create() {
    setError(null);
    try {
      await adminApi.post("/admin/variants", {
        modelId: draft.modelId,
        name: draft.name,
        storage: draft.storage || null,
        slug: draft.slug || slugify(draft.name),
        scrapPrice: draft.scrapReais ? Math.round(Number(draft.scrapReais) * 100) : null,
        active: draft.active,
      });
      setDraft(empty);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta versao?")) return;
    try {
      await adminApi.del(`/admin/variants/${id}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Versoes</h1>

      <div className={cls.card + " space-y-3"}>
        <p className="font-medium">Nova versao</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={cls.label}>Modelo</label>
            <select
              className={cls.input}
              value={draft.modelId}
              onChange={(e) => setDraft((d) => ({ ...d, modelId: e.target.value }))}
            >
              <option value="">Selecione...</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={cls.label}>Nome (ex: iPhone 11 64GB)</label>
            <input
              className={cls.input}
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value, slug: slugify(e.target.value) }))
              }
            />
          </div>
          <div>
            <label className={cls.label}>Armazenamento</label>
            <input
              className={cls.input}
              value={draft.storage}
              onChange={(e) => setDraft((d) => ({ ...d, storage: e.target.value }))}
            />
          </div>
          <div>
            <label className={cls.label}>Valor de sucata (R$, opcional)</label>
            <input
              type="number"
              step="0.01"
              className={cls.input}
              value={draft.scrapReais}
              onChange={(e) => setDraft((d) => ({ ...d, scrapReais: e.target.value }))}
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button className={cls.btn} disabled={!draft.modelId || !draft.name} onClick={create}>
          Adicionar
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[680px] border-collapse">
          <thead>
            <tr className="bg-surface-2/70">
              <th className={cls.th}>Versao</th>
              <th className={cls.th}>Modelo</th>
              <th className={cls.th}>Sucata</th>
              <th className={cls.th}>Ativa</th>
              <th className={cls.th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="hover:bg-surface-2/50">
                <td className={cls.td}>{v.name}</td>
                <td className={cls.td + " text-muted"}>{v.model?.name}</td>
                <td className={cls.td}>
                  {v.scrapPrice != null ? `R$ ${(v.scrapPrice / 100).toFixed(2)}` : "—"}
                </td>
                <td className={cls.td}>{v.active ? "Sim" : "Nao"}</td>
                <td className={cls.td}>
                  <div className="flex gap-2">
                    <Link className={cls.btnGhost} href={`/admin/variants/${v.id}`}>
                      Precos / Estados
                    </Link>
                    <button className={cls.btnDanger} onClick={() => remove(v.id)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
