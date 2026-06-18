import type { Metadata } from "next";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import PublicShell from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "Blog — Solen",
  description: "Dicas e guias sobre como vender seus eletrônicos usados.",
};

type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: string;
};

async function getPosts(): Promise<PostRow[]> {
  try {
    const data = await apiGet<{ items: PostRow[] }>("/blog", {
      next: { revalidate: 60 },
    } as RequestInit);
    return data.items;
  } catch {
    return [];
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogIndexPage() {
  const posts = await getPosts();
  const [featured, ...rest] = posts;

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="mt-1 text-muted">Dicas para vender seus eletrônicos com mais valor.</p>
        </div>

        {posts.length === 0 && (
          <p className="text-muted">Nenhum post publicado ainda.</p>
        )}

        {/* Post em destaque */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-10 block overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            {featured.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.coverImageUrl}
                alt=""
                className="h-56 w-full object-cover sm:h-72"
              />
            )}
            <div className="p-6">
              <span className="rounded-full bg-brand-subtle px-2.5 py-0.5 text-xs font-medium text-brand-subtle-fg">
                Em destaque
              </span>
              <h2 className="mt-3 text-xl font-bold leading-snug transition group-hover:text-brand sm:text-2xl">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="mt-2 text-sm text-muted line-clamp-2">{featured.excerpt}</p>
              )}
              <p className="mt-3 text-xs text-muted">{fmtDate(featured.publishedAt)}</p>
            </div>
          </Link>
        )}

        {/* Grade de posts */}
        {rest.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2">
            {rest.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {p.coverImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverImageUrl}
                    alt=""
                    className="h-36 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold leading-snug transition group-hover:text-brand">
                    {p.title}
                  </h3>
                  {p.excerpt && (
                    <p className="mt-1 flex-1 text-sm text-muted line-clamp-2">{p.excerpt}</p>
                  )}
                  <p className="mt-3 text-xs text-muted">{fmtDate(p.publishedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
