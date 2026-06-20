import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Render fica atrás de proxy reverso; req.ip deve refletir o cliente para
  // que o rate limit não trate todos os visitantes como um único IP.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(helmet());
  app.setGlobalPrefix("api");
  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  // Render/Heroku injetam PORT; em dev usamos API_PORT do .env.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3333);
  await app.listen(port, "0.0.0.0");
  new Logger("Bootstrap").log(`API Vendy rodando na porta ${port} (prefixo /api)`);
}

bootstrap();
