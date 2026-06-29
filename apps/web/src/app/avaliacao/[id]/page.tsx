"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { PICKUP_POINTS, type PickupPointId } from "@vendy/shared";
import PublicShell from "@/components/PublicShell";
import { fadeUp, scaleIn, stagger, ease, easeFast } from "@/components/motion";
import { track } from "@/lib/analytics";

type Answer = "YES" | "NO";
type Knockout = { id: string; question: string; helpText: string | null; triggerAnswer: Answer };
type ConditionState = { id: string; key: string; label: string };
type Detailed = { id: string; question: string; helpText: string | null };
type Questions = {
  variant: {
    id: string;
    name: string;
    model: string;
    category: string;
    categorySlug: string;
    manualReview: boolean;
  };
  knockout: Knockout[];
  conditionStates: ConditionState[];
  detailedStates: Detailed[];
};
type QuoteResult = {
  isScrap: boolean;
  value: number;
  valueFormatted: string;
  breakdown: { type: string; label: string; amount: number }[];
};

// ── Toggle Sim/Não ───────────────────────────────────────────────────────────
function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Answer | null;
  onChange: (a: Answer) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="relative flex w-28 shrink-0 rounded-xl border border-border bg-surface p-0.5"
    >
      {value && (
        <motion.div
          layoutId={undefined}
          className="absolute inset-y-0.5 w-[calc(50%-2px)] rounded-[9px] bg-brand shadow-sm"
          animate={{ x: value === "YES" ? "calc(100% + 4px)" : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      {(["NO", "YES"] as Answer[]).map((a) => (
        <button
          key={a}
          type="button"
          aria-label={`${label}: ${a === "NO" ? "Não" : "Sim"}`}
          aria-pressed={value === a}
          onClick={() => onChange(a)}
          className={`relative flex-1 rounded-[9px] py-1.5 text-sm font-medium transition-colors duration-150 ${
            value === a ? "text-brand-fg" : "text-muted hover:text-fg"
          }`}
        >
          {a === "NO" ? "Não" : "Sim"}
        </button>
      ))}
    </div>
  );
}

// ── Condition State Card ─────────────────────────────────────────────────────
function ConditionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={`Estado do aparelho: ${label}`}
      aria-pressed={selected}
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium text-left transition-all duration-200 ${
        selected
          ? "border-brand bg-brand-subtle text-brand-subtle-fg shadow-sm shadow-brand/20"
          : "border-border bg-surface hover:border-brand hover:shadow-sm"
      }`}
    >
      <span
        className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
          selected ? "border-brand bg-brand" : "border-muted"
        }`}
      >
        {selected && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-full items-center justify-center"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white block" />
          </motion.span>
        )}
      </span>
      {label}
    </motion.button>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
