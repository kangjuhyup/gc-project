import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogLevel } from '@kangjuhyup/rvlog';
import { RvlogNestModule } from '@kangjuhyup/rvlog-nest';
import {
  ChangeMemberPasswordCommand,
  CheckUserIdAvailabilityQuery,
  CommandBus,
  ConfirmPhoneVerificationCommand,
  CreateSeatHoldCommand,
  GetHealthQuery,
  IssueTemporaryPasswordCommand,
  ListMoviesQuery,
  ListScreeningSeatsQuery,
  ListTheatersQuery,
  LoginMemberCommand,
  QueryBus,
  RequestPhoneVerificationCommand,
  SearchAddressesQuery,
  SignupMemberCommand,
} from '@application';
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
  SEAT_HOLD_CACHE,
  SEAT_HOLD_LOCK,
  SEAT_HOLD_REPOSITORY,
  SeatHoldCachePort,
  SeatHoldLockPort,
  SeatHoldRepositoryPort,
  TEMPORARY_PASSWORD_GENERATOR,
  TemporaryPasswordGeneratorPort,
  VERIFICATION_CODE_GENERATOR,
  VerificationCodeGeneratorPort,
} from '@application/commands/ports';
import {
  ChangeMemberPasswordCommandHandler,
  ConfirmPhoneVerificationCommandHandler,
  CreateSeatHoldCommandHandler,
  IssueTemporaryPasswordCommandHandler,
  LoginMemberCommandHandler,
  RequestPhoneVerificationCommandHandler,
  SignupMemberCommandHandler,
} from '@application/commands/handlers';
import {
  CheckUserIdAvailabilityQueryHandler,
  GetHealthQueryHandler,
  ListMoviesQueryHandler,
  ListScreeningSeatsQueryHandler,
  ListTheatersQueryHandler,
  SearchAddressesQueryHandler,
} from '@application/query/handlers';
import {
  ADDRESS_SEARCH,
  AUTHORIZATION_VERIFIER,
  MEMBER_QUERY,
  MOVIE_QUERY,
  SEAT_QUERY,
  THEATER_QUERY,
  type AddressSearchPort,
  type MemberQueryPort,
  type MovieQueryPort,
  type SeatQueryPort,
  type TheaterQueryPort,
} from '@application/query/ports';
import {
  NumericVerificationCodeGenerator,
  Pbkdf2PasswordHasher,
  RandomTemporaryPasswordGenerator,
  SystemClock,
} from '@infrastructure/crypto';
import { NestLogEventPublisher } from '@infrastructure/logging';
import { PersistenceModule } from '@infrastructure/persistence';
import { JusoAddressSearchAdapter, LocalAddressSearchAdapter } from '@infrastructure/public-api';
import { EnvironmentAdapterFlag, MemberIdAuthorizationVerifier, RedisModule, RedisSeatHoldCache, RedisSeatHoldLock } from '@infrastructure';
import { AddressController, HealthController, MemberController, MovieController, SeatController, TheaterController } from '@presentation/http';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PersistenceModule,
    RedisModule,
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
  controllers: [
    HealthController,
    MemberController,
    AddressController,
    MovieController,
    TheaterController,
    SeatController,
  ],
  providers: [
    GetHealthQueryHandler,
    SystemClock,
    NumericVerificationCodeGenerator,
    Pbkdf2PasswordHasher,
    RandomTemporaryPasswordGenerator,
    NestLogEventPublisher,
    JusoAddressSearchAdapter,
    LocalAddressSearchAdapter,
    RedisSeatHoldCache,
    RedisSeatHoldLock,
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
      provide: SEAT_HOLD_CACHE,
      useExisting: RedisSeatHoldCache,
    },
    {
      provide: SEAT_HOLD_LOCK,
      useExisting: RedisSeatHoldLock,
    },
    {
      provide: AUTHORIZATION_VERIFIER,
      useFactory: (memberRepository: MemberRepositoryPort) => new MemberIdAuthorizationVerifier(memberRepository),
      inject: [MEMBER_REPOSITORY],
    },
    {
      provide: ADDRESS_SEARCH,
      useFactory: (
        configService: ConfigService,
        jusoAddressSearchAdapter: JusoAddressSearchAdapter,
        localAddressSearchAdapter: LocalAddressSearchAdapter,
      ): AddressSearchPort =>
        EnvironmentAdapterFlag.of({
          name: 'ADDRESS_SEARCH_ADAPTER',
          value: configService.get<string>('ADDRESS_SEARCH_ADAPTER'),
        }).select({
          adapters: {
            local: localAddressSearchAdapter,
            juso: jusoAddressSearchAdapter,
          },
          fallback: jusoAddressSearchAdapter,
        }),
      inject: [ConfigService, JusoAddressSearchAdapter, LocalAddressSearchAdapter],
    },
    {
      provide: CheckUserIdAvailabilityQueryHandler,
      useFactory: (memberQuery: MemberQueryPort) => new CheckUserIdAvailabilityQueryHandler(memberQuery),
      inject: [MEMBER_QUERY],
    },
    {
      provide: SearchAddressesQueryHandler,
      useFactory: (addressSearch: AddressSearchPort) => new SearchAddressesQueryHandler(addressSearch),
      inject: [ADDRESS_SEARCH],
    },
    {
      provide: ListMoviesQueryHandler,
      useFactory: (movieQuery: MovieQueryPort) => new ListMoviesQueryHandler(movieQuery),
      inject: [MOVIE_QUERY],
    },
    {
      provide: ListTheatersQueryHandler,
      useFactory: (theaterQuery: TheaterQueryPort) => new ListTheatersQueryHandler(theaterQuery),
      inject: [THEATER_QUERY],
    },
    {
      provide: ListScreeningSeatsQueryHandler,
      useFactory: (seatQuery: SeatQueryPort) => new ListScreeningSeatsQueryHandler(seatQuery),
      inject: [SEAT_QUERY],
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
      provide: QueryBus,
      useFactory: (
        getHealthQueryHandler: GetHealthQueryHandler,
        checkUserIdAvailabilityQueryHandler: CheckUserIdAvailabilityQueryHandler,
        searchAddressesQueryHandler: SearchAddressesQueryHandler,
        listMoviesQueryHandler: ListMoviesQueryHandler,
        listTheatersQueryHandler: ListTheatersQueryHandler,
        listScreeningSeatsQueryHandler: ListScreeningSeatsQueryHandler,
      ) =>
        QueryBus.of([
          { query: CheckUserIdAvailabilityQuery, handler: checkUserIdAvailabilityQueryHandler },
          { query: SearchAddressesQuery, handler: searchAddressesQueryHandler },
          { query: ListMoviesQuery, handler: listMoviesQueryHandler },
          { query: ListTheatersQuery, handler: listTheatersQueryHandler },
          { query: ListScreeningSeatsQuery, handler: listScreeningSeatsQueryHandler },
          { query: GetHealthQuery, handler: getHealthQueryHandler },
        ]),
      inject: [
        GetHealthQueryHandler,
        CheckUserIdAvailabilityQueryHandler,
        SearchAddressesQueryHandler,
        ListMoviesQueryHandler,
        ListTheatersQueryHandler,
        ListScreeningSeatsQueryHandler,
      ],
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
      ) =>
        CommandBus.of([
          { command: RequestPhoneVerificationCommand, handler: requestPhoneVerificationCommandHandler },
          { command: ConfirmPhoneVerificationCommand, handler: confirmPhoneVerificationCommandHandler },
          { command: SignupMemberCommand, handler: signupMemberCommandHandler },
          { command: LoginMemberCommand, handler: loginMemberCommandHandler },
          { command: IssueTemporaryPasswordCommand, handler: issueTemporaryPasswordCommandHandler },
          { command: ChangeMemberPasswordCommand, handler: changeMemberPasswordCommandHandler },
          { command: CreateSeatHoldCommand, handler: createSeatHoldCommandHandler },
        ]),
      inject: [
        RequestPhoneVerificationCommandHandler,
        ConfirmPhoneVerificationCommandHandler,
        SignupMemberCommandHandler,
        LoginMemberCommandHandler,
        IssueTemporaryPasswordCommandHandler,
        ChangeMemberPasswordCommandHandler,
        CreateSeatHoldCommandHandler,
      ],
    },
  ],
})
export class AppModule {}
