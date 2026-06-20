"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog</h1>
        <Link href="/admin/blog/new" className={cls.btn}>
          + Novo post
        </Link>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm">
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
                <td colSpan={5} className="px-3 py-8 text-center text-muted">
                  Nenhum post ainda.
                </td>
              </tr>
            )}
            {posts.map((p) => (
              <tr key={p.id} className="hover:bg-border/10">
                <td className={cls.td + " font-medium"}>{p.title}</td>
                <td className={cls.td + " font-mono text-xs text-muted"}>{p.slug}</td>
                <td className={cls.td}>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      p.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
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
