"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/proposals", label: "Propostas" },
  { href: "/admin/categories", label: "Categorias" },
  { href: "/admin/models", label: "Modelos" },
  { href: "/admin/variants", label: "Versoes" },
  { href: "/admin/detailed-states", label: "Estados detalhados" },
  { href: "/admin/knockout", label: "Perguntas knockout" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/settings", label: "Configuracoes" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

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
      setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [isLogin, router]);

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

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-bg p-4">
        <div className="mb-6">
          <span className="rounded-full bg-brand px-3 py-1 text-sm font-medium text-brand-fg">
            Solen
          </span>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded px-3 py-2 text-sm transition ${
                  active
                    ? "bg-brand text-brand-fg"
                    : "hover:bg-border/50 text-fg"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 border-t border-border pt-4 text-xs text-muted">
          <p className="mb-2 break-all">{email}</p>
          <button
            onClick={signOut}
            className="rounded border border-border px-3 py-1.5 transition hover:border-brand"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
