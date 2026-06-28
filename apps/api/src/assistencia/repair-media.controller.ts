import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { REPAIR_SLOTS } from "@vendy/shared";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser, type AuthUser } from "../auth/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseService } from "../auth/supabase.service";

interface UploadedFileLike {
  buffer: Buffer;
  size: number;
  mimetype: string;
}

const MAX_IMAGE = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO = 40 * 1024 * 1024; // 40 MB (clipe de ~10s)
const RETENTION_DAYS = 90;
const SIGNED_TTL = 3600; // 1h

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

@Controller("admin")
@UseGuards(SupabaseAuthGuard)
export class RepairMediaController {
  private readonly bucket = process.env.SUPABASE_ASSIST_BUCKET ?? "assistencia";

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  /** POST /admin/repair-devices/:id/media — anexa foto/vídeo a um slot. */
  @Post("repair-devices/:id/media")
  @Roles("admin", "tecnico")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_VIDEO, files: 1 } }))
  async upload(
    @Param("id") deviceId: string,
    @Body("slot") slot: string,
    @UploadedFile() file: UploadedFileLike | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    await this.assertAccess(deviceId, user);
    if (!REPAIR_SLOTS.includes(slot)) {
      throw new BadRequestException("Item de comprovação inválido.");
    }
    if (!file) throw new BadRequestException("Arquivo ausente (campo 'file').");

    const mime = file.mimetype ?? "";
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");
    if (!isImage && !isVideo) {
      throw new BadRequestException("Envie uma imagem ou um vídeo.");
    }
    if (isImage && file.size > MAX_IMAGE) {
      throw new BadRequestException("A imagem deve ter no máximo 8 MB.");
    }
    if (isVideo && file.size > MAX_VIDEO) {
      throw new BadRequestException("O vídeo deve ter no máximo 40 MB.");
    }

    const sb = this.supabase.client;
    await this.ensureBucket();

    const ext = EXT_BY_MIME[mime] ?? mime.split("/")[1] ?? "bin";
    const path = `repair/${deviceId}/${slot}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error } = await sb.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: mime, upsert: false });
    if (error) throw new BadRequestException(error.message);

    const media = await this.prisma.repairMedia.create({
      data: { deviceId, slot, kind: isImage ? "photo" : "video", path },
    });

    // Retenção sob demanda (não bloqueia a resposta).
    this.runRetention().catch(() => {/* silencioso */});

    return { ...media, url: await this.signed(path) };
  }

  /** GET /admin/repair-devices/:id/media — lista as comprovações (URLs assinadas). */
  @Get("repair-devices/:id/media")
  @Roles("admin", "tecnico")
  async list(@Param("id") deviceId: string, @CurrentUser() user: AuthUser) {
    await this.assertAccess(deviceId, user);
    const items = await this.prisma.repairMedia.findMany({
      where: { deviceId },
      orderBy: { createdAt: "asc" },
    });
    return Promise.all(
      items.map(async (m) => ({ ...m, url: await this.signed(m.path) })),
    );
  }

  /** DELETE /admin/repair-media/:mediaId — remove uma comprovação. */
  @Delete("repair-media/:mediaId")
  @Roles("admin", "tecnico")
  async remove(@Param("mediaId") id: string, @CurrentUser() user: AuthUser) {
    const media = await this.prisma.repairMedia.findUnique({
      where: { id },
      include: { device: { select: { technicianId: true } } },
    });
    if (!media) throw new NotFoundException("Mídia não encontrada");
    if (user.role === "tecnico" && media.device.technicianId !== user.id) {
      throw new ForbiddenException("Sem acesso a esta mídia");
    }
    await this.supabase.client.storage.from(this.bucket).remove([media.path]);
    await this.prisma.repairMedia.delete({ where: { id } });
    return { id };
  }

  /** POST /admin/repair-media/cleanup — apaga mídias com mais de 90 dias (admin / cron externo). */
  @Post("repair-media/cleanup")
  async cleanup() {
    return { removed: await this.runRetention() };
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  private async assertAccess(deviceId: string, user: AuthUser) {
    const device = await this.prisma.repairDevice.findUnique({
      where: { id: deviceId },
      select: { id: true, technicianId: true },
    });
    if (!device) throw new NotFoundException("Aparelho não encontrado");
    if (user.role === "tecnico" && device.technicianId !== user.id) {
      throw new ForbiddenException("Sem acesso a este aparelho");
    }
    return device;
  }

  private async signed(path: string): Promise<string | null> {
    const { data } = await this.supabase.client.storage
      .from(this.bucket)
      .createSignedUrl(path, SIGNED_TTL);
    return data?.signedUrl ?? null;
  }

  private async ensureBucket() {
    const sb = this.supabase.client;
    const { data: buckets } = await sb.storage.listBuckets();
    if (!buckets?.some((b) => b.name === this.bucket)) {
      await sb.storage.createBucket(this.bucket, { public: false });
    }
  }

  private async runRetention(): Promise<number> {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
    const old = await this.prisma.repairMedia.findMany({
      where: { createdAt: { lt: cutoff } },
      select: { id: true, path: true },
    });
    if (old.length === 0) return 0;
    await this.supabase.client.storage
      .from(this.bucket)
      .remove(old.map((o) => o.path));
    await this.prisma.repairMedia.deleteMany({
      where: { id: { in: old.map((o) => o.id) } },
    });
    return old.length;
  }
}
