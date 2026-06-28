"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/lib/icons";
import { cls } from "@/lib/ui";

const HIGHLIGHTS = [
  { icon: "inbox" as const, label: "Propostas e leads em um só lugar" },
  { icon: "dashboard" as const, label: "Dashboards e análises em tempo real" },
  { icon: "wrench" as const, label: "Assistência técnica com comprovações" },
];

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha inválidos.");
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Painel de marca */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-nav p-10 text-nav-fg lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #22c55e, transparent 70%)" }}
        />
        <div className="relative flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.svg" alt="" width={40} height={40} className="h-10 w-10" />
          <div className="leading-tight">
            <p className="text-base font-bold">Vendy</p>
            <p className="text-xs text-nav-muted">Painel administrativo</p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
            Gerencie avaliações, preços e a operação{" "}
            <span className="text-brand-400">em um só painel.</span>
          </h2>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((h) => {
              const IconCmp = Icon[h.icon];
              return (
                <li key={h.label} className="flex items-center gap-3 text-sm text-nav-fg/90">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-nav-2 text-brand-400 ring-1 ring-inset ring-nav-border">
                    <IconCmp size={16} />
                  </span>
                  {h.label}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs text-nav-muted">
          © {new Date().getFullYear()} Vendy · Compra de eletrônicos usados
        </p>
      </aside>

      {/* Formulário */}
      <div className="flex flex-col justify-center bg-surface px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.svg"
              alt="Vendy"
              width={44}
              height={44}
              className="mb-4 mx-auto h-11 w-11 lg:mx-0 lg:hidden"
            />
            <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
            <p className="mt-1 text-sm text-muted">
              Entre para gerenciar o catálogo e as propostas.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-border bg-bg p-6 shadow-sm">
            <div>
              <label className={cls.label} htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cls.input}
                placeholder="voce@vendy.com"
              />
            </div>
            <div>
              <label className={cls.label} htmlFor="password">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cls.input + " pr-16"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-muted transition hover:text-brand"
                >
                  {show ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {error && (
              <p className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                <Icon.ban size={16} />
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className={cls.btn + " w-full"}>
              {loading ? "Entrando…" : "Entrar no painel"}
              {!loading && <Icon.arrowRight size={16} />}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Acesso restrito à equipe Vendy.
          </p>
        </div>
      </div>
    </main>
  );
}
