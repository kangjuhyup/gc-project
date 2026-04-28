import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApplicationErrorInterceptor } from '@presentation';
import { buildSwaggerConfig, SWAGGER_DOCUMENT_PATH, SWAGGER_JSON_PATH } from '@presentation/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
