import { describe, expect, it } from 'vitest';
import {
  ENV_KEY,
  validateApiConfig,
  validateWorkerConfig,
} from '@infrastructure/config';

const baseConfig = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'gc_project',
  DB_USER: 'gc_user',
  DB_PASSWORD: 'gc_password',
  REDIS_URL: 'redis://localhost:6379',
  ADDRESS_SEARCH_ADAPTER: 'local',
  ACCESS_TOKEN_TTL_SECONDS: '900',
  REFRESH_TOKEN_TTL_SECONDS: '1209600',
  SEAT_HOLD_TTL_SECONDS: '3',
  LOCAL_PAYMENT_CALLBACK_URL: 'http://localhost:3000/payments/callback',
  LOCAL_PAYMENT_CALLBACK_DELAY_SECONDS: '3',
  ADMIN_USER_ID: 'admin',
  ADMIN_PASSWORD: 'admin-password123!',
  ADMIN_ACCESS_TOKEN_TTL_SECONDS: '900',
};

describe('service config validation', () => {
  it('API 실행에 필요한 필수 config가 모두 있으면 검증을 통과한다', () => {
    const config = validateApiConfig({
      ...baseConfig,
      PORT: '3000',
    });

    expect(config.NODE_ENV).toBe('development');
    expect(config.LOG_LEVEL).toBe('INFO');
    expect(config.DB_HOST).toBe('localhost');
    expect(config.DB_PORT).toBe(5432);
  });

  it('로그 레벨은 허용된 값만 사용할 수 있다', () => {
    const config = validateApiConfig({
      ...baseConfig,
      PORT: '3000',
      LOG_LEVEL: 'ERROR',
    });

    expect(config.LOG_LEVEL).toBe('ERROR');
    expect(() =>
      validateApiConfig({
        ...baseConfig,
        PORT: '3000',
        LOG_LEVEL: 'TRACE',
      }),
    ).toThrow(/LOG_LEVEL/);
  });

  it('필수 config가 없으면 서비스 부팅 전에 명시적으로 실패한다', () => {
    expect(() =>
      validateApiConfig({
        ...baseConfig,
        PORT: '3000',
        DB_PASSWORD: '',
      }),
    ).toThrow(/DB_PASSWORD/);
  });

  it('숫자 config가 올바른 양수가 아니면 서비스 부팅 전에 실패한다', () => {
    expect(() =>
      validateApiConfig({
        ...baseConfig,
        PORT: '3000',
        ACCESS_TOKEN_TTL_SECONDS: '0',
      }),
    ).toThrow(/ACCESS_TOKEN_TTL_SECONDS/);
  });

  it('주소 검색 어댑터가 juso이면 JUSO_API_KEY를 필수로 요구한다', () => {
    expect(() =>
      validateApiConfig({
        ...baseConfig,
        PORT: '3000',
        ADDRESS_SEARCH_ADAPTER: 'juso',
      }),
    ).toThrow(/JUSO_API_KEY/);
  });

  it('워커 실행에는 워커 전용 config를 추가로 요구한다', () => {
    const config = validateWorkerConfig({
      ...baseConfig,
      PAYMENT_OUTBOX_WORKER_ENABLED: 'true',
      PAYMENT_OUTBOX_WORKER_INTERVAL_MS: '500',
    });

    expect(config.PAYMENT_OUTBOX_WORKER_ENABLED).toBe(true);
  });

  it('워커 boolean config가 올바르지 않으면 서비스 부팅 전에 실패한다', () => {
    expect(() =>
      validateWorkerConfig({
        ...baseConfig,
        PAYMENT_OUTBOX_WORKER_ENABLED: 'maybe',
        PAYMENT_OUTBOX_WORKER_INTERVAL_MS: '500',
      }),
    ).toThrow(/PAYMENT_OUTBOX_WORKER_ENABLED/);
  });

  it('ENV_KEY 상수는 envSpec 기준으로 config key 오타 없이 사용할 수 있게 한다', () => {
    expect(ENV_KEY.DB_HOST).toBe('DB_HOST');
    expect(ENV_KEY.ADMIN_ACCESS_TOKEN_TTL_SECONDS).toBe('ADMIN_ACCESS_TOKEN_TTL_SECONDS');
    expect(ENV_KEY.PAYMENT_OUTBOX_WORKER_INTERVAL_MS).toBe(
      'PAYMENT_OUTBOX_WORKER_INTERVAL_MS',
    );
  });
});
