import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { SupabaseService } from "./supabase.service";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Mapeia o caminho da API para a "página" de permissão. Rotas não mapeadas
 * (ex.: /admin/users, /admin/roles) ficam restritas ao admin. "*" = qualquer
 * usuário autenticado (ex.: /admin/me).
 */
const PAGE_RULES: [RegExp, string][] = [
  [/^\/admin\/me(\/|$)/, "*"],
  [/^\/admin\/analytics(\/|$)/, "dashboard"],
  [/^\/admin\/proposals(\/|$)/, "propostas"],
  [/^\/admin\/models\/[^/]+\/detailed-states(\/|$)/, "regras"],
  [/^\/admin\/(detailed-states|knockout-questions)(\/|$)/, "regras"],
  [/^\/admin\/(categories|variants|models|catalog|condition-states|uploads)(\/|$)/, "catalogo"],
  [/^\/admin\/posts(\/|$)/, "blog"],
  [/^\/admin\/(repair-devices|repair-media)(\/|$)/, "assistencia"],
  [/^\/admin\/settings(\/|$)/, "settings"],
];

function resolvePage(rawPath: string): string | null {
  const p = (rawPath || "").replace(/^\/api/, "").split("?")[0];
  for (const [re, page] of PAGE_RULES) if (re.test(p)) return page;
  return null; // somente admin
}

/**
 * Protege rotas do painel: exige Bearer token válido do Supabase Auth e
 * permissão para a página correspondente. O papel "admin" tem acesso total;
 * papéis personalizados são definidos na tabela `roles` (pages[]).
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Token ausente");
    }

    const { data, error } = await this.supabase.client.auth.getUser(token);
    if (error || !data?.user) {
      throw new UnauthorizedException("Sessao invalida");
    }

    const roleKey = data.user.app_metadata?.role as string | undefined;
    const attach = () => {
      (req as Request & { user?: unknown }).user = {
        id: data.user.id,
        email: data.user.email,
        role: roleKey,
      };
    };

    // Admin embutido: acesso total (não depende do banco).
    if (roleKey === "admin") {
      attach();
      return true;
    }
    if (!roleKey || !this.prisma) {
      throw new ForbiddenException("Usuario sem acesso");
    }

    const role = await this.prisma.role.findUnique({ where: { key: roleKey } });
    if (!role) throw new ForbiddenException("Papel desconhecido");
    if (role.isAdmin) {
      attach();
      return true;
    }

    const page = resolvePage(req.path ?? req.url ?? "");
    const pages = Array.isArray(role.pages) ? (role.pages as string[]) : [];
    if (page === "*" || (page !== null && pages.includes(page))) {
      attach();
      return true;
    }

    throw new ForbiddenException("Seu perfil não tem permissão para este recurso");
  }
}
