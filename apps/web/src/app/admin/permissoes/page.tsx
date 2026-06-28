"use client";

import { useEffect, useState } from "react";
import { ADMIN_PAGES } from "@vendy/shared";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";
import { Icon } from "@/lib/icons";
import { PageHeader } from "../_components/PageHeader";

type Role = {
  key: string;
  label: string;
  isAdmin: boolean;
  builtin: boolean;
  pages: string[];
};
type User = { id: string; email: string | null; role: string | null };

export default function PermissoesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // edição de papéis (por chave)
  const [edit, setEdit] = useState<Record<string, { label: string; pages: string[] }>>({});
  const [savingRole, setSavingRole] = useState<string | null>(null);

  // novo papel
  const [nkey, setNkey] = useState("");
  const [nlabel, setNlabel] = useState("");
  const [npages, setNpages] = useState<string[]>([]);
  const [creatingRole, setCreatingRole] = useState(false);

  // novo usuário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [urole, setUrole] = useState("tecnico");
  const [creatingUser, setCreatingUser] = useState(false);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<Record<string, string>>({});

  async function load() {
    setError(null);
    try {
      const [r, u] = await Promise.all([
        adminApi.get<Role[]>("/admin/roles"),
        adminApi.get<User[]>("/admin/users"),
      ]);
      setRoles(r);
      setUsers(u);
      const e: Record<string, { label: string; pages: string[] }> = {};
      r.forEach((role) => (e[role.key] = { label: role.label, pages: role.pages }));
      setEdit(e);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 2000);
  }

  function togglePage(key: string, page: string) {
    setEdit((s) => {
      const cur = s[key] ?? { label: "", pages: [] };
      const pages = cur.pages.includes(page)
        ? cur.pages.filter((p) => p !== page)
        : [...cur.pages, page];
      return { ...s, [key]: { ...cur, pages } };
    });
  }

  async function saveRole(key: string) {
    setSavingRole(key);
    setError(null);
    try {
      const e = edit[key];
      await adminApi.patch(`/admin/roles/${key}`, { label: e.label, pages: e.pages });
      flash("Papel atualizado.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingRole(null);
    }
  }

  async function deleteRole(key: string) {
    if (!confirm(`Excluir o papel "${key}"?`)) return;
    try {
      await adminApi.del(`/admin/roles/${key}`);
      flash("Papel excluído.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    setCreatingRole(true);
    setError(null);
    try {
      await adminApi.post("/admin/roles", { key: nkey.trim(), label: nlabel.trim(), pages: npages });
      setNkey("");
      setNlabel("");
      setNpages([]);
      flash("Papel criado.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreatingRole(false);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreatingUser(true);
    setError(null);
    try {
      await adminApi.post("/admin/users", { email: email.trim(), password, role: urole });
      setEmail("");
      setPassword("");
      flash("Usuário criado.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreatingUser(false);
    }
  }

  async function saveUserRole(id: string) {
    const role = editedUser[id];
    if (!role) return;
    setSavingUser(id);
    setError(null);
    try {
      await adminApi.patch(`/admin/users/${id}/role`, { role });
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, role } : u)));
      setEditedUser((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
      flash("Papel do usuário atualizado.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingUser(null);
    }
  }

  const roleOptions = roles.map((r) => ({ value: r.key, label: r.label }));

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Permissões"
        subtitle="Crie níveis de acesso, defina o que cada um enxerga e atribua aos usuários. O papel Administrador tem acesso total."
        icon={<Icon.shield size={20} />}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
      {msg && (
        <p className="flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-subtle px-3 py-2 text-sm text-brand-subtle-fg">
          <Icon.check size={15} />
          {msg}
        </p>
      )}

      {/* Níveis de permissão */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Níveis de permissão
        </h2>
        {roles.map((role) => (
          <div key={role.key} className={cls.card + " space-y-3"}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  value={edit[role.key]?.label ?? role.label}
                  disabled={role.isAdmin}
                  onChange={(e) =>
                    setEdit((s) => ({ ...s, [role.key]: { ...s[role.key], label: e.target.value } }))
                  }
                  className={cls.input + " w-48"}
                />
                <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
                  {role.key}
                </span>
                {role.isAdmin && (
                  <span className="rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    acesso total
                  </span>
                )}
              </div>
              {!role.builtin && !role.isAdmin && (
                <button onClick={() => deleteRole(role.key)} className={cls.btnDanger}>
                  Excluir
                </button>
              )}
            </div>

            {!role.isAdmin && (
              <>
                <div className="flex flex-wrap gap-2">
                  {ADMIN_PAGES.map((p) => {
                    const on = (edit[role.key]?.pages ?? role.pages).includes(p.key);
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => togglePage(role.key, p.key)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                          on
                            ? "border-brand bg-brand-subtle text-brand-subtle-fg"
                            : "border-border bg-surface text-muted hover:border-brand"
                        }`}
                      >
                        {on ? "✓ " : ""}
                        {p.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => saveRole(role.key)}
                  disabled={savingRole === role.key}
                  className={cls.btn + " disabled:opacity-50"}
                >
                  {savingRole === role.key ? "Salvando..." : "Salvar papel"}
                </button>
              </>
            )}
          </div>
        ))}

        {/* Novo papel */}
        <form onSubmit={createRole} className={cls.card + " space-y-3"}>
          <h3 className="font-semibold">Novo nível</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={cls.label}>Chave (sem espaços)</label>
              <input
                required
                value={nkey}
                onChange={(e) => setNkey(e.target.value.toLowerCase())}
                placeholder="avaliador"
                className={cls.input}
              />
            </div>
            <div>
              <label className={cls.label}>Nome</label>
              <input
                required
                value={nlabel}
                onChange={(e) => setNlabel(e.target.value)}
                placeholder="Avaliador"
                className={cls.input}
              />
            </div>
          </div>
          <div>
            <label className={cls.label}>Acessos</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ADMIN_PAGES.map((p) => {
                const on = npages.includes(p.key);
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() =>
                      setNpages((s) => (s.includes(p.key) ? s.filter((x) => x !== p.key) : [...s, p.key]))
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      on
                        ? "border-brand bg-brand-subtle text-brand-subtle-fg"
                        : "border-border bg-surface text-muted hover:border-brand"
                    }`}
                  >
                    {on ? "✓ " : ""}
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <button type="submit" disabled={creatingRole} className={cls.btn + " disabled:opacity-50"}>
            {creatingRole ? "Criando..." : "Criar nível"}
          </button>
        </form>
      </section>

      {/* Usuários */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Usuários</h2>

        <form onSubmit={createUser} className={cls.card + " grid gap-3 sm:grid-cols-4"}>
          <div className="sm:col-span-2">
            <label className={cls.label}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cls.input}
              placeholder="usuario@vendy.com"
            />
          </div>
          <div>
            <label className={cls.label}>Senha</label>
            <input
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cls.input}
              placeholder="mín. 8"
            />
          </div>
          <div>
            <label className={cls.label}>Papel</label>
            <select value={urole} onChange={(e) => setUrole(e.target.value)} className={cls.input}>
              {roleOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4">
            <button type="submit" disabled={creatingUser} className={cls.btn + " disabled:opacity-50"}>
              {creatingUser ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>

        <div className={cls.card}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr>
                  <th className={cls.th}>E-mail</th>
                  <th className={cls.th}>Papel</th>
                  <th className={cls.th}></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const value = editedUser[u.id] ?? u.role ?? "tecnico";
                  const changed = editedUser[u.id] && editedUser[u.id] !== u.role;
                  return (
                    <tr key={u.id}>
                      <td className={cls.td}>{u.email ?? "—"}</td>
                      <td className={cls.td}>
                        <select
                          value={value}
                          onChange={(e) =>
                            setEditedUser((s) => ({ ...s, [u.id]: e.target.value }))
                          }
                          className={cls.input + " w-44"}
                        >
                          {/* admin sempre disponível, mesmo não estando na lista editável */}
                          {!roleOptions.some((o) => o.value === "admin") && (
                            <option value="admin">Administrador</option>
                          )}
                          {roleOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className={cls.td}>
                        <button
                          onClick={() => saveUserRole(u.id)}
                          disabled={!changed || savingUser === u.id}
                          className={cls.btnGhost + " disabled:opacity-40"}
                        >
                          {savingUser === u.id ? "Salvando..." : "Salvar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
