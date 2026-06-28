import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Optional,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { SupabaseService } from "./supabase.service";
import { ROLES_KEY, type AppRole } from "./roles.decorator";

/**
 * Protege rotas do painel: exige um Bearer token válido do Supabase Auth.
 * Por padrão exige o papel "admin"; rotas com @Roles(...) aceitam os papéis
 * declarados. Em sucesso, anexa o usuário em req.user.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    @Optional() private readonly reflector?: Reflector,
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

    const required =
      this.reflector?.getAllAndOverride<AppRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? (["admin"] as AppRole[]);

    const role = data.user.app_metadata?.role as string | undefined;
    if (!role || !required.includes(role as AppRole)) {
      throw new ForbiddenException("Usuario sem acesso a este recurso");
    }

    (req as Request & { user?: unknown }).user = {
      id: data.user.id,
      email: data.user.email,
      role,
    };
    return true;
  }
}
