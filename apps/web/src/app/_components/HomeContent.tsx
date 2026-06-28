"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PublicShell from "@/components/PublicShell";
import CategoryIcon from "@/components/CategoryIcon";
import { fadeUp, stagger, ease } from "@/components/motion";
import { track } from "@/lib/analytics";

type Category = { id: string; name: string; slug: string; iconUrl: string | null };

// Visual unico para todos os cards (consistencia entre categorias).
const CARD_VISUAL = {
  background: "from-slate-100 via-slate-50 to-white",
  halo: "bg-emerald-200/25",
  icon: "h-28 sm:h-32",
};

const STEPS = [
  {
    n: "01",
    title: "Selecione o aparelho",
    desc: "Escolha a categoria, modelo e versão exata do seu dispositivo.",
  },
  {
    n: "02",
    title: "Responda às perguntas",
    desc: "Diga o estado, se a tela está intacta, bateria original e outros detalhes.",
  },
  {
    n: "03",
    title: "Receba a proposta",
    desc: "Valor calculado na hora. Basta confirmar e ir direto ao WhatsApp.",
  },
];

export default function HomeContent({
  categories,
  headline,
}: {
  categories: Category[];
  headline: string;
}) {
  const highlight = "na hora";
  const highlightAt = headline.toLocaleLowerCase("pt-BR").lastIndexOf(highlight);
  const headlineStart =
    highlightAt >= 0 ? headline.slice(0, highlightAt) : headline;
  const headlineEnd =
    highlightAt >= 0 ? headline.slice(highlightAt + highlight.length) : "";

  return (
    <PublicShell>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-fg py-24 sm:py-32">
        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center, #16a34a 0%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger(0.07)}
          >
            <motion.div variants={fadeUp} transition={ease} className="mb-5 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-mark.svg"
                alt="Vendy"
                width={80}
                height={80}
                className="h-16 w-16 drop-shadow-[0_8px_24px_rgba(0,204,10,0.35)] sm:h-20 sm:w-20"
              />
            </motion.div>

            <motion.span
              variants={fadeUp}
              transition={ease}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Compra de eletrônicos usados
            </motion.span>

            <motion.h1
              variants={fadeUp}
              transition={ease}
              className="mt-2 text-5xl font-bold tracking-tight text-white sm:text-6xl"
            >
              {headlineStart}
              {highlightAt >= 0 && (
                <span className="text-brand">{highlight}</span>
              )}
              {headlineEnd}
            </motion.h1>

            <motion.p
              variants={fadeUp}
              transition={ease}
              className="mt-5 mx-auto max-w-xl text-lg text-white/60"
            >
              iPhones, iPads, Apple Watch, consoles e mais — usados, quebrados
              ou seminovos. Avaliação gratuita e proposta imediata.
            </motion.p>

            <motion.div variants={fadeUp} transition={ease} className="mt-8">
              <a
                href="#categorias"
                className="group inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark active:scale-95"
              >
                Começar avaliação
                <span className="transition group-hover:translate-x-0.5">→</span>
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Categorias ───────────────────────────────────────────── */}
      <section
        id="categorias"
        className="relative scroll-mt-16 overflow-hidden border-b border-border/60 bg-gradient-to-b from-bg via-surface/40 to-bg py-20"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-brand/5 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={ease}
          className="mx-auto mb-10 max-w-xl text-center"
        >
          <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand-subtle px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand-subtle-fg">
            Avaliação rápida
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            O que você quer vender?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Escolha uma categoria e descubra quanto seu item pode valer.
          </p>
        </motion.div>

        {categories.length === 0 ? (
          <p className="text-center text-muted">Catálogo indisponível no momento.</p>
        ) : (
          <motion.div
            className="flex flex-wrap justify-center gap-4 sm:gap-5"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger(0.05)}
          >
            {categories.map((c) => {
              const visual = CARD_VISUAL;
              return (
              <motion.div
                key={c.id}
                variants={fadeUp}
                transition={ease}
                className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.875rem)] lg:w-[calc(25%-0.95rem)]"
              >
                <Link
                  href={`/vender/${c.slug}`}
                  onClick={() =>
                    track("category_selected", {
                      category: c.slug,
                      category_name: c.name,
                    })
                  }
                  className="group flex h-full min-h-[220px] flex-col items-center overflow-hidden rounded-2xl border border-border/80 bg-bg shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/70 hover:shadow-[0_16px_40px_rgba(22,163,74,0.14)] active:scale-[0.98]"
                >
                  {/* Device illustration area */}
                  <div
                    className={`relative flex min-h-[160px] w-full flex-1 items-center justify-center overflow-hidden bg-gradient-to-b ${visual.background} px-4 pb-4 pt-7`}
                  >
                    <div
                      aria-hidden
                      className={`absolute h-32 w-32 rounded-full ${visual.halo} blur-2xl transition duration-500 group-hover:scale-125`}
                    />
                    <div
                      aria-hidden
                      className="absolute bottom-5 h-5 w-28 rounded-[100%] bg-slate-900/10 blur-md transition duration-300 group-hover:w-32 group-hover:bg-brand/15"
                    />
                    {c.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.iconUrl}
                        alt=""
                        className={`relative w-auto max-w-[86%] object-contain drop-shadow-xl transition duration-500 group-hover:-translate-y-1 group-hover:scale-110 ${visual.icon}`}
                      />
                    ) : (
                      <CategoryIcon
                        slug={c.slug}
                        className={`relative w-auto max-w-[86%] drop-shadow-xl transition duration-500 group-hover:-translate-y-1 group-hover:scale-110 ${visual.icon}`}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className="w-full border-t border-border/70 px-3 py-4 text-center">
                    <span className="text-sm font-semibold tracking-tight transition-colors duration-200 group-hover:text-brand">
                      {c.name}
                    </span>
                    <p className="mt-1 text-xs font-medium text-muted transition-colors group-hover:text-brand">
                      Avaliar agora{" "}
                      <span className="inline-block transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </p>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </motion.div>
        )}
        </div>
      </section>

      {/* ── Como funciona ────────────────────────────────────────── */}
      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-4xl px-6">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={ease}
            className="mb-10 text-center text-2xl font-bold"
          >
            Como funciona
          </motion.h2>

          <motion.div
            className="grid gap-6 sm:grid-cols-3"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger(0.1)}
          >
            {STEPS.map((s) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                transition={ease}
                className="flex flex-col gap-3 rounded-xl border border-border bg-bg p-6 shadow-sm"
              >
                <span className="text-3xl font-bold text-brand/30">{s.n}</span>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </PublicShell>
  );
}
