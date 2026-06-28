"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../_components/PageHeader";
import { STATUS_COLOR, STATUS_LABEL, type RepairDevice } from "./_shared";

export default function AssistenciaPage() {
  const [devices, setDevices] = useState<RepairDevice[]>([]);
  // null = ainda carregando (fail-open: mostra o botão de incluir por padrão)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [me, list] = await Promise.all([
          adminApi.get<{ role?: { isAdmin?: boolean } }>("/admin/me"),
          adminApi.get<RepairDevice[]>("/admin/repair-devices"),
        ]);
        setIsAdmin(me.role?.isAdmin ?? null);
        setDevices(list);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canCreate = isAdmin !== false; // admin ou ainda desconhecido

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assistência técnica"
        subtitle={
          isAdmin === false
            ? "Aparelhos atribuídos a você."
            : "Aparelhos enviados para assistência."
        }
        icon={<Icon.wrench size={20} />}
        actions={
          canCreate ? (
            <Link href="/admin/assistencia/novo" className={cls.btn}>
              <Icon.plus size={16} />
              Novo aparelho
            </Link>
          ) : null
        }
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {loading && <p className="text-sm text-muted">Carregando…</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-border bg-bg shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-surface-2/70">
                <th className={cls.th}>Aparelho</th>
                <th className={cls.th}>Técnico</th>
                <th className={cls.th}>Status</th>
                <th className={cls.th}>Entrada</th>
                <th className={cls.th}></th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => (
                <tr key={d.id} className="transition hover:bg-surface-2/60">
                  <td className={cls.td}>
                    <div className="flex items-center gap-3">
                      {d.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.imageUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-xs">📱</span>
                      )}
                      <div>
                        <span className="font-medium">{d.model}</span>
                        {d.proposal && (
                          <span className="ml-2 rounded bg-brand-subtle px-1.5 py-0.5 font-mono text-[10px] text-brand-subtle-fg">
                            #{d.proposal.token}
                          </span>
                        )}
                      </div>
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
                    <Link
                      href={`/admin/assistencia/${d.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                    >
                      Abrir <Icon.arrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
              {devices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-14 text-center">
                    <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-muted">
                      <Icon.wrench size={22} />
                    </span>
                    <p className="text-sm font-medium">Nenhum aparelho em assistência.</p>
                    {canCreate && (
                      <Link
                        href="/admin/assistencia/novo"
                        className="mt-1 inline-block text-xs font-medium text-brand hover:underline"
                      >
                        Cadastrar o primeiro
                      </Link>
                    )}
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
