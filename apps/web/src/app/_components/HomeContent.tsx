"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PublicShell from "@/components/PublicShell";
import { fadeUp, stagger, ease } from "@/components/motion";

type Category = { id: string; name: string; slug: string; iconUrl: string | null };

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

export default function HomeContent({ categories }: { categories: Category[] }) {
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
              Venda seus usados{" "}
              <span className="text-brand">na hora</span>
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
      <section id="categorias" className="mx-auto max-w-5xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={ease}
          className="mb-8 text-center"
        >
          <h2 className="text-2xl font-bold">O que você quer vender?</h2>
          <p className="mt-1 text-muted">Escolha a categoria para começar</p>
        </motion.div>

        {categories.length === 0 ? (
          <p className="text-center text-muted">Catálogo indisponível no momento.</p>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger(0.05)}
          >
            {categories.map((c) => (
              <motion.div key={c.id} variants={fadeUp} transition={ease}>
                <Link
                  href={`/vender/${c.slug}`}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-4 py-7 text-center text-sm font-medium shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand hover:shadow-md active:scale-[0.98]"
                >
                  {c.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.iconUrl}
                      alt=""
                      className="h-12 w-12 object-contain transition group-hover:scale-110"
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-subtle text-2xl font-bold text-brand-subtle-fg transition group-hover:scale-110">
                      {c.name.charAt(0)}
                    </span>
                  )}
                  <span>{c.name}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
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
