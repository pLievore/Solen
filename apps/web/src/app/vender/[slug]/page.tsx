"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiGet } from "@/lib/api";
import PublicShell from "@/components/PublicShell";
import CategoryIcon from "@/components/CategoryIcon";
import { fadeUp, scaleIn, stagger, ease, easeFast } from "@/components/motion";

type Model = { id: string; name: string; slug: string };
type Variant = { id: string; name: string; storage: string | null };

export default function SelectPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [modelId, setModelId] = useState<string | null>(null);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);

  useEffect(() => {
    apiGet<Model[]>(`/catalog/categories/${slug}/models`)
      .then(setModels)
      .catch(() => setError("Não foi possível carregar os modelos."));
  }, [slug]);

  async function pickModel(id: string) {
    setModelId(id);
    setVariantId(null);
    setVariants([]);
    setLoadingVariants(true);
    try {
      const v = await apiGet<Variant[]>(`/catalog/models/${id}/variants`);
      setVariants(v);
    } catch {
      setError("Não foi possível carregar as versões.");
    } finally {
      setLoadingVariants(false);
    }
  }

  const step = variantId ? 3 : modelId ? 2 : 1;

  return (
    <PublicShell>
      <div className="mx-auto max-w-2xl px-6 py-12">

        {/* Step progress */}
        <div className="mb-10 flex items-center gap-2">
          {["Modelo", "Versão", "Avaliar"].map((label, i) => {
            const idx = i + 1;
            const active = idx === step;
            const done = idx < step;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={`h-px w-8 transition-colors duration-300 ${done ? "bg-brand" : "bg-border"}`} />
                )}
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-300 ${
                  active ? "bg-brand text-brand-fg shadow-brand" :
                  done ? "bg-brand-subtle text-brand-subtle-fg" :
                  "bg-surface text-muted"
                }`}>
                  <span>{done ? "✓" : idx}</span>
                  <span>{label}</span>
                </div>
              </div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={ease}
          className="flex items-center gap-5 rounded-2xl border border-border bg-gradient-to-br from-surface-2 to-surface p-5 shadow-sm"
        >
          {/* Device illustration */}
          <div className="shrink-0">
            <CategoryIcon slug={slug} className="h-20 w-auto drop-shadow-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Selecione seu aparelho</h1>
            <p className="mt-1 text-sm text-muted">
              Escolha o modelo e versão para receber sua proposta.
            </p>
          </div>
        </motion.div>
        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Passo 1: modelo */}
        <motion.section
          className="mt-8"
          initial="initial"
          animate="animate"
          variants={stagger(0.04)}
        >
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            Modelo
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {models.map((m) => (
              <motion.button
                key={m.id}
                variants={fadeUp}
                transition={ease}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pickModel(m.id)}
                className={`group flex flex-col items-center rounded-xl border pt-4 pb-3 px-3 text-center shadow-sm transition-all duration-200 ${
                  modelId === m.id
                    ? "border-brand bg-brand-subtle text-brand-subtle-fg shadow-brand/30"
                    : "border-border bg-surface hover:border-brand hover:shadow-md"
                }`}
              >
                <CategoryIcon
                  slug={slug}
                  className={`mb-2 h-10 w-auto transition duration-300 group-hover:scale-105 ${
                    modelId === m.id ? "opacity-100" : "opacity-60"
                  }`}
                />
                <span className="text-xs font-semibold leading-tight">{m.name}</span>
              </motion.button>
            ))}
            {models.length === 0 && !error && (
              <div className="col-span-3 flex gap-2 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 flex-1 animate-pulse rounded-xl bg-surface" />
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* Passo 2: versão */}
        <AnimatePresence>
          {modelId && (
            <motion.section
              key="variants"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={ease}
              className="mt-8"
            >
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
                Versão
              </h2>
              {loadingVariants ? (
                <div className="flex gap-2.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 flex-1 animate-pulse rounded-xl bg-surface" />
                  ))}
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
                  initial="initial"
                  animate="animate"
                  variants={stagger(0.04)}
                >
                  {variants.map((v) => (
                    <motion.button
                      key={v.id}
                      variants={scaleIn}
                      transition={easeFast}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setVariantId(v.id)}
                      className={`rounded-xl border px-4 py-3.5 text-sm font-medium text-left shadow-sm transition-all duration-200 ${
                        variantId === v.id
                          ? "border-brand bg-brand-subtle text-brand-subtle-fg shadow-brand/30"
                          : "border-border bg-surface hover:border-brand hover:shadow-md"
                      }`}
                    >
                      {v.name}
                    </motion.button>
                  ))}
                  {variants.length === 0 && (
                    <p className="col-span-3 text-sm text-muted">Sem versões cadastradas.</p>
                  )}
                </motion.div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* CTA */}
        <AnimatePresence>
          {variantId && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={ease}
              className="mt-10"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/avaliacao/${variantId}`)}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark"
              >
                Avaliar meu aparelho
                <span className="transition group-hover:translate-x-0.5">→</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicShell>
  );
}

