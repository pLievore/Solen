import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { ADMIN_PAGE_KEYS } from "@vendy/shared";
import { SupabaseService } from "../auth/supabase.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

const roleKeyField = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen");

const pagesField = z.array(z.enum(ADMIN_PAGE_KEYS as [string, ...string[]]));

const setUserRoleSchema = z.object({ role: roleKeyField });
const createUserSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Senha de no mínimo 8 caracteres"),
  role: roleKeyField,
});
const createRoleSchema = z.object({
  key: roleKeyField,
  label: z.string().trim().min(2).max(60),
  pages: pagesField.default([]),
});
const updateRoleSchema = z.object({
  label: z.string().trim().min(2).max(60).optional(),
  pages: pagesField.optional(),
});

@Controller("admin")
@UseGuards(SupabaseAuthGuard)
export class AdminUsersController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  /** GET /admin/me — usuário atual + permissões do seu papel. */
  @Get("me")
  async me(@CurrentUser() user: AuthUser) {
    const role = await this.resolveRole(user.role);
    return { id: user.id, email: user.email ?? null, role };
  }

  // ── Papéis ────────────────────────────────────────────────────────────────
  /** GET /admin/roles — lista de papéis. */
  @Get("roles")
  roles() {
    return this.prisma.role.findMany({ orderBy: [{ isAdmin: "desc" }, { label: "asc" }] });
  }

  /** POST /admin/roles — cria um nível de permissão. */
  @Post("roles")
  async createRole(
    @Body(new ZodValidationPipe(createRoleSchema))
    dto: z.infer<typeof createRoleSchema>,
  ) {
    if (dto.key === "admin") throw new BadRequestException("Chave reservada.");
    const exists = await this.prisma.role.findUnique({ where: { key: dto.key } });
    if (exists) throw new BadRequestException("Já existe um papel com essa chave.");
    return this.prisma.role.create({
      data: { key: dto.key, label: dto.label, pages: dto.pages },
    });
  }

  /** PATCH /admin/roles/:key — edita label/páginas (não altera papéis admin). */
  @Patch("roles/:key")
  async updateRole(
    @Param("key") key: string,
    @Body(new ZodValidationPipe(updateRoleSchema))
    dto: z.infer<typeof updateRoleSchema>,
  ) {
    const role = await this.prisma.role.findUnique({ where: { key } });
    if (!role) throw new NotFoundException("Papel não encontrado");
    if (role.isAdmin) throw new BadRequestException("O papel admin não é editável.");
    return this.prisma.role.update({
      where: { key },
      data: {
        ...(dto.label !== undefined ? { label: dto.label } : {}),
        ...(dto.pages !== undefined ? { pages: dto.pages } : {}),
      },
    });
  }

  /** DELETE /admin/roles/:key — remove um papel personalizado. */
  @Delete("roles/:key")
  async deleteRole(@Param("key") key: string) {
    const role = await this.prisma.role.findUnique({ where: { key } });
    if (!role) throw new NotFoundException("Papel não encontrado");
    if (role.builtin) throw new BadRequestException("Papel padrão não pode ser excluído.");
    await this.prisma.role.delete({ where: { key } });
    return { key };
  }

  // ── Usuários ────────────────────────────────────────────────────────────────
  /** GET /admin/users — lista usuários e papéis. */
  @Get("users")
  async listUsers() {
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

  /** POST /admin/users — cria um usuário com papel. */
  @Post("users")
  async createUser(
    @Body(new ZodValidationPipe(createUserSchema))
    dto: z.infer<typeof createUserSchema>,
  ) {
    await this.assertRoleExists(dto.role);
    const { data, error } = await this.supabase.client.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      app_metadata: { role: dto.role },
    });
    if (error) throw new BadRequestException(error.message);
    return { id: data.user?.id, email: data.user?.email ?? null, role: dto.role };
  }

  /** PATCH /admin/users/:id/role — altera o papel de um usuário. */
  @Patch("users/:id/role")
  async setUserRole(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(setUserRoleSchema))
    dto: z.infer<typeof setUserRoleSchema>,
  ) {
    await this.assertRoleExists(dto.role);
    const { data, error } = await this.supabase.client.auth.admin.updateUserById(
      id,
      { app_metadata: { role: dto.role } },
    );
    if (error) throw new BadRequestException(error.message);
    return { id: data.user?.id, role: dto.role };
  }

  // ── helpers ────────────────────────────────────────────────────────────────
  private async resolveRole(key: string | undefined) {
    if (key === "admin") {
      return { key: "admin", label: "Administrador", isAdmin: true, builtin: true, pages: [] as string[] };
    }
    const role = key ? await this.prisma.role.findUnique({ where: { key } }) : null;
    if (!role) {
      return { key: key ?? "", label: key ?? "Sem papel", isAdmin: false, builtin: false, pages: [] as string[] };
    }
    return {
      key: role.key,
      label: role.label,
      isAdmin: role.isAdmin,
      builtin: role.builtin,
      pages: Array.isArray(role.pages) ? (role.pages as string[]) : [],
    };
  }

  private async assertRoleExists(key: string) {
    if (key === "admin") return;
    const role = await this.prisma.role.findUnique({ where: { key } });
    if (!role) throw new BadRequestException("Papel inexistente.");
  }
}
