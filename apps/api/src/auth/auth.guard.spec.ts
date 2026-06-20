import assert from "node:assert/strict";
import test from "node:test";
import {
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { SupabaseAuthGuard } from "./auth.guard";
import type { SupabaseService } from "./supabase.service";

function context(authorization?: string): {
  context: ExecutionContext;
  request: { headers: { authorization?: string }; user?: unknown };
} {
  const request = { headers: { authorization } };
  return {
    request,
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext,
  };
}

function guardFor(user: unknown, error: unknown = null) {
  const service = {
    client: {
      auth: {
        getUser: async () => ({ data: { user }, error }),
      },
    },
  } as unknown as SupabaseService;
  return new SupabaseAuthGuard(service);
}

test("rejeita requisição sem bearer token", async () => {
  const { context: ctx } = context();
  await assert.rejects(
    () => guardFor(null).canActivate(ctx),
    UnauthorizedException,
  );
});

test("rejeita usuário autenticado sem papel admin", async () => {
  const { context: ctx } = context("Bearer token-valido");
  await assert.rejects(
    () =>
      guardFor({
        id: "user-1",
        email: "user@example.com",
        app_metadata: {},
      }).canActivate(ctx),
    ForbiddenException,
  );
});

test("autoriza usuário com app_metadata.role admin", async () => {
  const { context: ctx, request } = context("Bearer token-valido");
  const allowed = await guardFor({
    id: "admin-1",
    email: "admin@example.com",
    app_metadata: { role: "admin" },
  }).canActivate(ctx);

  assert.equal(allowed, true);
  assert.deepEqual(request.user, {
    id: "admin-1",
    email: "admin@example.com",
    role: "admin",
  });
});
