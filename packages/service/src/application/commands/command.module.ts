import { Module } from '@nestjs/common';
import {
  ChangeMemberPasswordCommand,
  CommandBus,
  ConfirmPhoneVerificationCommand,
  CreateSeatHoldCommand,
  IssueTemporaryPasswordCommand,
  LoginMemberCommand,
  ReleaseSeatHoldCommand,
  RequestPhoneVerificationCommand,
  SignupMemberCommand,
} from '@application';
import {
  CLOCK,
  LOG_EVENT_PUBLISHER,
  MEMBER_REPOSITORY,
  PASSWORD_HASHER,
  PHONE_VERIFICATION_REPOSITORY,
  SEAT_HOLD_CACHE,
  SEAT_HOLD_LOCK,
  SEAT_HOLD_REPOSITORY,
  TEMPORARY_PASSWORD_GENERATOR,
  VERIFICATION_CODE_GENERATOR,
  type ClockPort,
  type LogEventPublisherPort,
  type MemberRepositoryPort,
  type PasswordHasherPort,
  type PhoneVerificationRepositoryPort,
  type SeatHoldCachePort,
  type SeatHoldLockPort,
  type SeatHoldRepositoryPort,
  type TemporaryPasswordGeneratorPort,
  type VerificationCodeGeneratorPort,
} from '@application/commands/ports';
import { InfrastructureModule } from '@infrastructure';
import {
  ChangeMemberPasswordCommandHandler,
  ConfirmPhoneVerificationCommandHandler,
  CreateSeatHoldCommandHandler,
  IssueTemporaryPasswordCommandHandler,
  LoginMemberCommandHandler,
  ReleaseSeatHoldCommandHandler,
  RequestPhoneVerificationCommandHandler,
  SignupMemberCommandHandler,
} from './handlers';

@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: RequestPhoneVerificationCommandHandler,
      useFactory: (
        phoneVerificationRepository: PhoneVerificationRepositoryPort,
        verificationCodeGenerator: VerificationCodeGeneratorPort,
        clock: ClockPort,
      ) => new RequestPhoneVerificationCommandHandler(phoneVerificationRepository, verificationCodeGenerator, clock),
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
    {
      provide: CreateSeatHoldCommandHandler,
      useFactory: (
        seatHoldRepository: SeatHoldRepositoryPort,
        seatHoldCache: SeatHoldCachePort,
        seatHoldLock: SeatHoldLockPort,
        clock: ClockPort,
      ) => new CreateSeatHoldCommandHandler(seatHoldRepository, seatHoldCache, seatHoldLock, clock),
      inject: [SEAT_HOLD_REPOSITORY, SEAT_HOLD_CACHE, SEAT_HOLD_LOCK, CLOCK],
    },
    {
      provide: ReleaseSeatHoldCommandHandler,
      useFactory: (
        seatHoldRepository: SeatHoldRepositoryPort,
        seatHoldCache: SeatHoldCachePort,
      ) => new ReleaseSeatHoldCommandHandler(seatHoldRepository, seatHoldCache),
      inject: [SEAT_HOLD_REPOSITORY, SEAT_HOLD_CACHE],
    },
    {
      provide: CommandBus,
      useFactory: (
        requestPhoneVerificationCommandHandler: RequestPhoneVerificationCommandHandler,
        confirmPhoneVerificationCommandHandler: ConfirmPhoneVerificationCommandHandler,
        signupMemberCommandHandler: SignupMemberCommandHandler,
        loginMemberCommandHandler: LoginMemberCommandHandler,
        issueTemporaryPasswordCommandHandler: IssueTemporaryPasswordCommandHandler,
        changeMemberPasswordCommandHandler: ChangeMemberPasswordCommandHandler,
        createSeatHoldCommandHandler: CreateSeatHoldCommandHandler,
        releaseSeatHoldCommandHandler: ReleaseSeatHoldCommandHandler,
      ) =>
        CommandBus.of([
          { command: RequestPhoneVerificationCommand, handler: requestPhoneVerificationCommandHandler },
          { command: ConfirmPhoneVerificationCommand, handler: confirmPhoneVerificationCommandHandler },
          { command: SignupMemberCommand, handler: signupMemberCommandHandler },
          { command: LoginMemberCommand, handler: loginMemberCommandHandler },
          { command: IssueTemporaryPasswordCommand, handler: issueTemporaryPasswordCommandHandler },
          { command: ChangeMemberPasswordCommand, handler: changeMemberPasswordCommandHandler },
          { command: CreateSeatHoldCommand, handler: createSeatHoldCommandHandler },
          { command: ReleaseSeatHoldCommand, handler: releaseSeatHoldCommandHandler },
        ]),
      inject: [
        RequestPhoneVerificationCommandHandler,
        ConfirmPhoneVerificationCommandHandler,
        SignupMemberCommandHandler,
        LoginMemberCommandHandler,
        IssueTemporaryPasswordCommandHandler,
        ChangeMemberPasswordCommandHandler,
        CreateSeatHoldCommandHandler,
        ReleaseSeatHoldCommandHandler,
      ],
    },
  ],
  exports: [CommandBus],
})
export class CommandModule {}
