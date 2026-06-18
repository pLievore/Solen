import { Controller, Get, UseGuards } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { CurrentUser, AuthUser } from "../auth/current-user.decorator";

@Controller("admin")
@UseGuards(SupabaseAuthGuard)
export class AdminController {
  /** Echo do usuario autenticado — valida que o login do painel funciona. */
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return { user };
  }
}
