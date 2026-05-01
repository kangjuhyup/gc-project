import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type Redis from 'ioredis';
import { expect } from 'vitest';
import { REDIS } from '../../../src/infrastructure/cache/redis.module';
import {
  MemberEntity,
  MovieEntity,
  OutboxEventEntity,
  PaymentEntity,
  PaymentEventLogEntity,
  RefreshTokenEntity,
  ReservationEntity,
  ReservationEventEntity,
  ReservationSeatEntity,
  ScreeningEntity,
  SeatEntity,
} from '../../../src/infrastructure/persistence/entities';
import { ApplicationErrorInterceptor } from '../../../src/presentation/interceptor/application-error.interceptor';

export type JsonObject = Record<string, unknown>;

export type HttpResult<TBody extends JsonObject = JsonObject> = {
  status: number;
  body: TBody;
};

export type E2eMember = {
  memberId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
};

export type E2eSeat = {
  id: string;
  row: string;
  col: number;
  type: string;
  status: string;
};

type E2eSeatRow = Omit<E2eSeat, 'status'>;

let userSequence = 0;

export class ServiceE2eContext {
  private constructor(
    readonly app: INestApplication,
    readonly orm: MikroORM,
    readonly redis: Redis,
    readonly baseUrl: string,
  ) {}

  static async create(): Promise<ServiceE2eContext> {
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'ERROR';
    process.env.PORT = '3000';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '55432';
    process.env.DB_NAME = 'gc_project_e2e';
    process.env.DB_USER = 'gc_user';
    process.env.DB_PASSWORD = 'gc_password';
    process.env.REDIS_URL = 'redis://:gc_redis_password@localhost:56379';
    process.env.ADDRESS_SEARCH_ADAPTER = 'local';
    process.env.ACCESS_TOKEN_TTL_SECONDS = '900';
    process.env.REFRESH_TOKEN_TTL_SECONDS = '1209600';
    process.env.SEAT_HOLD_TTL_SECONDS = '1';
    process.env.LOCAL_PAYMENT_CALLBACK_URL = 'http://localhost:3000/payments/callback';
    process.env.LOCAL_PAYMENT_CALLBACK_DELAY_SECONDS = '3';
    process.env.ADMIN_USER_ID = 'admin';
    process.env.ADMIN_PASSWORD = 'admin-password123!';
    process.env.ADMIN_ACCESS_TOKEN_TTL_SECONDS = '900';

    faker.seed(20260429);

    const { ApiAppModule } = await import('../../../src/api-app.module');
    const app = await NestFactory.create(ApiAppModule, { logger: false, abortOnError: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ApplicationErrorInterceptor());

    await app.init();
    const orm = app.get(MikroORM);
    const redis = app.get<Redis>(REDIS);

    await app.listen(0);

    return new ServiceE2eContext(app, orm, redis, await app.getUrl());
  }

  async reset(): Promise<void> {
    await this.orm.schema.dropSchema({ dropMigrationsTable: true });
    await this.orm.migrator.up();
    await this.redis.flushall();
  }

  async close(): Promise<void> {
    await this.app.close();
  }

  async signupAndLogin(label: string): Promise<E2eMember> {
    userSequence += 1;
    const compactLabel = label.replace(/[^a-z0-9_]/g, '').slice(0, 6);
    const userId = `u_${compactLabel}_${userSequence}`;
    const phoneNumber = `010${String(userSequence).padStart(8, '0')}`;
    const password = 'password123!';

    const phoneVerification = await this.post('/phone-verifications', { phoneNumber });
    expect(phoneVerification.status).toBe(201);
    expect(phoneVerification.body.verificationId).toEqual(expect.any(String));
    expect(phoneVerification.body.code).toEqual(expect.stringMatching(/^\d{6}$/));

    const confirmed = await this.post('/phone-verifications/confirm', {
      verificationId: phoneVerification.body.verificationId,
      phoneNumber,
      code: phoneVerification.body.code,
    });
    expect(confirmed.status).toBe(201);

    const signup = await this.post('/members/signup', {
      userId,
      password,
      name: faker.person.fullName(),
      birthDate: '1990-01-01',
      phoneNumber,
      address: '서울특별시 강남구 테헤란로 427',
      phoneVerificationId: phoneVerification.body.verificationId,
    });
    expect(signup.status).toBe(201);
    expect(signup.body.userId).toBe(userId);

    const login = await this.post('/members/login', {
      userId,
      password,
    });
    expect(login.status).toBe(201);
    expect(login.body.memberId).toBe(signup.body.memberId);
    expect(login.body.accessToken).toEqual(expect.any(String));
    expect(login.body.accessTokenExpiresAt).toEqual(expect.any(String));
    expect(login.body.refreshToken).toEqual(expect.any(String));
    expect(login.body.refreshTokenExpiresAt).toEqual(expect.any(String));

    return {
      memberId: String(login.body.memberId),
      userId: String(login.body.userId),
      accessToken: String(login.body.accessToken),
      refreshToken: String(login.body.refreshToken),
    };
  }

  async firstScreeningId(): Promise<string> {
    const movies = await this.get('/movies?time=2026-04-28T10:30:00%2B09:00&limit=5');
    expect(movies.status).toBe(200);
    const movieItems = movies.body.items as JsonObject[];
    expect(movieItems.length).toBeGreaterThan(0);

    const firstScreening = (movieItems[0].screenings as JsonObject[])[0];
    expect(firstScreening).toBeDefined();

    return String(firstScreening.id);
  }

  async availableSeats(screeningId: string, count = 1): Promise<E2eSeat[]> {
    const em = this.orm.em.fork();
    const screening = await em.findOne(ScreeningEntity, { id: screeningId }, { populate: ['screen.seats'] });
    const rows: E2eSeatRow[] = screening?.screen.seats
      .getItems()
      .slice()
      .sort((left, right) => this.compareSeat(left, right))
      .slice(0, count)
      .map((seat) => ({
        id: seat.id,
        row: seat.seatRow,
        col: seat.seatCol,
        type: seat.seatType ?? 'NORMAL',
      })) ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(count);

    return rows.map((seat) => ({
      ...seat,
      status: 'AVAILABLE',
    }));
  }

  async seatStatus(screeningId: string, seatId: string): Promise<string | undefined> {
    const em = this.orm.em.fork();
    const screening = await em.findOne(ScreeningEntity, { id: screeningId }, {
      populate: ['reservationSeats.seat', 'reservationSeats.reservation', 'seatHolds.seat'],
    });

    if (screening === null) {
      return undefined;
    }

    const reserved = screening.reservationSeats
      .getItems()
      .some((reservationSeat) =>
        reservationSeat.seat.id === seatId &&
        ['PENDING', 'CONFIRMED'].includes(reservationSeat.reservation.status),
      );

    if (reserved) {
      return 'RESERVED';
    }

    const now = new Date();
    const held = screening.seatHolds
      .getItems()
      .some((seatHold) => seatHold.seat.id === seatId && seatHold.status === 'HELD' && seatHold.expiresAt > now);

    return held ? 'HELD' : 'AVAILABLE';
  }

  async apiSeatStatus(screeningId: string, seatId: string): Promise<string | undefined> {
    const seats = await this.get(`/screenings/${screeningId}/seats`);
    expect(seats.status).toBe(200);

    const seat = (seats.body.seats as E2eSeat[]).find((item) => String(item.id) === seatId);

    return seat?.status;
  }

  async createSeatHold(member: E2eMember, screeningId: string, seatIds: string[]): Promise<HttpResult> {
    return this.post(
      '/seat-holds',
      {
        screeningId,
        seatIds,
      },
      this.auth(member),
    );
  }

  async requestPayment(member: E2eMember, seatHoldId: string, idempotencyKey: string, amount = 15000): Promise<HttpResult> {
    return this.post(
      '/payments',
      {
        seatHoldId,
        idempotencyKey,
        provider: 'LOCAL',
        amount,
      },
      this.auth(member),
    );
  }

  async approvePayment(payment: JsonObject, amount = Number(payment.amount)): Promise<HttpResult> {
    const paymentId = String(payment.paymentId);
    const providerPaymentId = `local-payment-${paymentId}`;

    return this.post('/payments/callback', {
      provider: 'LOCAL',
      providerPaymentId,
      paymentId,
      amount,
      approved: true,
      token: `local:${paymentId}:${providerPaymentId}`,
    });
  }

  async countRows(tableName: string, where = 'TRUE', params: unknown[] = []): Promise<number> {
    const em = this.orm.em.fork();

    if (tableName === 'member' && where === "id = ? AND status = 'WITHDRAWN'") {
      return em.count(MemberEntity, { id: String(params[0]), status: 'WITHDRAWN' });
    }

    if (tableName === 'member_refresh_token' && where === 'member_id = ? AND revoked_at IS NOT NULL') {
      return em.count(RefreshTokenEntity, { member: String(params[0]), revokedAt: { $ne: null } });
    }

    if (tableName === 'movie' && where === 'title = ?') {
      return em.count(MovieEntity, { title: String(params[0]) });
    }

    if (tableName === 'payment' && where === 'member_id = ? AND idempotency_key = ?') {
      return em.count(PaymentEntity, { member: String(params[0]), idempotencyKey: String(params[1]) });
    }

    if (tableName === 'payment' && where === "id = ? AND status = 'REFUND_REQUIRED'") {
      return em.count(PaymentEntity, { id: String(params[0]), status: 'REFUND_REQUIRED' });
    }

    if (tableName === 'outbox_event' && where === "aggregate_type = 'PAYMENT' AND event_type = 'PAYMENT_REQUESTED'") {
      return em.count(OutboxEventEntity, { aggregateType: 'PAYMENT', eventType: 'PAYMENT_REQUESTED' });
    }

    if (tableName === 'reservation' && where === 'member_id = ?') {
      return em.count(ReservationEntity, { member: String(params[0]) });
    }

    if (tableName === 'reservation' && where === "id = ? AND status = 'CANCELED'") {
      return em.count(ReservationEntity, { id: String(params[0]), status: 'CANCELED' });
    }

    if (tableName === 'reservation_seat' && where === 'screening_id = ? AND seat_id = ?') {
      return em.count(ReservationSeatEntity, { screening: String(params[0]), seat: String(params[1]) });
    }

    if (tableName === 'reservation_event' && where === 'TRUE') {
      return em.count(ReservationEventEntity, {});
    }

    if (tableName === 'payment_event_log' && where === "payment_id = ? AND event_type = 'PAYMENT_REFUND_REQUESTED'") {
      return em.count(PaymentEventLogEntity, { payment: String(params[0]), eventType: 'PAYMENT_REFUND_REQUESTED' });
    }

    throw new Error(`UNSUPPORTED_E2E_COUNT_ROWS: ${tableName} ${where}`);
  }

  async findPayment(paymentId: string): Promise<JsonObject | undefined> {
    const em = this.orm.em.fork();
    const payment = await em.findOne(PaymentEntity, { id: paymentId }, { populate: ['reservation'] });

    return payment === null
      ? undefined
      : {
          id: payment.id,
          status: payment.status,
          reservationId: payment.reservation?.id,
        };
  }

  private compareSeat(left: SeatEntity, right: SeatEntity): number {
    return left.seatRow.localeCompare(right.seatRow) || left.seatCol - right.seatCol || Number(left.id) - Number(right.id);
  }

  auth(member: E2eMember): Record<string, string> {
    return { Authorization: `Bearer ${member.accessToken}` };
  }

  get(path: string, headers: Record<string, string> = {}): Promise<HttpResult> {
    return this.request('GET', path, undefined, headers);
  }

  post(path: string, body: JsonObject, headers: Record<string, string> = {}): Promise<HttpResult> {
    return this.request('POST', path, body, headers);
  }

  delete(path: string, headers: Record<string, string> = {}): Promise<HttpResult> {
    return this.request('DELETE', path, undefined, headers);
  }

  private async request(
    method: string,
    path: string,
    body?: JsonObject,
    headers: Record<string, string> = {},
  ): Promise<HttpResult> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();

    return {
      status: response.status,
      body: text.length === 0 ? {} : JSON.parse(text) as JsonObject,
    };
  }
}
