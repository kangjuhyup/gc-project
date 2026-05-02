import * as Joi from 'joi';

export type ServiceProcess = 'api' | 'worker';

type EnvSpec = Record<string, { joi: Joi.Schema }>;
type RawConfig = Record<string, unknown>;

const booleanSchema = Joi.boolean()
  .truthy('1', 'true', 'yes', 'on')
  .falsy('0', 'false', 'no', 'off');

export const commonEnvSpec = {
  NODE_ENV: {
    joi: Joi.string().valid('development', 'production', 'test').default('development'),
  },
  LOG_LEVEL: { joi: Joi.string().valid('DEBUG', 'INFO', 'WARN', 'ERROR').default('INFO') },
  DB_HOST: { joi: Joi.string().trim().required() },
  DB_PORT: { joi: Joi.number().integer().positive().required() },
  DB_NAME: { joi: Joi.string().trim().required() },
  DB_USER: { joi: Joi.string().trim().required() },
  DB_PASSWORD: { joi: Joi.string().required() },
  REDIS_URL: { joi: Joi.string().trim().required() },
  ADDRESS_SEARCH_ADAPTER: { joi: Joi.string().valid('local', 'juso').required() },
  JUSO_API_KEY: {
    joi: Joi.when('ADDRESS_SEARCH_ADAPTER', {
      is: 'juso',
      then: Joi.string().trim().required(),
      otherwise: Joi.string().trim().optional(),
    }),
  },
  ACCESS_TOKEN_TTL_SECONDS: { joi: Joi.number().integer().positive().required() },
  REFRESH_TOKEN_TTL_SECONDS: { joi: Joi.number().integer().positive().required() },
  PHONE_NUMBER_ENCRYPTION_KEY: { joi: Joi.string().min(16).required() },
  SEAT_HOLD_TTL_SECONDS: { joi: Joi.number().integer().positive().required() },
  LOCAL_PAYMENT_CALLBACK_URL: { joi: Joi.string().trim().required() },
  LOCAL_PAYMENT_CALLBACK_DELAY_SECONDS: { joi: Joi.number().min(0).required() },
  MIGRATIONS_RUN_ON_STARTUP: { joi: booleanSchema.default(false) },
} as const satisfies EnvSpec;

export const apiEnvSpec = {
  PORT: { joi: Joi.number().integer().positive().required() },
  ADMIN_USER_ID: { joi: Joi.string().trim().required() },
  ADMIN_PASSWORD: { joi: Joi.string().required() },
  ADMIN_ACCESS_TOKEN_TTL_SECONDS: { joi: Joi.number().integer().positive().required() },
  RATE_LIMIT_TTL_MILLISECONDS: { joi: Joi.number().integer().positive().default(60_000) },
  RATE_LIMIT_LIMIT: { joi: Joi.number().integer().positive().default(100) },
} as const satisfies EnvSpec;

export const workerEnvSpec = {
  PAYMENT_OUTBOX_WORKER_ENABLED: { joi: booleanSchema.required() },
  PAYMENT_OUTBOX_WORKER_INTERVAL_MS: { joi: Joi.number().integer().positive().required() },
} as const satisfies EnvSpec;

export const apiServiceEnvSpec = {
  ...commonEnvSpec,
  ...apiEnvSpec,
} as const satisfies EnvSpec;

export const workerServiceEnvSpec = {
  ...commonEnvSpec,
  ...workerEnvSpec,
} as const satisfies EnvSpec;

export type ApiEnvKey = keyof typeof apiServiceEnvSpec;
export type WorkerEnvKey = keyof typeof workerServiceEnvSpec;
export type ServiceEnvKey = ApiEnvKey | WorkerEnvKey;

export const ENV_KEY: { [K in ServiceEnvKey]: K } = Object.keys({
  ...apiServiceEnvSpec,
  ...workerServiceEnvSpec,
}).reduce((acc, key) => ({ ...acc, [key]: key }), {} as { [K in ServiceEnvKey]: K });

export const serviceValidationOptions = {
  abortEarly: false,
  allowUnknown: true,
} as const;

export const apiValidationSchema = createValidationSchema(apiServiceEnvSpec);
export const workerValidationSchema = createValidationSchema(workerServiceEnvSpec);

export function validateApiConfig(config: RawConfig): RawConfig {
  return validateServiceConfig(config, 'api');
}

export function validateWorkerConfig(config: RawConfig): RawConfig {
  return validateServiceConfig(config, 'worker');
}

export function validateServiceConfig(config: RawConfig, process: ServiceProcess): RawConfig {
  const validationSchema = process === 'api' ? apiValidationSchema : workerValidationSchema;
  const { error, value } = validationSchema.validate(config, serviceValidationOptions);

  if (error) {
    throw error;
  }

  return value as RawConfig;
}

function createValidationSchema(envSpec: EnvSpec): Joi.ObjectSchema {
  return Joi.object(
    Object.fromEntries(Object.entries(envSpec).map(([key, spec]) => [key, spec.joi])),
  );
}

type EnvSpecToType<T extends EnvSpec> = {
  [K in keyof T]: T[K]['joi'] extends Joi.NumberSchema
    ? number
    : T[K]['joi'] extends Joi.BooleanSchema
      ? boolean
      : string;
};

export type ApiEnvironmentVariables = EnvSpecToType<typeof apiServiceEnvSpec>;
export type WorkerEnvironmentVariables = EnvSpecToType<typeof workerServiceEnvSpec>;
export type EnvironmentVariables = ApiEnvironmentVariables & Partial<WorkerEnvironmentVariables>;
