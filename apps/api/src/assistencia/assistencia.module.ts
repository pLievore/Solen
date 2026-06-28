import { Module } from "@nestjs/common";
import { RepairDeviceController } from "./repair-device.controller";

@Module({
  controllers: [RepairDeviceController],
})
export class AssistenciaModule {}
