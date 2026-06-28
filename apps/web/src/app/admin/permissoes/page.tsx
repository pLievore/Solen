"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin-api";
import { cls } from "@/lib/ui";

type Role = "admin" | "tecnico";
type User = {
  id: string;
  email: string | null;
  role: string | null;
  createdAt: string;
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  tecnico: "Técnico",
};

export default function PermissoesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [edited, setEdited] = useState<Record<string, Role>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // criar usuário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("tecnico");
  const [creating, setCreating] = useState(false);

  async function load() {
    setError(null);
    try {
      setUsers(await adminApi.get<User[]>("/admin/users"));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveRole(id: string) {
    const role = edited[id];
    if (!role) return;
    setSavingId(id);
    setMsg(null);
    setError(null);
    try {
      await adminApi.patch(`/admin/users/${id}/role`, { role });
      setUsers((us) => us.map((u) => (u.id === id ? { ...u, role } : u)));
      setEdited((e) => {
        const n = { ...e };
        delete n[id];
        return n;
      });
      setMsg("Papel atualizado.");
      setTimeout(() => setMsg(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMsg(null);
    setError(null);
    try {
      await adminApi.post("/admin/users", { email: email.trim(), password, role: newRole });
      setEmail("");
      setPassword("");
      setNewRole("tecnico");
      setMsg("Usuário criado.");
      setTimeout(() => setMsg(null), 2500);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Permissões</h1>
        <p className="text-sm text-muted">
          Gerencie os usuários do painel e seus papéis. <strong>Técnico</strong>{" "}
          acessa apenas a Assistência técnica; <strong>Administrador</strong>{" "}
          acessa tudo.
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {msg && <p className="rounded bg-brand/10 px-3 py-2 text-sm text-brand">{msg}</p>}

      {/* Criar usuário */}
      <form onSubmit={createUser} className={cls.card + " space-y-3"}>
        <h2 className="font-semibold">Criar usuário</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className={cls.label}>E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cls.input}
              placeholder="tecnico@vendy.com"
            />
          </div>
          <div>
            <label className={cls.label}>Papel</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className={cls.input}
            >
              <option value="tecnico">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={cls.label}>Senha</label>
            <input
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cls.input}
              placeholder="mínimo 8 caracteres"
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={creating} className={cls.btn + " w-full disabled:opacity-50"}>
              {creating ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </div>
      </form>

      {/* Lista de usuários */}
      <div className={cls.card + " space-y-1"}>
        <h2 className="mb-2 font-semibold">Usuários ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr>
                <th className={cls.th}>E-mail</th>
                <th className={cls.th}>Papel</th>
                <th className={cls.th}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const value = (edited[u.id] ?? u.role ?? "tecnico") as Role;
                const changed = edited[u.id] && edited[u.id] !== u.role;
                return (
                  <tr key={u.id}>
                    <td className={cls.td}>
                      {u.email ?? "—"}
                      {u.role && (
                        <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">
                          {ROLE_LABEL[u.role] ?? u.role}
                        </span>
                      )}
                    </td>
                    <td className={cls.td}>
                      <select
                        value={value}
                        onChange={(e) =>
                          setEdited((ed) => ({ ...ed, [u.id]: e.target.value as Role }))
                        }
                        className={cls.input + " w-40"}
                      >
                        <option value="tecnico">Técnico</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td className={cls.td}>
                      <button
                        onClick={() => saveRole(u.id)}
                        disabled={!changed || savingId === u.id}
                        className={cls.btnGhost + " disabled:opacity-40"}
                      >
                        {savingId === u.id ? "Salvando..." : "Salvar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-muted">
                    Nenhum usuário.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
