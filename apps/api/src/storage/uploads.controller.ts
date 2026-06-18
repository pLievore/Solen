import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { SupabaseService } from "../auth/supabase.service";

interface UploadedFileLike {
  buffer: Buffer;
  size: number;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function detectImage(buffer: Buffer): { extension: string; mimeType: string } | null {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return { extension: "png", mimeType: "image/png" };
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", mimeType: "image/webp" };
  }

  if (
    buffer.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"))
  ) {
    return { extension: "gif", mimeType: "image/gif" };
  }

  return null;
}

/** Upload de icones/imagens para o Supabase Storage (bucket publico). */
@Controller("admin/uploads")
@UseGuards(SupabaseAuthGuard)
export class UploadsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post("icon")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
    }),
  )
  async uploadIcon(@UploadedFile() file?: UploadedFileLike) {
    if (!file) throw new BadRequestException("Arquivo ausente (campo 'file').");
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException("A imagem deve ter no maximo 5 MB.");
    }

    const image = detectImage(file.buffer);
    if (!image) {
      throw new BadRequestException(
        "Formato invalido. Envie PNG, JPEG, WebP ou GIF.",
      );
    }

    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "catalog";
    const sb = this.supabase.client;

    // garante o bucket (publico)
    const { data: buckets } = await sb.storage.listBuckets();
    if (!buckets?.some((b) => b.name === bucket)) {
      await sb.storage.createBucket(bucket, { public: true });
    }

    const path = `icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${image.extension}`;

    const { error } = await sb.storage
      .from(bucket)
      .upload(path, file.buffer, {
        contentType: image.mimeType,
        upsert: false,
      });
    if (error) throw new BadRequestException(error.message);

    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl };
  }
}
