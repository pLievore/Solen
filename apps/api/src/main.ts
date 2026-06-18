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

  // Render/Heroku injetam PORT; em dev usamos API_PORT do .env.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3333);
  await app.listen(port, "0.0.0.0");
  new Logger("Bootstrap").log(`API Solen rodando na porta ${port} (prefixo /api)`);
}

bootstrap();
