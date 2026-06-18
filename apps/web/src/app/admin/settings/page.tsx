"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";

type Setting = { key: string; value: unknown };

const FIELDS: { key: string; label: string; type: "text" | "money" | "email" }[] = [
  { key: "home.headline", label: "Headline da home", type: "text" },
  { key: "whatsapp_phone", label: "WhatsApp (DDI+DDD+numero)", type: "text" },
  { key: "whatsapp_message_template", label: "Modelo da mensagem do WhatsApp", type: "text" },
  { key: "scrap.defaultValue", label: "Valor de sucata padrao (R$)", type: "money" },
  { key: "notify_email", label: "E-mail de notificacao de propostas", type: "email" },
];

export default function SettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const all = await adminApi.get<Setting[]>("/admin/settings");
    const map: Record<string, string> = {};
    for (const f of FIELDS) {
      const found = all.find((s) => s.key === f.key);
      const raw = found?.value;
      if (f.type === "money") {
        map[f.key] = typeof raw === "number" ? (raw / 100).toFixed(2) : "";
      } else {
        map[f.key] = typeof raw === "string" ? raw : raw != null ? String(raw) : "";
      }
    }
    setValues(map);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function saveOne(key: string, type: string) {
    setError(null);
    try {
      const raw = values[key] ?? "";
      const value = type === "money" ? Math.round(Number(raw || 0) * 100) : raw;
      await adminApi.put(`/admin/settings/${key}`, { value });
      setMsg("Salvo.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Configuracoes</h1>
      {msg && <p className="rounded bg-brand/10 px-3 py-2 text-sm text-brand">{msg}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key} className={cls.card + " space-y-2"}>
            <label className={cls.label}>{f.label}</label>
            <div className="flex gap-2">
              <input
                className={cls.input}
                type={f.type === "money" ? "number" : f.type === "email" ? "email" : "text"}
                step={f.type === "money" ? "0.01" : undefined}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
              <button className={cls.btn} onClick={() => saveOne(f.key, f.type)}>
                Salvar
              </button>
            </div>
            <p className="text-xs text-muted">chave: {f.key}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
