import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import PublicShell from "@/components/PublicShell";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  publishedAt: string;
};

async function getPost(slug: string): Promise<Post | null> {
  try {
    return await apiGet<Post>(`/blog/${slug}`, {
      next: { revalidate: 60 },
    } as RequestInit);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post não encontrado" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      type: "article",
      publishedTime: post.publishedAt,
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const readingTime = Math.max(1, Math.ceil(post.content.replace(/<[^>]+>/g, "").split(/\s+/).length / 200));

  return (
    <PublicShell>
      <article className="mx-auto max-w-2xl px-6 py-16">
        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt=""
            className="mb-8 w-full rounded-2xl object-cover shadow-md"
            style={{ maxHeight: "360px" }}
          />
        )}

        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-muted">
          <Link href="/blog" className="hover:text-brand transition">← Blog</Link>
          <span>·</span>
          <time>
            {new Date(post.publishedAt).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
          <span>·</span>
          <span>{readingTime} min de leitura</span>
        </div>

        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-3 text-lg text-muted leading-relaxed">{post.excerpt}</p>
        )}

        <div
          className="prose prose-sm mt-8 max-w-none prose-headings:font-bold prose-a:text-brand prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-brand/30 bg-brand-subtle px-6 py-8 text-center">
          <p className="text-sm font-medium text-brand-subtle-fg">
            Gostou do conteúdo? Venda seus eletrônicos agora!
          </p>
          <Link
            href="/"
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg shadow-brand transition hover:bg-brand-dark active:scale-95"
          >
            Fazer avaliação gratuita →
          </Link>
        </div>
      </article>
    </PublicShell>
  );
}
