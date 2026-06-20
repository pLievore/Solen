import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const STATE_ORDER = ["NEW", "LIKE_NEW", "USED_LIGHT", "USED_HEAVY"] as const;
const STATE_HEADERS: Record<string, string> = {
  NEW: "Novo/lacrado",
  LIKE_NEW: "Seminovo",
  USED_LIGHT: "Usado leve",
  USED_HEAVY: "Usado forte",
};

export type ImportSummary = {
  totalRows: number;
  categoriesCreated: number;
  modelsCreated: number;
  variantsCreated: number;
  variantsUpdated: number;
  pricesUpserted: number;
  errors: { row: number; message: string }[];
};

function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Chave de casamento: ignora acentos, caixa e espacos extras. */
function normName(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueSlug(base: string, taken: Set<string>): string {
  let s = base || "item";
  let i = 2;
  while (taken.has(s)) s = `${base}-${i++}`;
  taken.add(s);
  return s;
}

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function normalizeHeader(h: string): string {
  return h.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function detectDelimiter(headerLine: string): string {
  const semi = (headerLine.match(/;/g) || []).length;
  const comma = (headerLine.match(/,/g) || []).length;
  return semi >= comma ? ";" : ",";
}

function parseCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === delim) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Converte R$ (1800, 1.800, 1800,50, 1.800,50, R$ 1.800) para centavos. */
function priceToCents(raw: string): number {
  let s = raw.trim().replace(/r\$/i, "").replace(/\s/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) s = s.replace(/\./g, "").replace(",", ".");
  else if (hasComma) s = s.replace(",", ".");
  else if (hasDot) {
    const parts = s.split(".");
    if (parts.length > 1 && parts.slice(1).every((p) => p.length === 3)) s = parts.join("");
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Preco invalido: "${raw}"`);
  return Math.round(n * 100);
}

function centsToCell(cents: number | null | undefined): string {
  if (cents == null) return "";
  if (cents % 100 === 0) return String(cents / 100);
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** "sim/s/1/true/x" -> true; "nao/n/0/false" -> false; vazio -> undefined. */
function parseBool(raw: string): boolean | undefined {
  const s = normName(raw);
  if (!s) return undefined;
  if (["sim", "s", "1", "true", "verdadeiro", "x", "ativo"].includes(s)) return true;
  if (["nao", "n", "0", "false", "falso", "inativo"].includes(s)) return false;
  return undefined;
}

type Row = {
  rowNum: number;
  catName: string;
  modelName: string;
  verName: string;
  catNorm: string;
  modelNorm: string;
  verNorm: string;
  storage: string | null | undefined;
  scrapCents: number | undefined;
  active: boolean | undefined;
  prices: { key: string; cents: number }[];
};

@Injectable()
export class CatalogImportService {
  constructor(private readonly prisma: PrismaService) {}

  /** CSV do catalogo atual (serve de template para editar e reimportar). */
  async export(): Promise<string> {
    const variants = await this.prisma.variant.findMany({
      include: { model: { include: { category: true } }, prices: true },
      orderBy: [{ model: { category: { order: "asc" } } }, { name: "asc" }],
    });
    const states = await this.prisma.conditionState.findMany();
    const idByKey = Object.fromEntries(states.map((s) => [s.key, s.id]));

    const header = [
      "Categoria",
      "Modelo",
      "Versao",
      "Armazenamento",
      STATE_HEADERS.NEW,
      STATE_HEADERS.LIKE_NEW,
      STATE_HEADERS.USED_LIGHT,
      STATE_HEADERS.USED_HEAVY,
      "Sucata",
      "Ativo",
    ];
    const lines = [header.join(";")];
    for (const v of variants) {
      const priceFor = (key: string) =>
        centsToCell(v.prices.find((x) => x.conditionStateId === idByKey[key])?.price);
      lines.push(
        [
          v.model.category.name,
          v.model.name,
          v.name,
          v.storage ?? "",
          priceFor("NEW"),
          priceFor("LIKE_NEW"),
          priceFor("USED_LIGHT"),
          priceFor("USED_HEAVY"),
          centsToCell(v.scrapPrice),
          v.active ? "Sim" : "Nao",
        ]
          .map((c) => (String(c).includes(";") ? `"${c}"` : c))
          .join(";"),
      );
    }
    return "﻿" + lines.join("\r\n");
  }

  /** Importa o CSV em lote. Casa por NOME (Categoria > Modelo > Versao); nada e apagado. */
  async import(csvRaw: string): Promise<ImportSummary> {
    const text = stripBom(csvRaw).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) throw new BadRequestException("Planilha vazia ou sem linhas de dados.");

    const delim = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delim).map(normalizeHeader);
    const find = (pred: (h: string) => boolean) => headers.findIndex(pred);
    const col = {
      category: find((h) => h.includes("categoria")),
      model: find((h) => h.startsWith("modelo")),
      version: find((h) => h.includes("versao")),
      storage: find((h) => h.includes("armazenamento")),
      scrap: find((h) => h.includes("sucata")),
      active: find((h) => h.includes("ativo")),
    };
    const stateCol: Record<string, number> = {
      NEW: find((h) => h.includes("novo") || h.includes("lacrado")),
      LIKE_NEW: find((h) => h.includes("seminovo")),
      USED_LIGHT: find((h) => h.includes("leve")),
      USED_HEAVY: find((h) => h.includes("forte")),
    };
    if (col.category < 0 || col.model < 0 || col.version < 0) {
      throw new BadRequestException("Cabecalho invalido. Colunas obrigatorias: Categoria, Modelo, Versao.");
    }

    const errors: { row: number; message: string }[] = [];
    const cell = (cells: string[], idx: number) => (idx >= 0 && idx < cells.length ? cells[idx].trim() : "");

    // 1. Parse + dedupe por nome (ultima linha vence)
    const rowMap = new Map<string, Row>();
    for (let r = 1; r < lines.length; r++) {
      const rowNum = r + 1;
      try {
        const cells = parseCsvLine(lines[r], delim);
        const catName = cell(cells, col.category);
        const modelName = cell(cells, col.model);
        const verName = cell(cells, col.version);
        if (!catName || !modelName || !verName) throw new Error("Categoria, Modelo e Versao sao obrigatorios.");
        const scrapRaw = col.scrap >= 0 ? cell(cells, col.scrap) : "";
        const prices: { key: string; cents: number }[] = [];
        for (const key of STATE_ORDER) {
          const idx = stateCol[key];
          if (idx < 0) continue;
          const raw = cell(cells, idx);
          if (!raw) continue;
          prices.push({ key, cents: priceToCents(raw) });
        }
        const row: Row = {
          rowNum,
          catName,
          modelName,
          verName,
          catNorm: normName(catName),
          modelNorm: normName(modelName),
          verNorm: normName(verName),
          storage: col.storage >= 0 ? cell(cells, col.storage) || null : undefined,
          scrapCents: scrapRaw ? priceToCents(scrapRaw) : undefined,
          active: col.active >= 0 ? parseBool(cell(cells, col.active)) : undefined,
          prices,
        };
        rowMap.set(`${row.catNorm}|${row.modelNorm}|${row.verNorm}`, row);
      } catch (e) {
        errors.push({ row: rowNum, message: (e as Error).message });
      }
    }
    const rows = [...rowMap.values()];

    const states = await this.prisma.conditionState.findMany();
    const stateIdByKey = Object.fromEntries(states.map((s) => [s.key, s.id]));

    // 2. Categorias (casa por nome normalizado)
    const allCats = await this.prisma.category.findMany();
    const catIdByNorm = new Map(allCats.map((c) => [normName(c.name), c.id]));
    const takenCatSlugs = new Set(allCats.map((c) => c.slug));
    const newCats = new Map<string, { name: string; slug: string; order: number }>();
    for (const r of rows) {
      if (!catIdByNorm.has(r.catNorm) && !newCats.has(r.catNorm)) {
        newCats.set(r.catNorm, { name: r.catName, slug: uniqueSlug(slugify(r.catName), takenCatSlugs), order: 99 });
      }
    }
    if (newCats.size) {
      await this.prisma.category.createMany({ data: [...newCats.values()] });
      const refreshed = await this.prisma.category.findMany();
      refreshed.forEach((c) => catIdByNorm.set(normName(c.name), c.id));
    }

    // 3. Modelos (casa por categoria + nome)
    const catIds = [...new Set([...catIdByNorm.values()])];
    let models = await this.prisma.deviceModel.findMany({ where: { categoryId: { in: catIds } } });
    const mKey = (categoryId: string, n: string) => `${categoryId}|${n}`;
    const modelIdByKey = new Map(models.map((m) => [mKey(m.categoryId, normName(m.name)), m.id]));
    const takenModelSlugs = new Map<string, Set<string>>();
    for (const m of models) {
      if (!takenModelSlugs.has(m.categoryId)) takenModelSlugs.set(m.categoryId, new Set());
      takenModelSlugs.get(m.categoryId)!.add(m.slug);
    }
    const newModels = new Map<string, { categoryId: string; name: string; slug: string }>();
    for (const r of rows) {
      const categoryId = catIdByNorm.get(r.catNorm)!;
      const k = mKey(categoryId, r.modelNorm);
      if (!modelIdByKey.has(k) && !newModels.has(k)) {
        if (!takenModelSlugs.has(categoryId)) takenModelSlugs.set(categoryId, new Set());
        const slug = uniqueSlug(slugify(r.modelName), takenModelSlugs.get(categoryId)!);
        newModels.set(k, { categoryId, name: r.modelName, slug });
      }
    }
    if (newModels.size) {
      await this.prisma.deviceModel.createMany({ data: [...newModels.values()] });
      models = await this.prisma.deviceModel.findMany({ where: { categoryId: { in: catIds } } });
      models.forEach((m) => modelIdByKey.set(mKey(m.categoryId, normName(m.name)), m.id));
    }

    // 4. Versoes (casa por modelo + nome)
    const modelIds = [...new Set([...modelIdByKey.values()])];
    let variants = await this.prisma.variant.findMany({ where: { modelId: { in: modelIds } } });
    const vKey = (modelId: string, n: string) => `${modelId}|${n}`;
    const variantByKey = new Map(variants.map((v) => [vKey(v.modelId, normName(v.name)), v]));

    const newVariants: { modelId: string; name: string; slug: string; storage: string | null; scrapPrice: number | null; active: boolean }[] = [];
    const updates: Promise<unknown>[] = [];
    let variantsUpdated = 0;
    for (const r of rows) {
      const categoryId = catIdByNorm.get(r.catNorm)!;
      const modelId = modelIdByKey.get(mKey(categoryId, r.modelNorm))!;
      const existing = variantByKey.get(vKey(modelId, r.verNorm));
      if (!existing) {
        newVariants.push({
          modelId,
          name: r.verName,
          slug: slugify(r.verName),
          storage: r.storage ?? null,
          scrapPrice: r.scrapCents ?? null,
          active: r.active ?? true,
        });
      } else {
        const data: { storage?: string | null; scrapPrice?: number; active?: boolean } = {};
        if (r.storage !== undefined && existing.storage !== r.storage) data.storage = r.storage;
        if (r.scrapCents !== undefined && existing.scrapPrice !== r.scrapCents) data.scrapPrice = r.scrapCents;
        if (r.active !== undefined && existing.active !== r.active) data.active = r.active;
        if (Object.keys(data).length) updates.push(this.prisma.variant.update({ where: { id: existing.id }, data }));
        variantsUpdated++;
      }
    }
    if (newVariants.length) await this.prisma.variant.createMany({ data: newVariants });
    if (updates.length) await Promise.all(updates);
    if (newVariants.length) {
      variants = await this.prisma.variant.findMany({ where: { modelId: { in: modelIds } } });
      variants.forEach((v) => variantByKey.set(vKey(v.modelId, normName(v.name)), v));
    }

    // 5. Precos em lote (INSERT ... ON CONFLICT)
    const priceValues: { variantId: string; conditionStateId: string; price: number }[] = [];
    for (const r of rows) {
      const categoryId = catIdByNorm.get(r.catNorm)!;
      const modelId = modelIdByKey.get(mKey(categoryId, r.modelNorm))!;
      const variant = variantByKey.get(vKey(modelId, r.verNorm));
      if (!variant) continue;
      for (const p of r.prices) {
        priceValues.push({ variantId: variant.id, conditionStateId: stateIdByKey[p.key], price: p.cents });
      }
    }
    const CHUNK = 500;
    for (let i = 0; i < priceValues.length; i += CHUNK) {
      const chunk = priceValues.slice(i, i + CHUNK);
      const placeholders = chunk
        .map((_, j) => `(gen_random_uuid()::text, $${j * 3 + 1}, $${j * 3 + 2}, $${j * 3 + 3})`)
        .join(",");
      const params = chunk.flatMap((v) => [v.variantId, v.conditionStateId, v.price]);
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO variant_prices (id, "variantId", "conditionStateId", price)
         VALUES ${placeholders}
         ON CONFLICT ("variantId", "conditionStateId") DO UPDATE SET price = EXCLUDED.price`,
        ...params,
      );
    }

    return {
      totalRows: rows.length + errors.length,
      categoriesCreated: newCats.size,
      modelsCreated: newModels.size,
      variantsCreated: newVariants.length,
      variantsUpdated,
      pricesUpserted: priceValues.length,
      errors,
    };
  }
}
