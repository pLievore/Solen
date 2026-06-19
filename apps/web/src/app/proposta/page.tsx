"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiPost } from "@/lib/api";
import PublicShell from "@/components/PublicShell";
import { fadeUp, stagger, ease } from "@/components/motion";

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
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quote || !validate()) return;
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
      });
      sessionStorage.removeItem(STORAGE_KEY);
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
              {quote.isScrap ? "Proposta (sucata)" : "Sua proposta"}
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

          {/* Form */}
          <motion.div variants={fadeUp} transition={ease} className="mt-8">
            <h1 className="text-xl font-bold">Seus dados para contato</h1>
            <p className="mt-1 text-sm text-muted">
              Abriremos o WhatsApp com tudo preenchido. Leva menos de 1 minuto.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate>
            <motion.div variants={fadeUp} transition={ease} className="mt-6 space-y-4">

              <Field label="Nome completo" error={errors.name}>
                <input
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className={`${inputBase} ${errors.name ? inputErr : inputOk}`}
                />
              </Field>

              <Field label="WhatsApp" error={errors.whatsapp}>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className={`${inputBase} ${errors.whatsapp ? inputErr : inputOk}`}
                />
              </Field>

              <Field label="CEP" error={errors.cep}>
                <div className="relative">
                  <input
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
                <Field label="Cidade" error={errors.city}>
                  <input
                    type="text"
                    autoComplete="address-level2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                    className={`${inputBase} ${errors.city ? inputErr : inputOk}`}
                  />
                </Field>
                <Field label="Bairro" error={errors.neighborhood}>
                  <input
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
                  <Field label="Rua" error={errors.street}>
                    <input
                      type="text"
                      autoComplete="address-line1"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Av. Paulista"
                      className={`${inputBase} ${errors.street ? inputErr : inputOk}`}
                    />
                  </Field>
                </div>
                <Field label="Nº" error={errors.number}>
                  <input
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
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark disabled:opacity-60"
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
            </motion.div>
          </form>
        </motion.div>
      </div>
    </PublicShell>
  );
}
