import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export type AuthUser = { id: string; email?: string; role: string };

/** Injeta o usuario autenticado (definido pelo SupabaseAuthGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user: AuthUser }>();
    return req.user;
  },
);
