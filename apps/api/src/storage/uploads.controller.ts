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
  originalname: string;
  mimetype: string;
}

/** Upload de icones/imagens para o Supabase Storage (bucket publico). */
@Controller("admin/uploads")
@UseGuards(SupabaseAuthGuard)
export class UploadsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post("icon")
  @UseInterceptors(FileInterceptor("file"))
  async uploadIcon(@UploadedFile() file?: UploadedFileLike) {
    if (!file) throw new BadRequestException("Arquivo ausente (campo 'file').");

    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "catalog";
    const sb = this.supabase.client;

    // garante o bucket (publico)
    const { data: buckets } = await sb.storage.listBuckets();
    if (!buckets?.some((b) => b.name === bucket)) {
      await sb.storage.createBucket(bucket, { public: true });
    }

    const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "png";
    const path = `icons/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await sb.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new BadRequestException(error.message);

    const { data } = sb.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl };
  }
}
