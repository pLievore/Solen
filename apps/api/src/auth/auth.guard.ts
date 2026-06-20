import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { SupabaseService } from "./supabase.service";

/**
 * Protege rotas do painel: exige um Bearer token válido do Supabase Auth e
 * app_metadata.role = "admin". Em sucesso, anexa o usuário em req.user.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

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

    const role = data.user.app_metadata?.role;
    if (role !== "admin") {
      throw new ForbiddenException("Usuario sem acesso administrativo");
    }

    (req as Request & { user?: unknown }).user = {
      id: data.user.id,
      email: data.user.email,
      role,
    };
    return true;
  }
}
