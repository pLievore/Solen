import type { Metadata } from "next";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Passo a passo para a coleta do seu aparelho",
  description:
    "Prepare seu iPhone para uma coleta rápida e segura: remova o iCloud, formate e inicie o aparelho sem senha. Guia completo da Vendy.",
  alternates: { canonical: "/coleta-passo-a-passo" },
  robots: { index: true, follow: true },
};

const SETUP_STEPS = [
  "Escolha o idioma e o país/região.",
  "Toque em Configurar Manualmente.",
  "Conecte no Wi-Fi.",
  "Aguarde a ativação.",
  "Ao chegar no Face ID / Touch ID, toque em Configurar Depois.",
  "Na tela de código de desbloqueio, entre em Opções e escolha Não usar código.",
];

const FINAL_STEPS = [
  {
    title: "Apps e Dados",
    text: "Escolha Não Transferir Apps e Dados.",
  },
  {
    title: "Apple ID",
    text: "Toque em “Esqueceu a senha ou não tem um Apple ID?”, depois escolha “Configurar mais tarde em Ajustes” e confirme em “Não Usar”.",
  },
  {
    title: "Termos e finalização",
    text: "Aceite os termos e finalize as telas de Siri, Tempo de Uso, Análise etc.",
  },
];

export default function ColetaPassoAPassoPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-6 py-14">
        {/* Hero */}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-subtle px-3 py-1 text-xs font-medium text-brand-subtle-fg">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Guia de coleta
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Passo a passo para a coleta do seu aparelho
        </h1>
        <p className="mt-3 text-base text-muted">
          Para a coleta ser rápida e o aparelho ser conferido na hora da retirada,
          siga este passo a passo antes do nosso encontro.
        </p>

        {/* Antes de começar */}
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-amber-800">
            <span className="text-lg">⚠️</span> Antes de começar
          </h2>
          <p className="mt-1.5 text-sm text-amber-700">
            Remova o iCloud e formate o aparelho. Ele deve ser iniciado{" "}
            <strong>sem iCloud conectado</strong> e{" "}
            <strong>sem senha de desbloqueio</strong>.
          </p>
        </div>

        {/* Passos de configuração */}
        <section className="mt-10">
          <h2 className="text-lg font-bold">Inicie o aparelho assim</h2>
          <ol className="mt-4 space-y-3">
            {SETUP_STEPS.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-fg">
                  {i + 1}
                </span>
                <p className="pt-1 text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Telas finais */}
        <section className="mt-10">
          <h2 className="text-lg font-bold">Para concluir a configuração</h2>
          <div className="mt-4 space-y-3">
            {FINAL_STEPS.map((s) => (
              <div
                key={s.title}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <div className="mt-12 rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-6 text-brand-fg shadow-brand">
          <h2 className="text-lg font-bold">Tudo pronto? Falta só uma coisa 📸</h2>
          <p className="mt-1.5 text-sm text-brand-fg/90">
            Ao finalizar o processo, envie fotos do aparelho{" "}
            <strong>sem o iCloud conectado</strong> no WhatsApp do seu avaliador e
            siga as próximas instruções.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-muted transition hover:text-brand"
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </PublicShell>
  );
}
