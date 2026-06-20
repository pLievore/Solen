import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import HomeContent from "./_components/HomeContent";

export const metadata: Metadata = {
  title: "Vendy — Venda seus usados",
  description:
    "Venda iPhones, iPads, Apple Watch, consoles e eletrônicos usados, quebrados ou seminovos. Avaliação gratuita e proposta na hora.",
  alternates: { canonical: "/" },
};

type Category = { id: string; name: string; slug: string; iconUrl: string | null };
type PublicConfig = { homeHeadline: string };

async function getCategories(): Promise<Category[]> {
  try {
    return await apiGet<Category[]>("/catalog/categories", {
      next: { revalidate: 300 },
    } as RequestInit);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [categories, config] = await Promise.all([
    getCategories(),
    apiGet<PublicConfig>("/config", {
      next: { revalidate: 300 },
    } as RequestInit).catch(() => ({
      homeHeadline: "Venda seus usados na hora",
    })),
  ]);
  return (
    <HomeContent
      categories={categories}
      headline={config.homeHeadline}
    />
  );
}
