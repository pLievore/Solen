import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SupabaseAuthGuard } from "../auth/auth.guard";

type PutItem = {
  detailedStateId: string;
  assigned: boolean;
  yesDelta: number; // centavos
  noDelta: number;
};

/**
 * Descontos (estados detalhados) por MODELO: o valor definido aqui e gravado
 * como override em TODAS as versoes do modelo. O motor de calculo usa
 * yesDeltaOverride/noDeltaOverride ?? delta global.
 */
@Controller("admin/models")
@UseGuards(SupabaseAuthGuard)
export class ModelDetailedStatesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":id/detailed-states")
  async get(@Param("id") id: string) {
    const model = await this.prisma.deviceModel.findUnique({
      where: { id },
      include: { variants: { select: { id: true } } },
    });
    if (!model) throw new NotFoundException("Modelo nao encontrado");

    const versionIds = model.variants.map((v) => v.id);
    const [detailed, links] = await Promise.all([
      this.prisma.detailedState.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
      versionIds.length
        ? this.prisma.variantDetailedState.findMany({ where: { variantId: { in: versionIds } } })
        : Promise.resolve([]),
    ]);

    const items = detailed.map((ds) => {
      const dsLinks = links.filter((l) => l.detailedStateId === ds.id);
      const assigned = dsLinks.length > 0;
      const yesOverride = dsLinks.find((l) => l.yesDeltaOverride != null)?.yesDeltaOverride;
      const noOverride = dsLinks.find((l) => l.noDeltaOverride != null)?.noDeltaOverride;
      return {
        detailedStateId: ds.id,
        question: ds.question,
        helpText: ds.helpText,
        globalYesDelta: ds.yesDelta,
        globalNoDelta: ds.noDelta,
        assigned,
        yesDelta: yesOverride ?? ds.yesDelta,
        noDelta: noOverride ?? ds.noDelta,
      };
    });

    return {
      model: { id: model.id, name: model.name },
      versionsCount: versionIds.length,
      items,
    };
  }

  @Put(":id/detailed-states")
  async set(@Param("id") id: string, @Body() body: { items?: PutItem[] }) {
    if (!Array.isArray(body?.items)) {
      throw new BadRequestException("Envie 'items' (array).");
    }
    const model = await this.prisma.deviceModel.findUnique({
      where: { id },
      include: { variants: { select: { id: true } } },
    });
    if (!model) throw new NotFoundException("Modelo nao encontrado");
    const versionIds = model.variants.map((v) => v.id);

    for (const item of body.items) {
      if (typeof item?.detailedStateId !== "string") continue;
      if (item.assigned) {
        const yes = Math.round(Number(item.yesDelta) || 0);
        const no = Math.round(Number(item.noDelta) || 0);
        await Promise.all(
          versionIds.map((variantId) =>
            this.prisma.variantDetailedState.upsert({
              where: {
                variantId_detailedStateId: { variantId, detailedStateId: item.detailedStateId },
              },
              update: { yesDeltaOverride: yes, noDeltaOverride: no },
              create: {
                variantId,
                detailedStateId: item.detailedStateId,
                yesDeltaOverride: yes,
                noDeltaOverride: no,
              },
            }),
          ),
        );
      } else if (versionIds.length) {
        await this.prisma.variantDetailedState.deleteMany({
          where: { variantId: { in: versionIds }, detailedStateId: item.detailedStateId },
        });
      }
    }

    return this.get(id);
  }
}
