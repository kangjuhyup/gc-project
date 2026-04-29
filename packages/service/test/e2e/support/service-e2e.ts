import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type Redis from 'ioredis';
import { expect } from 'vitest';
import { REDIS } from '../../../src/infrastructure/cache/redis.module';
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

const migrations = [
  '001_create_movie_catalog_tables.sql',
  '002_seed_movie_catalog_temp_data.sql',
  '003_add_theater_location.sql',
  '004_create_payment_outbox_tables.sql',
  '005_create_member_refresh_token_table.sql',
];

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
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '55432';
    process.env.DB_NAME = 'gc_project_e2e';
    process.env.DB_USER = 'gc_user';
    process.env.DB_PASSWORD = 'gc_password';
    process.env.REDIS_URL = 'redis://:gc_redis_password@localhost:56379';
    process.env.ADDRESS_ADAPTER = 'local';
    process.env.SEAT_HOLD_TTL_SECONDS = '1';

    faker.seed(20260429);

    const { AppModule } = await import('../../../src/app.module');
    const app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
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
    await this.orm.schema.refreshDatabase();
    await applySeedMigrations(this.orm);
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
    const rows: E2eSeatRow[] = await this.orm.em.getConnection().execute(
      `
        SELECT
          seat.id::text AS id,
          seat.seat_row AS row,
          seat.seat_col AS col,
          COALESCE(seat.seat_type, 'NORMAL') AS type
        FROM screening
        JOIN seat ON seat.screen_id = screening.screen_id
        WHERE screening.id = ?
        ORDER BY seat.seat_row ASC, seat.seat_col ASC, seat.id ASC
        LIMIT ?
      `,
      [screeningId, count],
    );
    expect(rows.length).toBeGreaterThanOrEqual(count);

    return rows.map((seat) => ({
      ...seat,
      status: 'AVAILABLE',
    }));
  }

  async seatStatus(screeningId: string, seatId: string): Promise<string | undefined> {
    const rows = await this.orm.em.getConnection().execute<Array<{ status: string }>>(
      `
        SELECT
          CASE
            WHEN COUNT(reserved.id) > 0 THEN 'RESERVED'
            WHEN COUNT(active_hold.id) > 0 THEN 'HELD'
            ELSE 'AVAILABLE'
          END AS status
        FROM screening
        JOIN seat ON seat.screen_id = screening.screen_id
        LEFT JOIN reservation_seat reserved_seat
          ON reserved_seat.screening_id = screening.id
          AND reserved_seat.seat_id = seat.id
        LEFT JOIN reservation reserved
          ON reserved.id = reserved_seat.reservation_id
          AND reserved.status IN ('PENDING', 'CONFIRMED')
        LEFT JOIN seat_hold active_hold
          ON active_hold.screening_id = screening.id
          AND active_hold.seat_id = seat.id
          AND active_hold.status = 'HELD'
          AND active_hold.expires_at > now()
        WHERE screening.id = ?
          AND seat.id = ?
        GROUP BY seat.id
      `,
      [screeningId, seatId],
    );

    return rows[0]?.status;
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
    const rows = await this.orm.em.getConnection().execute<{ count: string }[]>(
      `SELECT COUNT(*)::int AS count FROM ${tableName} WHERE ${where}`,
      params,
    );

    return Number(rows[0].count);
  }

  async findPayment(paymentId: string): Promise<JsonObject | undefined> {
    const rows = await this.orm.em.getConnection().execute<JsonObject[]>(
      'SELECT id::text, status, reservation_id::text AS "reservationId" FROM payment WHERE id = ?',
      [paymentId],
    );

    return rows[0];
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

async function applySeedMigrations(orm: MikroORM): Promise<void> {
  for (const migration of migrations) {
    const sql = await readFile(
      resolve(process.cwd(), 'src/infrastructure/persistence/migrations', migration),
      'utf8',
    );
    await orm.em.getConnection().execute(sql);
  }
}
