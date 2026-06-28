"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { STATUS_COLOR, STATUS_LABEL, type RepairDevice } from "./_shared";

export default function AssistenciaPage() {
  const [devices, setDevices] = useState<RepairDevice[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [me, list] = await Promise.all([
          adminApi.get<{ role: string }>("/admin/me"),
          adminApi.get<RepairDevice[]>("/admin/repair-devices"),
        ]);
        setRole(me.role);
        setDevices(list);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assistência técnica</h1>
          <p className="text-sm text-muted">
            {role === "tecnico"
              ? "Aparelhos atribuídos a você."
              : "Aparelhos enviados para assistência."}
          </p>
        </div>
        {role === "admin" && (
          <Link href="/admin/assistencia/novo" className={cls.btn}>
            + Novo aparelho
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {loading && <p className="text-sm text-muted">Carregando...</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-border/20">
                <th className={cls.th}>Aparelho</th>
                <th className={cls.th}>Técnico</th>
                <th className={cls.th}>Status</th>
                <th className={cls.th}>Entrada</th>
                <th className={cls.th}></th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="hover:bg-border/10">
                  <td className={cls.td}>
                    <div className="flex items-center gap-3">
                      {d.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-xs">📱</span>
                      )}
                      <span className="font-medium">{d.model}</span>
                    </div>
                  </td>
                  <td className={cls.td + " text-muted"}>{d.technicianEmail ?? "—"}</td>
                  <td className={cls.td}>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[d.status] ?? ""}`}>
                      {STATUS_LABEL[d.status] ?? d.status}
                    </span>
                  </td>
                  <td className={cls.td + " text-muted"}>
                    {new Date(d.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className={cls.td}>
                    <Link href={`/admin/assistencia/${d.id}`} className="text-xs text-brand hover:underline">
                      Abrir →
                    </Link>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-muted">
                    Nenhum aparelho em assistência.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
