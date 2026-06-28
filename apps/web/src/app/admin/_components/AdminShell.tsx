"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { adminApi } from "@/lib/admin-api";

type Role = { key: string; label: string; isAdmin: boolean; pages: string[] };
type NavItem = { href: string; label: string };
type NavGroup = { title: string; items: NavItem[] };

// Cada prefixo de rota do painel mapeia para uma "página" de permissão.
const PAGE_BY_HREF: [string, string][] = [
  ["/admin/proposals", "propostas"],
  ["/admin/categories", "catalogo"],
  ["/admin/models", "catalogo"],
  ["/admin/variants", "catalogo"],
  ["/admin/import", "catalogo"],
  ["/admin/detailed-states", "regras"],
  ["/admin/descontos", "regras"],
  ["/admin/knockout", "regras"],
  ["/admin/blog", "blog"],
  ["/admin/assistencia", "assistencia"],
  ["/admin/permissoes", "permissoes"],
  ["/admin/settings", "settings"],
  ["/admin", "dashboard"],
];

function pageForPath(pathname: string): string {
  for (const [prefix, page] of PAGE_BY_HREF) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return page;
  }
  return "dashboard";
}

function canAccess(role: Role | null, pathname: string): boolean {
  // Papel ainda desconhecido (carregando/erro): não bloqueia — a segurança real
  // está no backend; o gating do front é só de UX.
  if (!role) return true;
  if (role.isAdmin) return true;
  const page = pageForPath(pathname);
  if (page === "permissoes") return false; // gestão de permissões é só do admin
  return role.pages.includes(page);
}

const NAV: NavGroup[] = [
  {
    title: "Operação",
    items: [
      { href: "/admin", label: "Visão geral" },
      { href: "/admin/proposals", label: "Propostas" },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/categories", label: "Categorias" },
      { href: "/admin/models", label: "Modelos" },
      { href: "/admin/variants", label: "Versões" },
      { href: "/admin/import", label: "Importar planilha" },
    ],
  },
  {
    title: "Regras de preço",
    items: [
      { href: "/admin/detailed-states", label: "Estados detalhados" },
      { href: "/admin/descontos", label: "Descontos por modelo" },
      { href: "/admin/knockout", label: "Perguntas knockout" },
    ],
  },
  {
    title: "Conteúdo",
    items: [{ href: "/admin/blog", label: "Blog" }],
  },
  {
    title: "Assistência",
    items: [{ href: "/admin/assistencia", label: "Assistência técnica" }],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/permissoes", label: "Permissões" },
      { href: "/admin/settings", label: "Configurações" },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (isLogin) {
      setReady(true);
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        router.replace("/admin/login");
        return;
      }
      setEmail(data.session.user.email ?? null);
      try {
        const me = await adminApi.get<{ role: Role }>("/admin/me");
        if (!active) return;
        setRole(me.role);
        // Não-admin que cai numa página sem permissão vai para a 1ª página acessível.
        if (!me.role.isAdmin && !canAccess(me.role, pathname)) {
          const landing = ALL_ITEMS.find((i) => canAccess(me.role, i.href));
          if (landing) router.replace(landing.href);
        }
      } catch {
        if (active) setRole(null);
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [isLogin, router, pathname]);

  if (isLogin) return <>{children}</>;

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        Carregando...
      </main>
    );
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const current =
    [...ALL_ITEMS]
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) => isActive(i.href))?.label ?? "Painel";

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-fg">
            V
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold">Vendy</p>
            <p className="text-[11px] text-muted">Painel administrativo</p>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {NAV.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-brand text-brand-fg shadow-sm"
                          : "text-fg hover:bg-border/40"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? "bg-brand-fg" : "bg-border"
                        }`}
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border px-4 py-3 text-xs text-muted">
          <p className="mb-2 break-all">{email}</p>
          <button
            onClick={signOut}
            className="w-full rounded-lg border border-border px-3 py-1.5 transition hover:border-brand hover:text-fg"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Painel</span>
            <span className="text-muted">/</span>
            <span className="font-medium">{current}</span>
          </div>
          {/* Nav compacta no mobile */}
          <div className="md:hidden">
            <select
              value={
                [...ALL_ITEMS]
                  .sort((a, b) => b.href.length - a.href.length)
                  .find((i) => isActive(i.href))?.href ?? "/admin"
              }
              onChange={(e) => router.push(e.target.value)}
              className="rounded-lg border border-border bg-bg px-2 py-1 text-sm"
            >
              {NAV.flatMap((g) =>
                g.items.map((i) => (
                  <option key={i.href} value={i.href}>
                    {i.label}
                  </option>
                )),
              )}
            </select>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {canAccess(role, pathname) ? (
            children
          ) : (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <p className="text-4xl">🔒</p>
              <h2 className="mt-3 text-lg font-semibold">
                Seu perfil não tem permissão
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Esta página é restrita ao seu perfil. Fale com um administrador
                se precisar de acesso.
              </p>
              {role &&
                !role.isAdmin &&
                (() => {
                  const landing = ALL_ITEMS.find((i) => canAccess(role, i.href));
                  return landing ? (
                    <Link
                      href={landing.href}
                      className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition hover:bg-brand-dark"
                    >
                      Ir para {landing.label} →
                    </Link>
                  ) : null;
                })()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
