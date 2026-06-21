import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import {
  pickupPointLabel,
  type CreateProposal,
  type CreateProposalResponse,
  type QuoteResponse,
} from "@vendy/shared";
import { PrismaService } from "../prisma/prisma.service";
import { QuoteService } from "../evaluation/quote.service";

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

    const conditionLabel = quote.isScrap
      ? "Aproveitamento de peças"
      : input.quote.conditionStateId
        ? (
            await this.prisma.conditionState.findUnique({
              where: { id: input.quote.conditionStateId },
              select: { label: true },
            })
          )?.label ?? ""
        : "";

    // 3. Generate token and build WhatsApp URL
    const pickupLabel = pickupPointLabel(input.pickupPointId);
    const token = this.generateToken();
    const whatsappUrl = await this.buildWhatsappUrl(
      token,
      input,
      quote,
      variantLabel,
      conditionLabel,
      pickupLabel,
    );

    // 4. Persist proposal
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
        cep: input.seller.cep,
        city: input.seller.city,
        neighborhood: input.seller.neighborhood,
        street: input.seller.street,
        number: input.seller.number,
        pickupPoint: pickupLabel,
        status: "NEW",
      },
    });

    // 5. Envia a notificação sem atrasar a resposta, mas registra falhas.
    this.sendEmailNotification(
      token,
      input,
      quote,
      variantLabel,
      pickupLabel,
    ).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Falha ao notificar a proposta ${token}: ${message}`);
    });

    return {
      token,
      value: quote.value,
      valueFormatted: quote.valueFormatted,
      whatsappUrl,
    };
  }

  private async buildWhatsappUrl(
    token: string,
    input: CreateProposal,
    quote: QuoteResponse,
    variantLabel: string,
    conditionLabel: string,
    pickupLabel: string,
  ): Promise<string> {
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

    let message = template
      .replaceAll("{token}", token)
      .replaceAll("{variant}", variantLabel)
      .replaceAll("{condition}", conditionLabel)
      .replaceAll("{value}", quote.valueFormatted)
      .replaceAll("{name}", input.seller.name)
      .replaceAll("{whatsapp}", input.seller.whatsapp)
      .replaceAll("{pickup}", pickupLabel);

    // Garante o ponto de coleta na mensagem mesmo que o template não use {pickup}.
    if (!template.includes("{pickup}")) {
      message += `\nPonto de coleta: ${pickupLabel}`;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }

  private async sendEmailNotification(
    token: string,
    input: CreateProposal,
    quote: QuoteResponse,
    variantLabel: string,
    pickupLabel: string,
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
        `Valor:    ${quote.valueFormatted}`,
        `Sucata:   ${quote.isScrap ? "Sim" : "Não"}`,
        `Coleta:   ${pickupLabel}`,
        ``,
        `Vendedor:`,
        `  Nome:      ${input.seller.name}`,
        `  WhatsApp:  ${input.seller.whatsapp}`,
        `  CEP:       ${input.seller.cep}`,
        `  Cidade:    ${input.seller.city}`,
        `  Bairro:    ${input.seller.neighborhood}`,
        `  Endereço:  ${input.seller.street}, ${input.seller.number}`,
      ].join("\n"),
    });
  }
}
