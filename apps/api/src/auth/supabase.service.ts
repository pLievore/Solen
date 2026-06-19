import { Injectable } from "@nestjs/common";
import type { WebSocketLikeConstructor } from "@supabase/realtime-js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const serverWebSocket = WebSocket as unknown as WebSocketLikeConstructor;

/**
 * Cliente Supabase no servidor (chave secreta = service role).
 * Usado para validar o JWT do usuario logado no painel.
 */
@Injectable()
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error(
        "SUPABASE_URL e SUPABASE_SECRET_KEY sao obrigatorias para a autenticacao.",
      );
    }
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: serverWebSocket },
    });
  }
}
