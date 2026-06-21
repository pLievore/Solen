"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiPost } from "@/lib/api";
import { PICKUP_POINTS, type PickupPointId } from "@vendy/shared";
import PublicShell from "@/components/PublicShell";
import { fadeUp, scaleIn, stagger, ease } from "@/components/motion";
import { track } from "@/lib/analytics";

// ── Types ────────────────────────────────────────────────────────────────────

type StoredQuote = {
  variantId: string;
  variantName: string;
  conditionStateId?: string;
  knockoutAnswers: { questionId: string; answer: "YES" | "NO" }[];
  detailedAnswers: { questionId: string; answer: "YES" | "NO" }[];
  value: number;
  valueFormatted: string;
  isScrap: boolean;
  breakdown: { type: string; label: string; amount: number }[];
};

type ViaCepResult = {
  logradouro: string;
  bairro: string;
  localidade: string;
  erro?: boolean;
};

const STORAGE_KEY = "vendy_quote";

// ── Input component ──────────────────────────────────────────────────────────
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-1 text-xs text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border bg-surface px-4 py-3 text-sm outline-none transition-all duration-150 focus:border-brand focus:ring-2 focus:ring-brand/10";
const inputOk = "border-border";
const inputErr = "border-red-400 focus:border-red-400 focus:ring-red-400/10";

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function PropostaPage() {
  const router = useRouter();
  const [quote, setQuote] = useState<StoredQuote | null>(null);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cep, setCep] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");

  const [cepLoading, setCepLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fluxo em duas etapas: dados -> ponto de coleta ("quase lá") -> WhatsApp.
  const [phase, setPhase] = useState<"form" | "pickup">("form");
  const [pickupId, setPickupId] = useState<PickupPointId | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) { router.replace("/"); return; }
      setQuote(JSON.parse(raw) as StoredQuote);
    } catch {
      router.replace("/");
    }
  }, [router]);

  // ViaCEP auto-fill
  const lastCep = useRef("");
  async function handleCepBlur() {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8 || cleaned === lastCep.current) return;
    lastCep.current = cleaned;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data: ViaCepResult = await res.json();
      if (data.erro) {
        setErrors((e) => ({ ...e, cep: "CEP não encontrado" }));
      } else {
        setCity(data.localidade);
        setNeighborhood(data.bairro);
        setStreet(data.logradouro);
        setErrors((e) => { const n = { ...e }; delete n.cep; return n; });
      }
    } catch { /* non-critical */ } finally {
      setCepLoading(false);
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Informe seu nome completo";
    if (!/^[\d\s()+\-]{10,}$/.test(whatsapp)) errs.whatsapp = "WhatsApp inválido";
    if (!/^\d{5}-?\d{3}$/.test(cep)) errs.cep = "CEP inválido";
    if (!city.trim()) errs.city = "Informe a cidade";
    if (!neighborhood.trim()) errs.neighborhood = "Informe o bairro";
    if (!street.trim()) errs.street = "Informe a rua";
    if (!number.trim()) errs.number = "Informe o número";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goToPickup(e: React.FormEvent) {
    e.preventDefault();
    if (!quote || !validate()) return;
    setSubmitError(null);
    setPhase("pickup");
    track("pickup_step_viewed", {
      variant_id: quote.variantId,
      value: quote.value / 100,
      is_scrap: quote.isScrap,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSend() {
    if (!quote || !pickupId) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const response = await apiPost<{ token: string; whatsappUrl: string }>("/proposals", {
        quote: {
          variantId: quote.variantId,
          conditionStateId: quote.conditionStateId,
          knockoutAnswers: quote.knockoutAnswers,
          detailedAnswers: quote.detailedAnswers,
        },
        seller: {
          name: name.trim(),
          whatsapp: whatsapp.trim(),
          cep: cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2"),
          city: city.trim(),
          neighborhood: neighborhood.trim(),
          street: street.trim(),
          number: number.trim(),
        },
        pickupPointId: pickupId,
      });
      sessionStorage.removeItem(STORAGE_KEY);
      track("proposal_created", {
        variant_id: quote.variantId,
        pickup_point: pickupId,
        value: quote.value / 100,
        is_scrap: quote.isScrap,
      });
      track("whatsapp_redirect", {
        pickup_point: pickupId,
      });
      window.location.href = response.whatsappUrl;
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      setSubmitError(
        status === 429
          ? "Muitas tentativas. Aguarde e tente novamente."
          : "Não foi possível enviar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!quote) return null;

  const stations = PICKUP_POINTS.filter((p) => p.id !== "correios");
  const regions = Array.from(new Set(stations.map((s) => s.region)));

  return (
    <PublicShell>
      <div className="mx-auto max-w-lg px-6 py-12">
        <motion.div initial="initial" animate="animate" variants={stagger(0.07)}>

          {/* Value card */}
          <motion.div
            variants={fadeUp}
            transition={ease}
            className="rounded-2xl border border-border bg-surface p-6 text-center shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              {quote.isScrap
                ? "Proposta para aproveitamento de peças"
                : "Sua proposta"}
            </p>
            <p className="mt-0.5 text-sm text-muted">{quote.variantName}</p>
            <p className="my-3 text-5xl font-bold tracking-tight text-brand">
              {quote.valueFormatted}
            </p>
            <div className="space-y-0.5 text-xs text-muted">
              {quote.breakdown.map((b, i) => (
                <div key={i} className="flex justify-between">
                  <span>{b.label}</span>
                  <span>
                    {(b.amount / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {phase === "form" && (
          <>
          {/* Form */}
          <motion.div variants={fadeUp} transition={ease} className="mt-8">
            <h1 className="text-xl font-bold">Seus dados para contato</h1>
            <p className="mt-1 text-sm text-muted">
              Falta pouco! Preencha seus dados para combinarmos a entrega.
            </p>
          </motion.div>

          <form onSubmit={goToPickup} noValidate>
            <motion.div variants={fadeUp} transition={ease} className="mt-6 space-y-4">

              <Field id="seller-name" label="Nome completo" error={errors.name}>
                <input
                  id="seller-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
                />
              </Field>

              <Field id="seller-whatsapp" label="WhatsApp" error={errors.whatsapp}>
                <input
                  id="seller-whatsapp"
                  type="tel"
                  autoComplete="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={`${inputBase} ${errors.whatsapp ? inputErr : inputOk}`}
                />
              </Field>

              <Field id="seller-cep" label="CEP" error={errors.cep}>
                <div className="relative">
                  <input
                    id="seller-cep"
                    type="text"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    className={`${inputBase} ${errors.cep ? inputErr : inputOk} pr-20`}
                  />
                  {cepLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                      buscando…
                    </span>
                  )}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field id="seller-city" label="Cidade" error={errors.city}>
                  <input
                    id="seller-city"
                    type="text"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className={`${inputBase} ${errors.city ? inputErr : inputOk}`}
                  />
                </Field>
                <Field id="seller-neighborhood" label="Bairro" error={errors.neighborhood}>
                  <input
                    id="seller-neighborhood"
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Centro"
                    className={`${inputBase} ${errors.neighborhood ? inputErr : inputOk}`}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field id="seller-street" label="Rua" error={errors.street}>
                    <input
                      id="seller-street"
                      type="text"
                      autoComplete="address-line1"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Av. Paulista"
                      className={`${inputBase} ${errors.street ? inputErr : inputOk}`}
                    />
                  </Field>
                </div>
                <Field id="seller-number" label="Nº" error={errors.number}>
                  <input
                    id="seller-number"
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="100"
                    className={`${inputBase} ${errors.number ? inputErr : inputOk}`}
                  />
                </Field>
              </div>
            </motion.div>

            <AnimatePresence>
              {submitError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                  {submitError}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div variants={fadeUp} transition={ease} className="mt-6">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark"
              >
                Continuar
                <span className="transition group-hover:translate-x-0.5">→</span>
              </motion.button>
              <p className="mt-3 text-center text-xs leading-relaxed text-muted">
                Ao continuar, seus dados serão usados para calcular a proposta,
                entrar em contato e organizar a entrega. Consulte nossa{" "}
                <Link
                  href="/privacidade"
                  target="_blank"
                  className="underline hover:text-brand"
                >
                  Política de Privacidade
                </Link>
                .
              </p>
            </motion.div>
          </form>
          </>
          )}

          {/* Etapa 2 — ponto de coleta ("quase lá") */}
          {phase === "pickup" && (
            <motion.div
              key="pickup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={ease}
              className="mt-8"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand-subtle-fg">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Quase lá!
              </span>
              <h1 className="mt-3 text-xl font-bold">
                Onde você quer entregar o aparelho?
              </h1>
              <p className="mt-1 text-sm text-muted">
                Escolha um ponto de coleta. Conferimos o aparelho na hora e o
                pagamento é liberado na mesma visita.
              </p>

              <div className="mt-6 space-y-5">
                {regions.map((region) => (
                  <div key={region}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">
                      {region}
                    </p>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {stations
                        .filter((s) => s.region === region)
                        .map((s) => {
                          const selected = pickupId === s.id;
                          return (
                            <motion.button
                              key={s.id}
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setPickupId(s.id)}
                              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${
                                selected
                                  ? "border-brand bg-brand-subtle shadow-sm shadow-brand/20"
                                  : "border-border bg-surface hover:border-brand hover:shadow-sm"
                              }`}
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                  selected
                                    ? "bg-brand text-brand-fg"
                                    : "bg-surface-2 text-brand"
                                }`}
                              >
                                <PinIcon />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold leading-tight">
                                  {s.name}
                                </span>
                                <span className="block text-xs text-muted">
                                  {s.city}/{s.uf}
                                </span>
                              </span>
                            </motion.button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sem ponto próximo -> Correios */}
              <button
                type="button"
                onClick={() => setPickupId("correios")}
                className={`mt-4 flex w-full items-center gap-3 rounded-xl border border-dashed px-4 py-3.5 text-left transition-all ${
                  pickupId === "correios"
                    ? "border-brand bg-brand-subtle"
                    : "border-border bg-surface hover:border-brand"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    pickupId === "correios"
                      ? "bg-brand text-brand-fg"
                      : "bg-surface-2 text-brand"
                  }`}
                >
                  <BoxIcon />
                </span>
                <span>
                  <span className="block text-sm font-semibold leading-tight">
                    Sem ponto de coleta próximo?
                  </span>
                  <span className="block text-xs text-muted">
                    Clique aqui para enviar pelos Correios
                  </span>
                </span>
              </button>

              <AnimatePresence>
                {pickupId === "correios" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-xl border border-brand/30 bg-brand-subtle/50 px-4 py-3.5 text-brand-subtle-fg">
                      <p className="text-sm font-semibold">📦 Envio pelos Correios</p>
                      <p className="mt-1 text-[13px] leading-relaxed">
                        Sem problema! Você envia com segurança pelos Correios.
                        Combinamos o endereço e a etiqueta de postagem pelo
                        WhatsApp, e o pagamento é liberado assim que recebermos e
                        conferirmos o aparelho.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Selo de credibilidade */}
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 text-brand" fill="currentColor" aria-hidden>
                  <path d="M10 1.5 3 4.2v4.3c0 4 2.8 7.7 7 8.9 4.2-1.2 7-4.9 7-8.9V4.2L10 1.5zm-1 11L5.8 9.3l1.2-1.2L9 10.1l4-4 1.2 1.2L9 12.5z" />
                </svg>
                Conferência na hora · pagamento à vista · sem compromisso
              </p>

              {submitError && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {submitError}
                </p>
              )}

              <div className="mt-6 space-y-3">
                <motion.button
                  type="button"
                  disabled={!pickupId || loading}
                  whileHover={pickupId ? { scale: 1.02 } : undefined}
                  whileTap={pickupId ? { scale: 0.97 } : undefined}
                  onClick={handleSend}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Ir para o WhatsApp
                      <span className="transition group-hover:translate-x-0.5">→</span>
                    </>
                  )}
                </motion.button>
                <button
                  type="button"
                  onClick={() => setPhase("form")}
                  className="block w-full text-center text-sm text-muted transition hover:text-brand"
                >
                  ← Voltar e editar meus dados
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PublicShell>
  );
}
