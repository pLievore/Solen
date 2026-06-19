"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet, API_BASE_URL } from "@/lib/api";
import PublicShell from "@/components/PublicShell";
import { fadeUp, scaleIn, stagger, ease, easeFast } from "@/components/motion";

const QUOTE_STORAGE_KEY = "solen_quote";

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
function Toggle({ value, onChange }: { value: Answer | null; onChange: (a: Answer) => void }) {
  return (
    <div className="relative flex w-28 shrink-0 rounded-xl border border-border bg-surface p-0.5">
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
  const router = useRouter();
  const [data, setData] = useState<Questions | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [knockoutA, setKnockoutA] = useState<Record<string, Answer>>({});
  const [conditionId, setConditionId] = useState<string | null>(null);
  const [detailedA, setDetailedA] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);

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

  async function submit() {
    if (!data) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: id,
          conditionStateId: scrapTriggered ? undefined : conditionId,
          knockoutAnswers: Object.entries(knockoutA).map(([questionId, answer]) => ({ questionId, answer })),
          detailedAnswers: scrapTriggered
            ? []
            : Object.entries(detailedA).map(([questionId, answer]) => ({ questionId, answer })),
        }),
      });
      if (!res.ok) throw new Error("Falha no cálculo");
      setResult(await res.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
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
                {result.isScrap ? "Avaliação de sucata" : "Avaliação concluída"}
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
                {result.isScrap ? "Oferta pela sucata" : "Sua proposta"}
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
                Pelas respostas, o aparelho entra como sucata.
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

            <motion.div variants={fadeUp} transition={ease} className="mt-6 space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark"
                onClick={() => {
                  sessionStorage.setItem(
                    QUOTE_STORAGE_KEY,
                    JSON.stringify({
                      variantId: id,
                      variantName: data.variant.name,
                      conditionStateId: scrapTriggered ? undefined : conditionId,
                      knockoutAnswers: Object.entries(knockoutA).map(([questionId, answer]) => ({ questionId, answer })),
                      detailedAnswers: scrapTriggered
                        ? []
                        : Object.entries(detailedA).map(([questionId, answer]) => ({ questionId, answer })),
                      value: result.value,
                      valueFormatted: result.valueFormatted,
                      isScrap: result.isScrap,
                      breakdown: result.breakdown,
                    }),
                  );
                  router.push("/proposta");
                }}
              >
                Continuar para o WhatsApp
                <span className="transition group-hover:translate-x-0.5">→</span>
              </motion.button>

              <Link
                href="/"
                className="block text-center text-sm text-muted transition hover:text-brand"
              >
                Avaliar outro aparelho
              </Link>
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
              <p className="text-sm font-semibold text-amber-700">⚠️ Avaliação como sucata</p>
              <p className="mt-1 text-sm text-amber-600">
                Pelas respostas acima, o aparelho será avaliado como sucata. O valor será calculado com base na versão.
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
                disabled={loading}
                onClick={submit}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Calculando...
                  </>
                ) : (
                  <>
                    Ver minha proposta
                    <span className="transition group-hover:translate-x-0.5">→</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicShell>
  );
}
