"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";

type BreakdownItem = { type: string; label: string; amount: number };
type Answer = { questionId: string; answer: string };

type Proposal = {
  id: string;
  token: string;
  status: string;
  isScrap: boolean;
  calculatedValue: number;
  breakdown: BreakdownItem[];
  answers: { knockout: Answer[]; detailed: Answer[] };
  sellerName: string;
  sellerWhatsapp: string;
  cep: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  pickupPoint: string | null;
  createdAt: string;
  conditionStateId: string | null;
  variant: {
    name: string;
    model: { name: string; category: { name: string } };
  };
};

const STATUS_OPTIONS = [
  { value: "NEW", label: "Novo" },
  { value: "CONTACTED", label: "Em contato" },
  { value: "CLOSED", label: "Fechado" },
  { value: "LOST", label: "Perdido" },
];

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  CLOSED: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

function fmt(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .get<Proposal>(`/admin/proposals/${id}`)
      .then((p) => {
        setProposal(p);
        setStatus(p.status);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function saveStatus() {
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      await adminApi.patch(`/admin/proposals/${id}`, { status });
      setMsg("Status atualizado.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (error && !proposal) return <p className="text-red-500">{error}</p>;
  if (!proposal) return <p className="text-muted">Carregando...</p>;

  const { variant } = proposal;
  const variantLabel = `${variant.model.category.name} › ${variant.model.name} › ${variant.name}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/proposals" className="text-sm text-muted hover:text-brand">
          ← Propostas
        </Link>
        <span className="text-muted">/</span>
        <span className="font-mono text-sm font-medium">{proposal.token}</span>
      </div>

      <div className="flex flex-wrap items-start gap-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide">Aparelho</p>
          <p className="font-medium">{variantLabel}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wide">Data</p>
          <p>{new Date(proposal.createdAt).toLocaleString("pt-BR")}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wide">
            {proposal.isScrap ? "Valor (sucata)" : "Valor proposto"}
          </p>
          <p className="text-xl font-bold text-brand">{fmt(proposal.calculatedValue)}</p>
        </div>
      </div>

      {/* Status */}
      <div className={cls.card + " space-y-3"}>
        <h2 className="font-semibold">Status do lead</h2>
        <div className="flex items-center gap-3">
          {STATUS_OPTIONS.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="status"
                value={o.value}
                checked={status === o.value}
                onChange={() => setStatus(o.value)}
              />
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[o.value]}`}>
                {o.label}
              </span>
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveStatus}
            disabled={saving || status === proposal.status}
            className={cls.btn + " disabled:opacity-50"}
          >
            {saving ? "Salvando..." : "Salvar status"}
          </button>
          {msg && <span className="text-sm text-brand">{msg}</span>}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </div>

      {/* Vendedor */}
      <div className={cls.card + " space-y-2"}>
        <h2 className="font-semibold">Dados do vendedor</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
          <div><dt className="text-muted">Nome</dt><dd>{proposal.sellerName}</dd></div>
          <div><dt className="text-muted">WhatsApp</dt>
            <dd>
              <a
                href={`https://wa.me/${proposal.sellerWhatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand hover:underline"
              >
                {proposal.sellerWhatsapp}
              </a>
            </dd>
          </div>
          <div><dt className="text-muted">CEP</dt><dd>{proposal.cep}</dd></div>
          <div><dt className="text-muted">Cidade</dt><dd>{proposal.city}</dd></div>
          <div><dt className="text-muted">Bairro</dt><dd>{proposal.neighborhood}</dd></div>
          <div className="col-span-2"><dt className="text-muted">Endereço</dt>
            <dd>{proposal.street}, {proposal.number}</dd>
          </div>
          <div className="col-span-2"><dt className="text-muted">Ponto de coleta</dt>
            <dd>{proposal.pickupPoint ?? "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Breakdown */}
      <div className={cls.card + " space-y-2"}>
        <h2 className="font-semibold">Composição do valor</h2>
        <div className="space-y-0.5 text-sm">
          {(proposal.breakdown as BreakdownItem[]).map((b, i) => (
            <div key={i} className="flex justify-between border-b border-border py-1">
              <span className={b.type === "base" ? "font-medium" : "text-muted"}>{b.label}</span>
              <span>{fmt(b.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1 font-bold">
            <span>Total</span>
            <span>{fmt(proposal.calculatedValue)}</span>
          </div>
        </div>
      </div>

      {/* Respostas */}
      <div className={cls.card + " space-y-3"}>
        <h2 className="font-semibold">Respostas da avaliação</h2>
        {proposal.answers.knockout.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Knockout</p>
            <ul className="space-y-0.5 text-sm">
              {proposal.answers.knockout.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted">{a.questionId.slice(0, 8)}…</span>
                  <span className={a.answer === "YES" ? "text-green-600" : "text-red-600"}>
                    {a.answer === "YES" ? "Sim" : "Não"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {proposal.answers.detailed.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Detalhados</p>
            <ul className="space-y-0.5 text-sm">
              {proposal.answers.detailed.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted">{a.questionId.slice(0, 8)}…</span>
                  <span className={a.answer === "YES" ? "text-green-600" : "text-red-600"}>
                    {a.answer === "YES" ? "Sim" : "Não"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
