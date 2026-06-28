"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { cls, badge } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../_components/PageHeader";

type PostRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setPosts(await adminApi.get<PostRow[]>("/admin/posts"));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id: string, title: string) {
    if (!confirm(`Excluir "${title}"?`)) return;
    try {
      await adminApi.del(`/admin/posts/${id}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        subtitle="Crie e gerencie os artigos publicados no site."
        icon={<Icon.file size={20} />}
        actions={
          <Link href="/admin/blog/new" className={cls.btn}>
            <Icon.plus size={16} />
            Novo post
          </Link>
        }
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-bg shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-surface-2/70">
              <th className={cls.th}>Título</th>
              <th className={cls.th}>Slug</th>
              <th className={cls.th}>Status</th>
              <th className={cls.th}>Publicado em</th>
              <th className={cls.th}></th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-14 text-center">
                  <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-muted">
                    <Icon.file size={22} />
                  </span>
                  <p className="text-sm font-medium">Nenhum post ainda.</p>
                  <Link
                    href="/admin/blog/new"
                    className="mt-1 inline-block text-xs font-medium text-brand hover:underline"
                  >
                    Escrever o primeiro
                  </Link>
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="transition hover:bg-surface-2/50">
                <td className={cls.td + " font-medium"}>{p.title}</td>
                <td className={cls.td + " font-mono text-xs text-muted"}>{p.slug}</td>
                <td className={cls.td}>
                  <span className={badge(p.status === "PUBLISHED" ? "green" : "amber")}>
                    {p.status === "PUBLISHED" ? "Publicado" : "Rascunho"}
                  </span>
                </td>
                <td className={cls.td + " text-muted"}>
                  {p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
                <td className={cls.td}>
                  <div className="flex gap-3">
                    <Link
                      href={`/admin/blog/${p.id}`}
                      className="text-brand hover:underline text-xs"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => remove(p.id, p.title)}
                      className={cls.btnDanger}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
