import type { MetadataRoute } from "next";
import { apiGet } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://solen.com.br";

type PostRow = { slug: string; publishedAt: string };
type CategoryRow = { slug: string; updatedAt?: string };

async function getBlogSlugs(): Promise<PostRow[]> {
  try {
    const data = await apiGet<{ items: PostRow[] }>("/blog?take=500");
    return data.items;
  } catch {
    return [];
  }
}

async function getCategorySlugs(): Promise<CategoryRow[]> {
  try {
    return apiGet<CategoryRow[]>("/catalog/categories");
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories] = await Promise.all([getBlogSlugs(), getCategorySlugs()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE}/vender/${c.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...blogRoutes];
}
