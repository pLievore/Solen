import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { SupabaseService } from "./supabase.service";

/**
 * Protege rotas do painel: exige um Bearer token (JWT do Supabase Auth)
 * valido. Em sucesso, anexa o usuario em req.user.
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

    (req as Request & { user?: unknown }).user = {
      id: data.user.id,
      email: data.user.email,
    };
    return true;
  }
}
