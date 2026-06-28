"use client";

import { useEffect, useRef, useState } from "react";
import { adminApi, uploadIcon } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";

type Tecnico = { id: string; email: string | null; role: string | null };

export type DeviceFormValue = {
  model: string;
  imageUrl: string | null;
  technicianId: string | null;
  technicianEmail: string | null;
  accessNotes: string;
  priorDefects: string;
  services: string;
  status: string;
};

const STATUSES: [string, string][] = [
  ["RECEBIDO", "Recebido"],
  ["EM_REPARO", "Em reparo"],
  ["CONCLUIDO", "Concluído"],
  ["ENTREGUE", "Entregue"],
];

export const EMPTY_DEVICE: DeviceFormValue = {
  model: "",
  imageUrl: null,
  technicianId: null,
  technicianEmail: null,
  accessNotes: "",
  priorDefects: "",
  services: "",
  status: "RECEBIDO",
};

export default function DeviceForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
}: {
  initial: DeviceFormValue;
  submitLabel: string;
  busy: boolean;
  onSubmit: (value: DeviceFormValue) => void;
}) {
  const [v, setV] = useState<DeviceFormValue>(initial);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminApi
      .get<Tecnico[]>("/admin/users")
      .then((us) => setTecnicos(us.filter((u) => u.role && u.role !== "admin")))
      .catch(() => setTecnicos([]));
  }, []);

  function set<K extends keyof DeviceFormValue>(k: K, val: DeviceFormValue[K]) {
    setV((s) => ({ ...s, [k]: val }));
  }

  async function onPhoto(file: File) {
    setUploading(true);
    try {
      const url = await uploadIcon(file);
      set("imageUrl", url);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
      className="space-y-4"
    >
      {/* Foto + modelo */}
      <div className={cls.card + " space-y-3"}>
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {v.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface-2 text-2xl">
                📱
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <label className={cls.label}>Modelo do aparelho *</label>
              <input
                required
                value={v.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="iPhone 14 Pro Max 256GB"
                className={cls.input}
              />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className={cls.btnGhost}
            >
              <Icon.image size={15} />
              {uploading ? "Enviando…" : v.imageUrl ? "Trocar foto" : "Adicionar foto inicial"}
            </button>
          </div>
        </div>
      </div>

      {/* Técnico + status */}
      <div className={cls.card + " grid gap-3 sm:grid-cols-2"}>
        <div>
          <label className={cls.label}>Técnico responsável</label>
          <select
            value={v.technicianId ?? ""}
            onChange={(e) => {
              const t = tecnicos.find((x) => x.id === e.target.value);
              set("technicianId", t?.id ?? null);
              set("technicianEmail", t?.email ?? null);
            }}
            className={cls.input}
          >
            <option value="">Sem técnico</option>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.email}
              </option>
            ))}
          </select>
          {tecnicos.length === 0 && (
            <p className="mt-1 text-xs text-muted">
              Nenhum técnico cadastrado. Crie em Permissões.
            </p>
          )}
        </div>
        <div>
          <label className={cls.label}>Status</label>
          <select
            value={v.status}
            onChange={(e) => set("status", e.target.value)}
            className={cls.input}
          >
            {STATUSES.map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Textos */}
      <div className={cls.card + " space-y-3"}>
        <div>
          <label className={cls.label}>Serviços a realizar</label>
          <textarea
            rows={2}
            value={v.services}
            onChange={(e) => set("services", e.target.value)}
            placeholder="Troca de tela / bateria / câmeras..."
            className={cls.input}
          />
        </div>
        <div>
          <label className={cls.label}>Defeitos prévios</label>
          <textarea
            rows={2}
            value={v.priorDefects}
            onChange={(e) => set("priorDefects", e.target.value)}
            placeholder="Sinalize defeitos já existentes na entrada."
            className={cls.input}
          />
        </div>
        <div>
          <label className={cls.label}>Acesso ao aparelho</label>
          <textarea
            rows={2}
            value={v.accessNotes}
            onChange={(e) => set("accessNotes", e.target.value)}
            placeholder="Senha de desbloqueio / instruções de acesso."
            className={cls.input}
          />
        </div>
      </div>

      <button type="submit" disabled={busy || uploading} className={cls.btn + " disabled:opacity-50"}>
        {busy ? "Salvando..." : submitLabel}
      </button>
    </form>
  );
}