// Anima o valor de 0 ate o total (efeito "contagem") para dar peso a proposta.
function AnimatedPrice({ cents }: { cents: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const dur = 750;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(cents * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cents]);
  return <>{(n / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</>;
}

export default function EvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Questions | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [knockoutA, setKnockoutA] = useState<Record<string, Answer>>({});
  const [conditionId, setConditionId] = useState<string | null>(null);
  const [detailedA, setDetailedA] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Captura nome + WhatsApp ANTES de revelar o valor (garante o lead).
  const [phase, setPhase] = useState<"form" | "contact">("form");
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [contactErr, setContactErr] = useState<Record<string, string>>({});
  const [token, setToken] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [pickupId, setPickupId] = useState<PickupPointId | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    apiGet<Questions>(`/evaluation/variants/${id}/questions`)
      .then(setData)
      .catch(() => setError("Não foi possível carregar a avaliação."));
  }, [id]);

  const scrapTriggered = useMemo(() => {
    if (!data) return false;
    return data.knockout.some((k) => knockoutA[k.id] && knockoutA[k.id] === k.triggerAnswer);
  }, [data, knockoutA]);

  const answeredCount = useMemo(() => {
    if (!data) return 0;
    const kDone = data.knockout.filter((k) => knockoutA[k.id]).length;
    if (scrapTriggered) return kDone;
    const cDone = conditionId ? 1 : 0;
    const dDone = data.detailedStates.filter((d) => detailedA[d.id]).length;
    return kDone + cDone + dDone;
  }, [data, knockoutA, scrapTriggered, conditionId, detailedA]);

  const totalCount = useMemo(() => {
    if (!data) return 1;
    if (scrapTriggered) return data.knockout.length;
    return data.knockout.length + 1 + data.detailedStates.length;
  }, [data, scrapTriggered]);

  const progress = Math.round((answeredCount / totalCount) * 100);

  const canSubmit = useMemo(() => {
    if (!data) return false;
    const allKnockout = data.knockout.every((k) => knockoutA[k.id]);
    if (!allKnockout) return false;
    if (scrapTriggered) return true;
    const allDetailed = data.detailedStates.every((d) => detailedA[d.id]);
    return !!conditionId && allDetailed;
  }, [data, knockoutA, scrapTriggered, conditionId, detailedA]);

  // Passo 1->2: das perguntas para o contato (sem revelar valor ainda).
  function goToContact() {
    if (!canSubmit) return;
    setError(null);
    setPhase("contact");
    track("avancou_etapa", {
      etapa: "dados_contato",
      variant_id: id,
      is_scrap: scrapTriggered,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function validateContact(): boolean {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Informe seu nome";
    if (!/^[\d\s()+\-]{10,}$/.test(whatsapp)) e.whatsapp = "WhatsApp inválido";
    setContactErr(e);
    return Object.keys(e).length === 0;
  }

  // Passo 2: cria o lead (nome + WhatsApp) e só então revela o valor.
  async function submitLead() {
    if (!data || !validateContact()) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await apiPost<{
        token: string;
        value: number;
        valueFormatted: string;
        isScrap: boolean;
        breakdown: QuoteResult["breakdown"];
        whatsappUrl: string;
      }>("/proposals", {
        quote: {
          variantId: id,
          conditionStateId: scrapTriggered ? undefined : conditionId,
          knockoutAnswers: Object.entries(knockoutA).map(([questionId, answer]) => ({ questionId, answer })),
          detailedAnswers: scrapTriggered
            ? []
            : Object.entries(detailedA).map(([questionId, answer]) => ({ questionId, answer })),
        },
        seller: { name: name.trim(), whatsapp: whatsapp.trim() },
      });
      setToken(resp.token);
      setWhatsappUrl(resp.whatsappUrl);
      setResult({
        isScrap: resp.isScrap,
        value: resp.value,
        valueFormatted: resp.valueFormatted,
        breakdown: resp.breakdown,
      });
      track("enviou_avaliacao", {
        variant_id: id,
        valor: resp.value / 100,
        is_scrap: resp.isScrap,
      });
    } catch (e) {
      const status = (e as { status?: number }).status;
      setError(
        status === 429
          ? "Muitas tentativas. Aguarde um instante e tente novamente."
          : "Não foi possível enviar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Passo 3: grava o ponto de coleta e abre o WhatsApp.
  async function sendWhatsApp() {
    if (!pickupId) return;
    setSending(true);
    let url = whatsappUrl;
    try {
      if (token) {
        const r = await apiPatch<{ whatsappUrl: string }>(
          `/proposals/${token}/pickup`,
          { pickupPointId: pickupId },
        );
        url = r.whatsappUrl;
      }
    } catch {
      /* mantém a URL sem o ponto de coleta */
    } finally {
      setSending(false);
    }
    track("lead", { variant_id: id });
    window.location.href = url;
  }

  if (error && !data) {
    return (
      <PublicShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-5xl">😕</p>
            <p className="mt-4 font-semibold">{error}</p>
            <Link href="/" className="mt-4 inline-block text-sm text-brand hover:underline">
              Voltar ao início
            </Link>
          </div>
        </div>
      </PublicShell>
    );
  }

  if (!data) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-2xl px-6 py-12">
          <div className="h-2 w-full animate-pulse rounded-full bg-surface" />
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface" />
            ))}
          </div>
        </div>
      </PublicShell>
    );
  }

  // ── Resultado ─────────────────────────────────────────────────────────────
  if (result) {
    return (
      <PublicShell>
        <div className="mx-auto max-w-md px-6 py-16">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger(0.08)}
            className="text-center"
          >
            <motion.div variants={fadeUp} transition={ease}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand-subtle-fg">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {result.isScrap ? "Seu aparelho ainda tem valor" : "Avaliação concluída"}
              </span>
            </motion.div>

            {/* Card de valor */}
            <motion.div
              variants={scaleIn}
              transition={{ ...ease, delay: 0.1 }}
              className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-6 py-8 text-brand-fg shadow-brand"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl"
              />
              <p className="text-sm font-medium text-brand-fg/80">
                {result.isScrap
                  ? "Valor para aproveitamento de peças"
                  : "Sua proposta"}
              </p>
              <p className="mt-1 text-5xl font-extrabold tracking-tight sm:text-6xl">
                <AnimatedPrice cents={result.value} />
              </p>
              <p className="mt-2 text-sm text-brand-fg/80">{data.variant.name}</p>
            </motion.div>

            {/* Selos de confiança */}
            <motion.div
              variants={fadeUp}
              transition={ease}
              className="mt-4 grid grid-cols-3 gap-2"
            >
              {[
                { t: "Pagamento", s: "à vista" },
                { t: "Resposta", s: "na hora" },
                { t: "Sem", s: "compromisso" },
              ].map((b) => (
                <div
                  key={b.t}
                  className="rounded-xl border border-border bg-surface px-2 py-3 text-center"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className="mx-auto mb-1 h-4 w-4 text-brand"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L9 11.6l6.3-6.3a1 1 0 0 1 1.4 0z" />
                  </svg>
                  <p className="text-xs font-semibold leading-tight">{b.t}</p>
                  <p className="text-[11px] leading-tight text-muted">{b.s}</p>
                </div>
              ))}
            </motion.div>

            {result.isScrap && (
              <motion.p variants={fadeUp} transition={ease} className="mt-4 text-sm text-muted">
                Seu aparelho pode ser vendido para retirada e reaproveitamento
                de peças. Por isso, a proposta tem valor reduzido em relação a
                um aparelho funcionando normalmente.
              </motion.p>
            )}
            {data.variant.manualReview && (
              <motion.p
                variants={fadeUp}
                transition={ease}
                className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700"
              >
                Este valor é uma estimativa inicial. A oferta final será
                confirmada após análise de fotos, autenticidade, raridade e
                conservação.
              </motion.p>
            )}

            {/* Breakdown */}
            <motion.div
              variants={fadeUp}
              transition={ease}
              className="mt-6 overflow-hidden rounded-xl border border-border bg-surface text-left text-sm"
            >
              <div className="border-b border-border px-4 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Como chegamos nesse valor
                </span>
              </div>
              {result.breakdown.map((b, i) => (
                <div
                  key={i}
                  className={`flex justify-between px-4 py-2.5 ${
                    i < result.breakdown.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className={b.type === "base" ? "font-medium" : "text-muted"}>
                    {b.label}
                  </span>
                  <span className={b.amount < 0 ? "text-red-500" : ""}>
                    {(b.amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Ponto de coleta + envio */}
            <motion.div
              variants={fadeUp}
              transition={ease}
              className="mt-6 rounded-2xl border border-border bg-surface p-5 text-left shadow-sm"
            >
              <p className="text-base font-semibold">Onde você quer entregar?</p>
              <p className="mb-4 mt-0.5 text-sm text-muted">
                Escolha um ponto de coleta para combinarmos pelo WhatsApp.
              </p>

              <div className="space-y-3">
                {/* Coleta a domicílio — destaque */}
                <button
                  type="button"
                  onClick={() => setPickupId("domicilio")}
                  className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    pickupId === "domicilio"
                      ? "border-brand bg-brand-subtle text-brand-subtle-fg shadow-sm shadow-brand/20"
                      : "border-brand/40 bg-brand-subtle/30 hover:border-brand"
                  }`}
                >
                  <span className="text-lg leading-none">🚚</span>
                  <span>
                    <span className="block text-sm font-semibold leading-tight">
                      Coleta a domicílio · grátis
                    </span>
                    <span className="block text-xs text-muted">
                      Vamos até você e o pagamento é na hora.
                    </span>
                  </span>
                </button>

                {Array.from(new Set(PICKUP_POINTS.filter((p) => p.id !== "correios" && p.id !== "domicilio").map((p) => p.region))).map((region) => (
                  <div key={region}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {region}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {PICKUP_POINTS.filter((p) => p.id !== "correios" && p.id !== "domicilio" && p.region === region).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPickupId(p.id)}
                          className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                            pickupId === p.id
                              ? "border-brand bg-brand-subtle text-brand-subtle-fg shadow-sm shadow-brand/20"
                              : "border-border bg-surface hover:border-brand"
                          }`}
                        >
                          <span className="block font-medium leading-tight">{p.name}</span>
                          <span className="block text-xs text-muted">{p.city}/{p.uf}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setPickupId("correios")}
                  className={`block w-full rounded-xl border border-dashed px-3 py-2.5 text-left text-sm transition ${
                    pickupId === "correios"
                      ? "border-brand bg-brand-subtle text-brand-subtle-fg"
                      : "border-border bg-surface hover:border-brand"
                  }`}
                >
                  <span className="block font-medium leading-tight">
                    Sem ponto de coleta próximo?
                  </span>
                  <span className="block text-xs text-muted">
                    Clique para enviar pelos Correios
                  </span>
                </button>
              </div>

              <AnimatePresence>
                {pickupId === "correios" && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 overflow-hidden rounded-xl border border-brand/30 bg-brand-subtle/40 px-3 py-2.5 text-[13px] leading-relaxed text-brand-subtle-fg"
                  >
                    📦 Sem problema! Você envia com segurança pelos Correios.
                    Combinamos o endereço e a etiqueta pelo WhatsApp, e o pagamento
                    é liberado assim que recebermos e conferirmos o aparelho.
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={pickupId ? { scale: 1.02 } : undefined}
                whileTap={pickupId ? { scale: 0.97 } : undefined}
                disabled={!pickupId || sending}
                onClick={sendWhatsApp}
                className="group mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Abrindo WhatsApp...
                  </>
                ) : (
                  <>
                    Enviar no WhatsApp
                    <span className="transition group-hover:translate-x-0.5">→</span>
                  </>
                )}
              </motion.button>

              <Link
                href="/coleta-passo-a-passo"
                className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-brand transition hover:underline"
              >
                📋 Como preparar seu aparelho para a coleta
              </Link>
              <Link
                href="/"
                className="mt-3 block text-center text-sm text-muted transition hover:text-brand"
              >
                Avaliar outro aparelho
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </PublicShell>
    );
  }

  // ── Contato (antes de revelar o valor) ────────────────────────────────────
  if (phase === "contact") {
    const inputBase =
      "w-full rounded-xl border bg-surface px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10";
    return (
      <PublicShell>
        <div className="mx-auto max-w-md px-6 py-14">
          <motion.div initial="initial" animate="animate" variants={stagger(0.06)}>
            <motion.div variants={fadeUp} transition={ease}>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand-subtle-fg">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Quase lá!
              </span>
              <h1 className="mt-3 text-2xl font-bold tracking-tight">
                Sua avaliação está pronta
              </h1>
              <p className="mt-1 text-sm text-muted">
                Informe seu nome e WhatsApp para ver o valor e finalizar a venda
                de {data.variant.name}.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} transition={ease} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nome completo</label>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className={`${inputBase} ${contactErr.name ? "border-red-400" : "border-border"}`}
                />
                {contactErr.name && (
                  <p className="mt-1 text-xs text-red-500">{contactErr.name}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">WhatsApp</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={`${inputBase} ${contactErr.whatsapp ? "border-red-400" : "border-border"}`}
                />
                {contactErr.whatsapp && (
                  <p className="mt-1 text-xs text-red-500">{contactErr.whatsapp}</p>
                )}
              </div>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                onClick={submitLead}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Calculando...
                  </>
                ) : (
                  <>
                    Ver minha avaliação
                    <span className="transition group-hover:translate-x-0.5">→</span>
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => { setPhase("form"); setError(null); }}
                className="block w-full text-center text-sm text-muted transition hover:text-brand"
              >
                ← Voltar
              </button>
              <p className="text-center text-[11px] text-muted">
                🔒 Usamos seu contato apenas para enviar a proposta. Sem spam.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </PublicShell>
    );
  }

  // ── Formulário de avaliação ───────────────────────────────────────────────
  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-6 py-10">

        {/* Progress bar */}
        <div className="mb-8 space-y-1.5">
          <div className="flex justify-between text-xs text-muted">
            <span>{data.variant.name}</span>
            <span>{progress}% respondido</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </div>
        </div>

        {/* Bloco 1 — Knockout */}
        <motion.section
          initial="initial"
          animate="animate"
          variants={stagger(0.06)}
          className="space-y-3"
        >
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
            Condições gerais
          </h2>
          {data.knockout.map((k) => (
            <motion.div
              key={k.id}
              variants={fadeUp}
              transition={ease}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3.5"
            >
              <div className="flex-1">
                <p className="text-sm font-medium leading-snug">{k.question}</p>
                {k.helpText && (
                  <p className="mt-0.5 text-xs text-muted">{k.helpText}</p>
                )}
              </div>
              <Toggle
                label={k.question}
                value={knockoutA[k.id] ?? null}
                onChange={(a) => setKnockoutA((s) => ({ ...s, [k.id]: a }))}
              />
            </motion.div>
          ))}
        </motion.section>

        {/* Scrap warning */}
        <AnimatePresence>
          {scrapTriggered && (
            <motion.div
              key="scrap-warning"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={easeFast}
              className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4"
            >
              <p className="text-sm font-semibold text-amber-700">
                Seu aparelho ainda pode ser vendido
              </p>
              <p className="mt-1 text-sm text-amber-600">
                Pelas respostas, ele poderá ser comprado para retirada e
                reaproveitamento de peças. Nesse caso, a proposta terá um valor
                reduzido em relação a um aparelho funcionando normalmente.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Blocos 2 + 3 — só aparecem se não for sucata */}
        <AnimatePresence>
          {!scrapTriggered && (
            <motion.div
              key="detailed-blocks"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={ease}
            >
              {/* Bloco 2 — Estado */}
              <section className="mt-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
                  Estado do aparelho
                </h2>
                <div className="space-y-2">
                  {data.conditionStates.map((c) => (
                    <ConditionCard
                      key={c.id}
                      label={c.label}
                      selected={conditionId === c.id}
                      onClick={() => setConditionId(c.id)}
                    />
                  ))}
                </div>
              </section>

              {/* Bloco 3 — Detalhados */}
              {data.detailedStates.length > 0 && (
                <motion.section
                  initial="initial"
                  animate="animate"
                  variants={stagger(0.05)}
                  className="mt-8 space-y-3"
                >
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
                    Detalhes adicionais
                  </h2>
                  {data.detailedStates.map((d) => (
                    <motion.div
                      key={d.id}
                      variants={fadeUp}
                      transition={ease}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3.5"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-snug">{d.question}</p>
                        {d.helpText && (
                          <p className="mt-0.5 text-xs text-muted">{d.helpText}</p>
                        )}
                      </div>
                      <Toggle
                        label={d.question}
                        value={detailedA[d.id] ?? null}
                        onChange={(a) => setDetailedA((s) => ({ ...s, [d.id]: a }))}
                      />
                    </motion.div>
                  ))}
                </motion.section>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* CTA */}
        <AnimatePresence>
          {canSubmit && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={ease}
              className="mt-8"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={goToContact}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark"
              >
                Ver minha avaliação
                <span className="transition group-hover:translate-x-0.5">→</span>
              </motion.button>
              <p className="mt-2 text-center text-xs text-muted">
                Avaliação grátis e sem compromisso.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicShell>
  );
}
