"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../../_components/PageHeader";
import DeviceForm, { type DeviceFormValue } from "../_DeviceForm";
import MediaChecklist from "../_MediaChecklist";
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [me, d] = await Promise.all([
          adminApi.get<{ role?: { isAdmin?: boolean } }>("/admin/me"),
          adminApi.get<RepairDevice>(`/admin/repair-devices/${id}`),
        ]);
        setIsAdmin(me.role?.isAdmin ?? null);
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
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={device.model}
        subtitle={`Entrada em ${new Date(device.createdAt).toLocaleDateString("pt-BR")}`}
        icon={<Icon.wrench size={20} />}
        back={{ href: "/admin/assistencia", label: "Assistência" }}
        actions={
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[device.status] ?? ""}`}
          >
            {STATUS_LABEL[device.status] ?? device.status}
          </span>
        }
      />

      {msg && (
        <p className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-subtle px-3 py-2 text-sm text-brand-subtle-fg">
          <Icon.check size={15} />
          {msg}
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {isAdmin !== false ? (
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

      {/* Comprovações de funcionamento */}
      <MediaChecklist deviceId={device.id} />
    </div>
  );
}
