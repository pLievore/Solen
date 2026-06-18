"use client";

import { useEffect, useState } from "react";
import { adminApi, uploadIcon } from "@/lib/admin-api";
import { cls, slugify } from "@/lib/ui";

type Category = {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  order: number;
  active: boolean;
  _count?: { models: number };
};

type Draft = {
  id?: string;
  name: string;
  slug: string;
  iconUrl: string | null;
  order: number;
  active: boolean;
};

const empty: Draft = { name: "", slug: "", iconUrl: null, order: 0, active: true };

export default function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setItems(await adminApi.get<Category[]>("/admin/categories"));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  function edit(c: Category) {
    setDraft({ id: c.id, name: c.name, slug: c.slug, iconUrl: c.iconUrl, order: c.order, active: c.active });
  }

  async function save() {
    setError(null);
    setSaving(true);
    try {
      const body = {
        name: draft.name,
        slug: draft.slug || slugify(draft.name),
        iconUrl: draft.iconUrl || null,
        order: Number(draft.order) || 0,
        active: draft.active,
      };
      if (draft.id) await adminApi.patch(`/admin/categories/${draft.id}`, body);
      else await adminApi.post("/admin/categories", body);
      setDraft(empty);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta categoria? (modelos vinculados tambem serao removidos)")) return;
    try {
      await adminApi.del(`/admin/categories/${id}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadIcon(file);
      setDraft((d) => ({ ...d, iconUrl: url }));
    } catch {
      setError("Falha no upload do icone");
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Categorias</h1>

      <div className={cls.card + " space-y-3"}>
        <p className="font-medium">{draft.id ? "Editar categoria" : "Nova categoria"}</p>
        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className={cls.label}>Icone</label>
            <input type="file" accept="image/*" onChange={onFile} className="text-sm" />
            {draft.iconUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.iconUrl} alt="" className="mt-1 h-8 w-8 rounded object-cover" />
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => setDraft((d) => ({ ...d, active: e.target.checked }))}
          />
          Ativa
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button className={cls.btn} disabled={saving || !draft.name} onClick={save}>
            {saving ? "Salvando..." : draft.id ? "Salvar" : "Adicionar"}
          </button>
          {draft.id && (
            <button className={cls.btnGhost} onClick={() => setDraft(empty)}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className={cls.th}>Ordem</th>
            <th className={cls.th}>Nome</th>
            <th className={cls.th}>Slug</th>
            <th className={cls.th}>Modelos</th>
            <th className={cls.th}>Ativa</th>
            <th className={cls.th}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td className={cls.td}>{c.order}</td>
              <td className={cls.td}>{c.name}</td>
              <td className={cls.td + " text-muted"}>{c.slug}</td>
              <td className={cls.td}>{c._count?.models ?? 0}</td>
              <td className={cls.td}>{c.active ? "Sim" : "Nao"}</td>
              <td className={cls.td}>
                <div className="flex gap-2">
                  <button className={cls.btnGhost} onClick={() => edit(c)}>Editar</button>
                  <button className={cls.btnDanger} onClick={() => remove(c.id)}>Excluir</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
