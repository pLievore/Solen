import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.enableCors({
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:3000").split(","),
    credentials: true,
  });

  const port = Number(process.env.API_PORT ?? 3333);
  await app.listen(port);
  new Logger("Bootstrap").log(`API Solen rodando em http://localhost:${port}/api`);
}

bootstrap();
