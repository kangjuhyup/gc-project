import { describe, expect, it } from 'vitest';
import { shouldRunMigrationsOnStartup } from '@infrastructure/config/migration.config';

describe('shouldRunMigrationsOnStartup', () => {
  it.each(['1', 'true', 'TRUE', ' yes ', 'on'])('%s 값이면 true를 반환한다', (value) => {
    expect(shouldRunMigrationsOnStartup(value)).toBe(true);
  });

  it.each([undefined, '', '0', 'false', 'off', 'no'])('%s 값이면 false를 반환한다', (value) => {
    expect(shouldRunMigrationsOnStartup(value)).toBe(false);
  });
});
