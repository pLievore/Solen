import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { createSign } from "crypto";

type ServiceAccountKey = { client_email: string; private_key: string };

/**
 * Cliente minimalista da GA4 Data API (runReport) usando autenticacao por
 * service account. Assina o JWT com o `crypto` nativo e troca por um access
 * token — sem dependencias externas. Token fica em cache em memoria (~1h).
 *
 * Configuracao via env:
 *   - GA4_PROPERTY_ID   -> numero da propriedade (ex.: 542400286)
 *   - GA_SA_KEY_BASE64  -> JSON da service account em base64
 */
@Injectable()
export class Ga4Service {
  private readonly logger = new Logger(Ga4Service.name);
  private cachedToken: { value: string; exp: number } | null = null;

  get propertyId(): string | null {
    return process.env.GA4_PROPERTY_ID?.trim() || null;
  }

  /** True quando ha property id + chave valida configurados. */
  get configured(): boolean {
    return Boolean(this.propertyId && this.loadKey());
  }

  private loadKey(): ServiceAccountKey | null {
    const b64 = process.env.GA_SA_KEY_BASE64?.trim();
    if (!b64) return null;
    try {
      const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
      if (typeof json.client_email !== "string" || typeof json.private_key !== "string") {
        return null;
      }
      return { client_email: json.client_email, private_key: json.private_key };
    } catch {
      this.logger.warn("GA_SA_KEY_BASE64 invalido (nao foi possivel decodificar).");
      return null;
    }
  }

  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedToken && this.cachedToken.exp > now + 60) {
      return this.cachedToken.value;
    }

    const key = this.loadKey();
    if (!key) throw new ServiceUnavailableException("Analytics nao configurado.");

    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claim = base64url(
      JSON.stringify({
        iss: key.client_email,
        scope: "https://www.googleapis.com/auth/analytics.readonly",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    );
    const signingInput = `${header}.${claim}`;
    const signature = createSign("RSA-SHA256")
      .update(signingInput)
      .sign(key.private_key)
      .toString("base64url");
    const assertion = `${signingInput}.${signature}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });
    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Falha ao autenticar no Google (${res.status}).`,
      );
    }
    const data = (await res.json()) as { access_token: string; expires_in?: number };
    this.cachedToken = {
      value: data.access_token,
      exp: now + (data.expires_in ?? 3600),
    };
    return this.cachedToken.value;
  }

  /** Executa um runReport na propriedade configurada. */
  async runReport(body: Record<string, unknown>): Promise<GaReport> {
    const token = await this.getAccessToken();
    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      this.logger.warn(`GA Data API ${res.status}: ${detail}`);
      throw new ServiceUnavailableException(
        `Erro ao consultar o Google Analytics (${res.status}).`,
      );
    }
    return (await res.json()) as GaReport;
  }
}

export type GaReport = {
  rows?: {
    dimensionValues?: { value: string }[];
    metricValues?: { value: string }[];
  }[];
  metricHeaders?: { name: string }[];
};

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}
