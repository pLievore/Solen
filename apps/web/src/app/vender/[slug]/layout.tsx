import type { Metadata } from "next";
import { apiGet } from "@/lib/api";

type Category = { name: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let name = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  try {
    const categories = await apiGet<Category[]>("/catalog/categories", {
      next: { revalidate: 300 },
    } as RequestInit);
    name = categories.find((category) => category.slug === slug)?.name ?? name;
  } catch {
    // Mantém o título derivado do slug quando a API estiver indisponível.
  }

  return {
    title: `Vender ${name}`,
    description: `Avalie seu ${name} usado e receba uma proposta de compra na hora.`,
    alternates: { canonical: `/vender/${slug}` },
  };
}

export default function SellCategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
