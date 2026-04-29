import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MikroORM } from '@mikro-orm/core';
import type Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ApplicationErrorInterceptor } from '../../src/presentation/interceptor/application-error.interceptor';
import { REDIS } from '../../src/infrastructure/cache/redis.module';

type JsonObject = Record<string, unknown>;

type HttpResult<TBody extends JsonObject = JsonObject> = {
  status: number;
  body: TBody;
};

const migrations = [
  '001_create_movie_catalog_tables.sql',
  '002_seed_movie_catalog_temp_data.sql',
  '003_add_theater_location.sql',
  '004_create_payment_outbox_tables.sql',
];

describe('service e2e with real PostgreSQL and Redis containers', () => {
  let app: INestApplication;
  let baseUrl: string;
  let orm: MikroORM;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '55432';
    process.env.DB_NAME = 'gc_project_e2e';
    process.env.DB_USER = 'gc_user';
    process.env.DB_PASSWORD = 'gc_password';
    process.env.REDIS_URL = 'redis://:gc_redis_password@localhost:56379';
    process.env.ADDRESS_ADAPTER = 'local';

    const { AppModule } = await import('../../src/app.module');
    app = await NestFactory.create(AppModule, { logger: false, abortOnError: false });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new ApplicationErrorInterceptor());

    await app.init();
    orm = app.get(MikroORM);
    await orm.schema.refreshDatabase();
    await applySeedMigrations(orm);
    await app.get<Redis>(REDIS).flushall();

    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('A와 B 회원의 좌석 임시점유 경쟁을 실제 DB와 Redis로 검증한다', async () => {
    const uniqueSuffix = Date.now().toString(36);
    const password = 'password123!';
    const memberA = await signupAndLogin({
      userId: `e2e_a_${uniqueSuffix}`,
      phoneNumber: phoneNumberFrom(uniqueSuffix, '1'),
      name: '홍길동',
      password,
    });
    const memberB = await signupAndLogin({
      userId: `e2e_b_${uniqueSuffix}`,
      phoneNumber: phoneNumberFrom(uniqueSuffix, '2'),
      name: '김철수',
      password,
    });

    const movies = await httpGet('/movies?time=2026-04-28T10:30:00%2B09:00&limit=5');
    expect(movies.status).toBe(200);
    const movieItems = movies.body.items as JsonObject[];
    expect(movieItems.length).toBeGreaterThan(0);
    const firstScreening = ((movieItems[0].screenings as JsonObject[])[0]);
    expect(firstScreening.theater).toMatchObject({ name: 'GC 시네마 강남' });

    const screeningId = String(firstScreening.id);
    const seats = await httpGet(`/screenings/${screeningId}/seats`);
    expect(seats.status).toBe(200);
    const availableSeats = (seats.body.seats as JsonObject[]).filter((seat) => seat.status === 'AVAILABLE');
    expect(availableSeats.length).toBeGreaterThanOrEqual(2);
    const seatForA = availableSeats[0];
    const seatForB = availableSeats[1];

    const holdByA = await httpPost(
      '/seat-holds',
      {
        screeningId,
        seatIds: [String(seatForA.id)],
      },
      { Authorization: `Bearer ${memberA.memberId}` },
    );
    expect(holdByA.status).toBe(201);
    expect(holdByA.body.ttlSeconds).toBe(600);
    expect(holdByA.body.holdIds).toHaveLength(1);

    const redisKeys = await app.get<Redis>(REDIS).keys(`seat-hold:${screeningId}:*`);
    expect(redisKeys.length).toBeGreaterThan(0);

    const seatsForB = await httpGet(`/screenings/${screeningId}/seats`);
    expect(seatsForB.status).toBe(200);
    const heldSeat = (seatsForB.body.seats as JsonObject[]).find((seat) => seat.id === String(seatForA.id));
    expect(heldSeat).toMatchObject({ status: 'HELD' });

    const duplicateHoldByB = await httpPost(
      '/seat-holds',
      {
        screeningId,
        seatIds: [String(seatForA.id)],
      },
      { Authorization: `Bearer ${memberB.memberId}` },
    );
    expect(duplicateHoldByB.status).toBe(409);

    const holdByB = await httpPost(
      '/seat-holds',
      {
        screeningId,
        seatIds: [String(seatForB.id)],
      },
      { Authorization: `Bearer ${memberB.memberId}` },
    );
    expect(holdByB.status).toBe(201);
    expect(holdByB.body.seatIds).toEqual([String(seatForB.id)]);
  });

  async function signupAndLogin(params: {
    userId: string;
    phoneNumber: string;
    name: string;
    password: string;
  }): Promise<{ memberId: string; userId: string }> {
    const phoneVerification = await httpPost('/phone-verifications', { phoneNumber: params.phoneNumber });
    expect(phoneVerification.status).toBe(201);
    expect(phoneVerification.body.verificationId).toEqual(expect.any(String));
    expect(phoneVerification.body.code).toEqual(expect.stringMatching(/^\d{6}$/));

    const confirmed = await httpPost('/phone-verifications/confirm', {
      verificationId: phoneVerification.body.verificationId,
      phoneNumber: params.phoneNumber,
      code: phoneVerification.body.code,
    });
    expect(confirmed.status).toBe(201);

    const signup = await httpPost('/members/signup', {
      userId: params.userId,
      password: params.password,
      name: params.name,
      birthDate: '1990-01-01',
      phoneNumber: params.phoneNumber,
      address: '서울특별시 강남구 테헤란로 427',
      phoneVerificationId: phoneVerification.body.verificationId,
    });
    expect(signup.status).toBe(201);
    expect(signup.body.userId).toBe(params.userId);

    const login = await httpPost('/members/login', {
      userId: params.userId,
      password: params.password,
    });
    expect(login.status).toBe(201);
    expect(login.body.memberId).toBe(signup.body.memberId);

    return {
      memberId: String(login.body.memberId),
      userId: String(login.body.userId),
    };
  }

  function phoneNumberFrom(seed: string, suffix: string): string {
    return `010${seed.replace(/\D/g, '').padEnd(7, suffix).slice(0, 7)}${suffix}`;
  }

  async function httpGet(path: string, headers: Record<string, string> = {}): Promise<HttpResult> {
    return request('GET', path, undefined, headers);
  }

  async function httpPost(
    path: string,
    body: JsonObject,
    headers: Record<string, string> = {},
  ): Promise<HttpResult> {
    return request('POST', path, body, headers);
  }

  async function request(
    method: string,
    path: string,
    body?: JsonObject,
    headers: Record<string, string> = {},
  ): Promise<HttpResult> {
    const response = await fetch(`${baseUrl}${path}`, {
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
});

async function applySeedMigrations(orm: MikroORM): Promise<void> {
  for (const migration of migrations) {
    const sql = await readFile(
      resolve(process.cwd(), 'src/infrastructure/persistence/migrations', migration),
      'utf8',
    );
    await orm.em.getConnection().execute(sql);
  }
}
