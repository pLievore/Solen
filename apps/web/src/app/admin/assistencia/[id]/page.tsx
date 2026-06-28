"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import DeviceForm, { type DeviceFormValue } from "../_DeviceForm";
import { STATUS_COLOR, STATUS_LABEL, type RepairDevice } from "../_shared";

function toForm(d: RepairDevice): DeviceFormValue {
  return {
    model: d.model,
    imageUrl: d.imageUrl,
    technicianId: d.technicianId,
    technicianEmail: d.technicianEmail,
    accessNotes: d.accessNotes ?? "",
    priorDefects: d.priorDefects ?? "",
    services: d.services ?? "",
    status: d.status,
  };
}

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

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm">{value}</dd>
    </div>
  );
}

export default function RepairDeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [device, setDevice] = useState<RepairDevice | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [me, d] = await Promise.all([
          adminApi.get<{ role: string }>("/admin/me"),
          adminApi.get<RepairDevice>(`/admin/repair-devices/${id}`),
        ]);
        setRole(me.role);
        setDevice(d);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [id]);

  async function save(v: DeviceFormValue) {
    setBusy(true);
    setMsg(null);
    setError(null);
    try {
      const d = await adminApi.patch<RepairDevice>(`/admin/repair-devices/${id}`, payload(v));
      setDevice(d);
      setMsg("Aparelho atualizado.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Excluir este aparelho da assistência?")) return;
    try {
      await adminApi.del(`/admin/repair-devices/${id}`);
      router.push("/admin/assistencia");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (error && !device) return <p className="text-red-500">{error}</p>;
  if (!device) return <p className="text-muted">Carregando...</p>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-3 text-sm">
        <Link href="/admin/assistencia" className="text-muted hover:text-brand">
          ← Assistência
        </Link>
        <span className="text-muted">/</span>
        <span className="font-medium">{device.model}</span>
        <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[device.status] ?? ""}`}>
          {STATUS_LABEL[device.status] ?? device.status}
        </span>
      </div>

      {msg && <p className="rounded bg-brand/10 px-3 py-2 text-sm text-brand">{msg}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {role === "admin" ? (
        <>
          <DeviceForm initial={toForm(device)} submitLabel="Salvar alterações" busy={busy} onSubmit={save} />
          <button onClick={remove} className={cls.btnDanger}>
            Excluir aparelho
          </button>
        </>
      ) : (
        // Visão do técnico (somente leitura)
        <div className={cls.card + " space-y-4"}>
          <div className="flex items-center gap-4">
            {device.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={device.imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface-2 text-2xl">📱</div>
            )}
            <div>
              <p className="font-semibold">{device.model}</p>
              <p className="text-sm text-muted">Entrada: {new Date(device.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
          <dl className="space-y-3">
            <Field label="Serviços a realizar" value={device.services} />
            <Field label="Defeitos prévios" value={device.priorDefects} />
            <Field label="Acesso ao aparelho" value={device.accessNotes} />
          </dl>
        </div>
      )}

      {/* Comprovações de funcionamento (Fase C3) */}
      <div className="rounded-xl border border-dashed border-border bg-surface p-5 text-center">
        <p className="text-2xl">🎥</p>
        <p className="mt-2 text-sm font-medium">Comprovações de funcionamento</p>
        <p className="mt-1 text-xs text-muted">
          Checklist de fotos e vídeos (carcaça, biometria, câmeras, energia,
          botões) chega na próxima entrega.
        </p>
      </div>
    </div>
  );
}
