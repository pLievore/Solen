import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { PrismaService } from "../prisma/prisma.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { sanitizePostHtml } from "./sanitize-post-html";

const createPostSchema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug deve ser kebab-case"),
  excerpt: z.string().optional(),
  content: z.string().default(""),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  seoTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

const updatePostSchema = createPostSchema.partial();
type CreatePost = z.infer<typeof createPostSchema>;
type UpdatePost = z.infer<typeof updatePostSchema>;

@Controller("admin/posts")
@UseGuards(SupabaseAuthGuard)
export class AdminBlogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Post não encontrado");
    return { ...post, content: sanitizePostHtml(post.content) };
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createPostSchema)) dto: CreatePost,
  ) {
    return this.prisma.post.create({
      data: {
        ...dto,
        content: sanitizePostHtml(dto.content),
        coverImageUrl: dto.coverImageUrl || null,
        publishedAt:
          dto.status === "PUBLISHED" ? new Date() : null,
      },
    });
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePostSchema)) dto: UpdatePost,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!post) throw new NotFoundException("Post não encontrado");

    // Set publishedAt when first publishing
    const publishedAt =
      dto.status === "PUBLISHED" && post.status !== "PUBLISHED"
        ? new Date()
        : undefined;

    return this.prisma.post.update({
      where: { id },
      data: {
        ...dto,
        content:
          dto.content !== undefined
            ? sanitizePostHtml(dto.content)
            : undefined,
        coverImageUrl:
          dto.coverImageUrl !== undefined
            ? dto.coverImageUrl || null
            : undefined,
        ...(publishedAt ? { publishedAt } : {}),
      },
    });
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    const post = await this.prisma.post.findUnique({ where: { id }, select: { id: true } });
    if (!post) throw new NotFoundException("Post não encontrado");
    await this.prisma.post.delete({ where: { id } });
  }
}
