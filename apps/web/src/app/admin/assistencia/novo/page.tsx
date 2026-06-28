"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import { PageHeader } from "../../_components/PageHeader";
import { Icon } from "@/lib/icons";
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
    proposalId: v.proposalId,
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
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Cadastrar aparelho"
        subtitle="Registre a entrada com foto inicial, técnico e serviços."
        icon={<Icon.wrench size={20} />}
        back={{ href: "/admin/assistencia", label: "Assistência" }}
      />
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      <DeviceForm initial={EMPTY_DEVICE} submitLabel="Cadastrar aparelho" busy={busy} onSubmit={create} />
    </div>
  );
}
