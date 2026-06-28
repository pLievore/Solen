"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import DeviceForm, { EMPTY_DEVICE, type DeviceFormValue } from "../_DeviceForm";

function payload(v: DeviceFormValue) {
  return {
    model: v.model.trim(),
    imageUrl: v.imageUrl,
    technicianId: v.technicianId,
    technicianEmail: v.technicianEmail,
    accessNotes: v.accessNotes.trim() || null,
    priorDefects: v.priorDefects.trim() || null,
    services: v.services.trim() || null,
    status: v.status,
  };
}

export default function NovoAparelhoPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(v: DeviceFormValue) {
    setBusy(true);
    setError(null);
    try {
      const d = await adminApi.post<{ id: string }>("/admin/repair-devices", payload(v));
      router.push(`/admin/assistencia/${d.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3 text-sm">
        <Link href="/admin/assistencia" className="text-muted hover:text-brand">
          ← Assistência
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">Novo aparelho</span>
      </div>
      <h1 className="text-2xl font-bold tracking-tight">Cadastrar aparelho</h1>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <DeviceForm initial={EMPTY_DEVICE} submitLabel="Cadastrar aparelho" busy={busy} onSubmit={create} />
    </div>
  );
}
