"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../../_components/PageHeader";

type BreakdownItem = { type: string; label: string; amount: number };
type Answer = { questionId: string; question?: string; answer: string };

type Proposal = {
  id: string;
  token: string;
  status: string;
  isScrap: boolean;
  calculatedValue: number;
  overriddenValue: number | null;
  breakdown: BreakdownItem[];
  answers: { knockout: Answer[]; detailed: Answer[] };
  sellerName: string;
  sellerWhatsapp: string;
  cep: string | null;
  city: string | null;
  neighborhood: string | null;
  street: string | null;
  number: string | null;
  pickupPoint: string | null;
  createdAt: string;
  conditionStateId: string | null;
  variant: {
    name: string;
    model: { name: string; category: { name: string } };
  };
  repairDevices: { id: string; model: string; status: string }[];
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
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [valueReais, setValueReais] = useState("");
  const [savingValue, setSavingValue] = useState(false);
  const [sendingRepair, setSendingRepair] = useState(false);
  const [copied, setCopied] = useState<"saudacao" | "status" | null>(null);

  useEffect(() => {
    adminApi
      .get<Proposal>(`/admin/proposals/${id}`)
      .then((p) => {
        setProposal(p);
        setStatus(p.status);
        setValueReais(((p.overriddenValue ?? p.calculatedValue) / 100).toFixed(2));
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function saveValue(reais: string | null) {
    setSavingValue(true);
    setMsg(null);
    setError(null);
    try {
      const value = reais === null ? null : Math.round(Number(reais) * 100);
      const r = await adminApi.patch<{ calculatedValue: number; overriddenValue: number | null }>(
        `/admin/proposals/${id}/value`,
        { value },
      );
      setProposal((p) => (p ? { ...p, overriddenValue: r.overriddenValue } : p));
      setValueReais(((r.overriddenValue ?? r.calculatedValue) / 100).toFixed(2));
      setMsg(reais === null ? "Valor restaurado." : "Valor atualizado.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingValue(false);
    }
  }

  async function copy(kind: "saudacao" | "status", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("Não foi possível copiar.");
    }
  }

  async function sendToRepair() {
    const linked = proposal?.repairDevices[0];
    if (linked) {
      router.push(`/admin/assistencia/${linked.id}`);
      return;
    }
    setSendingRepair(true);
    setError(null);
    try {
      const device = await adminApi.post<{ id: string }>(
        "/admin/repair-devices/from-proposal",
        { proposalId: id },
      );
      router.push(`/admin/assistencia/${device.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSendingRepair(false);
    }
  }

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
  const effectiveValue = proposal.overriddenValue ?? proposal.calculatedValue;

  // ── Mensagens cópia-e-cola ──────────────────────────────────────────────
  const firstName = proposal.sellerName.trim().split(/\s+/)[0] || "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const saudacao =
    `${greeting}, ${firstName}! Tudo bem?\n` +
    `Estou entrando em contato para falar da avaliação feita na Vendy.`;

  const modelName = variant.name.startsWith(variant.model.name)
    ? variant.name
    : `${variant.model.name} ${variant.name}`;
  const base = proposal.breakdown.find((b) => b.type === "base");
  const deltas = proposal.breakdown.filter((b) => b.type !== "base");
  const statusLines = [`📱 ${modelName}`];
  if (base) statusLines.push(base.label, fmt(base.amount));
  for (const d of deltas) statusLines.push(d.label, fmt(d.amount));
  statusLines.push("Total", `💰 ${fmt(effectiveValue)}`);
  const statusMsg =
    statusLines.join("\n") + "\n\nVocê pode falar sobre sua negociação agora?";

  const statusLabel =
    STATUS_OPTIONS.find((o) => o.value === proposal.status)?.label ?? proposal.status;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={variantLabel}
        subtitle={new Date(proposal.createdAt).toLocaleString("pt-BR")}
        back={{ href: "/admin/proposals", label: "Propostas" }}
        actions={
          <span className="font-mono text-xs font-medium text-muted">#{proposal.token}</span>
        }
      />

      {/* Resumo */}
      <div className="overflow-hidden rounded-xl border border-border bg-nav text-nav-fg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-nav-muted">
              {proposal.isScrap ? "Valor (sucata)" : "Valor proposto"}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-brand-400">
              {fmt(effectiveValue)}
            </p>
            {proposal.overriddenValue != null && (
              <p className="text-xs text-nav-muted">
                original <span className="line-through">{fmt(proposal.calculatedValue)}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-nav-muted">Status</p>
            <span
              className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                STATUS_COLORS[proposal.status] ?? "bg-surface-2 text-muted"
              }`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Assistência técnica */}
      <div className={cls.card + " space-y-3"}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Assistência técnica</h2>
            <p className="text-xs text-muted">
              {proposal.repairDevices.length > 0
                ? "Este aparelho já foi enviado para a assistência."
                : "Envie este aparelho para manutenção/assistência."}
            </p>
          </div>
          <button
            onClick={sendToRepair}
            disabled={sendingRepair}
            className={cls.btn + " disabled:opacity-50"}
          >
            <Icon.wrench size={15} />
            {sendingRepair
              ? "Enviando…"
              : proposal.repairDevices.length > 0
                ? "Abrir aparelho"
                : "Enviar para assistência"}
          </button>
        </div>
        {proposal.repairDevices.length > 0 && (
          <ul className="space-y-1 text-sm">
            {proposal.repairDevices.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/admin/assistencia/${d.id}`}
                  className="inline-flex items-center gap-1 text-brand hover:underline"
                >
                  {d.model} <span className="text-xs text-muted">· {d.status}</span>
                  <Icon.arrowRight size={13} />
                </Link>
              </li>
            ))}
          </ul>
        )}
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

      {/* Ajuste de valor */}
      <div className={cls.card + " space-y-3"}>
        <h2 className="font-semibold">Valor da proposta</h2>
        <p className="text-xs text-muted">
          Original gerado pelo site: <strong>{fmt(proposal.calculatedValue)}</strong>.
          Ajuste o valor negociado abaixo (o original é preservado).
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valueReais}
              onChange={(e) => setValueReais(e.target.value)}
              className={cls.input + " w-36"}
            />
          </div>
          <button
            onClick={() => saveValue(valueReais)}
            disabled={savingValue}
            className={cls.btn + " disabled:opacity-50"}
          >
            {savingValue ? "Salvando..." : "Salvar valor"}
          </button>
          {proposal.overriddenValue != null && (
            <button
              onClick={() => saveValue(null)}
              disabled={savingValue}
              className={cls.btnGhost}
            >
              Restaurar original
            </button>
          )}
        </div>
      </div>

      {/* Mensagens cópia-e-cola */}
      <div className={cls.card + " space-y-3"}>
        <h2 className="font-semibold">Mensagem para o cliente</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => copy("saudacao", saudacao)} className={cls.btnGhost}>
            {copied === "saudacao" ? <Icon.check size={15} /> : <Icon.copy size={15} />}
            {copied === "saudacao" ? "Copiado!" : "Copiar saudação"}
          </button>
          <button onClick={() => copy("status", statusMsg)} className={cls.btnGhost}>
            {copied === "status" ? <Icon.check size={15} /> : <Icon.copy size={15} />}
            {copied === "status" ? "Copiado!" : "Copiar status"}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
            {saudacao}
          </pre>
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-surface-2 p-3 text-xs text-muted">
            {statusMsg}
          </pre>
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
          {proposal.city && (
            <div><dt className="text-muted">Cidade</dt><dd>{proposal.city}</dd></div>
          )}
          {proposal.cep && (
            <div><dt className="text-muted">CEP</dt><dd>{proposal.cep}</dd></div>
          )}
          {(proposal.street || proposal.neighborhood) && (
            <div className="col-span-2"><dt className="text-muted">Endereço</dt>
              <dd>
                {[proposal.street, proposal.number].filter(Boolean).join(", ")}
                {proposal.neighborhood ? ` — ${proposal.neighborhood}` : ""}
              </dd>
            </div>
          )}
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
            <ul className="space-y-1 text-sm">
              {proposal.answers.knockout.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <span className="text-muted">{a.question ?? a.questionId}</span>
                  <span className={`shrink-0 font-medium ${a.answer === "YES" ? "text-green-600" : "text-red-600"}`}>
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
            <ul className="space-y-1 text-sm">
              {proposal.answers.detailed.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <span className="text-muted">{a.question ?? a.questionId}</span>
                  <span className={`shrink-0 font-medium ${a.answer === "YES" ? "text-green-600" : "text-red-600"}`}>
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
