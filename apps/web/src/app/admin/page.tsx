"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { apiGetAuthed } from "@/lib/api";

type Me = { user: { id: string; email?: string } };

export default function AdminHomePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [apiCheck, setApiCheck] = useState<string>("verificando...");

  useEffect(() => {
    let active = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        router.replace("/admin/login");
        return;
      }
      if (!active) return;
      setEmail(session.user.email ?? null);

      // Prova de ponta a ponta: chama a rota protegida da API com o token.
      try {
        const me = await apiGetAuthed<Me>("/admin/me", session.access_token);
        if (active) setApiCheck(`API autenticada como ${me.user.email}`);
      } catch {
        if (active) setApiCheck("API rejeitou o token");
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (!email) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted">
        Carregando...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold">Painel</h1>
          <p className="text-sm text-muted">{email}</p>
        </div>
        <button
          onClick={signOut}
          className="rounded border border-border px-3 py-1.5 text-sm transition hover:border-brand"
        >
          Sair
        </button>
      </div>

      <div className="mt-6 space-y-3">
        <div className="rounded border border-border p-4">
          <p className="text-sm font-medium">Status da sessao</p>
          <p className="text-sm text-brand">{apiCheck}</p>
        </div>
        <p className="text-sm text-muted">
          Fase 0 — autenticacao do painel pronta. As telas de catalogo, precos e
          propostas chegam na Fase 1.
        </p>
      </div>
    </main>
  );
}
