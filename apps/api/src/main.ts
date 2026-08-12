import "reflect-metadata";
import { config } from "dotenv";
import { join } from "path";
config({ path: join(__dirname, "..", ".env") });

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({ origin: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });

  const port = process.env.PORT ?? 3333;
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port}`);
}
bootstrap();
