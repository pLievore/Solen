import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "roles";
export type AppRole = "admin" | "tecnico";

/**
 * Restringe uma rota a determinados papéis. Sem @Roles, o SupabaseAuthGuard
 * exige "admin" por padrão (comportamento histórico do painel).
 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
