import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("config")
export class PublicSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            "home.headline",
            "whatsapp_phone",
            "privacy_contact_email",
          ],
        },
      },
      select: { key: true, value: true },
    });
    const value = (key: string) =>
      settings.find((setting) => setting.key === key)?.value;
    const headline = value("home.headline");
    const whatsappPhone = value("whatsapp_phone");
    const privacyContactEmail = value("privacy_contact_email");

    return {
      homeHeadline:
        typeof headline === "string" ? headline : "Venda seus usados na hora",
      privacyContactWhatsapp:
        typeof whatsappPhone === "string"
          ? whatsappPhone.replace(/\D/g, "")
          : null,
      privacyContactEmail:
        typeof privacyContactEmail === "string" && privacyContactEmail
          ? privacyContactEmail
          : null,
    };
  }
}
