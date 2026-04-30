import { MikroORM } from '@mikro-orm/core';
import { NestFactory } from '@nestjs/core';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApplicationErrorInterceptor } from '@presentation';
import { buildSwaggerConfig, SWAGGER_DOCUMENT_PATH, SWAGGER_JSON_PATH } from '@presentation/swagger/swagger.config';
import { buildCorsOptions } from '@infrastructure/config/cors.config';
import { shouldRunMigrationsOnStartup } from '@infrastructure/config/migration.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
}

async function runMigrationsOnStartup(app: INestApplication): Promise<void> {
  if (!shouldRunMigrationsOnStartup()) {
    return;
  }

  await app.get(MikroORM).migrator.up();
}

void bootstrap();
