import { Module } from "@nestjs/common";
import { RepairDeviceController } from "./repair-device.controller";
import { RepairMediaController } from "./repair-media.controller";

@Module({
  controllers: [RepairDeviceController, RepairMediaController],
})
export class AssistenciaModule {}
