import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { SupabaseService } from "../auth/supabase.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

const roleSchema = z.object({ role: z.enum(["admin", "tecnico"]) });
type RoleDto = z.infer<typeof roleSchema>;

const createUserSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha de no mínimo 8 caracteres"),
  role: z.enum(["admin", "tecnico"]),
});
type CreateUserDto = z.infer<typeof createUserSchema>;

@Controller("admin")
@UseGuards(SupabaseAuthGuard)
export class AdminUsersController {
  constructor(private readonly supabase: SupabaseService) {}

  /** GET /admin/me — usuário atual (admin ou técnico). */
  @Get("me")
  @Roles("admin", "tecnico")
  me(@CurrentUser() user: AuthUser) {
    return { id: user.id, email: user.email ?? null, role: user.role };
  }

  /** GET /admin/users — lista usuários e papéis (admin). */
  @Get("users")
  async list() {
    const { data, error } = await this.supabase.client.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (error) throw new BadRequestException(error.message);
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      role: (u.app_metadata?.role as string) ?? null,
      createdAt: u.created_at,
    }));
  }

  /** POST /admin/users — cria um usuário com papel (admin). */
  @Post("users")
  async create(
    @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto,
  ) {
    const { data, error } = await this.supabase.client.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      app_metadata: { role: dto.role },
    });
    if (error) throw new BadRequestException(error.message);
    return { id: data.user?.id, email: data.user?.email ?? null, role: dto.role };
  }

  /** PATCH /admin/users/:id/role — altera o papel de um usuário (admin). */
  @Patch("users/:id/role")
  async setRole(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(roleSchema)) dto: RoleDto,
  ) {
    const { data, error } = await this.supabase.client.auth.admin.updateUserById(
      id,
      { app_metadata: { role: dto.role } },
    );
    if (error) throw new BadRequestException(error.message);
    return { id: data.user?.id, role: dto.role };
  }
}
