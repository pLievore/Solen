"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls, slugify } from "@/lib/ui";

type Category = { id: string; name: string };
type Model = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  order: number;
  active: boolean;
  category?: { name: string };
  _count?: { variants: number };
};
type Draft = {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  order: number;
  active: boolean;
};

const empty: Draft = { categoryId: "", name: "", slug: "", order: 0, active: true };

export default function ModelsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Model[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [cats, models] = await Promise.all([
      adminApi.get<Category[]>("/admin/categories"),
      adminApi.get<Model[]>("/admin/models"),
    ]);
    setCategories(cats);
    setItems(models);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function save() {
    setError(null);
    try {
      const base = {
        name: draft.name,
        slug: draft.slug || slugify(draft.name),
        order: Number(draft.order) || 0,
        active: draft.active,
      };
      if (draft.id) await adminApi.patch(`/admin/models/${draft.id}`, base);
      else await adminApi.post("/admin/models", { ...base, categoryId: draft.categoryId });
      setDraft(empty);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este modelo? (versoes vinculadas tambem serao removidas)")) return;
    try {
      await adminApi.del(`/admin/models/${id}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Modelos</h1>

      <div className={cls.card + " space-y-3"}>
        <p className="font-medium">{draft.id ? "Editar modelo" : "Novo modelo"}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={cls.label}>Categoria</label>
            <select
              className={cls.input}
              value={draft.categoryId}
              disabled={!!draft.id}
              onChange={(e) => setDraft((d) => ({ ...d, categoryId: e.target.value }))}
            >
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={cls.label}>Nome</label>
            <input
              className={cls.input}
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  name: e.target.value,
                  slug: d.id ? d.slug : slugify(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <label className={cls.label}>Slug</label>
            <input
              className={cls.input}
              value={draft.slug}
              onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
            />
          </div>
          <div>
            <label className={cls.label}>Ordem</label>
            <input
              type="number"
              className={cls.input}
              value={draft.order}
              onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) }))}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
          />
          Ativo
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button
            className={cls.btn}
            disabled={!draft.name || (!draft.id && !draft.categoryId)}
            onClick={save}
          >
            {draft.id ? "Salvar" : "Adicionar"}
          </button>
          {draft.id && (
            <button className={cls.btnGhost} onClick={() => setDraft(empty)}>Cancelar</button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[620px] border-collapse">
          <thead>
            <tr className="bg-surface-2/70">
              <th className={cls.th}>Nome</th>
              <th className={cls.th}>Categoria</th>
              <th className={cls.th}>Versoes</th>
              <th className={cls.th}>Ativo</th>
              <th className={cls.th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id} className="hover:bg-surface-2/50">
                <td className={cls.td}>{m.name}</td>
                <td className={cls.td + " text-muted"}>{m.category?.name}</td>
                <td className={cls.td}>{m._count?.variants ?? 0}</td>
                <td className={cls.td}>{m.active ? "Sim" : "Nao"}</td>
                <td className={cls.td}>
                  <div className="flex gap-2">
                    <button
                      className={cls.btnGhost}
                      onClick={() =>
                        setDraft({
                          id: m.id,
                          categoryId: m.categoryId,
                          name: m.name,
                          slug: m.slug,
                          order: m.order,
                          active: m.active,
                        })
                      }
                    >
                      Editar
                    </button>
                    <button className={cls.btnDanger} onClick={() => remove(m.id)}>Excluir</button>
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
