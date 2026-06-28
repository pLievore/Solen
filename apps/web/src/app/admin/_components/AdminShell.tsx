"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { adminApi } from "@/lib/admin-api";
import { Icon, type IconName } from "@/lib/icons";
import { cn } from "@/lib/ui";

type Role = { key: string; label: string; isAdmin: boolean; pages: string[] };
type NavItem = { href: string; label: string; icon: IconName };
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
      { href: "/admin", label: "Visão geral", icon: "dashboard" },
      { href: "/admin/proposals", label: "Propostas", icon: "inbox" },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/categories", label: "Categorias", icon: "box" },
      { href: "/admin/models", label: "Modelos", icon: "phone" },
      { href: "/admin/variants", label: "Versões", icon: "layers" },
      { href: "/admin/import", label: "Importar planilha", icon: "upload" },
    ],
  },
  {
    title: "Regras de preço",
    items: [
      { href: "/admin/detailed-states", label: "Estados detalhados", icon: "sliders" },
      { href: "/admin/descontos", label: "Descontos por modelo", icon: "percent" },
      { href: "/admin/knockout", label: "Perguntas knockout", icon: "ban" },
    ],
  },
  {
    title: "Conteúdo",
    items: [{ href: "/admin/blog", label: "Blog", icon: "file" }],
  },
  {
    title: "Assistência",
    items: [{ href: "/admin/assistencia", label: "Assistência técnica", icon: "wrench" }],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/permissoes", label: "Permissões", icon: "shield" },
      { href: "/admin/settings", label: "Configurações", icon: "settings" },
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
  const [drawer, setDrawer] = useState(false);

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

  // Fecha o drawer ao navegar.
  useEffect(() => setDrawer(false), [pathname]);

  if (isLogin) return <>{children}</>;

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3 text-muted">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-brand" />
          <span className="text-sm">Carregando painel…</span>
        </div>
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

  const visibleGroups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => canAccess(role, i.href)),
  })).filter((g) => g.items.length > 0);

  const SidebarBody = (
    <>
      <Link href="/admin" className="flex items-center gap-2.5 px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" width={36} height={36} className="h-9 w-9" />
        <div className="leading-tight">
          <p className="text-sm font-bold text-nav-fg">Vendy</p>
          <p className="text-[11px] text-nav-muted">Painel administrativo</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        {visibleGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-nav-muted">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const IconCmp = Icon[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-nav-active text-white"
                        : "text-nav-muted hover:bg-nav-hover hover:text-nav-fg",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active-bar"
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-400"
                      />
                    )}
                    <IconCmp
                      size={18}
                      className={cn(
                        "shrink-0 transition",
                        active ? "text-brand-400" : "text-nav-muted group-hover:text-nav-fg",
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-nav-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nav-2 text-xs font-bold uppercase text-brand-400 ring-1 ring-inset ring-nav-border">
            {(email ?? "?").slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-nav-fg">{email ?? "—"}</p>
            <p className="text-[10px] text-nav-muted">{role?.label ?? "Sessão"}</p>
          </div>
          <button
            onClick={signOut}
            title="Sair"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-nav-muted transition hover:bg-nav-hover hover:text-white"
          >
            <Icon.logout size={17} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-nav md:flex">
        {SidebarBody}
      </aside>

      {/* Drawer mobile */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-nav md:hidden"
            >
              <button
                onClick={() => setDrawer(false)}
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-nav-muted hover:bg-nav-hover hover:text-white"
              >
                <Icon.close size={18} />
              </button>
              {SidebarBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDrawer(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-fg transition hover:bg-surface-2 md:hidden"
            >
              <Icon.menu size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted">Painel</span>
              <Icon.chevronRight size={14} className="text-muted/60" />
              <span className="font-semibold text-fg">{current}</span>
            </div>
          </div>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-brand hover:text-brand sm:inline-flex"
          >
            Ver site
            <Icon.external size={14} />
          </a>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            {canAccess(role, pathname) ? (
              children
            ) : (
              <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-muted">
                  <Icon.shield size={30} />
                </span>
                <h2 className="mt-4 text-lg font-semibold">Seu perfil não tem permissão</h2>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  Esta página é restrita ao seu perfil. Fale com um administrador se
                  precisar de acesso.
                </p>
                {role &&
                  !role.isAdmin &&
                  (() => {
                    const landing = ALL_ITEMS.find((i) => canAccess(role, i.href));
                    return landing ? (
                      <Link
                        href={landing.href}
                        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg transition hover:bg-brand-dark"
                      >
                        Ir para {landing.label}
                        <Icon.arrowRight size={16} />
                      </Link>
                    ) : null;
                  })()}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
