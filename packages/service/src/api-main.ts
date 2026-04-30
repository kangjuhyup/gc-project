import { MikroORM } from '@mikro-orm/core';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { buildCorsOptions } from '@infrastructure/config/cors.config';
import { shouldRunMigrationsOnStartup } from '@infrastructure/config/migration.config';
import { ApplicationErrorInterceptor } from '@presentation';
import {
  buildSwaggerConfig,
  SWAGGER_DOCUMENT_PATH,
  SWAGGER_JSON_PATH,
} from '@presentation/swagger/swagger.config';
import { ApiAppModule } from './api-app.module';

export async function bootstrapApi(): Promise<INestApplication> {
  const app = await NestFactory.create(ApiAppModule);
  const corsOptions = buildCorsOptions();

  if (corsOptions) {
    app.enableCors(corsOptions);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ApplicationErrorInterceptor());

  const swaggerDocument = SwaggerModule.createDocument(app, buildSwaggerConfig());
  SwaggerModule.setup(SWAGGER_DOCUMENT_PATH, app, swaggerDocument, {
    jsonDocumentUrl: SWAGGER_JSON_PATH,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  await runMigrationsOnStartup(app);
  await app.listen(process.env.PORT ?? 3000);

  return app;
}

async function runMigrationsOnStartup(app: INestApplication): Promise<void> {
  if (!shouldRunMigrationsOnStartup()) {
    return;
  }

  await app.get(MikroORM).migrator.up();
}

if (require.main === module) {
  void bootstrapApi();
}
