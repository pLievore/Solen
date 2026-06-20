"use client";

import { useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";

type ImportSummary = {
  totalRows: number;
  categoriesCreated: number;
  modelsCreated: number;
  variantsCreated: number;
  variantsUpdated: number;
  pricesUpserted: number;
  errors: { row: number; message: string }[];
};

export default function ImportPage() {
  const [downloading, setDownloading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setError(null);
    setDownloading(true);
    try {
      const { csv, filename } = await adminApi.get<{ csv: string; filename: string }>(
        "/admin/catalog/export",
      );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  async function runImport() {
    if (!file) return;
    setError(null);
    setResult(null);
    setImporting(true);
    try {
      const csv = await file.text();
      const summary = await adminApi.post<ImportSummary>("/admin/catalog/import", { csv });
      setResult(summary);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar planilha</h1>
        <p className="text-sm text-muted">
          Atualize modelos, versoes e os precos dos 4 estados de uma vez por planilha (CSV).
        </p>
      </div>

      {/* Passo 1 */}
      <div className={cls.card + " space-y-3"}>
        <p className="font-medium">1. Baixe a planilha atual</p>
        <p className="text-sm text-muted">
          Vem com o catalogo de hoje preenchido. Edite os valores no Excel/Google Sheets
          e salve como CSV.
        </p>
        <button className={cls.btn} onClick={download} disabled={downloading}>
          {downloading ? "Gerando..." : "Baixar planilha (CSV)"}
        </button>
      </div>

      {/* Passo 2 */}
      <div className={cls.card + " space-y-3"}>
        <p className="font-medium">2. Envie a planilha preenchida</p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
          className="text-sm"
        />
        <div>
          <button className={cls.btn} onClick={runImport} disabled={!file || importing}>
            {importing ? "Importando..." : "Importar"}
          </button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Resultado */}
      {result && (
        <div className={cls.card + " space-y-3"}>
          <p className="font-medium">Resultado</p>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            <Stat label="Linhas" value={result.totalRows} />
            <Stat label="Categorias criadas" value={result.categoriesCreated} />
            <Stat label="Modelos criados" value={result.modelsCreated} />
            <Stat label="Versoes criadas" value={result.variantsCreated} />
            <Stat label="Versoes atualizadas" value={result.variantsUpdated} />
            <Stat label="Precos gravados" value={result.pricesUpserted} />
          </div>
          {result.errors.length > 0 ? (
            <div className="rounded border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-600">
                {result.errors.length} linha(s) com erro:
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-red-600">
                {result.errors.slice(0, 30).map((e, i) => (
                  <li key={i}>Linha {e.row}: {e.message}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-brand">Tudo importado sem erros.</p>
          )}
        </div>
      )}

      {/* Ajuda */}
      <div className="rounded border border-border p-4 text-xs text-muted">
        <p className="mb-1 font-medium text-fg">Colunas da planilha</p>
        <p>
          <strong>Categoria; Modelo; Versao; Armazenamento; Novo/lacrado; Seminovo;
          Usado leve; Usado forte; Sucata; Ativo</strong>
        </p>
        <p className="mt-2">
          Uma linha por versao. Precos em R$ (ex.: 2800 ou 2.800,00). A coluna{" "}
          <strong>Ativo</strong> (Sim/Nao) liga ou desliga a versao no site. Cada linha
          casa por nome (Categoria &rarr; Modelo &rarr; Versao); o que nao existe e criado,
          o que existe e atualizado. Nada e apagado.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border px-3 py-2">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
