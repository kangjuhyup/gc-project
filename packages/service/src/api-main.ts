import { MikroORM } from '@mikro-orm/core';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { ENV_KEY } from '@infrastructure/config';
import { buildCorsOptions } from '@infrastructure/config/cors.config';
import { ApplicationErrorInterceptor } from '@presentation';
import {
  buildSwaggerConfig,
  SWAGGER_DOCUMENT_PATH,
  SWAGGER_JSON_PATH,
} from '@presentation/swagger/swagger.config';
import { ApiAppModule } from './api-app.module';

export async function bootstrapApi(): Promise<INestApplication> {
  const app = await NestFactory.create(ApiAppModule);
  const configService = app.get(ConfigService);
  const corsOptions = buildCorsOptions(configService.get<string>(ENV_KEY.NODE_ENV));

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

  await runMigrationsOnStartup(app, configService);
  await app.listen(configService.getOrThrow<number>(ENV_KEY.PORT));

  return app;
}

async function runMigrationsOnStartup(
  app: INestApplication,
  configService: ConfigService,
): Promise<void> {
  if (!configService.getOrThrow<boolean>(ENV_KEY.MIGRATIONS_RUN_ON_STARTUP)) {
    return;
  }

  await app.get(MikroORM).migrator.up();
}

if (require.main === module) {
  void bootstrapApi();
}
