import { Module, type Provider } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  ChangeMemberPasswordCommandHandler,
  CheckUserIdAvailabilityQueryHandler,
  ConfirmPhoneVerificationCommandHandler,
  CreateSeatHoldCommandHandler,
  GetHealthQueryHandler,
  IssueTemporaryPasswordCommandHandler,
  ListMoviesQueryHandler,
  ListScreeningSeatsQueryHandler,
  ListTheatersQueryHandler,
  LoginMemberCommandHandler,
  RequestPhoneVerificationCommandHandler,
  SearchAddressesQueryHandler,
  SignupMemberCommandHandler,
} from '@application';
import { AUTHORIZATION_VERIFIER } from '@application/query/ports';
import { AddressController, HealthController, MemberController, MovieController, SeatController, TheaterController } from '@presentation/http';
import { buildSwaggerConfig } from '@presentation/swagger/swagger.config';

const documentedControllers = [
  HealthController,
  MemberController,
  AddressController,
  MovieController,
  SeatController,
  TheaterController,
];

const documentedHandlerProviders: Provider[] = [
  GetHealthQueryHandler,
  CheckUserIdAvailabilityQueryHandler,
  RequestPhoneVerificationCommandHandler,
  ConfirmPhoneVerificationCommandHandler,
  SignupMemberCommandHandler,
  LoginMemberCommandHandler,
  IssueTemporaryPasswordCommandHandler,
  ChangeMemberPasswordCommandHandler,
  CreateSeatHoldCommandHandler,
  SearchAddressesQueryHandler,
  ListMoviesQueryHandler,
  ListScreeningSeatsQueryHandler,
  ListTheatersQueryHandler,
].map((handler) => ({
  provide: handler,
  useValue: {
    execute: () => undefined,
  },
}));

const documentedAuthProvider: Provider = {
  provide: AUTHORIZATION_VERIFIER,
  useValue: {
    verify: () => undefined,
  },
};

@Module({
  controllers: documentedControllers,
  providers: [...documentedHandlerProviders, documentedAuthProvider],
})
class OpenApiDocumentModule {}

async function generateOpenApiDocument() {
  const app = await NestFactory.create(OpenApiDocumentModule, { logger: false });
  const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
  const outputPath = resolve(process.cwd(), 'docs/openapi.json');

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(document, undefined, 2)}\n`, 'utf8');

  await app.close();
}

void generateOpenApiDocument();
