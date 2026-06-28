"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../_components/PageHeader";

type DetailedState = {
  id: string;
  question: string;
  helpText: string | null;
  yesDelta: number;
  noDelta: number;
  order: number;
  active: boolean;
};
type Draft = {
  id?: string;
  question: string;
  helpText: string;
  yesReais: string;
  noReais: string;
  order: number;
  active: boolean;
};

const empty: Draft = { question: "", helpText: "", yesReais: "0", noReais: "0", order: 0, active: true };
const reais = (c: number) => (c / 100).toFixed(2);

export default function DetailedStatesPage() {
  const [items, setItems] = useState<DetailedState[]>([]);
  const [draft, setDraft] = useState<Draft>(empty);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setItems(await adminApi.get<DetailedState[]>("/admin/detailed-states"));
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
        yesDelta: Math.round(Number(draft.yesReais || 0) * 100),
        noDelta: Math.round(Number(draft.noReais || 0) * 100),
        order: Number(draft.order) || 0,
        active: draft.active,
      };
      if (draft.id) await adminApi.patch(`/admin/detailed-states/${draft.id}`, body);
      else await adminApi.post("/admin/detailed-states", body);
      setDraft(empty);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este estado detalhado?")) return;
    try {
      await adminApi.del(`/admin/detailed-states/${id}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Estados detalhados"
        subtitle="Perguntas de desconto. Os valores são deltas em R$ (geralmente negativos). Ex.: bateria abaixo de 85% = Não −100."
        icon={<Icon.sliders size={20} />}
      />

      <div className={cls.card + " space-y-3"}>
        <p className="font-semibold">{draft.id ? "Editar pergunta" : "Nova pergunta"}</p>
        <div>
          <label className={cls.label}>Pergunta</label>
          <input
            className={cls.input}
            value={draft.question}
            onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))}
          />
        </div>
        <div>
          <label className={cls.label}>Texto de ajuda (opcional)</label>
          <input
            className={cls.input}
            value={draft.helpText}
            onChange={(e) => setDraft((d) => ({ ...d, helpText: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={cls.label}>Delta &quot;Sim&quot; (R$)</label>
            <input
              type="number" step="0.01" className={cls.input}
              value={draft.yesReais}
              onChange={(e) => setDraft((d) => ({ ...d, yesReais: e.target.value }))}
            />
          </div>
          <div>
            <label className={cls.label}>Delta &quot;Nao&quot; (R$)</label>
            <input
              type="number" step="0.01" className={cls.input}
              value={draft.noReais}
              onChange={(e) => setDraft((d) => ({ ...d, noReais: e.target.value }))}
            />
          </div>
          <div>
            <label className={cls.label}>Ordem</label>
            <input
              type="number" className={cls.input}
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

      <div className="overflow-x-auto rounded-xl border border-border bg-bg shadow-sm">
        <table className="w-full min-w-[580px] border-collapse">
          <thead>
            <tr className="bg-surface-2/70">
              <th className={cls.th}>Pergunta</th>
              <th className={cls.th}>Sim</th>
              <th className={cls.th}>Não</th>
              <th className={cls.th}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="transition hover:bg-surface-2/50">
                <td className={cls.td + " font-medium"}>{d.question}</td>
                <td className={cls.td + " tabular-nums text-muted"}>{reais(d.yesDelta)}</td>
                <td className={cls.td + " tabular-nums text-muted"}>{reais(d.noDelta)}</td>
                <td className={cls.td}>
                  <div className="flex gap-2">
                    <button
                      className={cls.btnGhost}
                      onClick={() =>
                        setDraft({
                          id: d.id,
                          question: d.question,
                          helpText: d.helpText ?? "",
                          yesReais: reais(d.yesDelta),
                          noReais: reais(d.noDelta),
                          order: d.order,
                          active: d.active,
                        })
                      }
                    >
                      Editar
                    </button>
                    <button className={cls.btnDanger} onClick={() => remove(d.id)}>Excluir</button>
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
