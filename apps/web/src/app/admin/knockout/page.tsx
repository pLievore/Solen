"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";

type Knockout = {
  id: string;
  question: string;
  helpText: string | null;
  triggerAnswer: "YES" | "NO";
  order: number;
  active: boolean;
};
type Draft = {
  id?: string;
  question: string;
  helpText: string;
  triggerAnswer: "YES" | "NO";
  order: number;
  active: boolean;
};

const empty: Draft = { question: "", helpText: "", triggerAnswer: "NO", order: 0, active: true };

export default function KnockoutPage() {
  const [items, setItems] = useState<Knockout[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setItems(await adminApi.get<Knockout[]>("/admin/knockout-questions"));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function save() {
    setError(null);
    try {
      const body = {
        question: draft.question,
        helpText: draft.helpText || null,
        triggerAnswer: draft.triggerAnswer,
        order: Number(draft.order) || 0,
        active: draft.active,
      };
      if (draft.id) await adminApi.patch(`/admin/knockout-questions/${draft.id}`, body);
      else await adminApi.post("/admin/knockout-questions", body);
      setDraft(empty);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta pergunta?")) return;
    try {
      await adminApi.del(`/admin/knockout-questions/${id}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Perguntas knockout</h1>
      <p className="text-sm text-muted">
        Quando a resposta for o gatilho, a avaliacao vai direto para sucata. Ex.: &quot;O aparelho liga?&quot; com gatilho Nao.
      </p>

      <div className={cls.card + " space-y-3"}>
        <p className="font-medium">{draft.id ? "Editar pergunta" : "Nova pergunta"}</p>
        <div>
          <label className={cls.label}>Pergunta</label>
          <input
            className={cls.input}
            value={draft.question}
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={cls.label}>Aciona sucata quando a resposta for</label>
            <select
              className={cls.input}
              value={draft.triggerAnswer}
              onChange={(e) =>
                setDraft((d) => ({ ...d, triggerAnswer: e.target.value as "YES" | "NO" }))
              }
            >
              <option value="NO">Nao</option>
              <option value="YES">Sim</option>
            </select>
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
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2">
          <button className={cls.btn} disabled={!draft.question} onClick={save}>
            {draft.id ? "Salvar" : "Adicionar"}
          </button>
          {draft.id && (
            <button className={cls.btnGhost} onClick={() => setDraft(empty)}>Cancelar</button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="bg-surface-2/70">
              <th className={cls.th}>Pergunta</th>
              <th className={cls.th}>Gatilho</th>
              <th className={cls.th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((k) => (
              <tr key={k.id} className="hover:bg-surface-2/50">
                <td className={cls.td}>{k.question}</td>
                <td className={cls.td}>{k.triggerAnswer === "YES" ? "Sim" : "Nao"}</td>
                <td className={cls.td}>
                  <div className="flex gap-2">
                    <button
                      className={cls.btnGhost}
                      onClick={() =>
                        setDraft({
                          id: k.id,
                          question: k.question,
                          helpText: k.helpText ?? "",
                          triggerAnswer: k.triggerAnswer,
                          order: k.order,
                          active: k.active,
                        })
                      }
                    >
                      Editar
                    </button>
                    <button className={cls.btnDanger} onClick={() => remove(k.id)}>Excluir</button>
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
