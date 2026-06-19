import { PipeTransform, BadRequestException } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Valida o payload contra um schema Zod (de @vendy/shared) e retorna os dados
 * tipados. Lanca 400 com a lista de problemas quando invalido.
 */
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: "Dados invalidos",
        issues: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    return result.data;
  }
}
