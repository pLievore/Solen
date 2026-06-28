"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { adminApi } from "@/lib/admin-api";
import { cls, slugify } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../../_components/PageHeader";

// Load TipTap editor client-side only (uses browser APIs)
const RichEditor = dynamic(() => import("../_components/RichEditor"), { ssr: false });

type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  seoTitle: string;
  metaDescription: string;
  status: "DRAFT" | "PUBLISHED";
};

const empty: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  seoTitle: "",
  metaDescription: "",
  status: "DRAFT",
};

export default function BlogEditPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const isNew = id === "new";
  const router = useRouter();

  const [form, setForm] = useState<PostForm>(empty);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      adminApi
        .get<PostForm & { id: string }>(`/admin/posts/${id}`)
        .then((p) => {
          setForm({
            title: p.title,
            slug: p.slug,
            excerpt: p.excerpt ?? "",
            content: p.content,
            coverImageUrl: p.coverImageUrl ?? "",
            seoTitle: p.seoTitle ?? "",
            metaDescription: p.metaDescription ?? "",
            status: p.status as "DRAFT" | "PUBLISHED",
          });
          setSlugManual(true);
        })
        .catch((e) => setError(e.message));
    }
  }, [id, isNew]);

  function set<K extends keyof PostForm>(key: K, value: PostForm[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "title" && !slugManual) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function save() {
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      if (isNew) {
        const created = await adminApi.post<{ id: string }>("/admin/posts", form);
        router.replace(`/admin/blog/${created.id}`);
        setMsg("Post criado.");
      } else {
        await adminApi.patch(`/admin/posts/${id}`, form);
        setMsg("Salvo.");
        setTimeout(() => setMsg(null), 2000);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const input = (key: keyof PostForm, extra?: string) => (
    <input
      type="text"
      value={form[key] as string}
      onChange={(e) => set(key, e.target.value as PostForm[typeof key])}
      className={cls.input + (extra ? ` ${extra}` : "")}
    />
  );

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={isNew ? "Novo post" : "Editar post"}
        subtitle={isNew ? "Escreva um novo artigo para o blog." : form.title || undefined}
        icon={<Icon.file size={20} />}
        back={{ href: "/admin/blog", label: "Blog" }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {msg && (
        <p className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-subtle px-3 py-2 text-sm text-brand-subtle-fg">
          <Icon.check size={15} />
          {msg}
        </p>
      )}

      {/* Título + Slug */}
      <div className={cls.card + " space-y-3"}>
        <div>
          <label className={cls.label + " mb-1 block"}>Título</label>
          {input("title")}
        </div>
        <div>
          <label className={cls.label + " mb-1 block"}>
            Slug{" "}
            <span className="text-xs font-normal text-muted">(URL amigável)</span>
          </label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugManual(true);
              set("slug", e.target.value);
            }}
            className={cls.input}
            placeholder="meu-post"
          />
        </div>
        <div>
          <label className={cls.label + " mb-1 block"}>Resumo</label>
          <textarea
            value={form.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            rows={2}
            className={cls.input}
            placeholder="Breve descrição exibida no índice do blog."
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className={cls.card}>
        <label className={cls.label + " mb-1 block"}>Conteúdo</label>
        <RichEditor
          content={form.content}
          onChange={(html) => set("content", html)}
          placeholder="Escreva o conteúdo do post..."
        />
      </div>

      {/* Capa */}
      <div className={cls.card}>
        <label className={cls.label + " mb-1 block"}>URL da imagem de capa</label>
        {input("coverImageUrl")}
        {form.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.coverImageUrl} alt="Capa" className="mt-2 h-32 rounded object-cover" />
        )}
      </div>

      {/* SEO */}
      <div className={cls.card + " space-y-3"}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">SEO</h2>
        <div>
          <label className={cls.label + " mb-1 block"}>SEO Title</label>
          {input("seoTitle")}
        </div>
        <div>
          <label className={cls.label + " mb-1 block"}>Meta Description</label>
          <textarea
            value={form.metaDescription}
            onChange={(e) => set("metaDescription", e.target.value)}
            rows={2}
            className={cls.input}
            maxLength={160}
          />
          <p className="mt-0.5 text-right text-xs text-muted">
            {form.metaDescription.length}/160
          </p>
        </div>
      </div>

      {/* Status + Salvar */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={form.status}
          onChange={(e) => set("status", e.target.value as "DRAFT" | "PUBLISHED")}
          className={cls.input + " max-w-[180px]"}
        >
          <option value="DRAFT">Rascunho</option>
          <option value="PUBLISHED">Publicado</option>
        </select>
        <button
          onClick={save}
          disabled={saving}
          className={cls.btn + " disabled:opacity-50"}
        >
          {saving ? "Salvando..." : isNew ? "Criar post" : "Salvar alterações"}
        </button>
        {!isNew && (
          <Link href={`/blog/${form.slug}`} target="_blank" className={cls.btnGhost}>
            Ver post
            <Icon.external size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
