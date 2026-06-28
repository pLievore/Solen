"use client";

export default function AssistenciaPage() {
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assistência técnica</h1>
        <p className="text-sm text-muted">
          Cadastro e acompanhamento de aparelhos enviados para assistência.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-4xl">🛠️</p>
        <p className="mt-3 font-medium">Em construção</p>
        <p className="mt-1 text-sm text-muted">
          O cadastro de aparelhos, vínculo de técnico e checklist de mídias
          chegam na próxima entrega.
        </p>
      </div>
    </div>
  );
}
