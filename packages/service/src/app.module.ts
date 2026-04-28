import { Module } from '@nestjs/common';
import { LogLevel } from '@kangjuhyup/rvlog';
import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import {
  CLOCK,
  ClockPort,
  LOG_EVENT_PUBLISHER,
  LogEventPublisherPort,
  MEMBER_REPOSITORY,
  MemberRepositoryPort,
  PASSWORD_HASHER,
  PasswordHasherPort,
  PHONE_VERIFICATION_REPOSITORY,
  PhoneVerificationRepositoryPort,
  TEMPORARY_PASSWORD_GENERATOR,
  TemporaryPasswordGeneratorPort,
  VERIFICATION_CODE_GENERATOR,
  VerificationCodeGeneratorPort,
} from '@application/commands/ports';
import {
  ChangeMemberPasswordCommandHandler,
  ConfirmPhoneVerificationCommandHandler,
  IssueTemporaryPasswordCommandHandler,
  LoginMemberCommandHandler,
  RequestPhoneVerificationCommandHandler,
  SignupMemberCommandHandler,
} from '@application/commands/handlers';
import {
  CheckUserIdAvailabilityQueryHandler,
  GetHealthQueryHandler,
} from '@application/query/handlers';
import { MEMBER_QUERY, type MemberQueryPort } from '@application/query/ports';
import {
  NumericVerificationCodeGenerator,
  Pbkdf2PasswordHasher,
  RandomTemporaryPasswordGenerator,
  SystemClock,
} from '@infrastructure/crypto';
import { NestLogEventPublisher } from '@infrastructure/logging';
import { PersistenceModule } from '@infrastructure/persistence';
import { HealthController, MemberController } from '@presentation/http';

@Module({
  imports: [
    PersistenceModule,
    RvlogNestModule.forRoot({
      logger: {
        minLevel: LogLevel.INFO,
        pretty: true,
      },
      http: {
        excludePaths: ['/health'],
      },
    }),
  ],
  controllers: [HealthController, MemberController],
  providers: [
    GetHealthQueryHandler,
    SystemClock,
    NumericVerificationCodeGenerator,
    Pbkdf2PasswordHasher,
    RandomTemporaryPasswordGenerator,
    NestLogEventPublisher,
    {
      provide: CLOCK,
      useExisting: SystemClock,
    },
    {
      provide: VERIFICATION_CODE_GENERATOR,
      useExisting: NumericVerificationCodeGenerator,
    },
    {
      provide: PASSWORD_HASHER,
      useExisting: Pbkdf2PasswordHasher,
    },
    {
      provide: TEMPORARY_PASSWORD_GENERATOR,
      useExisting: RandomTemporaryPasswordGenerator,
    },
    {
      provide: LOG_EVENT_PUBLISHER,
      useExisting: NestLogEventPublisher,
    },
    {
      provide: CheckUserIdAvailabilityQueryHandler,
      useFactory: (memberQuery: MemberQueryPort) => new CheckUserIdAvailabilityQueryHandler(memberQuery),
      inject: [MEMBER_QUERY],
    },
    {
      provide: RequestPhoneVerificationCommandHandler,
      useFactory: (
        phoneVerificationRepository: PhoneVerificationRepositoryPort,
        verificationCodeGenerator: VerificationCodeGeneratorPort,
        clock: ClockPort,
      ) =>
        new RequestPhoneVerificationCommandHandler(
          phoneVerificationRepository,
          verificationCodeGenerator,
          clock,
        ),
      inject: [PHONE_VERIFICATION_REPOSITORY, VERIFICATION_CODE_GENERATOR, CLOCK],
    },
    {
      provide: ConfirmPhoneVerificationCommandHandler,
      useFactory: (
        phoneVerificationRepository: PhoneVerificationRepositoryPort,
        clock: ClockPort,
      ) => new ConfirmPhoneVerificationCommandHandler(phoneVerificationRepository, clock),
      inject: [PHONE_VERIFICATION_REPOSITORY, CLOCK],
    },
    {
      provide: SignupMemberCommandHandler,
      useFactory: (
        memberRepository: MemberRepositoryPort,
        phoneVerificationRepository: PhoneVerificationRepositoryPort,
        passwordHasher: PasswordHasherPort,
        logEventPublisher: LogEventPublisherPort,
        clock: ClockPort,
      ) =>
        new SignupMemberCommandHandler(
          memberRepository,
          phoneVerificationRepository,
          passwordHasher,
          logEventPublisher,
          clock,
        ),
      inject: [MEMBER_REPOSITORY, PHONE_VERIFICATION_REPOSITORY, PASSWORD_HASHER, LOG_EVENT_PUBLISHER, CLOCK],
    },
    {
      provide: LoginMemberCommandHandler,
      useFactory: (
        memberRepository: MemberRepositoryPort,
        passwordHasher: PasswordHasherPort,
        clock: ClockPort,
        logEventPublisher: LogEventPublisherPort,
      ) => new LoginMemberCommandHandler(memberRepository, passwordHasher, clock, logEventPublisher),
      inject: [MEMBER_REPOSITORY, PASSWORD_HASHER, CLOCK, LOG_EVENT_PUBLISHER],
    },
    {
      provide: IssueTemporaryPasswordCommandHandler,
      useFactory: (
        memberRepository: MemberRepositoryPort,
        phoneVerificationRepository: PhoneVerificationRepositoryPort,
        temporaryPasswordGenerator: TemporaryPasswordGeneratorPort,
        passwordHasher: PasswordHasherPort,
        clock: ClockPort,
      ) =>
        new IssueTemporaryPasswordCommandHandler(
          memberRepository,
          phoneVerificationRepository,
          temporaryPasswordGenerator,
          passwordHasher,
          clock,
        ),
      inject: [
        MEMBER_REPOSITORY,
        PHONE_VERIFICATION_REPOSITORY,
        TEMPORARY_PASSWORD_GENERATOR,
        PASSWORD_HASHER,
        CLOCK,
      ],
    },
    {
      provide: ChangeMemberPasswordCommandHandler,
      useFactory: (
        memberRepository: MemberRepositoryPort,
        passwordHasher: PasswordHasherPort,
        clock: ClockPort,
        logEventPublisher: LogEventPublisherPort,
      ) => new ChangeMemberPasswordCommandHandler(memberRepository, passwordHasher, clock, logEventPublisher),
      inject: [MEMBER_REPOSITORY, PASSWORD_HASHER, CLOCK, LOG_EVENT_PUBLISHER],
    },
  ],
})
export class AppModule {}
