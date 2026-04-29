import { describe, expect, it } from 'vitest';
import { EnvironmentAdapterFlag } from '@infrastructure/config';

describe('EnvironmentAdapterFlag', () => {
  it('환경변수 값과 일치하는 adapter를 선택한다', () => {
    const selected = EnvironmentAdapterFlag.of({
      name: 'ADDRESS_SEARCH_ADAPTER',
      value: 'local',
    }).select({
      adapters: {
        local: 'local-adapter',
        juso: 'juso-adapter',
      },
      fallback: 'juso-adapter',
    });

    expect(selected).toBe('local-adapter');
  });

  it('환경변수가 없으면 fallback adapter를 선택한다', () => {
    const selected = EnvironmentAdapterFlag.of({
      name: 'ADDRESS_SEARCH_ADAPTER',
    }).select({
      adapters: {
        local: 'local-adapter',
      },
      fallback: 'juso-adapter',
    });

    expect(selected).toBe('juso-adapter');
  });

  it('환경변수 값은 앞뒤 공백과 대소문자를 정규화해서 비교한다', () => {
    const flag = EnvironmentAdapterFlag.of({
      name: 'ADDRESS_SEARCH_ADAPTER',
      value: ' LOCAL ',
    });

    expect(flag.matches('local')).toBe(true);
    expect(
      flag.select({
        adapters: {
          local: 'local-adapter',
        },
        fallback: 'juso-adapter',
      }),
    ).toBe('local-adapter');
  });

  it('정의되지 않은 환경변수 값이면 fallback adapter를 선택한다', () => {
    const selected = EnvironmentAdapterFlag.of({
      name: 'ADDRESS_SEARCH_ADAPTER',
      value: 'unknown',
    }).select({
      adapters: {
        local: 'local-adapter',
      },
      fallback: 'juso-adapter',
    });

    expect(selected).toBe('juso-adapter');
  });
});
