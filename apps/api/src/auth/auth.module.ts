import { Global, Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { SupabaseAuthGuard } from "./auth.guard";

@Global()
@Module({
  providers: [SupabaseService, SupabaseAuthGuard],
  exports: [SupabaseService, SupabaseAuthGuard],
})
export class AuthModule {}
