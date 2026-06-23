import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import {
  pickupPointLabel,
  type CreateProposal,
  type CreateProposalResponse,
} from "@vendy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { QuoteService } from "../evaluation/quote.service";

type MessageParts = {
  token: string;
  variantLabel: string;
  conditionLabel: string;
  valueFormatted: string;
  name: string;
  whatsapp: string;
  pickupLabel: string | null;
};

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

@Injectable()
export class ProposalService {
  private readonly logger = new Logger(ProposalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly quoteService: QuoteService,
    private readonly config: ConfigService,
  ) {}

  private generateToken(): string {
    // 8 hex chars uppercase, ex: "A3F9B012"
    return randomBytes(4).toString("hex").toUpperCase();
  }

  async create(input: CreateProposal): Promise<CreateProposalResponse> {
    // 1. Calculate quote (reuses existing pricing engine)
    const quote = await this.quoteService.quote(input.quote);

    // 2. Fetch variant + model for display names
    const variant = await this.prisma.variant.findUnique({
      where: { id: input.quote.variantId },
      include: { model: true },
    });
    const variantLabel = variant
      ? variant.name.startsWith(variant.model.name)
        ? variant.name
        : `${variant.model.name} ${variant.name}`
      : input.quote.variantId;

    const conditionLabel = await this.resolveConditionLabel(
      quote.isScrap,
      input.quote.conditionStateId ?? null,
    );

    // 3. Generate token and build WhatsApp URL. O ponto de coleta normalmente
    // ainda nao foi escolhido aqui (lead criado antes de ver o valor).
    const pickupLabel = input.pickupPointId
      ? pickupPointLabel(input.pickupPointId)
      : null;
    const token = this.generateToken();
    const whatsappUrl = await this.buildWhatsappUrl({
      token,
      variantLabel,
      conditionLabel,
      valueFormatted: quote.valueFormatted,
      name: input.seller.name,
      whatsapp: input.seller.whatsapp,
      pickupLabel,
    });

    // 4. Persist proposal (o lead ja fica salvo, mesmo que o usuario nao siga)
    await this.prisma.proposal.create({
      data: {
        token,
        variantId: input.quote.variantId,
        conditionStateId: input.quote.conditionStateId ?? null,
        isScrap: quote.isScrap,
        answers: {
          knockout: input.quote.knockoutAnswers,
          detailed: input.quote.detailedAnswers,
        },
        calculatedValue: quote.value,
        breakdown: quote.breakdown as object[],
        sellerName: input.seller.name,
        sellerWhatsapp: input.seller.whatsapp,
        cep: input.seller.cep ?? null,
        city: input.seller.city ?? null,
        neighborhood: input.seller.neighborhood ?? null,
        street: input.seller.street ?? null,
        number: input.seller.number ?? null,
        pickupPoint: pickupLabel,
        status: "NEW",
      },
    });

    // 5. Envia a notificação sem atrasar a resposta, mas registra falhas.
    this.sendEmailNotification(
      token,
      variantLabel,
      quote.valueFormatted,
      quote.isScrap,
      input.seller.name,
      input.seller.whatsapp,
      pickupLabel,
    ).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Falha ao notificar a proposta ${token}: ${message}`);
    });

    return {
      token,
      value: quote.value,
      valueFormatted: quote.valueFormatted,
      isScrap: quote.isScrap,
      breakdown: quote.breakdown,
      whatsappUrl,
    };
  }

  /**
   * Grava o ponto de coleta numa proposta ja criada e devolve a URL do
   * WhatsApp atualizada. Usado quando o usuario escolhe o ponto apos ver o valor.
   */
  async updatePickup(
    token: string,
    pickupPointId: string,
  ): Promise<{ whatsappUrl: string }> {
    const proposal = await this.prisma.proposal.findUnique({
      where: { token },
      include: { variant: { include: { model: true } } },
    });
    if (!proposal) throw new NotFoundException("Proposta não encontrada");

    const variantLabel = proposal.variant
      ? proposal.variant.name.startsWith(proposal.variant.model.name)
        ? proposal.variant.name
        : `${proposal.variant.model.name} ${proposal.variant.name}`
      : proposal.variantId;
    const conditionLabel = await this.resolveConditionLabel(
      proposal.isScrap,
      proposal.conditionStateId,
    );
    const pickupLabel = pickupPointLabel(pickupPointId);

    const whatsappUrl = await this.buildWhatsappUrl({
      token: proposal.token,
      variantLabel,
      conditionLabel,
      valueFormatted: formatBRL(proposal.calculatedValue),
      name: proposal.sellerName,
      whatsapp: proposal.sellerWhatsapp,
      pickupLabel,
    });

    await this.prisma.proposal.update({
      where: { token },
      data: { pickupPoint: pickupLabel },
    });

    return { whatsappUrl };
  }

  private async resolveConditionLabel(
    isScrap: boolean,
    conditionStateId: string | null,
  ): Promise<string> {
    if (isScrap) return "Aproveitamento de peças";
    if (!conditionStateId) return "";
    const state = await this.prisma.conditionState.findUnique({
      where: { id: conditionStateId },
      select: { label: true },
    });
    return state?.label ?? "";
  }

  private async buildWhatsappUrl(parts: MessageParts): Promise<string> {
    const [phoneSetting, templateSetting] = await Promise.all([
      this.prisma.setting.findUnique({ where: { key: "whatsapp_phone" } }),
      this.prisma.setting.findUnique({ where: { key: "whatsapp_message_template" } }),
    ]);

    const phone =
      typeof phoneSetting?.value === "string" ? phoneSetting.value : "";
    const defaultTemplate =
      "Olá! Quero vender {variant}. Proposta nº {token} — Valor: {value}. Nome: {name}.";
    const template =
      typeof templateSetting?.value === "string"
        ? templateSetting.value
        : defaultTemplate;

    const pickupText = parts.pickupLabel ?? "A combinar";
    let message = template
      .replaceAll("{token}", parts.token)
      .replaceAll("{variant}", parts.variantLabel)
      .replaceAll("{condition}", parts.conditionLabel)
      .replaceAll("{value}", parts.valueFormatted)
      .replaceAll("{name}", parts.name)
      .replaceAll("{whatsapp}", parts.whatsapp)
      .replaceAll("{pickup}", pickupText);

    // Garante o ponto de coleta na mensagem (quando escolhido) mesmo que o
    // template não use {pickup}.
    if (parts.pickupLabel && !template.includes("{pickup}")) {
      message += `\nPonto de coleta: ${parts.pickupLabel}`;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  private async sendEmailNotification(
    token: string,
    variantLabel: string,
    valueFormatted: string,
    isScrap: boolean,
    name: string,
    whatsapp: string,
    pickupLabel: string | null,
  ): Promise<void> {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    const notifyEmailSetting = await this.prisma.setting.findUnique({
      where: { key: "notify_email" },
    });
    const notifyEmail =
      typeof notifyEmailSetting?.value === "string"
        ? notifyEmailSetting.value
        : null;

    if (!apiKey || !notifyEmail) return;

    const from =
      this.config.get<string>("RESEND_FROM_EMAIL") ?? "propostas@vendy.com.br";
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from,
      to: notifyEmail,
      subject: `[Vendy] Nova proposta ${token} — ${variantLabel}`,
      text: [
        `Nova proposta recebida!`,
        ``,
        `Token:    ${token}`,
        `Aparelho: ${variantLabel}`,
        `Valor:    ${valueFormatted}`,
        `Sucata:   ${isScrap ? "Sim" : "Não"}`,
        `Coleta:   ${pickupLabel ?? "A combinar"}`,
        ``,
        `Vendedor:`,
        `  Nome:      ${name}`,
        `  WhatsApp:  ${whatsapp}`,
      ].join("\n"),
    });
  }
}
