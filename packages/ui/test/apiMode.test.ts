import { describe, expect, it, vi } from 'vitest';
import { getApiMode } from '@/lib/apiMode';

describe('api mode', () => {
  it('VITE_API_MODE가 mock이면 mock API를 사용한다', () => {
    vi.stubEnv('VITE_API_MODE', 'mock');

    expect(getApiMode()).toBe('mock');
  });

  it('VITE_API_MODE가 real 또는 api이면 실제 API를 사용한다', () => {
    vi.stubEnv('VITE_API_MODE', 'real');
    expect(getApiMode()).toBe('real');

    vi.stubEnv('VITE_API_MODE', 'api');
    expect(getApiMode()).toBe('real');
  });

  it('기존 VITE_API_MOCK=false 설정은 실제 API 사용으로 해석한다', () => {
    vi.stubEnv('VITE_API_MOCK', 'false');

    expect(getApiMode()).toBe('real');
  });
});
