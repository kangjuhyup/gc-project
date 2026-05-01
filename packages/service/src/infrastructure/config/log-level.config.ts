import { LogLevel } from '@kangjuhyup/rvlog';

export function resolveLogLevel(value: string | undefined, fallback = LogLevel.INFO): LogLevel {
  const normalized = value?.trim().toUpperCase();

  if (normalized === LogLevel.DEBUG) {
    return LogLevel.DEBUG;
  }

  if (normalized === LogLevel.INFO) {
    return LogLevel.INFO;
  }

  if (normalized === LogLevel.WARN) {
    return LogLevel.WARN;
  }

  if (normalized === LogLevel.ERROR) {
    return LogLevel.ERROR;
  }

  return fallback;
}
