"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";

type Counts = {
  categories: number;
  models: number;
  variants: number;
  detailed: number;
  knockout: number;
};

const CARDS = [
  { href: "/admin/categories", label: "Categorias", key: "categories" as const },
  { href: "/admin/models", label: "Modelos", key: "models" as const },
  { href: "/admin/variants", label: "Versoes", key: "variants" as const },
  { href: "/admin/detailed-states", label: "Estados detalhados", key: "detailed" as const },
  { href: "/admin/knockout", label: "Perguntas knockout", key: "knockout" as const },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [categories, models, variants, detailed, knockout] = await Promise.all([
          adminApi.get<unknown[]>("/admin/categories"),
          adminApi.get<unknown[]>("/admin/models"),
          adminApi.get<unknown[]>("/admin/variants"),
          adminApi.get<unknown[]>("/admin/detailed-states"),
          adminApi.get<unknown[]>("/admin/knockout-questions"),
        ]);
        setCounts({
          categories: categories.length,
          models: models.length,
          variants: variants.length,
          detailed: detailed.length,
          knockout: knockout.length,
        });
      } catch {
        setCounts(null);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-sm text-muted">Gerencie o catalogo, os precos e as regras de avaliacao.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded border border-border p-4 transition hover:border-brand"
          >
            <p className="text-sm text-muted">{c.label}</p>
            <p className="text-2xl font-bold">{counts ? counts[c.key] : "—"}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
