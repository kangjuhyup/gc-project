import { Module } from '@nestjs/common';
import { LogLevel } from '@kangjuhyup/rvlog';
import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import {
  CLOCK,
  ClockPort,
  MEMBER_REPOSITORY,
  MemberRepositoryPort,
  PHONE_VERIFICATION_REPOSITORY,
  PhoneVerificationRepositoryPort,
  VERIFICATION_CODE_GENERATOR,
  VerificationCodeGeneratorPort,
} from './application/commands/ports';
import {
  ConfirmPhoneVerificationCommandHandler,
  RequestPhoneVerificationCommandHandler,
  SignupMemberCommandHandler,
} from './application/commands/handlers';
import {
  CheckUserIdAvailabilityQueryHandler,
  GetHealthQueryHandler,
} from './application/query/handlers';
import { MEMBER_QUERY, type MemberQueryPort } from './application/query/ports';
import {
  NumericVerificationCodeGenerator,
  SystemClock,
} from './infrastructure/crypto';
import { PersistenceModule } from './infrastructure/persistence';
import { HealthController, MemberController } from './presentation/http';

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
    {
      provide: CLOCK,
      useExisting: SystemClock,
    },
    {
      provide: VERIFICATION_CODE_GENERATOR,
      useExisting: NumericVerificationCodeGenerator,
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
      ) => new SignupMemberCommandHandler(memberRepository, phoneVerificationRepository),
      inject: [MEMBER_REPOSITORY, PHONE_VERIFICATION_REPOSITORY],
    },
  ],
})
export class AppModule {}
