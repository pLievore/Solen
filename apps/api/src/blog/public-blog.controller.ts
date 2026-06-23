import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { sanitizePostHtml } from "./sanitize-post-html";

const listQuerySchema = z.object({
  skip: z.coerce.number().int().min(0).default(0),
  take: z.coerce.number().int().min(1).max(50).default(10),
});
type ListQuery = z.infer<typeof listQuerySchema>;

/** Endpoints públicos do blog — sem autenticação. */
@Controller("blog")
export class PublicBlogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(listQuerySchema)) q: ListQuery) {
    const where = { status: "PUBLISHED" };
    const [total, items] = await Promise.all([
      this.prisma.post.count({ where }),
      this.prisma.post.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: q.skip,
        take: q.take,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          publishedAt: true,
          updatedAt: true,
        },
      }),
    ]);
    return { total, skip: q.skip, take: q.take, items };
  }

  @Get(":slug")
  async post(@Param("slug") slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    if (!post) throw new NotFoundException("Post não encontrado");
    return { ...post, content: sanitizePostHtml(post.content) };
  }
}
